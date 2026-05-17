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
import { clearProblemCache } from './problemController.js';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// PROBLEM IMAGE UPLOAD
// ═══════════════════════════════════════════════════════════════
export const uploadProblemImage = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the relative URL to the file
        const imageUrl = `/uploads/problems/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error('[Admin] uploadProblemImage error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
};

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

const sanitizeProblemTopics = (topics) => {
    if (!Array.isArray(topics)) {
        return [];
    }

    return [...new Set(
        topics
            .filter((topic) => typeof topic === 'string')
            .map((topic) => topic.trim().toLowerCase())
            .filter(Boolean)
    )];
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

const buildProblemPayload = (raw = {}, existingProblem = null) => {
    const merged = existingProblem ? { ...existingProblem, ...raw } : { ...raw };

    // 1. Normalize basic fields
    const campaignRegion = normalizeCampaignRegion(merged.campaignRegion);
    const campaignNodeId = normalizeCampaignNodeId(merged.campaignNodeId);

    // Check if any campaign data is provided
    const hasCampaignData = (campaignRegion !== undefined && !Number.isNaN(campaignRegion)) || 
                           (campaignNodeId !== undefined && campaignNodeId.trim().length > 0);

    // 2. Determine Type - CRITICAL FIX
    // Parse the raw type value: it could be undefined, empty string, 'campaign', 'battle', or malformed
    const rawType = typeof merged.type === 'string' ? merged.type.trim().toLowerCase() : '';
    const isExplicitCampaign = rawType === 'campaign';
    const isExplicitBattle = rawType === 'battle';
    const hasExplicitType = isExplicitCampaign || isExplicitBattle;

    // Decision logic:
    // 1. If type is explicitly 'campaign', honor it (and later validate campaign fields are present)
    // 2. If type is explicitly 'battle', honor it (and clear campaign fields)
    // 3. If type is not explicit but campaign fields exist, infer 'campaign'
    // 4. Otherwise, default to 'battle'
    let resolvedType;
    if (isExplicitCampaign) {
        resolvedType = 'campaign';
    } else if (isExplicitBattle) {
        resolvedType = 'battle';
    } else if (hasCampaignData) {
        resolvedType = 'campaign';
    } else {
        resolvedType = 'battle';
    }

    const type = resolvedType;

    // 3. Type-Specific Validation - CRITICAL: Ensure consistency
    if (type === 'campaign') {
        if (campaignRegion === undefined || Number.isNaN(campaignRegion)) {
            throw new Error('Campaign problems require a valid region number');
        }
        if (!campaignNodeId || campaignNodeId.trim().length === 0) {
            throw new Error('Campaign problems require a target node ID');
        }
    } else if (hasCampaignData && type !== 'campaign') {
        // If it resolved to battle but has campaign data, it's a mismatch
        throw new Error('Problem type mismatch: campaign fields were provided but type resolved to battle');
    }

    // 4. Return normalized payload
    return {
        title: typeof merged.title === 'string' ? merged.title.trim() : merged.title,
        slug: typeof merged.slug === 'string' ? merged.slug.trim().toLowerCase() : merged.slug,
        description: merged.description,
        inputFormatDescription: typeof merged.inputFormatDescription === 'string'
            ? merged.inputFormatDescription
            : undefined,
        difficulty: merged.difficulty || 'Easy',
        topics: sanitizeProblemTopics(merged.topics),
        type,
        campaignRegion: type === 'campaign' ? campaignRegion : undefined,
        campaignNodeId: type === 'campaign' ? campaignNodeId : undefined,
        constraints: Array.isArray(merged.constraints) ? merged.constraints : [],
        timeLimit: Number(merged.timeLimit) > 0 ? Number(merged.timeLimit) : 5000,
        memoryLimit: Number(merged.memoryLimit) > 0 ? Number(merged.memoryLimit) : 512,
        goldenSolution: merged.goldenSolution,
        starterCode: merged.starterCode && typeof merged.starterCode === 'object' ? merged.starterCode : {},
        testCases: Array.isArray(merged.testCases)
            ? merged.testCases.map((testCase) => ({
                input: testCase?.input,
                displayInput: typeof testCase?.displayInput === 'string' ? testCase.displayInput : undefined,
                visualInput: typeof testCase?.visualInput === 'string' ? testCase.visualInput : undefined,
                output: testCase?.output,
                explanation: typeof testCase?.explanation === 'string' ? testCase.explanation : undefined,
                isPublic: Boolean(testCase?.isPublic),
            }))
            : [],
        problemImage: typeof merged.problemImage === 'string' ? merged.problemImage.trim() : merged.problemImage,
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
            .select('title slug description inputFormatDescription difficulty type topics campaignRegion campaignNodeId constraints testCases goldenSolution timeLimit memoryLimit starterCode createdAt problemImage')
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
        await verifyAdmin(req.body.username);
        const payload = buildProblemPayload(req.body);

        // Required field validation
        if (!payload.title || !payload.slug || !payload.description) {
            return res.status(400).json({ message: 'Title, slug, and description are required' });
        }
        if (!payload.goldenSolution?.trim()) {
            return res.status(400).json({ message: 'Golden solution is required' });
        }
        if (!payload.testCases?.length || !payload.testCases[0]?.input) {
            return res.status(400).json({ message: 'At least one test case is required' });
        }

        // Slug uniqueness check
        const exists = await Problem.findOne({ slug: payload.slug }).lean();
        if (exists) {
            return res.status(400).json({ message: `Slug "${payload.slug}" is already taken` });
        }

        // Validate golden solution against test cases
        const validationError = validateGoldenSolution(payload.goldenSolution, payload.testCases);
        if (validationError) return res.status(400).json({ message: validationError });

        const problem = await Problem.create(payload);
        clearProblemCache();

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
        await verifyAdmin(req.body.username);
        const existing = await Problem.findById(problemId).lean();
        if (!existing) return res.status(404).json({ message: 'Problem not found' });

        const normalizedPayload = buildProblemPayload(req.body, existing);
        const updateOperation = {
            $set: {
                title: normalizedPayload.title,
                description: normalizedPayload.description,
                inputFormatDescription: normalizedPayload.inputFormatDescription,
                difficulty: normalizedPayload.difficulty,
                topics: normalizedPayload.topics,
                type: normalizedPayload.type,
                constraints: normalizedPayload.constraints,
                timeLimit: normalizedPayload.timeLimit,
                memoryLimit: normalizedPayload.memoryLimit,
                goldenSolution: normalizedPayload.goldenSolution,
                starterCode: normalizedPayload.starterCode,
                testCases: normalizedPayload.testCases,
                problemImage: normalizedPayload.problemImage,
            }
        };

        if (normalizedPayload.type === 'campaign') {
            updateOperation.$set.campaignRegion = normalizedPayload.campaignRegion;
            updateOperation.$set.campaignNodeId = normalizedPayload.campaignNodeId;
        } else {
            updateOperation.$unset = {
                campaignRegion: 1,
                campaignNodeId: 1,
            };
        }

        if (!normalizedPayload.goldenSolution?.trim()) {
            return res.status(400).json({ message: 'Golden solution is required' });
        }

        const validationError = validateGoldenSolution(
            normalizedPayload.goldenSolution,
            normalizedPayload.testCases
        );
        if (validationError) return res.status(400).json({ message: validationError });

        const problem = await Problem.findByIdAndUpdate(
            problemId,
            updateOperation,
            { new: true, runValidators: true }
        ).lean();

        if (!problem) return res.status(404).json({ message: 'Problem not found' });
        clearProblemCache();

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
        clearProblemCache();

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
// USER SUCCESS OVERRIDE TOOL
// ═══════════════════════════════════════════════════════════════
export const updateUserUsageStats = async (req, res) => {
    try {
        await verifyAdmin(req.body.username);

        const { userId } = req.params;
        const {
            // Usage stats
            chatQueriesToday,
            matchesToday,
            customMatchesToday,
            visualizationsToday,
            aiHelpToday,

            // Subscription plan
            subscriptionPlan,

            // Custom limits
            customChatQueriesLimit,
            customMatchesLimit,
            customCustomMatchesLimit,
            customVisualizationsLimit,
            customAIHelpLimit,
            hasCustomLimits
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Apply subscription plan if provided
        if (subscriptionPlan !== undefined) {
            user.subscriptionPlan = subscriptionPlan;
            // Keep standard boolean/string fields in sync
            user.isPro = ['plus', 'pro', 'premium'].includes(subscriptionPlan);
            user.planId = ['plus', 'pro', 'premium'].includes(subscriptionPlan) ? subscriptionPlan : null;
        }

        // Initialize objects if missing
        if (!user.usageStats) {
            user.usageStats = {
                chatQueriesToday: 0,
                matchesToday: 0,
                customMatchesToday: 0,
                visualizationsToday: 0,
                aiHelpToday: 0,
                lastResetDate: new Date()
            };
        }

        if (!user.customLimits) {
            user.customLimits = {
                chatQueriesLimit: null,
                matchesLimit: null,
                customMatchesLimit: null,
                visualizationsLimit: null,
                aiHelpLimit: null,
                hasCustomLimits: false
            };
        }

        // Apply usage statistics resets / overrides
        if (chatQueriesToday !== undefined) user.usageStats.chatQueriesToday = Number(chatQueriesToday);
        if (matchesToday !== undefined) user.usageStats.matchesToday = Number(matchesToday);
        if (customMatchesToday !== undefined) user.usageStats.customMatchesToday = Number(customMatchesToday);
        if (visualizationsToday !== undefined) user.usageStats.visualizationsToday = Number(visualizationsToday);
        if (aiHelpToday !== undefined) user.usageStats.aiHelpToday = Number(aiHelpToday);

        // Apply custom limit overrides
        if (hasCustomLimits !== undefined) user.customLimits.hasCustomLimits = Boolean(hasCustomLimits);
        
        if (customChatQueriesLimit !== undefined) {
            user.customLimits.chatQueriesLimit = customChatQueriesLimit === null || customChatQueriesLimit === '' ? null : Number(customChatQueriesLimit);
        }
        if (customMatchesLimit !== undefined) {
            user.customLimits.matchesLimit = customMatchesLimit === null || customMatchesLimit === '' ? null : Number(customMatchesLimit);
        }
        if (customCustomMatchesLimit !== undefined) {
            user.customLimits.customMatchesLimit = customCustomMatchesLimit === null || customCustomMatchesLimit === '' ? null : Number(customCustomMatchesLimit);
        }
        if (customVisualizationsLimit !== undefined) {
            user.customLimits.visualizationsLimit = customVisualizationsLimit === null || customVisualizationsLimit === '' ? null : Number(customVisualizationsLimit);
        }
        if (customAIHelpLimit !== undefined) {
            user.customLimits.aiHelpLimit = customAIHelpLimit === null || customAIHelpLimit === '' ? null : Number(customAIHelpLimit);
        }

        // Mark paths as modified to ensure Mongoose saves nested changes
        user.markModified('usageStats');
        user.markModified('customLimits');

        await user.save();

        res.json({
            message: 'User quotas and plan updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                rating: user.rating,
                seasonScore: user.seasonScore,
                stats: user.stats,
                createdAt: user.createdAt,
                banned: user.banned,
                subscriptionPlan: user.subscriptionPlan,
                usageStats: user.usageStats,
                customLimits: user.customLimits
            }
        });

    } catch (error) {
        console.error('[Admin] updateUserUsageStats error:', error);
        const status = error.message.startsWith('Unauthorized') ? 403 : 500;
        res.status(status).json({ message: error.message });
    }
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
//   router.post('/admin/users/:userId/update-stats', updateUserStats);
//   router.post('/admin/users/:userId/ban',        banUser);
//   router.post('/admin/users/:userId',            getUserById);
//   router.post('/admin/matches',                  getAllMatches);
//   router.post('/admin/matches/clear',            clearMatchHistory);
//   router.post('/admin/activity/recent',          getRecentActivity);
//   router.post('/admin/activity/hourly',          getActivityByHour);
//   router.post('/admin/system/health',            getSystemHealth);
//   router.post('/admin/problems',                 getAllProblems);
//   router.post('/admin/problems/create',          createProblem);
//   router.post('/admin/problems/:problemId/update', updateProblem);
//   router.post('/admin/problems/:problemId/delete', deleteProblem);
//   router.post('/admin/leaderboard/reset-season', resetSeasonScores);
//   router.post('/admin/leaderboard/reset-all',    resetAllStats);
// V 1.6
