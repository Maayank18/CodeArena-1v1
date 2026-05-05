// // FILE: backend/controllers/adminController.js
// // UPDATED VERSION WITH GOLDEN SOLUTION SUPPORT
// import User from '../models/User.js';
// import Match from '../models/Match.js';
// import Problem from '../models/Problem.js';

// // ===== PROBLEM MANAGEMENT =====

// export const getAllProblems = async (req, res) => {
//     try {
//         const problems = await Problem.find()
//             .select('title slug difficulty constraints testCases goldenSolution timeLimit memoryLimit createdAt')
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
//             goldenSolution,
//             starterCode,
//             testCases
//         } = req.body;
        
//         // Validate required fields
//         if (!title || !slug || !description) {
//             return res.status(400).json({ 
//                 message: 'Title, slug, and description are required' 
//             });
//         }
        
//         // Validate golden solution
//         if (!goldenSolution || goldenSolution.trim() === '') {
//             return res.status(400).json({ 
//                 message: 'Golden solution is required for validating test cases' 
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
        
//         // Validate test cases using golden solution
//         try {
//             const goldenFn = eval(`(${goldenSolution})`);
            
//             for (let i = 0; i < testCases.length; i++) {
//                 const testCase = testCases[i];
//                 try {
//                     const goldenOutput = goldenFn(testCase.input);
//                     const expectedOutput = testCase.output.trim();
//                     const actualOutput = String(goldenOutput).trim();
                    
//                     if (actualOutput !== expectedOutput) {
//                         return res.status(400).json({
//                             message: `Test case ${i + 1} validation failed. Golden solution output (${actualOutput}) doesn't match expected output (${expectedOutput})`
//                         });
//                     }
//                 } catch (error) {
//                     return res.status(400).json({
//                         message: `Test case ${i + 1} execution failed: ${error.message}`
//                     });
//                 }
//             }
//         } catch (error) {
//             return res.status(400).json({
//                 message: `Invalid golden solution: ${error.message}`
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
//             goldenSolution,
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
//         delete updateData.username;
        
//         // If updating golden solution or test cases, validate them
//         if (updateData.goldenSolution || updateData.testCases) {
//             const existingProblem = await Problem.findById(problemId);
//             if (!existingProblem) {
//                 return res.status(404).json({ message: 'Problem not found' });
//             }
            
//             const goldenSolution = updateData.goldenSolution || existingProblem.goldenSolution;
//             const testCases = updateData.testCases || existingProblem.testCases;
            
//             if (!goldenSolution) {
//                 return res.status(400).json({ 
//                     message: 'Golden solution is required' 
//                 });
//             }
            
//             try {
//                 const goldenFn = eval(`(${goldenSolution})`);
                
//                 for (let i = 0; i < testCases.length; i++) {
//                     const testCase = testCases[i];
//                     try {
//                         const goldenOutput = goldenFn(testCase.input);
//                         const expectedOutput = testCase.output.trim();
//                         const actualOutput = String(goldenOutput).trim();
                        
//                         if (actualOutput !== expectedOutput) {
//                             return res.status(400).json({
//                                 message: `Test case ${i + 1} validation failed. Golden solution output doesn't match expected output`
//                             });
//                         }
//                     } catch (error) {
//                         return res.status(400).json({
//                             message: `Test case ${i + 1} execution failed: ${error.message}`
//                         });
//                     }
//                 }
//             } catch (error) {
//                 return res.status(400).json({
//                     message: `Invalid golden solution: ${error.message}`
//                 });
//             }
//         }
        
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

// // ===== DASHBOARD STATS =====

// export const getDashboardStats = async (req, res) => {
//     try {
//         const now = new Date();
//         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
//         const [
//             totalUsers,
//             newUsersToday,
//             totalMatches,
//             matchesToday,
//             mostActivePlayer
//         ] = await Promise.all([
//             User.countDocuments(),
//             User.countDocuments({ createdAt: { $gte: todayStart } }),
//             Match.countDocuments(),
//             Match.countDocuments({ createdAt: { $gte: todayStart } }),
//             User.findOne().sort({ 'stats.matchesPlayed': -1 }).select('username stats').lean()
//         ]);
        
