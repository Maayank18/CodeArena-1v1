// backend/controllers/mentorController.js
// FIXED: sageCallCount does not exist on the sageUsage subdocument.
// The schema only has { nodeId, usedAt, failCount }.
// We use failCount as a proxy for both failure-gate AND rate-limiting.
// Rate limit = max 8 hint calls per node (failCount can keep counting
// even after initial 3-fail trigger since we never reset it on sage calls).

import CampaignProgress from '../models/CampaignProgress.js';
import CampaignMap      from '../models/CampaignMap.js';
import { buildSageMessages, callSageAI, getFallbackHint } from '../services/sageService.js';

const SAGE_GATE_FAILS    = 3;  // must fail this many times before Sage unlocks
const MAX_SAGE_CALLS     = 8;  // max total sage hints per node per user

// We store the sage call count in a separate Map (memory, per-process).
// This is fine: sage calls are ephemeral, not persisted.
// For multi-instance deployments, move this to Redis or add a sageCallCount
// field to the CampaignProgress.sageUsage schema.
const sageCallCounts = new Map(); // key: `${userId}:${nodeId}`

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/campaign/mentor
// ─────────────────────────────────────────────────────────────────────────────
export const getSageHint = async (req, res) => {
    try {
        const { nodeId, failedCode, errorMessage, language } = req.body;
        const userId = req.user._id;

        if (!nodeId || !failedCode) {
            return res.status(400).json({
                success: false,
                message: 'nodeId and failedCode are required',
            });
        }

        // ── Server-side gate: only trigger after SAGE_GATE_FAILS failures ──
        const progress =
            req.campaignProgress ||
            (await CampaignProgress.findOne({ userId }));

        if (!progress) {
            return res.status(404).json({ success: false, message: 'Progress not found' });
        }

        const sageEntry = progress.sageUsage?.find(s => s.nodeId === nodeId);

        if (!sageEntry || sageEntry.failCount < SAGE_GATE_FAILS) {
            return res.status(403).json({
                success: false,
                message: `The Sage only appears after ${SAGE_GATE_FAILS} failures on this node.`,
                failCount: sageEntry?.failCount ?? 0,
            });
        }

        // ── In-memory rate limit ──────────────────────────────────────────
        const callKey  = `${userId}:${nodeId}`;
        const callsMade = sageCallCounts.get(callKey) || 0;

        if (callsMade >= MAX_SAGE_CALLS) {
            return res.json({
                success:     true,
                hint:        'The Sage has spoken enough on this node. The answer lies within your own reflection.',
                rateLimited: true,
            });
        }

        // ── Fetch problem data for context ────────────────────────────────
        const node = await CampaignMap.findOne({ nodeId })
            .populate('problemId', 'title description');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        const { title = '', description = '' } = node.problemId || {};

        // ── Build messages + call AI ──────────────────────────────────────
        const messages = buildSageMessages({
            title,
            description,
            userCode:     failedCode,
            language:     language || 'unknown',
            errorMessage,
        });

        let hint;
        try {
            hint = await callSageAI(messages);
        } catch (aiErr) {
            console.error('[SAGE] AI call failed:', aiErr.message);
            hint = getFallbackHint();
        }

        // ── Increment in-memory call counter ──────────────────────────────
        sageCallCounts.set(callKey, callsMade + 1);

        return res.json({
            success:        true,
            hint,
            callsRemaining: MAX_SAGE_CALLS - (callsMade + 1),
        });

    } catch (err) {
        console.error('[SAGE CONTROLLER]', err);
        return res.json({
            success: true,
            hint:    getFallbackHint(), // never crash the user's session
        });
    }
};
// V 1.5
