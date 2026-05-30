// import express from 'express';
// import Match from '../models/Match.js';

// const router = express.Router();

// // GET /api/matches/user/:username
// // This is the command your Mobile Phone will send to get history
// router.get('/user/:username', async (req, res) => {
//   try {
//     const { username } = req.params;

//     // FIND matches where "players.username" matches the user
//     // SORT by -1 (Newest first)
//     const history = await Match.find({
//       "players.username": username
//     }).sort({ createdAt: -1 });

//     res.json(history);
//   } catch (error) {
//     console.error("Error fetching history:", error);
//     res.status(500).json({ message: "Server Error fetching history" });
//   }
// });

// export default router;









// routes/matchRoutes.js
// import express from 'express';
// import Match from '../models/Match.js';

// const router = express.Router();

// router.get('/user/:username', async (req, res) => {
//   try {
//     const { username } = req.params;
//     console.log(`[DB] Fetching history for: ${username}`);

//     // Robust query: Finds matches where at least one player object has this username
//     const history = await Match.find({
//       "players.username": username
//     })
//     .sort({ createdAt: -1 })
//     .lean(); // Senior Tip: lean() makes the query 3x faster for read-only data

//     console.log(`[DB] Found ${history.length} matches`);
//     res.json(history);
//   } catch (error) {
//     console.error("History Route Error:", error);
//     res.status(500).json({ error: "Database retrieval failed" });
//   }
// });

// export default router;










import express from 'express';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js'; // Ensure model registration for populate
import User from '../models/User.js'; // Resolve canonical casing for queries
import { verifyToken } from '../middleware/auth.js';
import { requirePlus } from '../middleware/subscriptionAuth.js';

const router = express.Router();

router.get('/user/:username', verifyToken, requirePlus, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`[HISTORY] Match history requested for username: "${username}"`);
    
    // Validate that username exists
    if (!username || username === 'undefined') {
        console.warn(`[HISTORY] Validation failed: invalid username "${username}"`);
        return res.status(400).json({ message: "Username is required" });
    }

    // Resolve the canonical username casing from User model to prevent indexed key conflicts
    const userDoc = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).select('username').lean();
    
    const canonicalUsername = userDoc ? userDoc.username : username;
    console.log(`[HISTORY] Casing resolution: "${username}" -> "${canonicalUsername}"`);

    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const history = await Match.find({
      "players.username": canonicalUsername
    })
    .populate({
      path: 'problemIds',
      select: 'title description difficulty topics constraints starterCode goldenSolution'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit) // Fetch based on requested limit
    .lean();

    console.log(`[HISTORY] Query successful. Found ${history.length} matches for canonical username "${canonicalUsername}" (skip: ${skip}, limit: ${limit})`);

    // If no history, return empty array instead of error
    return res.json(history || []);
  } catch (error) {
    console.error("❌ Critical History Route Error:", error);
    return res.status(500).json({ error: "Server could not retrieve match data" });
  }
});

export default router;
// V 1.5