//         const avgMatchesPerUser = totalUsers > 0 ? (totalMatches / totalUsers).toFixed(2) : 0;
        
//         res.json({
//             users: {
//                 total: totalUsers,
//                 newToday: newUsersToday
//             },
//             matches: {
//                 total: totalMatches,
//                 today: matchesToday,
//                 avgPerUser: parseFloat(avgMatchesPerUser)
//             },
//             players: {
//                 mostActive: mostActivePlayer
//             }
//         });
//     } catch (error) {
//         console.error('Get dashboard stats error:', error);
//         res.status(500).json({ message: 'Failed to fetch dashboard stats' });
//     }
// };

// export const getRecentActivity = async (req, res) => {
//     try {
//         const [recentMatches, recentUsers] = await Promise.all([
//             Match.find()
//                 .sort({ createdAt: -1 })
//                 .limit(20)
//                 .populate('players', 'username')
//                 .select('players winner createdAt')
//                 .lean(),
//             User.find()
//                 .sort({ createdAt: -1 })
//                 .limit(20)
//                 .select('username email createdAt')
//                 .lean()
//         ]);
        
//         res.json({
//             matches: recentMatches,
//             users: recentUsers
//         });
//     } catch (error) {
//         console.error('Get recent activity error:', error);
//         res.status(500).json({ message: 'Failed to fetch recent activity' });
//     }
// };

// export const getActivityByHour = async (req, res) => {
//     try {
//         const matches = await Match.find().select('createdAt').lean();
        
//         const hourlyActivity = new Array(24).fill(0);
        
//         matches.forEach(match => {
//             const hour = new Date(match.createdAt).getHours();
//             hourlyActivity[hour]++;
//         });
        
//         res.json({ hourlyActivity });
//     } catch (error) {
//         console.error('Get activity by hour error:', error);
//         res.status(500).json({ message: 'Failed to fetch activity data' });
//     }
// };

// // ===== USER MANAGEMENT =====

// export const getAllUsers = async (req, res) => {
//     try {
//         const { limit = 100 } = req.body;
        
//         const users = await User.find()
//             .select('username email rating seasonScore stats createdAt')
//             .sort({ createdAt: -1 })
//             .limit(parseInt(limit))
//             .lean();
        
//         res.json({ users });
//     } catch (error) {
//         console.error('Get all users error:', error);
//         res.status(500).json({ message: 'Failed to fetch users' });
//     }
// };

// export const updateUserStats = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { rating, seasonScore } = req.body;
        
//         const updateData = {};
//         if (rating !== undefined) updateData.rating = rating;
//         if (seasonScore !== undefined) updateData.seasonScore = seasonScore;
        
//         const user = await User.findByIdAndUpdate(
//             userId,
//             { $set: updateData },
//             { new: true }
//         ).select('username rating seasonScore stats');
        
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         res.json({ message: 'User stats updated successfully', user });
//     } catch (error) {
//         console.error('Update user stats error:', error);
//         res.status(500).json({ message: 'Failed to update user stats' });
//     }
// };

// export const deleteUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         // Delete user and all their matches
//         const [deletedUser] = await Promise.all([
//             User.findByIdAndDelete(userId),
//             Match.deleteMany({ players: userId })
//         ]);
        
//         if (!deletedUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         res.json({ message: 'User and associated matches deleted successfully' });
//     } catch (error) {
//         console.error('Delete user error:', error);
//         res.status(500).json({ message: 'Failed to delete user' });
//     }
// };

// // ===== LEADERBOARD MANAGEMENT =====

// export const resetSeasonScores = async (req, res) => {
//     try {
//         await User.updateMany({}, { $set: { seasonScore: 0 } });
        
//         res.json({ message: 'All season scores have been reset to 0' });
//     } catch (error) {
//         console.error('Reset season scores error:', error);
//         res.status(500).json({ message: 'Failed to reset season scores' });
//     }
// };

// export const resetAllStats = async (req, res) => {
//     try {
//         await User.updateMany({}, {
//             $set: {
//                 rating: 1000,
//                 seasonScore: 0,
//                 'stats.matchesPlayed': 0,
//                 'stats.wins': 0,
//                 'stats.losses': 0
//             }
//         });
        
