// // routes/statsRoutes.js
// import express from 'express';
// import { getStats } from '../controllers/statsController.js';

// const router = express.Router();

// router.get('/', getStats); // responds to /api/stats

// export default router;


// routes/statsRoutes.js
import express from 'express';
import { getStats, getUserAnalytics, getWeeklyReport } from '../controllers/statsController.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePro, requirePremium } from '../middleware/subscriptionAuth.js';

const router = express.Router();

// This must be GET '/' so that when mounted at '/api/stats'
// it responds to '/api/stats' (not '/api/stats/stats').
router.get('/', getStats);

// Analytics Route (Public for consistency tracking)
router.get('/analytics', verifyToken, getUserAnalytics);

// Weekly Report Route (Premium Only)
router.get('/weekly-report', verifyToken, requirePremium, getWeeklyReport);

export default router;
// V 1.5

// Version-2.0