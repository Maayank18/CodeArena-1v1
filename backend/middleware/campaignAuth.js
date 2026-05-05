// backend/middleware/campaignAuth.js
// Attaches to campaign routes AFTER verifyToken.
// Provides two independent middleware functions:
//   1. ensureProgress  – auto-initialises CampaignProgress on first visit
//   2. verifyNodeUnlocked – gate that prevents skipping locked nodes

import CampaignMap      from '../models/CampaignMap.js';
import CampaignProgress from '../models/CampaignProgress.js';
import Problem from '../models/Problem.js';
import {
    ensureEntryNodesUnlocked,
    getEntryNodeIds,
    isEntryNode,
} from '../utils/campaignProgressBootstrap.js';

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
            const startIds = await getEntryNodeIds();

            progress = await CampaignProgress.create({
                userId,
                unlockedNodes: startIds,
            });

            console.log(`[CAMPAIGN] Initialised progress for user ${userId} — unlocked: ${startIds}`);
        } else {
            const startIds = await getEntryNodeIds();
            const { changed } = ensureEntryNodesUnlocked(progress, startIds);

            if (changed) {
                progress.markModified('unlockedNodes');
                await progress.save();
                console.log(`[CAMPAIGN] Repaired entry unlocks for user ${userId} — unlocked: ${progress.unlockedNodes}`);
            }
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
            const node = await Problem.findOne({ campaignNodeId: nodeId, type: 'campaign' })
                .select('campaignNodeId campaignRegion')
                .lean();

            if (isEntryNode(node)) {
                return next();
            }

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
// V 1.5
