// backend/controllers/campaignController.js
import CampaignMap      from '../models/CampaignMap.js';
import CampaignProgress from '../models/CampaignProgress.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { executeForCampaign } from '../services/campaignExecutor.js';
import { calculateStars, calculateKP, shouldUpdateNode } from '../services/starCalculator.js';
import { processAchievementEvent } from '../services/achievementEngine.js';
import { outputsMatch } from '../utils/sanitizeOutput.js';
import {
    ensureEntryNodesUnlocked,
    getEntryNodeIds,
    isEntryNode,
} from '../utils/campaignProgressBootstrap.js';
import { recordActivity } from '../utils/activityTracker.js';

// replace: actual === expected
// with:    outputsMatch(actual, expected)
// ─── In-memory cache for static map (avoids DB hit every request) ────────────
let mapCache = null;
let mapCacheTime = 0;
const MAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const NODE_ID_PATTERN = /node-(\d+)$/i;

const parseCampaignNodeOrder = (campaignNodeId) => {
    const match = String(campaignNodeId ?? '').match(NODE_ID_PATTERN);
    return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
};

const compareCampaignProblems = (a, b) => {
    const regionDiff = (Number(a?.campaignRegion) || 0) - (Number(b?.campaignRegion) || 0);
    if (regionDiff !== 0) return regionDiff;

    const nodeDiff = parseCampaignNodeOrder(a?.campaignNodeId) - parseCampaignNodeOrder(b?.campaignNodeId);
    if (nodeDiff !== 0) return nodeDiff;

    return String(a?.campaignNodeId ?? '').localeCompare(String(b?.campaignNodeId ?? ''));
};

const buildCampaignProblemNodes = (problems) =>
    (Array.isArray(problems) ? problems : []).map((problem, index) => {
        const regionOrder = Number(problem.campaignRegion) || 1;
        const nodeOrder = index + 1;
        const column = index % 4;
        const row = Math.floor(index / 4);

        return {
            _id: problem._id,
            nodeId: problem.campaignNodeId,
            region: `Region ${regionOrder}`,
            regionOrder,
            nodeOrder,
            nodeType: 'standard',
            prerequisites: [],
            isEntryNode: index === 0,
            mapPosition: {
                x: 180 + (column * 220),
                y: 180 + (row * 180),
            },
            rewards: {
                oneStarKP: 10,
                twoStarKP: 20,
                threeStarKP: 35,
                lootPool: [],
            },
            starThresholds: {
                twoStarTimeMs: problem.timeLimit ?? 5000,
                threeStarTimeMs: Math.max(1000, Math.floor((problem.timeLimit ?? 5000) * 0.7)),
            },
            problemId: {
                _id: problem._id,
                title: problem.title,
                slug: problem.slug,
                difficulty: problem.difficulty,
                timeLimit: problem.timeLimit,
                constraints: problem.constraints,
            },
        };
    });

const getCampaignNodeOrder = (campaignNodeId) => {
    const parsedNodeOrder = parseCampaignNodeOrder(campaignNodeId);
    return Number.isFinite(parsedNodeOrder) ? parsedNodeOrder : null;
};

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

