// // controllers/statsController.js
// import User from '../models/User.js';

// export const getStats = async (req, res) => {
//   try {
//     // `io` isn't available here by default; we will attach live count to req.app.locals.io in server.js
//     const io = req.app.locals.io;
//     const live = io ? io.engine.clientsCount : 0;
//     const total = await User.countDocuments();
//     res.json({ live, total });
//   } catch (err) {
//     console.error("Error in getStats:", err);
//     res.status(500).json({ message: 'Failed to read stats' });
//   }
// };

// controllers/statsController.js
// import User from '../models/User.js';

// export const getStats = async (req, res) => {
//   try {
//     // safe access to io which we attach to app.locals in server.js
//     const io = req.app && req.app.locals && req.app.locals.io;
//     const live = io ? io.engine.clientsCount : 0;
//     const total = await User.countDocuments();
//     return res.json({ live, total });
//   } catch (err) {
//     console.error("Error in getStats:", err);
//     return res.status(500).json({ message: 'Failed to read stats' });
//   }
// };







// UPDATED STAT CONTROLLER
import User from '../models/User.js';
import Room from '../models/Room.js';

// @desc    Get site-wide statistics
// @route   GET /api/stats
// @access  Public
export const getStats = async (req, res) => {
  try {
    // 1. Live Users (Socket Connections)
    // Safe access to io instance attached in server.js
    const io = req.app.get('io') || req.app.locals.io;
    const liveUsers = io ? io.engine.clientsCount : 0;

    // 2. Total Registered Users
    const totalUsers = await User.countDocuments();

    // 3. Active Battles (Rooms currently in 'active' state)
    // This looks cool on the homepage: "5 Battles Happening Now!"
    const activeBattles = await Room.countDocuments({ status: 'active' });

    // 4. (Optional) Total Matches Played 
    // We aggregate the 'matchesPlayed' from all users and divide by 2 (since 2 players per match)
    // Note: This can be heavy if you have millions of users, but fine for now.
    const matchStats = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.matchesPlayed" } } }
    ]);
    const totalMatches = matchStats[0]?.total ? Math.floor(matchStats[0].total / 2) : 0;

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
