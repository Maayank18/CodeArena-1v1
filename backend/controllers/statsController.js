// FILE: backend/controllers/statsController.js
// HEAVILY OPTIMIZED VERSION
import User from '../models/User.js';
import Room from '../models/Room.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';
import CampaignProgress from '../models/CampaignProgress.js';

// PERFORMANCE: Cache stats for 30 seconds (high-traffic endpoint)
let statsCache = null;
let statsCacheTimestamp = 0;
const STATS_CACHE_DURATION = 30 * 1000; // 30 seconds

const CHART_TOPIC_FALLBACK = [
    'arrays',
    'strings',
    'dynamic programming',
    'graphs',
    'trees',
];

const titleCaseTopic = (value) => (
    String(value || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
);

// @desc    Get site-wide statistics (Cached)
export const getStats = async (req, res) => {
    try {
        const now = Date.now();

        // 1. Live Users (always fresh - from Socket.IO)
        const io = req.app.get('io') || req.app.locals.io;
        let liveUsers = 0;
        if (io) {
            const uniqueUsersSet = new Set();
            for (const s of io.sockets.sockets.values()) {
                const uname = s.data?.user?.username;
                if (uname) uniqueUsersSet.add(uname.toLowerCase());
            }
            liveUsers = uniqueUsersSet.size;
        }

        // 2. CACHE: Return cached stats if valid
        if (statsCache && (now - statsCacheTimestamp) < STATS_CACHE_DURATION) {
            return res.json({
                live: liveUsers,
                ...statsCache
            });
        }

        // 3. OPTIMIZED: Parallel queries with Promise.all
        const [totalUsers, activeBattles, matchStats] = await Promise.all([
            User.countDocuments(),
            Room.countDocuments({ status: 'active' }),
            User.aggregate([
                { $match: { 'stats.matchesPlayed': { $exists: true, $gt: 0 } } },
                { $group: { _id: null, total: { $sum: '$stats.matchesPlayed' } } }
            ])
        ]);

        const totalMatches = matchStats.length > 0 ? Math.floor(matchStats[0].total / 2) : 0;

        statsCache = {
            total: totalUsers,
            activeBattles,
            totalMatches
        };
        statsCacheTimestamp = now;

        return res.json({
            live: liveUsers,
            total: totalUsers,
            activeBattles,
            totalMatches
        });
    } catch (err) {
        console.error('Error in getStats:', err);
        return res.status(500).json({ message: 'Failed to read stats' });
    }
};

// NEW: Manual cache invalidation (call after significant events)
export const clearStatsCache = () => {
    statsCache = null;
    statsCacheTimestamp = 0;
};

// @desc    Get user analytics for Pro users (REAL DATA)
// @route   GET /api/stats/analytics
export const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const isMini = req.query.mini === 'true';

        // 1. Fetch User data (Always needed)
        // PERFORMANCE: Included missing activityLog, currentStreak, and lastActiveDate fields
        const user = await User.findById(userId)
            .select('stats totalTimeSpent totalSolved activityLog currentStreak lastActiveDate')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. MINI MODE: Return immediately with basic stats for Consistency Calendar
        if (isMini) {
            const today = new Date();
            const activityMap = new Map();
            for (let offset = 6; offset >= 0; offset--) {
                const date = new Date(today);
                date.setDate(date.getDate() - offset);
                date.setHours(0, 0, 0, 0);
                const key = date.toISOString().split('T')[0];
                
                activityMap.set(key, {
                    dateKey: key,
                    label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                    attempted: (user.activityLog || []).includes(key),
                });
            }

            // CLASSIC STREAK VALIDATION: Reset to 0 if last activity was before yesterday
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const yesterday = new Date(now);
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const lastActiveStr = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;

            let validatedStreak = user.currentStreak || 0;
            if (lastActiveStr && lastActiveStr !== todayStr && lastActiveStr !== yesterdayStr) {
                validatedStreak = 0;
            }

            return res.json({
                success: true,
                data: {
                    summary: {
                        totalSolved: user.totalSolved || 0,
                        currentStreak: validatedStreak,
                        totalAttempts: user.stats?.matchesPlayed || 0, // Approx for mini mode
                    },
                    activity: [...activityMap.values()]
                }
            });
        }

        // 3. FULL MODE: Heavy processing for main Analytics page
        const [matches, campaignProgress] = await Promise.all([
            Match.find({ 'players.userId': userId })
                .select('createdAt problemIds players matchDurationSeconds')
                .lean(),
            CampaignProgress.findOne({ userId })
                .select('totalAttempts currentStreak completedNodes')
                .lean(),
        ]);

        const completedNodes = campaignProgress?.completedNodes || [];
        const battleAttempts = matches.length;
        const campaignAttempts = campaignProgress?.totalAttempts || 0;
        const totalAttempts = battleAttempts + campaignAttempts;

        const battleSolvedProblemIds = matches.flatMap((match) => {
            const me = match.players?.find(
                (player) => String(player.userId) === String(userId)
            );
            return me?.isWinner ? (match.problemIds || []) : [];
        });

        const uniqueBattleProblemIds = [...new Set(
            battleSolvedProblemIds
                .map((problemId) => String(problemId))
                .filter(Boolean)
        )];

        const completedNodeIds = [...new Set(
            completedNodes
                .map((node) => node?.nodeId)
                .filter(Boolean)
        )];

        const [battleProblems, campaignProblems, totalTopicAgg] = await Promise.all([
            uniqueBattleProblemIds.length > 0
                ? Problem.find({ _id: { $in: uniqueBattleProblemIds } })
                    .select('topics')
                    .lean()
                : [],
            completedNodeIds.length > 0
                ? Problem.find({ type: 'campaign', campaignNodeId: { $in: completedNodeIds } })
                    .select('topics campaignNodeId')
                    .lean()
                : [],
            Problem.aggregate([
                { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$topics', total: { $sum: 1 } } }
            ])
        ]);

        const solvedTopicCounts = {};
        for (const problem of [...battleProblems, ...campaignProblems]) {
            for (const topic of (problem.topics || [])) {
                const normalizedTopic = String(topic).trim().toLowerCase();
                if (!normalizedTopic) continue;
                solvedTopicCounts[normalizedTopic] = (solvedTopicCounts[normalizedTopic] || 0) + 1;
            }
        }

        const totalTopicCounts = totalTopicAgg.reduce((acc, item) => {
            acc[item._id] = item.total;
            return acc;
        }, {});

        let topicBreakdown = Object.entries(solvedTopicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, solved]) => ({
                topic: titleCaseTopic(topic),
                solved,
                total: totalTopicCounts[topic] || solved
            }));

        if (topicBreakdown.length === 0) {
            topicBreakdown = CHART_TOPIC_FALLBACK.map((topic) => ({
                topic: titleCaseTopic(topic),
                solved: 0,
                total: totalTopicCounts[topic] || 0
            }));
        }

        const battleSolvedCount = battleSolvedProblemIds.length;
        const campaignSolvedCount = completedNodes.length;
        const totalSolved = Math.max(
            user.totalSolved || 0,
            battleSolvedCount + campaignSolvedCount
        );

        const successfulAttempts = battleSolvedCount + campaignSolvedCount;
        const accuracyPercent = totalAttempts > 0
            ? Math.round((successfulAttempts / totalAttempts) * 100)
            : 0;

        const aggregatedBattleTimeMinutes = matches.reduce(
            (sum, match) => sum + ((match.matchDurationSeconds || 0) / 60),
            0
        );
        const aggregatedCampaignTimeMinutes = completedNodes.reduce(
            (sum, node) => sum + ((node.bestTimeMs || 0) / 60000),
            0
        );
        const timeSpentMinutes = Number(
            Math.max(
                user.totalTimeSpent || 0,
                aggregatedBattleTimeMinutes + aggregatedCampaignTimeMinutes
            ).toFixed(2)
        );

        const activityMap = new Map();
        const today = new Date();
        for (let offset = 6; offset >= 0; offset--) {
            const date = new Date(today);
            date.setDate(date.getDate() - offset);
            date.setHours(0, 0, 0, 0);
            const key = date.toISOString().split('T')[0];
            
            activityMap.set(key, {
                dateKey: key,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                attempted: (user.activityLog || []).includes(key),
            });
        }

        const activity = [...activityMap.values()];
        
        // CLASSIC STREAK VALIDATION: Reset to 0 if last activity was before yesterday
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastActiveStr = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;

        let currentStreak = user.currentStreak || 0;
        if (lastActiveStr && lastActiveStr !== todayStr && lastActiveStr !== yesterdayStr) {
            currentStreak = 0;
        }

        return res.json({
            success: true,
            data: {
                summary: {
                    timeSpentMinutes,
                    totalSolved,
                    totalAttempts,
                    accuracyPercent,
                    currentStreak,
                },
                activity,
                topicBreakdown,
            }
        });
    } catch (error) {
        console.error('Error in getUserAnalytics:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

// @desc    Generate weekly performance report (Premium Only)
// @route   GET /api/stats/weekly-report
export const getWeeklyReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };
        const userTier = tiers[req.user.subscriptionPlan || 'free'];

        if (userTier < 3) {
            return res.status(403).json({ success: false, message: "Premium tier required" });
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [matches, campaignProgress] = await Promise.all([
            Match.find({ 
                'players.userId': userId,
                createdAt: { $gte: oneWeekAgo }
            }).select('players winner createdAt').lean(),
            CampaignProgress.findOne({ userId }).select('completedNodes').lean()
        ]);

        const weeklyMatches = matches.length;
        const weeklyWins = matches.filter(m => {
            const me = m.players?.find(p => String(p.userId) === String(userId));
            return me?.isWinner;
        }).length;

        const winRate = weeklyMatches > 0 ? Math.round((weeklyWins / weeklyMatches) * 100) : 0;
        
        const weeklyCampaignNodes = (campaignProgress?.completedNodes || []).filter(n => 
            n.completedAt && new Date(n.completedAt) >= oneWeekAgo
        ).length;

        return res.json({
            success: true,
            report: {
                period: "Last 7 Days",
                matchesPlayed: weeklyMatches,
                wins: weeklyWins,
                winRate: `${winRate}%`,
                campaignNodesCompleted: weeklyCampaignNodes,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Weekly Report Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
    }
};

