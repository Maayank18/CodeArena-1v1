// backend/controllers/campaignController.js

import CampaignMap      from '../models/CampaignMap.js';
import CampaignProgress from '../models/CampaignProgress.js';
import { executeForCampaign } from '../services/campaignExecutor.js';
import { calculateStars, calculateKP, shouldUpdateNode } from '../services/starCalculator.js';
import { outputsMatch } from '../utils/sanitizeOutput.js';
import {
    ensureEntryNodesUnlocked,
    getEntryNodeIds,
    isEntryNode,
} from '../utils/campaignProgressBootstrap.js';

// replace: actual === expected
// with:    outputsMatch(actual, expected)
// ─── In-memory cache for static map (avoids DB hit every request) ────────────
let mapCache = null;
let mapCacheTime = 0;
const MAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAP_POPULATE_SELECT = 'title slug difficulty timeLimit constraints';

const toPlainObject = (value) =>
    value && typeof value.toObject === 'function' ? value.toObject() : value;

const buildGroupedNodes = (nodes) =>
    nodes.reduce((acc, node) => {
        if (!acc[node.region]) acc[node.region] = [];
        acc[node.region].push(node);
        return acc;
    }, {});

const sanitizeCampaignNode = (node) => {
    const plainNode = toPlainObject(node) ?? {};
    const hasProblemData = Boolean(plainNode.problemId);

    return {
        ...plainNode,
        problemId: hasProblemData ? plainNode.problemId : null,
        hasProblemData,
        problemMissing: !hasProblemData,
    };
};

const sanitizeMapData = (nodes) => {
    const sanitizedNodes = (Array.isArray(nodes) ? nodes : []).map(sanitizeCampaignNode);
    const orphanedNodeIds = sanitizedNodes
        .filter((node) => node.problemMissing)
        .map((node) => node.nodeId)
        .filter(Boolean);

    return {
        nodes: sanitizedNodes,
        grouped: buildGroupedNodes(sanitizedNodes),
        meta: {
            totalNodes: sanitizedNodes.length,
            orphanedNodeCount: orphanedNodeIds.length,
            orphanedNodeIds,
        },
    };
};

