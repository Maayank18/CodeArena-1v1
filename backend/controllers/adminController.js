// import User from '../models/User.js';
// import Match from '../models/Match.js';
// import Problem from '../models/Problem.js';

// // ===== ANALYTICS =====

// export const getDashboardStats = async (req, res) => {
//     try {
//         // Total users
//         const totalUsers = await User.countDocuments();
        
//         // Users registered today
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const newUsersToday = await User.countDocuments({ 
//             createdAt: { $gte: today } 
//         });
        
//         // Total matches
//         const totalMatches = await Match.countDocuments();
        
//         // Matches today
//         const matchesToday = await Match.countDocuments({ 
//             createdAt: { $gte: today } 
//         });
        
//         // Most active player (by matches played)
//         const mostActivePlayer = await User.findOne()
//             .sort({ 'stats.matchesPlayed': -1 })
//             .select('username stats.matchesPlayed avatar')
//             .limit(1);
        
//         // Top player by season score
//         const topPlayer = await User.findOne()
//             .sort({ seasonScore: -1 })
//             .select('username seasonScore avatar rating')
//             .limit(1);
        
//         // Average matches per user
//         const avgMatchesPerUser = totalUsers > 0 
//             ? Math.round(totalMatches / totalUsers) 
//             : 0;
        
//         res.json({
//             users: {
//                 total: totalUsers,
//                 newToday: newUsersToday
//             },
//             matches: {
//                 total: totalMatches,
//                 today: matchesToday,
//                 avgPerUser: avgMatchesPerUser
//             },
//             players: {
//                 mostActive: mostActivePlayer,
//                 topRanked: topPlayer
//             }
//         });
//     } catch (error) {
//         console.error('Dashboard stats error:', error);
//         res.status(500).json({ message: 'Failed to fetch dashboard stats' });
//     }
// };

// export const getRecentActivity = async (req, res) => {
//     try {
//         const limit = parseInt(req.query.limit) || 20;
        
//         // Recent matches
//         const recentMatches = await Match.find()
//             .sort({ createdAt: -1 })
//             .limit(limit)
//             .lean();
        
//         // Recent user registrations
//         const recentUsers = await User.find()
//             .sort({ createdAt: -1 })
//             .select('username avatar rating createdAt')
//             .limit(10)
//             .lean();
        
//         res.json({
//             matches: recentMatches,
//             users: recentUsers
//         });
//     } catch (error) {
//         console.error('Recent activity error:', error);
//         res.status(500).json({ message: 'Failed to fetch recent activity' });
//     }
// };

// export const getActivityByHour = async (req, res) => {
//     try {
//         // Get matches grouped by hour of day
//         const matchesByHour = await Match.aggregate([
//             {
//                 $project: {
//                     hour: { $hour: "$createdAt" }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$hour",
//                     count: { $sum: 1 }
//                 }
//             },
//             {
//                 $sort: { _id: 1 }
//             }
//         ]);
        
//         // Fill in missing hours with 0
//         const hourlyData = Array(24).fill(0);
//         matchesByHour.forEach(item => {
//             hourlyData[item._id] = item.count;
//         });
        
//         res.json({ hourlyActivity: hourlyData });
//     } catch (error) {
//         console.error('Activity by hour error:', error);
//         res.status(500).json({ message: 'Failed to fetch activity data' });
//     }
// };

// // ===== USER MANAGEMENT =====

// export const getAllUsers = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 50;
//         const search = req.query.search || '';
        
//         const query = search 
//             ? { username: { $regex: search, $options: 'i' } }
//             : {};
        
//         const users = await User.find(query)
//             .select('username email avatar rating seasonScore stats createdAt')
//             .sort({ createdAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean();
        
//         const total = await User.countDocuments(query);
        
//         res.json({
//             users,
//             pagination: {
//                 page,
//                 limit,
//                 total,
//                 pages: Math.ceil(total / limit)
//             }
//         });
//     } catch (error) {
//         console.error('Get all users error:', error);
//         res.status(500).json({ message: 'Failed to fetch users' });
//     }
// };

// export const updateUserStats = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { rating, seasonScore, stats } = req.body;
        
//         const updateData = {};
//         if (rating !== undefined) updateData.rating = rating;
//         if (seasonScore !== undefined) updateData.seasonScore = seasonScore;
//         if (stats) updateData.stats = stats;
        
//         const user = await User.findByIdAndUpdate(
//             userId,
//             { $set: updateData },
//             { new: true }
//         ).select('username rating seasonScore stats');
        
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         res.json({ message: 'User updated successfully', user });
//     } catch (error) {
//         console.error('Update user error:', error);
//         res.status(500).json({ message: 'Failed to update user' });
//     }
// };

// export const deleteUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         const user = await User.findByIdAndDelete(userId);
        
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         // Also delete their match history
//         await Match.deleteMany({
//             'players.userId': userId
//         });
        
//         res.json({ message: 'User and their matches deleted successfully' });
//     } catch (error) {
//         console.error('Delete user error:', error);
//         res.status(500).json({ message: 'Failed to delete user' });
//     }
// };

// // ===== LEADERBOARD MANAGEMENT =====

// export const resetSeasonScores = async (req, res) => {
//     try {
//         const result = await User.updateMany(
//             {},
//             { $set: { seasonScore: 0 } }
//         );
        
//         res.json({ 
//             message: 'Season scores reset successfully',
//             usersAffected: result.modifiedCount
//         });
//     } catch (error) {
//         console.error('Reset season error:', error);
//         res.status(500).json({ message: 'Failed to reset season scores' });
//     }
// };

// export const resetAllStats = async (req, res) => {
//     try {
//         const result = await User.updateMany(
//             {},
//             {
//                 $set: {
//                     rating: 1000,
//                     seasonScore: 0,
//                     'stats.wins': 0,
//                     'stats.losses': 0,
//                     'stats.matchesPlayed': 0
//                 }
//             }
//         );
        
//         res.json({ 
//             message: 'All user stats reset successfully',
//             usersAffected: result.modifiedCount
//         });
//     } catch (error) {
//         console.error('Reset all stats error:', error);
//         res.status(500).json({ message: 'Failed to reset all stats' });
//     }
// };

// export const clearMatchHistory = async (req, res) => {
//     try {
//         const result = await Match.deleteMany({});
        
//         res.json({ 
//             message: 'Match history cleared successfully',
//             matchesDeleted: result.deletedCount
//         });
//     } catch (error) {
//         console.error('Clear match history error:', error);
//         res.status(500).json({ message: 'Failed to clear match history' });
//     }
// };

// // ===== PROBLEM MANAGEMENT =====

// export const getAllProblems = async (req, res) => {
//     try {
//         const problems = await Problem.find()
//             .select('title slug difficulty constraints testCases createdAt')
//             .sort({ createdAt: -1 })
//             .lean();
        
//         // Count test cases for each problem
//         const problemsWithCounts = problems.map(p => ({
//             ...p,
//             publicTestCount: p.testCases?.filter(tc => tc.isPublic).length || 0,
//             totalTestCount: p.testCases?.length || 0
//         }));
        
//         res.json({ problems: problemsWithCounts });
//     } catch (error) {
//         console.error('Get problems error:', error);
//         res.status(500).json({ message: 'Failed to fetch problems' });
//     }
// };

// export const getProblemById = async (req, res) => {
//     try {
//         const { problemId } = req.params;
        
//         const problem = await Problem.findById(problemId).lean();
        
//         if (!problem) {
//             return res.status(404).json({ message: 'Problem not found' });
//         }
        
//         res.json({ problem });
//     } catch (error) {
//         console.error('Get problem by ID error:', error);
//         res.status(500).json({ message: 'Failed to fetch problem' });
//     }
// };

// export const createProblem = async (req, res) => {
//     try {
//         const {
//             title,
//             slug,
//             description,
//             difficulty,
//             constraints,
//             timeLimit,
//             memoryLimit,
//             starterCode,
//             testCases
//         } = req.body;
        
//         // Validate required fields
//         if (!title || !slug || !description) {
//             return res.status(400).json({ 
//                 message: 'Title, slug, and description are required' 
//             });
//         }
        
//         // Check if slug already exists
//         const existingProblem = await Problem.findOne({ slug });
//         if (existingProblem) {
//             return res.status(400).json({ 
//                 message: 'A problem with this slug already exists' 
//             });
//         }
        
//         // Validate test cases
//         if (!testCases || testCases.length === 0) {
//             return res.status(400).json({ 
//                 message: 'At least one test case is required' 
//             });
//         }
        
//         // Create problem
//         const problem = await Problem.create({
//             title,
//             slug,
//             description,
//             difficulty: difficulty || 'Easy',
//             constraints: constraints || [],
//             timeLimit: timeLimit || 5000,
//             memoryLimit: memoryLimit || 512,
//             starterCode: starterCode || {},
//             testCases
//         });
        
//         res.status(201).json({ 
//             message: 'Problem created successfully', 
//             problem 
//         });
//     } catch (error) {
//         console.error('Create problem error:', error);
        
//         if (error.code === 11000) {
//             return res.status(400).json({ 
//                 message: 'A problem with this slug already exists' 
//             });
//         }
        
//         res.status(500).json({ message: 'Failed to create problem' });
//     }
// };

// export const updateProblem = async (req, res) => {
//     try {
//         const { problemId } = req.params;
//         const updateData = req.body;
        
//         // Don't allow slug updates (would break existing matches)
//         delete updateData.slug;
        
//         const problem = await Problem.findByIdAndUpdate(
//             problemId,
//             { $set: updateData },
//             { new: true, runValidators: true }
//         );
        
//         if (!problem) {
//             return res.status(404).json({ message: 'Problem not found' });
//         }
        
//         res.json({ 
//             message: 'Problem updated successfully', 
//             problem 
//         });
//     } catch (error) {
//         console.error('Update problem error:', error);
//         res.status(500).json({ message: 'Failed to update problem' });
//     }
// };

// export const deleteProblem = async (req, res) => {
//     try {
//         const { problemId } = req.params;
        
//         const problem = await Problem.findByIdAndDelete(problemId);
        
//         if (!problem) {
//             return res.status(404).json({ message: 'Problem not found' });
//         }
        
//         res.json({ message: 'Problem deleted successfully' });
//     } catch (error) {
//         console.error('Delete problem error:', error);
//         res.status(500).json({ message: 'Failed to delete problem' });
//     }
// };



// ========================================================================
// FILE: backend/controllers/adminController.js
// UPDATED VERSION WITH GOLDEN SOLUTION SUPPORT
// ========================================================================

import User from '../models/User.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';

// ===== PROBLEM MANAGEMENT =====

export const getAllProblems = async (req, res) => {
    try {
        const problems = await Problem.find()
            .select('title slug difficulty constraints testCases goldenSolution timeLimit memoryLimit createdAt')
            .sort({ createdAt: -1 })
            .lean();
        
        // Count test cases for each problem
        const problemsWithCounts = problems.map(p => ({
            ...p,
            publicTestCount: p.testCases?.filter(tc => tc.isPublic).length || 0,
            totalTestCount: p.testCases?.length || 0
        }));
        
        res.json({ problems: problemsWithCounts });
    } catch (error) {
        console.error('Get problems error:', error);
        res.status(500).json({ message: 'Failed to fetch problems' });
    }
};

export const getProblemById = async (req, res) => {
    try {
        const { problemId } = req.params;
        
        const problem = await Problem.findById(problemId).lean();
        
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        
        res.json({ problem });
    } catch (error) {
        console.error('Get problem by ID error:', error);
        res.status(500).json({ message: 'Failed to fetch problem' });
    }
};

export const createProblem = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            difficulty,
            constraints,
            timeLimit,
            memoryLimit,
            goldenSolution,
            starterCode,
            testCases
        } = req.body;
        
        // Validate required fields
        if (!title || !slug || !description) {
            return res.status(400).json({ 
                message: 'Title, slug, and description are required' 
            });
        }
        
        // Validate golden solution
        if (!goldenSolution || goldenSolution.trim() === '') {
            return res.status(400).json({ 
                message: 'Golden solution is required for validating test cases' 
            });
        }
        
        // Check if slug already exists
        const existingProblem = await Problem.findOne({ slug });
        if (existingProblem) {
            return res.status(400).json({ 
                message: 'A problem with this slug already exists' 
            });
        }
        
        // Validate test cases
        if (!testCases || testCases.length === 0) {
            return res.status(400).json({ 
                message: 'At least one test case is required' 
            });
        }
        
        // Validate test cases using golden solution
        try {
            const goldenFn = eval(`(${goldenSolution})`);
            
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                try {
                    const goldenOutput = goldenFn(testCase.input);
                    const expectedOutput = testCase.output.trim();
                    const actualOutput = String(goldenOutput).trim();
                    
                    if (actualOutput !== expectedOutput) {
                        return res.status(400).json({
                            message: `Test case ${i + 1} validation failed. Golden solution output (${actualOutput}) doesn't match expected output (${expectedOutput})`
                        });
                    }
                } catch (error) {
                    return res.status(400).json({
                        message: `Test case ${i + 1} execution failed: ${error.message}`
                    });
                }
            }
        } catch (error) {
            return res.status(400).json({
                message: `Invalid golden solution: ${error.message}`
            });
        }
        
        // Create problem
        const problem = await Problem.create({
            title,
            slug,
            description,
            difficulty: difficulty || 'Easy',
            constraints: constraints || [],
            timeLimit: timeLimit || 5000,
            memoryLimit: memoryLimit || 512,
            goldenSolution,
            starterCode: starterCode || {},
            testCases
        });
        
        res.status(201).json({ 
            message: 'Problem created successfully', 
            problem 
        });
    } catch (error) {
        console.error('Create problem error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'A problem with this slug already exists' 
            });
        }
        
        res.status(500).json({ message: 'Failed to create problem' });
    }
};

