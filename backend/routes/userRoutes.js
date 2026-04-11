// import express from 'express';
// import { getLeaderboard } from '../controllers/userController.js'; // Import the file you just made

// const router = express.Router();

// router.get('/leaderboard', getLeaderboard);

// export default router;



import express from 'express';
import { getLeaderboard, getUserProfile } from '../controllers/userController.js'; 

const router = express.Router();

// 🏆 GET Global Leaderboard
router.get('/leaderboard', getLeaderboard);

// 🔄 GET User Profile (Used for Syncing Dashboard Stats)
router.get('/profile/:username', getUserProfile);

export default router;
// V 1.5