//         res.json({ message: 'All stats (ELO, season, wins, losses) have been reset' });
//     } catch (error) {
//         console.error('Reset all stats error:', error);
//         res.status(500).json({ message: 'Failed to reset all stats' });
//     }
// };

// export const clearMatchHistory = async (req, res) => {
//     try {
//         await Match.deleteMany({});
        
//         res.json({ message: 'All match history has been cleared' });
//     } catch (error) {
//         console.error('Clear match history error:', error);
//         res.status(500).json({ message: 'Failed to clear match history' });
//     }
// };



























// ========================================================================
// FILE: backend/controllers/adminController.js
// COMPLETE UPGRADED VERSION — All endpoints for Admin Dashboard
// ========================================================================

import User from '../models/User.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE HELPER — validate admin identity
// ═══════════════════════════════════════════════════════════════
const verifyAdmin = async (username) => {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    if (!username || username !== adminUsername) {
        throw new Error('Unauthorized: Admin privileges required');
    }
};

const normalizeProblemType = (value) => {
    const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return normalizedValue === 'campaign' ? 'campaign' : 'battle';
};

const normalizeCampaignRegion = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
};

const normalizeCampaignNodeId = (value) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const buildProblemPayload = (raw = {}) => {
    // 1. Normalize basic fields
    const campaignRegion = normalizeCampaignRegion(raw.campaignRegion);
    const campaignNodeId = normalizeCampaignNodeId(raw.campaignNodeId);

    // Check if any campaign data is provided
    const hasCampaignData = (campaignRegion !== undefined && !Number.isNaN(campaignRegion)) || 
                           (campaignNodeId !== undefined && campaignNodeId.trim().length > 0);

    // 2. Determine Type
    // If user explicitly sent a type, we validate/normalize it.
    // If no type sent, but we have campaign data, we infer 'campaign'.
    const rawType = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : '';
    const hasExplicitType = rawType === 'battle' || rawType === 'campaign';

    const type = normalizeProblemType(
        !hasExplicitType && hasCampaignData
            ? 'campaign'
            : raw.type
    );

    // 3. Type-Specific Validation
    if (type === 'campaign') {
        if (campaignRegion === undefined || Number.isNaN(campaignRegion)) {
            throw new Error('Campaign problems require a valid region number');
        }
        if (!campaignNodeId || campaignNodeId.trim().length === 0) {
            throw new Error('Campaign problems require a target node ID');
        }
    } else if (hasCampaignData) {
        // If it resolved to battle but has campaign data, it's a mismatch
        throw new Error('Problem type mismatch: campaign fields were provided but type resolved to battle');
    }

    // 4. Return normalized payload
    return {
        title: raw.title,
        slug: raw.slug,
        description: raw.description,
        difficulty: raw.difficulty || 'Easy',
        type,
        campaignRegion: type === 'campaign' ? campaignRegion : undefined,
        campaignNodeId: type === 'campaign' ? campaignNodeId : undefined,
        constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
        timeLimit: raw.timeLimit || 5000,
        memoryLimit: raw.memoryLimit || 512,
        goldenSolution: raw.goldenSolution,
        starterCode: raw.starterCode || {},
        testCases: Array.isArray(raw.testCases) ? raw.testCases : [],
    };
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════
export const getDashboardStats = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const now       = new Date();
        const dayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monStart  = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersToday,
            newUsersWeek,
            newUsersMonth,
            totalMatches,
            matchesToday,
            matchesWeek,
            completedMatches,
            mostActivePlayer,
            highestRated,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: dayStart } }),
            User.countDocuments({ createdAt: { $gte: weekStart } }),
            User.countDocuments({ createdAt: { $gte: monStart } }),
            Match.countDocuments(),
            Match.countDocuments({ createdAt: { $gte: dayStart } }),
            Match.countDocuments({ createdAt: { $gte: weekStart } }),
            Match.countDocuments({ status: 'completed' }),
            User.findOne().sort({ 'stats.matchesPlayed': -1 }).select('username stats rating').lean(),
            User.findOne().sort({ rating: -1 }).select('username rating stats').lean(),
        ]);

        const activeUsers     = await User.countDocuments({ 'stats.matchesPlayed': { $gt: 0 } });
        const avgMatchesPerUser = totalUsers > 0 ? (totalMatches / totalUsers) : 0;

        res.json({
            users: {
                total:      totalUsers,
                active:     activeUsers,
                inactive:   totalUsers - activeUsers,
                newToday:   newUsersToday,
                newWeek:    newUsersWeek,
                newMonth:   newUsersMonth,
            },
            matches: {
                total:      totalMatches,
                completed:  completedMatches,
                today:      matchesToday,
                week:       matchesWeek,
                avgPerUser: parseFloat(avgMatchesPerUser.toFixed(2)),
                completionRate: totalMatches > 0
                    ? parseFloat(((completedMatches / totalMatches) * 100).toFixed(1))
                    : 0,
            },
            players: {
                mostActive:  mostActivePlayer,
                highestRated: highestRated,
            },
        });
    } catch (error) {
        console.error('[Admin] getDashboardStats error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// RECENT ACTIVITY
// ═══════════════════════════════════════════════════════════════
export const getRecentActivity = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const [recentMatches, recentUsers] = await Promise.all([
            Match.find()
                .sort({ createdAt: -1 })
                .limit(20)
                .populate({ path: 'players', select: 'username rating', strictPopulate: false })
                .select('players winner status createdAt roomId')
                .lean(),
            User.find()
                .sort({ createdAt: -1 })
                .limit(20)
                .select('username email createdAt rating stats')
                .lean(),
        ]);

        res.json({ matches: recentMatches, users: recentUsers });
    } catch (error) {
        console.error('[Admin] getRecentActivity error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// HOURLY ACTIVITY
// ═══════════════════════════════════════════════════════════════
export const getActivityByHour = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const matches = await Match.find().select('createdAt').lean();
        const hourlyActivity = new Array(24).fill(0);
        matches.forEach(m => {
            const hour = new Date(m.createdAt).getHours();
            hourlyActivity[hour]++;
        });

        res.json({ hourlyActivity });
    } catch (error) {
        console.error('[Admin] getActivityByHour error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════
export const getSystemHealth = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const mem      = process.memoryUsage();
        const uptimeSec = process.uptime();

        // Grab live socket info from server globals if available
        const activeSockets = global.__activeSockets ?? null;
        const activeRooms   = global.__activeRooms   ?? null;

        res.json({
            status:      'ok',
            timestamp:   new Date().toISOString(),
            activeSockets,
            activeRooms,
            memoryMB:    parseFloat((mem.rss / 1024 / 1024).toFixed(1)),
            heapUsedMB:  parseFloat((mem.heapUsed / 1024 / 1024).toFixed(1)),
            heapTotalMB: parseFloat((mem.heapTotal / 1024 / 1024).toFixed(1)),
            uptimeHours: parseFloat((uptimeSec / 3600).toFixed(2)),
            nodeVersion: process.version,
            platform:    process.platform,
        });
    } catch (error) {
        console.error('[Admin] getSystemHealth error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT — GET ALL
// ═══════════════════════════════════════════════════════════════
export const getAllUsers = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { limit = 500 } = req.body;

        const users = await User.find()
            .select('username email rating seasonScore stats createdAt banned')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ users, total: users.length });
    } catch (error) {
        console.error('[Admin] getAllUsers error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT — GET SINGLE USER + MATCH HISTORY
// ═══════════════════════════════════════════════════════════════
export const getUserById = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { userId } = req.params;

        const [user, userMatches] = await Promise.all([
            User.findById(userId)
                .select('username email rating seasonScore stats createdAt banned')
                .lean(),
            Match.find({ players: userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate({ path: 'players', select: 'username rating', strictPopulate: false })
                .select('players winner status createdAt')
                .lean(),
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user, matches: userMatches });
    } catch (error) {
        console.error('[Admin] getUserById error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT — UPDATE STATS (ELO, season, wins, losses)
// ═══════════════════════════════════════════════════════════════
export const updateUserStats = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { userId } = req.params;
        const { rating, seasonScore, wins, losses, matchesPlayed } = req.body;

        const updateData = {};
        if (rating        !== undefined) updateData.rating        = Math.max(0, parseInt(rating));
        if (seasonScore   !== undefined) updateData.seasonScore   = Math.max(0, parseInt(seasonScore));
        if (wins          !== undefined) updateData['stats.wins']          = Math.max(0, parseInt(wins));
        if (losses        !== undefined) updateData['stats.losses']        = Math.max(0, parseInt(losses));
        if (matchesPlayed !== undefined) updateData['stats.matchesPlayed'] = Math.max(0, parseInt(matchesPlayed));

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('username rating seasonScore stats').lean();

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User stats updated', user });
    } catch (error) {
        console.error('[Admin] updateUserStats error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT — DELETE USER
// ═══════════════════════════════════════════════════════════════
export const deleteUser = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { userId } = req.params;

        const [deletedUser] = await Promise.all([
            User.findByIdAndDelete(userId),
            Match.deleteMany({ players: userId }),
        ]);

        if (!deletedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: `User "${deletedUser.username}" and their matches deleted` });
    } catch (error) {
        console.error('[Admin] deleteUser error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT — BAN USER
// ═══════════════════════════════════════════════════════════════
export const banUser = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { userId } = req.params;
        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newBanned = !user.banned;
        await User.findByIdAndUpdate(userId, { $set: { banned: newBanned } });

        res.json({ message: `User "${user.username}" ${newBanned ? 'banned' : 'unbanned'}`, banned: newBanned });
    } catch (error) {
        console.error('[Admin] banUser error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// MATCH MANAGEMENT — GET ALL
// ═══════════════════════════════════════════════════════════════
export const getAllMatches = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { limit = 500, status, playerId } = req.body;

        const query = {};
        if (status)   query.status  = status;
        if (playerId) query.players = playerId;

        const matches = await Match.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate({ path: 'players', select: 'username rating', strictPopulate: false })
            .select('players winner status createdAt roomId')
            .lean();

        res.json({ matches, total: matches.length });
    } catch (error) {
        console.error('[Admin] getAllMatches error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// MATCH MANAGEMENT — CLEAR ALL
// ═══════════════════════════════════════════════════════════════
export const clearMatchHistory = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const result = await Match.deleteMany({});
        res.json({ message: `Cleared ${result.deletedCount} match records` });
    } catch (error) {
        console.error('[Admin] clearMatchHistory error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM MANAGEMENT — GET ALL (with test case counts)
// ═══════════════════════════════════════════════════════════════
export const getAllProblems = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const requestedType = req.query.type || req.body.type;
        const filter = {};
        if (requestedType === 'battle' || requestedType === 'campaign') {
            filter.type = requestedType;
        }

        const problems = await Problem.find(filter)
            .select('title slug difficulty type campaignRegion campaignNodeId constraints testCases goldenSolution timeLimit memoryLimit starterCode createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const problemsWithCounts = problems.map(p => ({
            ...p,
            publicTestCount: p.testCases?.filter(tc => tc.isPublic).length || 0,
            totalTestCount:  p.testCases?.length || 0,
        }));

        res.json({ problems: problemsWithCounts });
    } catch (error) {
        console.error('[Admin] getAllProblems error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM MANAGEMENT — CREATE
// ═══════════════════════════════════════════════════════════════
export const createProblem = async (req, res) => {
    try {
        console.log('[Admin] Received createProblem request body:', {
            title: req.body.title,
            type: req.body.type,
            campaignRegion: req.body.campaignRegion,
            campaignNodeId: req.body.campaignNodeId
        });

        await verifyAdmin(req.body.username);

        const payload = buildProblemPayload(req.body);
        console.log('[Admin] Resolved problem payload for creation:', {
            title: payload.title,
            type: payload.type,
            campaignRegion: payload.campaignRegion,
            campaignNodeId: payload.campaignNodeId
        });

        const {
            title, slug, description, difficulty, type, campaignRegion,
            campaignNodeId, constraints, timeLimit, memoryLimit,
            goldenSolution, starterCode, testCases
        } = payload;

        // Required field validation
        if (!title || !slug || !description) {
            return res.status(400).json({ message: 'Title, slug, and description are required' });
        }
        if (!type) {
            return res.status(400).json({ message: 'Problem type is required' });
        }
        if (!goldenSolution?.trim()) {
            return res.status(400).json({ message: 'Golden solution is required' });
        }
        if (!testCases?.length || !testCases[0]?.input) {
            return res.status(400).json({ message: 'At least one test case is required' });
        }

        // Slug uniqueness check
        const exists = await Problem.findOne({ slug }).lean();
        if (exists) {
            return res.status(400).json({ message: `Slug "${slug}" is already taken` });
        }

        // Validate golden solution against test cases
        const validationError = validateGoldenSolution(goldenSolution, testCases);
        if (validationError) return res.status(400).json({ message: validationError });

        console.log('[Admin] Final check before Problem.create:', { title, type, campaignRegion, campaignNodeId });

        const problem = await Problem.create({
            title,
            slug,
            description,
            difficulty,
            type,
            campaignRegion: type === 'campaign' ? campaignRegion : undefined,
            campaignNodeId: type === 'campaign' ? campaignNodeId : undefined,
            constraints,
            timeLimit,
            memoryLimit,
            goldenSolution,
            starterCode,
            testCases,
        });

        res.status(201).json({ message: 'Problem created successfully', problem });
    } catch (error) {
        console.error('[Admin] createProblem error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A problem with this slug already exists' });
        }
        if (
            error.message?.startsWith('Campaign problems require') ||
            error.message?.startsWith('Problem type mismatch')
        ) {
            return res.status(400).json({ message: error.message });
        }
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message || 'Failed to create problem' });
    }
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM MANAGEMENT — UPDATE
// ═══════════════════════════════════════════════════════════════
export const updateProblem = async (req, res) => {
    try {
        const { problemId } = req.params;
        console.log(`[Admin] Received updateProblem request for ${problemId}:`, {
            title: req.body.title,
            type: req.body.type,
            campaignRegion: req.body.campaignRegion,
            campaignNodeId: req.body.campaignNodeId
        });

        await verifyAdmin(req.body.username);
        const updateData    = { ...req.body };

        // Never allow slug or username to be updated
        delete updateData.slug;
        delete updateData.username;

        const existing = await Problem.findById(problemId).lean();
        if (!existing) return res.status(404).json({ message: 'Problem not found' });

        const mergedInput = { ...existing, ...updateData };
        const normalizedUpdate = buildProblemPayload(mergedInput);

        if (updateData.title !== undefined) updateData.title = normalizedUpdate.title;
        if (updateData.description !== undefined) updateData.description = normalizedUpdate.description;
        if (updateData.difficulty !== undefined || updateData.type !== undefined) {
            updateData.difficulty = normalizedUpdate.difficulty;
            updateData.type = normalizedUpdate.type;
        }
        if (updateData.constraints !== undefined) updateData.constraints = normalizedUpdate.constraints;
        if (updateData.timeLimit !== undefined) updateData.timeLimit = normalizedUpdate.timeLimit;
        if (updateData.memoryLimit !== undefined) updateData.memoryLimit = normalizedUpdate.memoryLimit;
        if (updateData.goldenSolution !== undefined) updateData.goldenSolution = normalizedUpdate.goldenSolution;
        if (updateData.starterCode !== undefined) updateData.starterCode = normalizedUpdate.starterCode;
        if (updateData.testCases !== undefined) updateData.testCases = normalizedUpdate.testCases;
        // Sync normalized fields back to updateData to ensure they are persisted
        updateData.type           = normalizedUpdate.type;
        updateData.campaignRegion = normalizedUpdate.campaignRegion;
        updateData.campaignNodeId = normalizedUpdate.campaignNodeId;

        // Note: normalizedUpdate already has undefined for campaign fields if type !== campaign.
        // Mongoose findByIdAndUpdate with $set will not remove existing fields if they are undefined in the object.
        // So we explicitly use $unset if needed.
        const updateOperation = { $set: updateData };
        if (normalizedUpdate.type !== 'campaign') {
            updateOperation.$unset = {
                campaignRegion: 1,
                campaignNodeId: 1,
            };
        }

        // If golden solution or test cases changed, re-validate
        if (updateData.goldenSolution || updateData.testCases) {
            const sol   = updateData.goldenSolution || existing.goldenSolution;
            const cases = updateData.testCases      || existing.testCases;

            if (!sol) return res.status(400).json({ message: 'Golden solution is required' });

            const validationError = validateGoldenSolution(sol, cases);
            if (validationError) return res.status(400).json({ message: validationError });
        }

        console.log('[Admin] Final check before Problem.findByIdAndUpdate:', { 
            id: problemId, 
            type: updateOperation.$set.type, 
            region: updateOperation.$set.campaignRegion,
            node: updateOperation.$set.campaignNodeId,
            unset: updateOperation.$unset
        });

        const problem = await Problem.findByIdAndUpdate(
            problemId,
            updateOperation,
            { new: true, runValidators: true }
        ).lean();

        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        res.json({ message: 'Problem updated successfully', problem });
    } catch (error) {
        console.error('[Admin] updateProblem error:', error);
        if (error.message?.startsWith('Campaign problems require')) {
            return res.status(400).json({ message: error.message });
        }
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message || 'Failed to update problem' });
    }
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM MANAGEMENT — DELETE
// ═══════════════════════════════════════════════════════════════
export const deleteProblem = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { problemId } = req.params;
        const problem = await Problem.findByIdAndDelete(problemId);
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        res.json({ message: `Problem "${problem.title}" deleted` });
    } catch (error) {
        console.error('[Admin] deleteProblem error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD — RESET SEASON SCORES
// ═══════════════════════════════════════════════════════════════
export const resetSeasonScores = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const result = await User.updateMany({}, { $set: { seasonScore: 0 } });
        res.json({ message: `Season scores reset for ${result.modifiedCount} users` });
    } catch (error) {
        console.error('[Admin] resetSeasonScores error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD — RESET ALL STATS
// ═══════════════════════════════════════════════════════════════
export const resetAllStats = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const result = await User.updateMany({}, {
            $set: {
                rating:                 1000,
                seasonScore:            0,
                'stats.matchesPlayed':  0,
                'stats.wins':           0,
                'stats.losses':         0,
            }
        });

        res.json({ message: `All stats reset for ${result.modifiedCount} users` });
    } catch (error) {
        console.error('[Admin] resetAllStats error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL HELPER — validate golden solution against test cases
// ═══════════════════════════════════════════════════════════════
const validateGoldenSolution = (goldenSolution, testCases) => {
    let goldenFn;
    try {
        // eslint-disable-next-line no-eval
        goldenFn = eval(`(${goldenSolution})`);
        if (typeof goldenFn !== 'function') throw new Error('Not a function');
    } catch (err) {
        return `Invalid golden solution syntax: ${err.message}`;
    }

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        if (!tc.input && tc.input !== 0) continue; // skip empty inputs during validation

        try {
            const result   = goldenFn(tc.input);
            const expected = String(tc.output).trim();
            const actual   = String(result).trim();

            if (actual !== expected) {
                return `Test case ${i + 1} mismatch — golden output: "${actual}", expected: "${expected}"`;
            }
        } catch (err) {
            return `Test case ${i + 1} execution failed: ${err.message}`;
        }
    }

    return null; // no error
};

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL HANDLERS
// ═══════════════════════════════════════════════════════════════
// All existing exports preserved for backward compatibility.
// Add to your router like:
//
//   router.post('/admin/stats',                    getDashboardStats);
//   router.post('/admin/users',                    getAllUsers);
//   router.post('/admin/users/:userId/delete',     deleteUser);
//   router.post('/admin/users/:userId/update-stats', updateUserStats);  ← NEW
//   router.post('/admin/users/:userId/ban',        banUser);             ← NEW
//   router.post('/admin/users/:userId',            getUserById);         ← NEW
//   router.post('/admin/matches',                  getAllMatches);        ← NEW
//   router.post('/admin/matches/clear',            clearMatchHistory);
//   router.post('/admin/activity/recent',          getRecentActivity);
//   router.post('/admin/activity/hourly',          getActivityByHour);
//   router.post('/admin/system/health',            getSystemHealth);     ← NEW
//   router.post('/admin/problems',                 getAllProblems);
//   router.post('/admin/problems/create',          createProblem);
//   router.post('/admin/problems/:problemId/update', updateProblem);
//   router.post('/admin/problems/:problemId/delete', deleteProblem);
//   router.post('/admin/leaderboard/reset-season', resetSeasonScores);
//   router.post('/admin/leaderboard/reset-all',    resetAllStats);
// V 1.5
