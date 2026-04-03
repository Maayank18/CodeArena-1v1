// backend/controllers/mentorController.js
// Replaces the inline version from the previous session.
// Now delegates prompt-building and API calls to sageService.js.

import CampaignProgress from '../models/CampaignProgress.js';
import CampaignMap      from '../models/CampaignMap.js';
import { buildSageMessages, callSageAI, getFallbackHint } from '../services/sageService.js';

// Per-user, per-node rate limit: max 8 Sage calls total to control cost.
const MAX_SAGE_CALLS_PER_NODE = 8;

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

        // ── Server-side gate: only trigger after 3 consecutive failures ────
        const progress =
            req.campaignProgress ||
            (await CampaignProgress.findOne({ userId }));

        if (!progress) {
            return res.status(404).json({ success: false, message: 'Progress not found' });
        }

        const sageEntry = progress.sageUsage?.find(s => s.nodeId === nodeId);

        if (!sageEntry || sageEntry.failCount < 3) {
            return res.status(403).json({
                success: false,
                message: 'The Sage only appears after 3 failures on this node.',
                failCount: sageEntry?.failCount ?? 0,
            });
        }

        // ── Rate limit: prevent infinite Sage spam ─────────────────────────
        const callsMade = sageEntry.sageCallCount ?? 0;
        if (callsMade >= MAX_SAGE_CALLS_PER_NODE) {
            return res.json({
                success: true,
                hint: 'The Sage has spoken enough. The path forward must be your own.',
                rateLimited: true,
            });
        }

        // ── Fetch problem data for context ─────────────────────────────────
        const node = await CampaignMap.findOne({ nodeId })
            .populate('problemId', 'title description');

        if (!node) {
            return res.status(404).json({ success: false, message: 'Node not found' });
        }

        const { title = '', description = '' } = node.problemId || {};

        // ── Build messages + call AI ────────────────────────────────────────
        const messages = buildSageMessages({
            title,
            description,
            userCode: failedCode,
            language: language || 'unknown',
            errorMessage,
        });

        let hint;
        try {
            hint = await callSageAI(messages);
        } catch (aiErr) {
            console.error('[SAGE] AI call failed:', aiErr.message);
            hint = getFallbackHint();
        }

        // ── Increment sage call counter ─────────────────────────────────────
        sageEntry.sageCallCount = callsMade + 1;
        await progress.save();

        return res.json({
            success: true,
            hint,
            callsRemaining: MAX_SAGE_CALLS_PER_NODE - (callsMade + 1),
        });

    } catch (err) {
        console.error('[SAGE CONTROLLER]', err);
        // Never let an AI error crash the session — return a graceful fallback
        return res.json({
            success: true,
            hint: getFallbackHint(),
        });
    }
};