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

const router = express.Router();

router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Validate that username exists
    if (!username || username === 'undefined') {
        return res.status(400).json({ message: "Username is required" });
    }

    const history = await Match.find({
      "players.username": username
    })
    .sort({ createdAt: -1 })
    .limit(20) // Only fetch last 20 for performance
    .lean();

    // If no history, return empty array instead of error
    return res.json(history || []);
  } catch (error) {
    console.error("❌ Critical History Route Error:", error);
    return res.status(500).json({ error: "Server could not retrieve match data" });
  }
});

export default router;
// V 1.5
