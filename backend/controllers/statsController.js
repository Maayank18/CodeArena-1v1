// UPDATED STAT CONTROLLER
// import User from '../models/User.js';
// import Room from '../models/Room.js';

// // @desc    Get site-wide statistics
// // @route   GET /api/stats
// // @access  Public
// export const getStats = async (req, res) => {
//   try {
//     // 1. Live Users (Socket Connections)
//     // Safe access to io instance attached in server.js
//     const io = req.app.get('io') || req.app.locals.io;
//     const liveUsers = io ? io.engine.clientsCount : 0;

//     // 2. Total Registered Users
//     const totalUsers = await User.countDocuments();

//     // 3. Active Battles (Rooms currently in 'active' state)
//     // This looks cool on the homepage: "5 Battles Happening Now!"
//     const activeBattles = await Room.countDocuments({ status: 'active' });

//     // 4. (Optional) Total Matches Played 
//     // We aggregate the 'matchesPlayed' from all users and divide by 2 (since 2 players per match)
//     // Note: This can be heavy if you have millions of users, but fine for now.
//     const matchStats = await User.aggregate([
//       { $group: { _id: null, total: { $sum: "$stats.matchesPlayed" } } }
//     ]);
//     const totalMatches = matchStats[0]?.total ? Math.floor(matchStats[0].total / 2) : 0;

//     return res.json({ 
//         live: liveUsers, 
//         total: totalUsers,
//         activeBattles,
//         totalMatches
//     });

//   } catch (err) {
//     console.error("Error in getStats:", err);
//     return res.status(500).json({ message: 'Failed to read stats' });
//   }
// };




import User from '../models/User.js';
import Room from '../models/Room.js';

// @desc    Get site-wide statistics
export const getStats = async (req, res) => {
  try {
    // 1. Live Users (Socket Connections)
    const io = req.app.get('io') || req.app.locals.io;
    const liveUsers = io ? io.engine.clientsCount : 0;

    // 2. Total Registered Users
    const totalUsers = await User.countDocuments();

    // 3. Active Battles
    const activeBattles = await Room.countDocuments({ status: 'active' });

    // 4. Total Matches Played 
    // ✅ FIX: Added $match to ensure we only sum users who actually have stats
    const matchStats = await User.aggregate([
      { $match: { "stats.matchesPlayed": { $exists: true } } },
      { $group: { _id: null, total: { $sum: "$stats.matchesPlayed" } } }
    ]);

    // Since every match has 2 players, total matches = sum of all played / 2
    const totalMatches = matchStats.length > 0 ? Math.floor(matchStats[0].total / 2) : 0;

    return res.json({ 
        live: liveUsers, 
        total: totalUsers,
        activeBattles,
        totalMatches
    });

  } catch (err) {
    console.error("Error in getStats:", err);
    return res.status(500).json({ message: 'Failed to read stats' });
  }
};