// // routes/statsRoutes.js
// import express from 'express';
// import { getStats } from '../controllers/statsController.js';

// const router = express.Router();

// router.get('/', getStats); // responds to /api/stats

// export default router;


// routes/statsRoutes.js
import express from 'express';
import { getStats } from '../controllers/statsController.js';

const router = express.Router();

// This must be GET '/' so that when mounted at '/api/stats'
// it responds to '/api/stats' (not '/api/stats/stats').
router.get('/', getStats);

export default router;
