import User from '../models/User.js';

// @desc    Get Global Leaderboard (Top 50)
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
    try {
        // 1. Fetch Users from DB
        // Query logic:
        // - Sort by seasonScore DESC (-1) -> Highest points first
        // - If tie, sort by rating DESC (-1) -> Higher skill first
        // - Limit to top 50 to keep the query fast
        const users = await User.find({})
            .sort({ seasonScore: -1, rating: -1 }) 
            .limit(50) 
            .select('username rating seasonScore stats'); // Select only fields we need

        // 2. Format the data for the frontend
        // We calculate 'rank' and 'winRate' here to make the frontend's job easier
        const leaderboard = users.map((user, index) => {
            const wins = user.stats?.wins || 0;
            const matches = user.stats?.matchesPlayed || 0;
            const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : 0;

            return {
                rank: index + 1,
                _id: user._id,
                username: user.username,
                rating: user.rating || 1200,       // Needed for "Level 5 Coder" badge
                seasonScore: user.seasonScore || 0, // The main score
                matchesPlayed: matches,
                winRate: winRate + "%"
            };
        });

        res.json(leaderboard);

    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Server Error fetching leaderboard" });
    }
};