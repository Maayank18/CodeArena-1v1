// routes/statsRoutes.js
import express from 'express';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/', getStats); // responds to /api/stats

export default router;
