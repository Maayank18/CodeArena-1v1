import express from 'express';
import { executeVisualization } from '../controllers/visualizerController.js';

import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

// POST /api/visualize/run
// Body: { code: string, language: "javascript" | "cpp" }
router.post('/run', verifyToken, executeVisualization);

export default router;
// V 1.5