const ensureRootNodesUnlockedForNewUsers = (progress, entryNodeIds) => {
    const safeProgress = progress ?? {};
    const hasSolvedChallenges = Array.isArray(safeProgress.completedNodes) && safeProgress.completedNodes.length > 0;

    if (!hasSolvedChallenges) {
        const canonicalUnlockedNodes = [...new Set((entryNodeIds ?? []).filter(Boolean))];
        const currentUnlockedNodes = Array.isArray(safeProgress.unlockedNodes)
            ? safeProgress.unlockedNodes.filter(Boolean)
            : [];
        const changed =
            canonicalUnlockedNodes.length !== currentUnlockedNodes.length ||
            canonicalUnlockedNodes.some((nodeId, index) => nodeId !== currentUnlockedNodes[index]);

        safeProgress.unlockedNodes = canonicalUnlockedNodes;
        return { changed, progress: safeProgress };
    }

    return { changed: false, progress: safeProgress };
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/campaign/map
// Returns full static map. Heavily cached.
// ────────────────────────────────────────────────────────────────────────────
export const getCampaignMap = async (req, res) => {
    try {
        const problems = await Problem.find({ type: 'campaign' });
        return res.status(200).json(problems);
    } catch (error) {
        console.error('[CAMPAIGN MAP] Failed to fetch campaign problems:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch campaign problems',
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
        const activeProblems = await Problem.find({ type: 'campaign' })
            .select('campaignNodeId')
            .lean();
        const activeNodeIds = activeProblems.map((problem) => problem.campaignNodeId).filter(Boolean);

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
        const rootUnlockState = ensureRootNodesUnlockedForNewUsers(progress, entryNodeIds);
        const finalProgress = rootUnlockState.progress;

        if (changed || rootUnlockState.changed) {
            await CampaignProgress.updateOne({
                userId,
            }, {
                $set: {
                    ...updateFields,
                    unlockedNodes: finalProgress.unlockedNodes,
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: finalProgress,
            progress: finalProgress,
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
        const node = await Problem.findOne({ campaignNodeId: nodeId, type: 'campaign' })
            .select('title slug description inputFormatDescription difficulty topics constraints testCases starterCode timeLimit memoryLimit campaignRegion campaignNodeId rewards starThresholds');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        const isUnlocked = Boolean(progress && (progress.unlockedNodes ?? []).includes(nodeId));
        if (!isUnlocked && !isEntryNode(node)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked. Complete prerequisites first.' 
            });
        }

        // Only send PUBLIC test cases to frontend
        const problem = node.toObject();
        problem.testCases = (problem.testCases ?? []).filter(tc => tc.isPublic);

        // Check if user has already completed this node
        const existingCompletion = progress?.completedNodes?.find(n => n.nodeId === nodeId);

        return res.json({
            success: true,
            node: {
                ...problem,
                nodeOrder: getCampaignNodeOrder(problem.campaignNodeId),
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
        recordActivity(userId);

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

        const node = await Problem.findOne({ campaignNodeId: nodeId, type: 'campaign' })
            .select('title slug description inputFormatDescription difficulty constraints testCases starterCode timeLimit memoryLimit campaignRegion campaignNodeId rewards starThresholds goldenSolution topics');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        const isUnlocked = Boolean(progress && (progress.unlockedNodes ?? []).includes(nodeId));
        if (!isUnlocked && !isEntryNode(node)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Node not unlocked' 
            });
        }

        const allTestCases = node.testCases ?? [];

        const userPlan = req.user?.subscriptionPlan || 'free';
        const userTier = userPlan === 'free' ? 0 : userPlan === 'plus' ? 1 : userPlan === 'pro' ? 2 : 3;
        const isAdmin = req.user?.role === 'admin';

        // 3. Increment attempt count BEFORE execution (Skip for Premium/Admin)
        if (!isAdmin && userTier < 3) {
            progress.totalAttempts = (progress.totalAttempts ?? 0) + 1;
        }

        // 4. Execute against ALL test cases via Piston
        const executionResult = await executeForCampaign(code, language, allTestCases);

        // 5. If failed, return feedback without updating progress
        if (!executionResult.allPassed) {

            // Update sage failure counter for this node (Skip for Premium)
            let sageEntry = null;
            if (!isAdmin && userTier < 3) {
                if (!progress.sageUsage) progress.sageUsage = [];
                sageEntry = progress.sageUsage.find(s => s.nodeId === nodeId);
                if (!sageEntry) {
                    progress.sageUsage.push({ nodeId, failCount: 1 });
                } else {
                    sageEntry.failCount += 1;
                }

                progress.markModified('sageUsage');
                await progress.save();
            }

            return res.json({
                success: false,
                allPassed: false,
                results: executionResult.results,
                sageShouldTrigger: isAdmin || userTier >= 3 || (sageEntry?.failCount || 0) >= 3,
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
            if (node.rewards?.lootPool?.length > 0) {
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
        const allNodes = await Problem.find({ type: 'campaign' })
            .select('campaignRegion campaignNodeId')
            .lean();
        const orderedNodes = allNodes
            .filter((entry) => entry?.campaignNodeId)
            .sort(compareCampaignProblems);
        const currentNodeIndex = orderedNodes.findIndex((entry) => entry.campaignNodeId === nodeId);
        const nextNodeId = currentNodeIndex >= 0
            ? orderedNodes[currentNodeIndex + 1]?.campaignNodeId
            : null;

        newlyUnlockedNodes = nextNodeId && !progress.unlockedNodes.includes(nextNodeId)
            ? [nextNodeId]
            : [];

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

        const solvedIncrement = existingNode ? 0 : 1;
        const minutesSpent = Number(((executionResult.avgTimeMs || 0) / 60000).toFixed(2));
        await User.findByIdAndUpdate(userId, {
            $inc: {
                totalTimeSpent: minutesSpent,
                totalSolved: solvedIncrement,
            }
        });

        // Badge Events
        if (!existingNode) {
            processAchievementEvent(userId, 'CAMPAIGN_PROGRESS', {
                action: 'clear_node', zoneId: node.campaignRegion, nodeId, stars, isFirstSubmission: progress.totalAttempts === 1
            }).catch(e => console.error(e));
            
            // If this is a boss node (Node 8 or 15 based on typical Campaign ID structure e.g. "aa_08")
            if (nodeId.includes('08') || nodeId.includes('15')) {
                processAchievementEvent(userId, 'CAMPAIGN_PROGRESS', {
                    action: 'clear_boss', nodeId, stars, timeMs: executionResult.avgTimeMs, isFirstSubmission: progress.totalAttempts === 1
                }).catch(e => console.error(e));
            }
        }
        
        if (!existingNode || isImprovement) {
            const starsGained = !existingNode ? stars : (stars - existingNode.starsAwarded);
            if (starsGained > 0) {
                processAchievementEvent(userId, 'CAMPAIGN_PROGRESS', {
                    action: 'earn_stars', stars: starsGained
                }).catch(e => console.error(e));
            }
        }
        
        if (lootDropped) {
             processAchievementEvent(userId, 'CAMPAIGN_PROGRESS', {
                 action: 'loot_drop', lootDropRarity: 'rare'
             }).catch(e => console.error(e));
        }

        processAchievementEvent(userId, 'PROBLEM_SOLVED', {
            solveTimeSeconds: executionResult.avgTimeMs / 1000,
            tags: node.topics || []
        }).catch(e => console.error(e));

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
