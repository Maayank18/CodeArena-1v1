import express from 'express';
import Match from '../models/Match.js';

const router = express.Router();

// GET /api/matches/user/:username
// This is the command your Mobile Phone will send to get history
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // FIND matches where "players.username" matches the user
    // SORT by -1 (Newest first)
    const history = await Match.find({
      "players.username": username
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Server Error fetching history" });
  }
});

export default router;