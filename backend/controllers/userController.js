// Optimized getLeaderboard in userController.js
import User from '../models/User.js';

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