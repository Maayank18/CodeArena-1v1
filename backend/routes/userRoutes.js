import express from 'express';
import { getLeaderboard } from '../controllers/userController.js'; // Import the file you just made

const router = express.Router();

router.get('/leaderboard', getLeaderboard);

export default router;