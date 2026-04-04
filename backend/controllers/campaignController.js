// backend/controllers/campaignController.js

import CampaignMap      from '../models/CampaignMap.js';
import CampaignProgress from '../models/CampaignProgress.js';
import { executeForCampaign } from '../services/campaignExecutor.js';
import { calculateStars, calculateKP, shouldUpdateNode } from '../services/starCalculator.js';
import { outputsMatch } from '../utils/sanitizeOutput.js';
// replace: actual === expected
// with:    outputsMatch(actual, expected)
// ─── In-memory cache for static map (avoids DB hit every request) ────────────
let mapCache = null;
let mapCacheTime = 0;
const MAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/map
// Returns full static map. Heavily cached.
// ────────────────────────────────────────────────────────────────────────────
export const getCampaignMap = async (req, res) => {
    try {
        const now = Date.now();
        if (mapCache && (now - mapCacheTime) < MAP_CACHE_TTL) {
            return res.json({ success: true, map: mapCache, cached: true });
        }

        const nodes = await CampaignMap.find({ isActive: true })
            .populate('problemId', 'title difficulty timeLimit constraints')
            .sort({ regionOrder: 1, nodeOrder: 1 })
            .lean();

        // Group by region for frontend convenience
        const grouped = nodes.reduce((acc, node) => {
            if (!acc[node.region]) acc[node.region] = [];
            acc[node.region].push(node);
            return acc;
        }, {});

        mapCache = { nodes, grouped };
        mapCacheTime = now;

        return res.json({ success: true, map: mapCache });
    } catch (err) {
        console.error('[CAMPAIGN MAP]', err);
        return res.status(500).json({ success: false, message: 'Failed to load map' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/progress
// Returns or initializes the user's progress
// ────────────────────────────────────────────────────────────────────────────
export const getCampaignProgress = async (req, res) => {
    try {
        const userId = req.user._id;

        let progress = await CampaignProgress.findOne({ userId }).lean();

        if (!progress) {
            // First time — initialize with the first node unlocked
            const firstNode = await CampaignMap.findOne({ 
                isActive: true, 
                prerequisites: { $size: 0 } // no prerequisites = starting node
            }).sort({ regionOrder: 1, nodeOrder: 1 });

            progress = await CampaignProgress.create({
                userId,
                unlockedNodes: firstNode ? [firstNode.nodeId] : ['array_01']
            });
            progress = progress.toObject();
        }

        return res.json({ success: true, progress });
    } catch (err) {
        console.error('[CAMPAIGN PROGRESS]', err);
        return res.status(500).json({ success: false, message: 'Failed to load progress' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/node/:nodeId
// Returns node details + problem for the editor
// ────────────────────────────────────────────────────────────────────────────
export const getNodeDetails = async (req, res) => {
    try {
        const { nodeId } = req.params;
        const userId = req.user._id;

        // Verify node is unlocked for this user
        const progress = await CampaignProgress.findOne({ userId }).lean();
        if (!progress || !(progress.unlockedNodes ?? []).includes(nodeId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked. Complete prerequisites first.' 
            });
        }

        const node = await CampaignMap.findOne({ nodeId, isActive: true })
            .populate({
                path: 'problemId',
                select: 'title description difficulty constraints testCases starterCode timeLimit memoryLimit'
            });

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        // Only send PUBLIC test cases to frontend
        const problem = node.problemId.toObject();
        problem.testCases = (problem.testCases ?? []).filter(tc => tc.isPublic);

        // Check if user has already completed this node
        const existingCompletion = progress.completedNodes?.find(n => n.nodeId === nodeId);

        return res.json({
            success: true,
            node: {
                ...node.toObject(),
                problemId: problem
            },
            existingCompletion: existingCompletion || null,
            userBestStars: existingCompletion?.starsAwarded || 0
        });
    } catch (err) {
        console.error('[NODE DETAILS]', err);
        return res.status(500).json({ success: false, message: 'Failed to load node' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/campaign/submit
// THE CORE — Zero-trust execution, star calculation, progress update
// ────────────────────────────────────────────────────────────────────────────
export const submitCampaignSolution = async (req, res) => {
    try {
        const { nodeId, code, language } = req.body;
        const userId = req.user._id;

        if (!nodeId || !code || !language) {
            return res.status(400).json({ 
                success: false, 
                message: 'nodeId, code, and language are required' 
            });
        }

        // 1. Verify this node is unlocked for the user
        const progress = await CampaignProgress.findOne({ userId });
        if (!progress || !(progress.unlockedNodes ?? []).includes(nodeId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked' 
            });
        }

        // 2. Get node + ALL test cases (hidden + public) from DB
        const node = await CampaignMap.findOne({ nodeId, isActive: true })
            .populate('problemId', 'testCases goldenSolution');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        const allTestCases = node.problemId?.testCases ?? []; // both public + hidden

        // 3. Increment attempt count BEFORE execution
        progress.totalAttempts = (progress.totalAttempts ?? 0) + 1;

        // 4. Execute against ALL test cases via Piston
        const executionResult = await executeForCampaign(code, language, allTestCases);

        // 5. If failed, return feedback without updating progress
        if (!executionResult.allPassed) {

            // Update sage failure counter for this node
            progress.sageUsage = progress.sageUsage ?? [];
            let sageEntry = progress.sageUsage.find(s => s.nodeId === nodeId);
            if (!sageEntry) {
                progress.sageUsage.push({ nodeId, failCount: 1 });
            } else {
                sageEntry.failCount += 1;
            }

            await progress.save();

            return res.json({
                success: false,
                allPassed: false,
                results: executionResult.results,
                sageShouldTrigger: (sageEntry?.failCount || 1) >= 3,
                message: 'Some test cases failed. Keep trying!'
            });
        }

        // 6. Calculate Stars
        const stars = calculateStars(
            executionResult.avgTimeMs,
            node.starThresholds ?? { twoStarTimeMs: Number.POSITIVE_INFINITY, threeStarTimeMs: Number.POSITIVE_INFINITY }
        );
        const safeRewards = node.rewards ?? { oneStarKP: 0, twoStarKP: 0, threeStarKP: 0 };
        const kpEarned = calculateKP(stars, safeRewards);

        // 7. Check existing completion — only update if improved
        progress.completedNodes = progress.completedNodes ?? [];
        progress.unlockedNodes = progress.unlockedNodes ?? [];
        progress.inventory = progress.inventory ?? [];
        progress.sageUsage = progress.sageUsage ?? [];

        const existingIdx = progress.completedNodes.findIndex(n => n.nodeId === nodeId);
        const existingNode = existingIdx >= 0 ? progress.completedNodes[existingIdx] : null;
        const isImprovement = shouldUpdateNode(stars, executionResult.avgTimeMs, existingNode);

        let bonusKP = 0;
        let newlyUnlockedNodes = [];
        let lootDropped = null;

        if (!existingNode) {
            // First time completion
            progress.completedNodes.push({
                nodeId,
                starsAwarded: stars,
                bestTimeMs:   executionResult.avgTimeMs,
                attempts:     progress.totalAttempts,
                language
            });

            progress.knowledgePoints += kpEarned;
            progress.totalStars      += stars;

            // Unlock next nodes based on prerequisites
            const allNodes  = await CampaignMap.find({ isActive: true }).lean();
            newlyUnlockedNodes = allNodes
                .filter(n => 
                    !progress.unlockedNodes.includes(n.nodeId) &&
                    (n.prerequisites ?? []).every(prereq => 
                        progress.completedNodes.some(c => c.nodeId === prereq) ||
                        nodeId === prereq // just completed this one
                    )
                )
                .map(n => n.nodeId);

            progress.unlockedNodes.push(...newlyUnlockedNodes);

            // Boss node loot drop
            if (node.nodeType === 'boss' && node.rewards?.lootPool?.length > 0) {
                const rolled = Math.random();
                let cumulative = 0;
                for (const loot of node.rewards.lootPool) {
                    cumulative += (loot.dropChance ?? 0);
                    if (rolled <= cumulative && !progress.inventory.find(i => i.itemId === loot.itemId)) {
                        progress.inventory.push({
                            itemId:       loot.itemId,
                            itemType:     loot.itemType,
                            acquiredFrom: nodeId
                        });
                        lootDropped = loot;
                        break;
                    }
                }
            }

        } else if (isImprovement) {
            // Re-attempt with better performance
            const oldStars = existingNode.starsAwarded;
            bonusKP = kpEarned - calculateKP(oldStars, safeRewards); // only diff

            progress.completedNodes[existingIdx].starsAwarded = stars;
            progress.completedNodes[existingIdx].bestTimeMs   = executionResult.avgTimeMs;
            progress.completedNodes[existingIdx].language     = language;

            if (bonusKP > 0) progress.knowledgePoints += bonusKP;
            progress.totalStars = progress.totalStars - oldStars + stars;
        }

        // 8. Update streak
        const today = new Date().toDateString();
        const lastActive = progress.lastActiveDate?.toDateString();
        if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            progress.currentStreak = lastActive === yesterday 
                ? progress.currentStreak + 1 
                : 1;
            progress.lastActiveDate = new Date();
        }

        // Reset sage counter on success
        const sageIdx = progress.sageUsage.findIndex(s => s.nodeId === nodeId);
        if (sageIdx >= 0) progress.sageUsage[sageIdx].failCount = 0;

        await progress.save();

        return res.json({
            success: true,
            allPassed: true,
            stars,
            kpEarned: !existingNode ? kpEarned : bonusKP,
            newlyUnlockedNodes,
            lootDropped,
            isImprovement,
            executionTime: executionResult.avgTimeMs,
            results: executionResult.results,
            currentKP: progress.knowledgePoints,
            currentStars: progress.totalStars,
            currentStreak: progress.currentStreak,
            message: `${stars} ⭐ — ${!existingNode ? 'Node Complete!' : isImprovement ? 'New Best!' : 'Already completed with this score.'}`
        });

    } catch (err) {
        console.error('[CAMPAIGN SUBMIT]', err);
        return res.status(500).json({ success: false, message: 'Submission failed' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/campaign/spend-kp
// Spend KP on cosmetics from the Skill Tree
// ────────────────────────────────────────────────────────────────────────────
export const spendKnowledgePoints = async (req, res) => {
    try {
        const { itemId, itemType, cost } = req.body;
        const userId = req.user._id;

        const SKILL_TREE = {
            'theme_matrix':    { cost: 100, type: 'theme'  },
            'theme_cyberpunk': { cost: 150, type: 'theme'  },
            'border_gold':     { cost: 80,  type: 'border' },
            'border_neon':     { cost: 120, type: 'border' },
            'title_knight':    { cost: 120, type: 'title'  },
            // Add more in the future
        };

        const item = SKILL_TREE[itemId];
        if (!item) {
            return res.status(400).json({ success: false, message: 'Invalid item' });
        }

        const progress = await CampaignProgress.findOne({ userId });
        if (!progress) {
            return res.status(404).json({ success: false, message: 'Progress not found' });
        }

        if ((progress.knowledgePoints ?? 0) < item.cost) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient KP. Need ${item.cost}, have ${progress.knowledgePoints ?? 0}` 
            });
        }

        progress.inventory = progress.inventory ?? [];
        if (progress.inventory.find(i => i.itemId === itemId)) {
            return res.status(400).json({ success: false, message: 'Already owned' });
        }

        progress.knowledgePoints = (progress.knowledgePoints ?? 0) - item.cost;
        progress.inventory.push({ itemId, itemType: item.type });
        await progress.save();

        return res.json({
            success: true,
            itemUnlocked: itemId,
            remainingKP: progress.knowledgePoints
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Transaction failed' });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/campaign/equip
// Equip a cosmetic the user already owns
// ────────────────────────────────────────────────────────────────────────────
export const equipCosmetic = async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        const userId = req.user._id;

        const progress = await CampaignProgress.findOne({ userId });
        if (!progress) {
            return res.status(404).json({ success: false, message: 'Progress not found' });
        }

        progress.inventory = progress.inventory ?? [];
        if (!progress.inventory.find(i => i.itemId === itemId)) {
            return res.status(403).json({ success: false, message: 'Item not owned' });
        }

        if (itemType === 'theme')  progress.activeTheme  = itemId;
        if (itemType === 'border') progress.activeBorder = itemId;
        if (itemType === 'title')  progress.activeTitle  = itemId;

        await progress.save();
        return res.json({ success: true, message: `${itemId} equipped` });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to equip' });
    }
};
