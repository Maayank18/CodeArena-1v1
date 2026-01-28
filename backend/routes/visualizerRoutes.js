import express from 'express';
import { executeVisualization } from '../controllers/visualizerController.js';

const router = express.Router();

// POST /api/visualize/run
// Body: { code: string, language: "javascript" | "cpp" }
router.post('/run', executeVisualization);

export default router;