export const updateProblem = async (req, res) => {
    try {
        const { problemId } = req.params;
        const updateData = req.body;
        
        // Don't allow slug updates (would break existing matches)
        delete updateData.slug;
        delete updateData.username;
        
        // If updating golden solution or test cases, validate them
        if (updateData.goldenSolution || updateData.testCases) {
            const existingProblem = await Problem.findById(problemId);
            if (!existingProblem) {
                return res.status(404).json({ message: 'Problem not found' });
            }
            
            const goldenSolution = updateData.goldenSolution || existingProblem.goldenSolution;
            const testCases = updateData.testCases || existingProblem.testCases;
            
            if (!goldenSolution) {
                return res.status(400).json({ 
                    message: 'Golden solution is required' 
                });
            }
            
            try {
                const goldenFn = eval(`(${goldenSolution})`);
                
                for (let i = 0; i < testCases.length; i++) {
                    const testCase = testCases[i];
                    try {
                        const goldenOutput = goldenFn(testCase.input);
                        const expectedOutput = testCase.output.trim();
                        const actualOutput = String(goldenOutput).trim();
                        
                        if (actualOutput !== expectedOutput) {
                            return res.status(400).json({
                                message: `Test case ${i + 1} validation failed. Golden solution output doesn't match expected output`
                            });
                        }
                    } catch (error) {
                        return res.status(400).json({
                            message: `Test case ${i + 1} execution failed: ${error.message}`
                        });
                    }
                }
            } catch (error) {
                return res.status(400).json({
                    message: `Invalid golden solution: ${error.message}`
                });
            }
        }
        
        const problem = await Problem.findByIdAndUpdate(
            problemId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        
        res.json({ 
            message: 'Problem updated successfully', 
            problem 
        });
    } catch (error) {
        console.error('Update problem error:', error);
        res.status(500).json({ message: 'Failed to update problem' });
    }
};

export const deleteProblem = async (req, res) => {
    try {
        const { problemId } = req.params;
        
        const problem = await Problem.findByIdAndDelete(problemId);
        
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        
        res.json({ message: 'Problem deleted successfully' });
    } catch (error) {
        console.error('Delete problem error:', error);
        res.status(500).json({ message: 'Failed to delete problem' });
    }
};

// ===== DASHBOARD STATS =====

export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const [
            totalUsers,
            newUsersToday,
            totalMatches,
            matchesToday,
            mostActivePlayer
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: todayStart } }),
            Match.countDocuments(),
            Match.countDocuments({ createdAt: { $gte: todayStart } }),
            User.findOne().sort({ 'stats.matchesPlayed': -1 }).select('username stats').lean()
        ]);
        
        const avgMatchesPerUser = totalUsers > 0 ? (totalMatches / totalUsers).toFixed(2) : 0;
        
        res.json({
            users: {
                total: totalUsers,
                newToday: newUsersToday
            },
            matches: {
                total: totalMatches,
                today: matchesToday,
                avgPerUser: parseFloat(avgMatchesPerUser)
            },
            players: {
                mostActive: mostActivePlayer
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const [recentMatches, recentUsers] = await Promise.all([
            Match.find()
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('players', 'username')
                .select('players winner createdAt')
                .lean(),
            User.find()
                .sort({ createdAt: -1 })
                .limit(20)
                .select('username email createdAt')
                .lean()
        ]);
        
        res.json({
            matches: recentMatches,
            users: recentUsers
        });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ message: 'Failed to fetch recent activity' });
    }
};

