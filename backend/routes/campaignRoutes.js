// backend/routes/campaignRoutes.js
// backend/routes/campaignRoutes.js
// Drop-in replacement for the route file written in the previous session.
// Now correctly applies campaignAuth middleware at the right granularity.

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ensureProgress, verifyNodeUnlocked } from '../middleware/campaignAuth.js';
import { requirePlus } from '../middleware/subscriptionAuth.js';

import {
    getCampaignMap,
    getCampaignProgress,
    getNodeDetails,
    submitCampaignSolution,
    spendKnowledgePoints,
    equipCosmetic,
} from '../controllers/campaignController.js';

import { getSageHint } from '../controllers/mentorController.js';

const router = express.Router();

// ── All routes require a valid JWT ──────────────────────────────────────────
// router.use(verifyToken);

// ── Static map (no progress initialisation needed — public-ish) ─────────────
// GET /api/campaign/map
// Heavily cached in the controller; safe to hit often.
router.get('/map', getCampaignMap);
router.use(verifyToken);

// ── Progress routes (need progress to exist) ─────────────────────────────────
// GET /api/campaign/progress
router.get('/progress', ensureProgress, getCampaignProgress);

// ── Node details (needs progress + node must be unlocked) ────────────────────
// GET /api/campaign/node/:nodeId
router.get('/node/:nodeId', ensureProgress, verifyNodeUnlocked, getNodeDetails);

// ── Core submission (needs progress + node unlocked — zero-trust) ────────────
// POST /api/campaign/submit  { nodeId, code, language }
router.post('/submit', ensureProgress, verifyNodeUnlocked, submitCampaignSolution);

// ── Economy ──────────────────────────────────────────────────────────────────
// POST /api/campaign/spend-kp  { itemId, itemType, cost }
router.post('/spend-kp', ensureProgress, spendKnowledgePoints);

// POST /api/campaign/equip  { itemId, itemType }
router.post('/equip', ensureProgress, equipCosmetic);

// ── AI Sage ──────────────────────────────────────────────────────────────────
// POST /api/campaign/mentor  { nodeId, failedCode, errorMessage, language }
// ensureProgress needed so sage can verify failCount server-side
router.post('/mentor', requirePlus, ensureProgress, getSageHint);

export default router;
// V 1.5
