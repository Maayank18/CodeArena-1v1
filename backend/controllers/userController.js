// import User from '../models/User.js';

// @desc    Get Global Leaderboard (Top 50)
// @route   GET /api/users/leaderboard
// @access  Public
// export const getLeaderboard = async (req, res) => {
//     try {
//         // 1. Fetch Users from DB
//         // Query logic:
//         // - Sort by seasonScore DESC (-1) -> Highest points first
//         // - If tie, sort by rating DESC (-1) -> Higher skill first
//         // - Limit to top 50 to keep the query fast
//         const users = await User.find({})
//             .sort({ seasonScore: -1, rating: -1 }) 
//             .limit(50) 
//             .select('username rating seasonScore stats'); // Select only fields we need

//         // 2. Format the data for the frontend
//         // We calculate 'rank' and 'winRate' here to make the frontend's job easier
//         const leaderboard = users.map((user, index) => {
//             const wins = user.stats?.wins || 0;
//             const matches = user.stats?.matchesPlayed || 0;
//             const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : 0;

//             return {
//                 rank: index + 1,
//                 _id: user._id,
//                 username: user.username,
//                 rating: user.rating || 1000,       // Needed for "Level 5 Coder" badge
//                 seasonScore: user.seasonScore || 0, // The main score
//                 matchesPlayed: matches,
//                 winRate: winRate + "%"
//             };
//         });

//         res.json(leaderboard);

//     } catch (error) {
//         console.error("Leaderboard Error:", error);
//         res.status(500).json({ message: "Server Error fetching leaderboard" });
//     }
// };




// // backend/controllers/userController.js
// export const getLeaderboard = async (req, res) => {
//     try {
//         const users = await User.find({})
//             .sort({ seasonScore: -1, rating: -1 }) 
//             .limit(50) 
//             .select('username rating seasonScore stats avatar'); // ✅ ADDED avatar

//         const leaderboard = users.map((user, index) => ({
//             rank: index + 1,
//             _id: user._id,
//             username: user.username,
//             avatar: user.avatar, // ✅ Pass avatar to frontend
//             rating: user.rating || 1000,
//             seasonScore: user.seasonScore || 0,
//             matchesPlayed: user.stats?.matchesPlayed || 0,
//             winRate: user.stats?.matchesPlayed > 0 
//                 ? ((user.stats.wins / user.stats.matchesPlayed) * 100).toFixed(1) + "%" 
//                 : "0%"
//         }));

//         res.json(leaderboard);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error" });
//     }
// };




// import User from '../models/User.js';

// // 🏆 GET LEADERBOARD - Sorted by seasonScore
// export const getLeaderboard = async (req, res) => {
//   try {
//     console.log('[LEADERBOARD] Fetching top players...');
    
//     const players = await User.find()
//       .select('username avatar rating seasonScore stats createdAt') // Only fetch needed fields
//       .sort({ seasonScore: -1 }) // Sort by season score (highest first)
//       .limit(100) // Limit to top 100 players
//       .lean(); // Faster read-only query

//     console.log(`[LEADERBOARD] Found ${players.length} players`);
    
//     res.json(players);
//   } catch (error) {
//     console.error('❌ [LEADERBOARD] Error:', error);
//     res.status(500).json({ 
//       error: 'Failed to fetch leaderboard',
//       details: error.message 
//     });
//   }
// };



// import User from '../models/User.js';

// // 🏆 GET LEADERBOARD - Sorted by seasonScore
// export const getLeaderboard = async (req, res) => {
//   try {
//     console.log('[LEADERBOARD] Fetching top players...');
    
//     const players = await User.find()
//       .select('username avatar rating seasonScore stats createdAt') // Only fetch needed fields
//       .sort({ seasonScore: -1 }) // Sort by season score (highest first)
//       .limit(100) // Limit to top 100 players
//       .lean(); // Faster read-only query

//     console.log(`[LEADERBOARD] Found ${players.length} players`);
    
//     res.json(players);
//   } catch (error) {
//     console.error('❌ [LEADERBOARD] Error:', error);
//     res.status(500).json({ 
//       error: 'Failed to fetch leaderboard',
//       details: error.message 
//     });
//   }
// };

// /** * ✅ ADDED: SYNC LOGIC FOR DASHBOARD
//  * This handles the GET /api/users/profile/:username request
//  * needed to fix the "1000 Elo" sync issue.
//  */
// export const getUserProfile = async (req, res) => {
//     try {
//         const { username } = req.params;
//         console.log(`[PROFILE] Syncing data for: ${username}`);
        
//         const user = await User.findOne({ username })
//             .select('username rating seasonScore stats avatar email fullName phone')
//             .lean();

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         res.json(user);
//     } catch (error) {
//         console.error("❌ [PROFILE] Sync error:", error);
//         res.status(500).json({ 
//             error: "Internal Server Error", 
//             details: error.message 
//         });
//     }
// };





import User from '../models/User.js';

// 🏆 GET LEADERBOARD - Optimized with Tie-Breaking
// export const getLeaderboard = async (req, res) => {
//   try {
//     console.log('[LEADERBOARD] Fetching top players...');
    
//     const players = await User.find()
//       // ✅ FIX: Ensure 'stats' is selected so matches/wins show up
//       .select('username avatar rating seasonScore stats createdAt') 
//       // ✅ FIX: Sort by seasonScore FIRST, then rating SECOND as a tie-breaker
//       // This prevents you from being #1 just because your account is old.
//       .sort({ seasonScore: -1, rating: -1 }) 
//       .limit(100) 
//       .lean(); 

//     console.log(`[LEADERBOARD] Found ${players.length} players`);
//     res.json(players);
//   } catch (error) {
//     console.error('❌ [LEADERBOARD] Error:', error);
//     res.status(500).json({ error: 'Failed to fetch leaderboard' });
//   }
// };


// Optimized getLeaderboard in userController.js
export const getLeaderboard = async (req, res) => {
  try {
    const players = await User.find()
      .select('username avatar rating seasonScore stats createdAt') 
      .sort({ seasonScore: -1, rating: -1 }) 
      .limit(100) 
      .lean(); 

    // ✅ SAFETY CHECK: Map over players to ensure stats object exists
    const sanitizedPlayers = players.map(p => ({
        ...p,
        stats: p.stats || { matchesPlayed: 0, wins: 0, losses: 0 }
    }));

    res.json(sanitizedPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// ✅ DASHBOARD SYNC: Fresh data fetch
export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        
        // ✅ FIX: Ensure all nested stats are retrieved for the Dashboard cards
        const user = await User.findOne({ username })
            .select('username rating seasonScore stats avatar email fullName phone')
            .lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ [PROFILE] Sync error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};