export const getActivityByHour = async (req, res) => {
    try {
        const matches = await Match.find().select('createdAt').lean();
        
        const hourlyActivity = new Array(24).fill(0);
        
        matches.forEach(match => {
            const hour = new Date(match.createdAt).getHours();
            hourlyActivity[hour]++;
        });
        
        res.json({ hourlyActivity });
    } catch (error) {
        console.error('Get activity by hour error:', error);
        res.status(500).json({ message: 'Failed to fetch activity data' });
    }
};

// ===== USER MANAGEMENT =====

export const getAllUsers = async (req, res) => {
    try {
        const { limit = 100 } = req.body;
        
        const users = await User.find()
            .select('username email rating seasonScore stats createdAt')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();
        
        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

export const updateUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rating, seasonScore } = req.body;
        
        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (seasonScore !== undefined) updateData.seasonScore = seasonScore;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('username rating seasonScore stats');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User stats updated successfully', user });
    } catch (error) {
        console.error('Update user stats error:', error);
        res.status(500).json({ message: 'Failed to update user stats' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Delete user and all their matches
        const [deletedUser] = await Promise.all([
            User.findByIdAndDelete(userId),
            Match.deleteMany({ players: userId })
        ]);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User and associated matches deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// ===== LEADERBOARD MANAGEMENT =====

export const resetSeasonScores = async (req, res) => {
    try {
        await User.updateMany({}, { $set: { seasonScore: 0 } });
        
        res.json({ message: 'All season scores have been reset to 0' });
    } catch (error) {
        console.error('Reset season scores error:', error);
        res.status(500).json({ message: 'Failed to reset season scores' });
    }
};

export const resetAllStats = async (req, res) => {
    try {
        await User.updateMany({}, {
            $set: {
                rating: 1000,
                seasonScore: 0,
                'stats.matchesPlayed': 0,
                'stats.wins': 0,
                'stats.losses': 0
            }
        });
        
        res.json({ message: 'All stats (ELO, season, wins, losses) have been reset' });
    } catch (error) {
        console.error('Reset all stats error:', error);
        res.status(500).json({ message: 'Failed to reset all stats' });
    }
};

export const clearMatchHistory = async (req, res) => {
    try {
        await Match.deleteMany({});
        
        res.json({ message: 'All match history has been cleared' });
    } catch (error) {
        console.error('Clear match history error:', error);
        res.status(500).json({ message: 'Failed to clear match history' });
    }
};