const sanitizeProgressData = (progressLike, validNodeIds, entryNodeIds) => {
    const plainProgress = toPlainObject(progressLike) ?? {};
    const validNodeIdSet = new Set((validNodeIds ?? []).filter(Boolean));
    const canonicalEntryNodeIds = [...new Set((entryNodeIds ?? []).filter(Boolean))];

    const completedNodes = (plainProgress.completedNodes ?? []).filter(
        (entry) => entry?.nodeId && validNodeIdSet.has(entry.nodeId)
    );
    const unlockedNodes = (plainProgress.unlockedNodes ?? []).filter(
        (nodeId) => validNodeIdSet.has(nodeId) || canonicalEntryNodeIds.includes(nodeId)
    );
    const sageUsage = (plainProgress.sageUsage ?? []).filter(
        (entry) => !entry?.nodeId || validNodeIdSet.has(entry.nodeId)
    );

    const sanitizedProgress = {
        ...plainProgress,
        completedNodes,
        unlockedNodes,
        sageUsage,
    };

    const repaired = ensureEntryNodesUnlocked(sanitizedProgress, canonicalEntryNodeIds);
    sanitizedProgress.unlockedNodes = repaired.unlockedNodes;

    const changed =
        JSON.stringify(plainProgress.completedNodes ?? []) !== JSON.stringify(completedNodes) ||
        JSON.stringify(plainProgress.unlockedNodes ?? []) !== JSON.stringify(repaired.unlockedNodes) ||
        JSON.stringify(plainProgress.sageUsage ?? []) !== JSON.stringify(sageUsage);

    return {
        progress: sanitizedProgress,
        changed,
        updateFields: {
            completedNodes,
            unlockedNodes: repaired.unlockedNodes,
            sageUsage,
        },
    };
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/map
// Returns full static map. Heavily cached.
// ────────────────────────────────────────────────────────────────────────────
export const getCampaignMap = async (req, res) => {
    try {
        const now = Date.now();
        if (mapCache && (now - mapCacheTime) < MAP_CACHE_TTL) {
            return res.status(200).json({
                success: true,
                data: mapCache,
                map: mapCache,
                cached: true,
            });
        }

        const nodes = await CampaignMap.find({ isActive: true })
            .populate({
                path: 'problemId',
                select: MAP_POPULATE_SELECT,
                strictPopulate: false,
            })
            .sort({ regionOrder: 1, nodeOrder: 1 })
            .lean();

        mapCache = sanitizeMapData(nodes);
        mapCacheTime = now;

        return res.status(200).json({
            success: true,
            data: mapCache,
            map: mapCache,
        });
    } catch (error) {
        console.error('[CAMPAIGN MAP] Failed to fetch campaign data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch campaign data',
            error: error.message,
        });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/progress
// Returns or initializes the user's progress
// ────────────────────────────────────────────────────────────────────────────
export const getCampaignProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const entryNodeIds = await getEntryNodeIds();
        const activeNodes = await CampaignMap.find({ isActive: true }).select('nodeId').lean();
        const activeNodeIds = activeNodes.map((node) => node.nodeId).filter(Boolean);

        let progressDoc = req.campaignProgress || await CampaignProgress.findOne({ userId });

        if (!progressDoc) {
            progressDoc = await CampaignProgress.create({
                userId,
                unlockedNodes: entryNodeIds,
            });
        }

        const { progress, changed, updateFields } = sanitizeProgressData(
            progressDoc,
            activeNodeIds,
            entryNodeIds
        );

        if (changed) {
            await CampaignProgress.updateOne({ userId }, { $set: updateFields });
        }

        return res.status(200).json({
            success: true,
            data: progress,
            progress,
        });
    } catch (error) {
        console.error('[CAMPAIGN PROGRESS] Failed to fetch campaign progress:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch campaign data',
            error: error.message,
        });
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
        let progress = req.campaignProgress || await CampaignProgress.findOne({ userId }).lean();
        if (!progress) {
            progress = {
                userId,
                unlockedNodes: await getEntryNodeIds(),
                completedNodes: [],
            };
        }
        const node = await CampaignMap.findOne({ nodeId, isActive: true })
            .populate({
                path: 'problemId',
                select: 'title description difficulty constraints testCases starterCode timeLimit memoryLimit'
            });

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        if (!node.problemId) {
            return res.status(409).json({
                success: false,
                message: 'Problem data missing for this campaign node',
            });
        }

        const isUnlocked = Boolean(progress && (progress.unlockedNodes ?? []).includes(nodeId));
        if (!isUnlocked && !isEntryNode(node)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked. Complete prerequisites first.' 
            });
        }

        // Only send PUBLIC test cases to frontend
        const problem = node.problemId.toObject();
        problem.testCases = (problem.testCases ?? []).filter(tc => tc.isPublic);

        // Check if user has already completed this node
        const existingCompletion = progress?.completedNodes?.find(n => n.nodeId === nodeId);

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
        let progress = req.campaignProgress || await CampaignProgress.findOne({ userId });
        const entryNodeIds = await getEntryNodeIds();
        if (!progress) {
            progress = await CampaignProgress.create({
                userId,
                unlockedNodes: entryNodeIds,
            });
        }
        ensureEntryNodesUnlocked(progress, entryNodeIds);

        const node = await CampaignMap.findOne({ nodeId, isActive: true })
            .populate('problemId', 'testCases goldenSolution prerequisites nodeOrder isEntryNode');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        if (!node.problemId) {
            return res.status(409).json({
                success: false,
                message: 'Problem data missing for this campaign node',
            });
        }

        const isUnlocked = Boolean(progress && (progress.unlockedNodes ?? []).includes(nodeId));
        if (!isUnlocked && !isEntryNode(node)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked' 
            });
        }

        const allTestCases = node.problemId?.testCases ?? []; // both public + hidden

        // 3. Increment attempt count BEFORE execution
        progress.totalAttempts = (progress.totalAttempts ?? 0) + 1;

        // 4. Execute against ALL test cases via Piston
        const executionResult = await executeForCampaign(code, language, allTestCases);

        // 5. If failed, return feedback without updating progress
        if (!executionResult.allPassed) {

            // Update sage failure counter for this node
            if (!progress.sageUsage) progress.sageUsage = [];
            let sageEntry = progress.sageUsage.find(s => s.nodeId === nodeId);
            if (!sageEntry) {
                progress.sageUsage.push({ nodeId, failCount: 1 });
            } else {
                sageEntry.failCount += 1;
            }

            progress.markModified('sageUsage');
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
        // ✅ FIX: Safe Array Initialization (Does NOT break Mongoose tracking)
        if (!progress.completedNodes) progress.completedNodes = [];
        if (!progress.unlockedNodes)  progress.unlockedNodes = [];
        if (!progress.inventory)      progress.inventory = [];
        if (!progress.sageUsage)      progress.sageUsage = [];

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

            progress.knowledgePoints = (progress.knowledgePoints || 0) + kpEarned;
            progress.totalStars      = (progress.totalStars || 0) + stars;

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

        // ✅ FIX: DECOUPLED UNLOCK LOGIC 
        // We now check for new unlocks on EVERY successful pass (first-time OR improvement)
        const allNodes  = await CampaignMap.find({ isActive: true }).lean();
        newlyUnlockedNodes = allNodes
            .filter(n => 
                !progress.unlockedNodes.includes(n.nodeId) &&
                (n.prerequisites ?? []).every(prereq => 
                    progress.completedNodes.some(c => c.nodeId === prereq) ||
                    nodeId === prereq // Count the current node as completed
                )
            )
            .map(n => n.nodeId);

        if (newlyUnlockedNodes.length > 0) {
            progress.unlockedNodes.push(...newlyUnlockedNodes);
        }

        // 8. Update streak
        const today = new Date().toDateString();
        const lastActive = progress.lastActiveDate?.toDateString();
        if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            progress.currentStreak = lastActive === yesterday 
                ? (progress.currentStreak || 0) + 1 
                : 1;
            progress.lastActiveDate = new Date();
        }

        // Reset sage counter on success
        const sageIdx = progress.sageUsage.findIndex(s => s.nodeId === nodeId);
        if (sageIdx >= 0) progress.sageUsage[sageIdx].failCount = 0;

        // ✅ CRITICAL FIX: Explicitly tell Mongoose to save our array pushes!
        progress.markModified('completedNodes');
        progress.markModified('unlockedNodes');
        progress.markModified('inventory');
        progress.markModified('sageUsage');

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
            progress: progress.toObject(),
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
// V 1.5
