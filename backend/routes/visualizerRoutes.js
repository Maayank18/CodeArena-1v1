import express from 'express';
import { executeVisualization, consumeVisualization } from '../controllers/visualizerController.js';

import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

// POST /api/visualize/run
// Body: { code: string, language: "javascript" | "cpp" }
router.post('/run', verifyToken, executeVisualization);

// POST /api/visualize/consume
router.post('/consume', verifyToken, consumeVisualization);

export default router;
// V 1.5

// Version-2.0