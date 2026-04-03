// backend/middleware/campaignAuth.js
// Attaches to campaign routes AFTER verifyToken.
// Provides two independent middleware functions:
//   1. ensureProgress  – auto-initialises CampaignProgress on first visit
//   2. verifyNodeUnlocked – gate that prevents skipping locked nodes

import CampaignMap      from '../models/CampaignMap.js';
import CampaignProgress from '../models/CampaignProgress.js';

// ─────────────────────────────────────────────────────────────────────────────
// ensureProgress
// Looks up (or lazily creates) the user's CampaignProgress document and
// attaches it to req.campaignProgress so downstream controllers can use it
// without an extra DB round-trip.
// ─────────────────────────────────────────────────────────────────────────────
export const ensureProgress = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            // verifyToken should have already rejected unauthenticated requests,
            // but be defensive.
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let progress = await CampaignProgress.findOne({ userId });

        if (!progress) {
            // First-ever visit — initialise with the entry node(s)
            const entryNodes = await CampaignMap.find({
                isActive:      true,
                prerequisites: { $size: 0 },   // no prerequisites = starting nodes
            })
                .sort({ regionOrder: 1, nodeOrder: 1 })
                .lean();

            const startIds = entryNodes.length > 0
                ? entryNodes.map(n => n.nodeId)
                : ['array_01']; // hard fallback if seed hasn't run yet

            progress = await CampaignProgress.create({
                userId,
                unlockedNodes: startIds,
            });

            console.log(`[CAMPAIGN] Initialised progress for user ${userId} — unlocked: ${startIds}`);
        }

        req.campaignProgress = progress;
        next();
    } catch (err) {
        console.error('[CAMPAIGN AUTH - ensureProgress]', err);
        // Don't crash the request — let the controller handle any inconsistency
        next();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyNodeUnlocked
// Must be placed AFTER ensureProgress in the middleware chain.
// Reads nodeId from req.params.nodeId OR req.body.nodeId and validates it
// is in the user's unlockedNodes list.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyNodeUnlocked = async (req, res, next) => {
    try {
        const nodeId = req.params.nodeId || req.body.nodeId;

        if (!nodeId) {
            // Nothing to validate — pass through
            return next();
        }

        // Prefer the already-fetched progress on req to avoid another DB hit
        const progress =
            req.campaignProgress ||
            (await CampaignProgress.findOne({ userId: req.user._id }).lean());

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: 'Campaign progress not found. Visit /campaign to initialise.',
            });
        }

        if (!progress.unlockedNodes.includes(nodeId)) {
            return res.status(403).json({
                success: false,
                message: 'Node is locked. Complete prerequisites first.',
                lockedNodeId: nodeId,
            });
        }

        next();
    } catch (err) {
        console.error('[CAMPAIGN AUTH - verifyNodeUnlocked]', err);
        return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
};