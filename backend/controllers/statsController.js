// FILE: backend/controllers/statsController.js
// HEAVILY OPTIMIZED VERSION
import User from '../models/User.js';
import Room from '../models/Room.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';
import CampaignProgress from '../models/CampaignProgress.js';
import Metadata from '../models/Metadata.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { getGroqClient } from '../services/aiRouterService.js';

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

        const [battleProblems, campaignProblems, topicMetadata] = await Promise.all([
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
            Metadata.findOne({ key: 'topicCounts' }).lean()
        ]);

        const solvedTopicCounts = {};
        for (const problem of [...battleProblems, ...campaignProblems]) {
            for (const topic of (problem.topics || [])) {
                const normalizedTopic = String(topic).trim().toLowerCase();
                if (!normalizedTopic) continue;
                solvedTopicCounts[normalizedTopic] = (solvedTopicCounts[normalizedTopic] || 0) + 1;
            }
        }

        let totalTopicCounts = {};
        if (topicMetadata && topicMetadata.data) {
            totalTopicCounts = topicMetadata.data;
        } else {
            // SILENT FALLBACK: Calculate dynamically if cron hasn't run yet
            const totalTopicAgg = await Problem.aggregate([
                { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$topics', total: { $sum: 1 } } }
            ]);
            totalTopicCounts = totalTopicAgg.reduce((acc, item) => {
                if (item._id && typeof item._id === 'string') {
                    acc[item._id.trim().toLowerCase()] = item.total;
                }
                return acc;
            }, {});
            
            // Background save for next requests
            Metadata.findOneAndUpdate(
                { key: 'topicCounts' },
                { data: totalTopicCounts, lastUpdated: new Date() },
                { upsert: true }
            ).catch(err => console.error('[STATS] Failed to save topic metadata fallback:', err));
        }

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
        const userPlan = req.user.subscriptionPlan || 'free';
        const userTier = tiers[userPlan];
        const isAdmin = req.user.role === 'admin';

        // 1. Premium tier check
        if (userTier < 3 && !isAdmin) {
            return res.status(403).json({ success: false, message: "Weekly performance reports require a Premium subscription plan." });
        }

        // 2. Sunday Check & Admin Bypass
        const isSunday = new Date().getDay() === 0;
        if (!isSunday && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Weekly performance reports are only available for download on Sundays to track full-week progress."
            });
        }

        // 3. Gather Weekly Statistics
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [matches, campaignProgress, user] = await Promise.all([
            Match.find({ 
                'players.userId': userId,
                createdAt: { $gte: oneWeekAgo }
            }).populate('problemIds').lean(),
            CampaignProgress.findOne({ userId }).lean(),
            User.findById(userId).select('fullName username email role subscriptionPlan').lean()
        ]);

        const weeklyMatches = matches.length;
        const weeklyWins = matches.filter(m => {
            const me = m.players?.find(p => String(p.userId) === String(userId));
            return me?.isWinner;
        }).length;

        const winRate = weeklyMatches > 0 ? Math.round((weeklyWins / weeklyMatches) * 100) : 0;

        const weeklyCampaignNodes = (campaignProgress?.completedNodes || []).filter(n => 
            n.completedAt && new Date(n.completedAt) >= oneWeekAgo
        );

        const weeklyBattleSolved = [];
        let totalBattleTimeSeconds = 0;
        let maxTimeSpentOnAQuestion = { title: 'None', timeSeconds: 0 };

        for (const match of matches) {
            const me = match.players?.find(p => String(p.userId) === String(userId));
            if (!me) continue;

            const timeSpent = match.matchDurationSeconds || 0;
            totalBattleTimeSeconds += timeSpent;

            if (me.isWinner) {
                for (const prob of (match.problemIds || [])) {
                    weeklyBattleSolved.push({
                        title: prob.title || 'Unknown Arena Problem',
                        difficulty: prob.difficulty || 'Medium',
                        topics: prob.topics || [],
                        type: 'battle',
                        timeSeconds: timeSpent
                    });
                }
            }

            for (const prob of (match.problemIds || [])) {
                if (timeSpent > maxTimeSpentOnAQuestion.timeSeconds) {
                    maxTimeSpentOnAQuestion = {
                        title: `${prob.title || 'Arena Problem'} (Battle)`,
                        timeSeconds: timeSpent
                    };
                }
            }
        }

        const completedCampaignNodeIds = weeklyCampaignNodes.map(n => n.nodeId);
        const campaignProblems = completedCampaignNodeIds.length > 0
            ? await Problem.find({ type: 'campaign', campaignNodeId: { $in: completedCampaignNodeIds } }).lean()
            : [];

        const weeklyCampaignSolved = [];
        let totalCampaignTimeSeconds = 0;

        for (const node of weeklyCampaignNodes) {
            const prob = campaignProblems.find(p => p.campaignNodeId === node.nodeId);
            const timeSeconds = (node.bestTimeMs || 0) / 1000;
            totalCampaignTimeSeconds += timeSeconds;

            if (prob) {
                weeklyCampaignSolved.push({
                    title: prob.title || `Node ${node.nodeId}`,
                    difficulty: prob.difficulty || 'Medium',
                    topics: prob.topics || [],
                    type: 'campaign',
                    timeSeconds
                });

                if (timeSeconds > maxTimeSpentOnAQuestion.timeSeconds) {
                    maxTimeSpentOnAQuestion = {
                        title: `${prob.title || 'Campaign Node'} (Campaign)`,
                        timeSeconds
                    };
                }
            } else {
                weeklyCampaignSolved.push({
                    title: `Node ${node.nodeId}`,
                    difficulty: 'Medium',
                    topics: [],
                    type: 'campaign',
                    timeSeconds
                });
                if (timeSeconds > maxTimeSpentOnAQuestion.timeSeconds) {
                    maxTimeSpentOnAQuestion = {
                        title: `Node ${node.nodeId} (Campaign)`,
                        timeSeconds
                    };
                }
            }
        }

        const totalWeeklyTimeSeconds = totalBattleTimeSeconds + totalCampaignTimeSeconds;
        const allSolvedQuestions = [...weeklyBattleSolved, ...weeklyCampaignSolved];

        // 4. Query AI Coaching Report
        let aiReport = null;
        try {
            const client = getGroqClient(3, 'weekly-report');
            if (client) {
                const systemPrompt = `You are Cody AI, an elite Senior AI Architect and engineering mentor for CodeArena 1v1. Your task is to analyze the user's weekly coding performance metrics and generate a highly personalized, constructive, and actionable feedback report.
You must answer three core questions:
1. Am I improving? (Evaluate practice consistency, solve counts, time spent, and competitive win rate)
2. Where am I weak? (Identify conceptual gaps, areas of difficulty, and where they struggled or spent excessive time)
3. What should I do next? (Provide concrete, structured actions, e.g. revise specific topics, practice Medium/Hard nodes)

Format your response strictly as a JSON object with exactly three keys:
- "improving": A paragraph (2-3 sentences) evaluating their improvement.
- "weakness": A paragraph (2-3 sentences) identifying their weak areas.
- "nextSteps": A bulleted list or 2-3 action items.

Do not wrap the JSON in markdown code blocks. Return only the raw JSON.`;

                const userPrompt = `User Stats for the Past Week:
- Username: ${user?.username || req.user.username}
- Total Solved Questions: ${allSolvedQuestions.length}
- Solved Questions: ${JSON.stringify(allSolvedQuestions.map(q => ({ title: q.title, difficulty: q.difficulty, topics: q.topics, type: q.type })))}
- Total Practice Time: ${Math.round(totalWeeklyTimeSeconds / 60)} minutes
- Single Question Max Time: "${maxTimeSpentOnAQuestion.title}" (${Math.round(maxTimeSpentOnAQuestion.timeSeconds / 60)} minutes)
- Arena 1v1 Matches: ${weeklyMatches} (Win Rate: ${winRate}%, Wins: ${weeklyWins})
- Campaign Nodes Completed: ${weeklyCampaignNodes.length}`;

                const completion = await client.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 1000
                });

                const rawText = completion.choices[0]?.message?.content?.trim();
                const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                aiReport = JSON.parse(cleanJson);
            }
        } catch (error) {
            console.error('[WEEKLY REPORT AI] Failed to generate or parse AI report:', error);
        }

        // Fallback for AI coaching insights
        if (!aiReport || !aiReport.improving || !aiReport.weakness || !aiReport.nextSteps) {
            const improvingText = `You are actively practicing and sharpening your competitive coding skills. With ${allSolvedQuestions.length} problem(s) solved this week and a total time commitment of ${Math.round(totalWeeklyTimeSeconds / 60)} minutes, your consistency is building a solid engineering foundation. ${winRate > 50 ? 'Your Arena win rate of ' + winRate + '% shows you are highly competitive in real-time matchups.' : 'Your Arena participation is helping you adapt to real-time coding pressure. Continue practicing to lift your competitive edge.'}`;
            
            const weaknessText = `Your performance shows that you spent the most time on "${maxTimeSpentOnAQuestion.title}" (${Math.round(maxTimeSpentOnAQuestion.timeSeconds / 60)} minutes). This suggests that complex logic or specific topics in that problem represent a learning frontier for you. You should focus more on parsing similar data structures and debugging under time constraints.`;
            
            const nextStepsText = [
                `Revise the core concepts of the topics in "${maxTimeSpentOnAQuestion.title}" to bridge the understanding gap.`,
                `Complete 2-3 Medium difficulty campaign nodes to strengthen your algorithmic foundation without matchmaking pressure.`,
                `Keep participating in Arena matchups on CodeArena to enhance your speed and accuracy under pressure.`
            ];

            aiReport = {
                improving: improvingText,
                weakness: weaknessText,
                nextSteps: nextStepsText
            };
        }

        // 5. Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Content-Disposition', `attachment; filename=CodeArena_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            res.send(pdfBuffer);
        });

        // Branding Header
        const logoPath = path.resolve(process.cwd(), '../frontend/src/assets/CodeArenaLogo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 35 });
        } else {
            doc.fillColor('#10b981')
               .rect(50, 45, 30, 30)
               .fill();
            doc.fillColor('#ffffff')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('C', 60, 53);
        }

        doc.fillColor('#1e293b')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('CodeArena', 95, 43);

        doc.fillColor('#10b981')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('WEEKLY PERFORMANCE REPORT', 95, 65, { characterSpacing: 1.5 });

        const formattedDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const printableUser = user || {
            fullName: req.user.fullName || req.user.username || 'Coder',
            username: req.user.username || 'unknown',
            role: req.user.role || 'user'
        };
        doc.fillColor('#64748b')
           .fontSize(8)
           .font('Helvetica')
           .text(`Generated on ${formattedDate}`, 380, 45, { align: 'right', width: 165 });
           
        doc.text(`User: ${printableUser.fullName} (${printableUser.username})`, 380, 58, { align: 'right', width: 165 });

        doc.strokeColor('#e2e8f0')
           .lineWidth(1)
           .moveTo(50, 88)
           .lineTo(545, 88)
           .stroke();

        // Practice Metrics Summary stats grid
        const yStart = 105;
        doc.fillColor('#f8fafc')
           .roundedRect(50, yStart, 495, 65, 8)
           .fill();

        doc.strokeColor('#e2e8f0')
           .lineWidth(1)
           .roundedRect(50, yStart, 495, 65, 8)
           .stroke();

        const timeSpentMinutes = Math.round(totalWeeklyTimeSeconds / 60);

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('PRACTICE TIME & SOLVES', 70, yStart + 12);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(`${timeSpentMinutes} mins`, 70, yStart + 23);
        doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`${allSolvedQuestions.length} Problem(s) Solved`, 70, yStart + 39);

        doc.strokeColor('#cbd5e1')
           .moveTo(215, yStart + 12)
           .lineTo(215, yStart + 53)
           .stroke();

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('ARENA 1V1 COMPETITIVE', 230, yStart + 12);
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(`${winRate}% Win Rate`, 230, yStart + 23);
        doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`${weeklyWins} Win(s) / ${weeklyMatches} Match(es)`, 230, yStart + 39);

        doc.strokeColor('#cbd5e1')
           .moveTo(375, yStart + 12)
           .lineTo(375, yStart + 53)
           .stroke();

        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('MOST TIME SPENT ON', 390, yStart + 12);
        const rawTitle = maxTimeSpentOnAQuestion.title;
        const truncatedTitle = rawTitle.length > 20 ? rawTitle.substring(0, 18) + '...' : rawTitle;
        doc.fillColor('#e11d48').fontSize(10).font('Helvetica-Bold').text(truncatedTitle, 390, yStart + 23);
        doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`Time: ${Math.round(maxTimeSpentOnAQuestion.timeSeconds / 60)} mins`, 390, yStart + 39);

        // AI Coaching Cards Layout
        let y = 185;
        doc.fillColor('#0f172a')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('AI Mentor Analysis & Recommendation', 50, y);
           
        doc.fillColor('#64748b')
           .fontSize(8)
           .font('Helvetica')
           .text('Dynamic learning diagnosis and coaching insights generated by Cody AI.', 50, y + 14);

        y += 32;

        // Am I Improving Card
        doc.fillColor('#f0fdf4')
           .roundedRect(50, y, 495, 60, 6)
           .fill();
        doc.strokeColor('#10b981')
           .lineWidth(3)
           .moveTo(51, y)
           .lineTo(51, y + 60)
           .stroke();
        doc.fillColor('#14532d').fontSize(9).font('Helvetica-Bold').text('Am I Improving?', 65, y + 10);
        doc.fillColor('#166534').fontSize(8.5).font('Helvetica').text(aiReport.improving, 65, y + 23, { width: 465, lineGap: 2 });

        y += 72;

        // Where Am I Weak Card
        doc.fillColor('#fffbeb')
           .roundedRect(50, y, 495, 60, 6)
           .fill();
        doc.strokeColor('#f59e0b')
           .lineWidth(3)
           .moveTo(51, y)
           .lineTo(51, y + 60)
           .stroke();
        doc.fillColor('#78350f').fontSize(9).font('Helvetica-Bold').text('Where Am I Weak?', 65, y + 10);
        doc.fillColor('#92400e').fontSize(8.5).font('Helvetica').text(aiReport.weakness, 65, y + 23, { width: 465, lineGap: 2 });

        y += 72;

        // What Should I Do Next Card
        doc.fillColor('#eff6ff')
           .roundedRect(50, y, 495, 75, 6)
           .fill();
        doc.strokeColor('#3b82f6')
           .lineWidth(3)
           .moveTo(51, y)
           .lineTo(51, y + 75)
           .stroke();
        doc.fillColor('#1e3a8a').fontSize(9).font('Helvetica-Bold').text('What Should I Do Next?', 65, y + 10);
        
        let nextStepsText = "";
        if (Array.isArray(aiReport.nextSteps)) {
            nextStepsText = aiReport.nextSteps.map((step) => `• ${step}`).join('\n');
        } else {
            nextStepsText = String(aiReport.nextSteps).trim();
        }
        doc.fillColor('#1e40af').fontSize(8.5).font('Helvetica').text(nextStepsText, 65, y + 23, { width: 465, lineGap: 3 });

        y += 90;

        // Solved Problems Logs Table
        if (y > 550) {
            doc.addPage();
            y = 50;
        }

        doc.fillColor('#0f172a')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Weekly Practice & Completed Log', 50, y);

        doc.fillColor('#64748b')
           .fontSize(8)
           .font('Helvetica')
           .text('Detailed logs of all problems successfully solved in the past 7 days.', 50, y + 14);

        y += 32;

        const colX = {
            title: 50,
            type: 230,
            difficulty: 300,
            topics: 370,
            time: 480
        };

        doc.fillColor('#f8fafc')
           .rect(50, y, 495, 20)
           .fill();
        doc.strokeColor('#e2e8f0')
           .lineWidth(1)
           .rect(50, y, 495, 20)
           .stroke();

        doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold');
        doc.text('PROBLEM TITLE', colX.title + 10, y + 6);
        doc.text('TYPE', colX.type, y + 6);
        doc.text('DIFFICULTY', colX.difficulty, y + 6);
        doc.text('TOPICS', colX.topics, y + 6);
        doc.text('SOLVE TIME', colX.time, y + 6, { width: 60, align: 'right' });

        y += 20;

        if (allSolvedQuestions.length === 0) {
            doc.strokeColor('#e2e8f0')
               .rect(50, y, 495, 35)
               .stroke();
            doc.fillColor('#94a3b8')
               .fontSize(8.5)
               .font('Helvetica-Oblique')
               .text('No problems solved yet in the last 7 days. Start solving to build your history!', 50, y + 13, { align: 'center', width: 495 });
        } else {
            doc.font('Helvetica').fontSize(8);
            for (let i = 0; i < allSolvedQuestions.length; i++) {
                if (y > 740) {
                    doc.addPage();
                    y = 50;
                    doc.fillColor('#f8fafc')
                       .rect(50, y, 495, 20)
                       .fill();
                    doc.strokeColor('#e2e8f0')
                       .lineWidth(1)
                       .rect(50, y, 495, 20)
                       .stroke();

                    doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold');
                    doc.text('PROBLEM TITLE', colX.title + 10, y + 6);
                    doc.text('TYPE', colX.type, y + 6);
                    doc.text('DIFFICULTY', colX.difficulty, y + 6);
                    doc.text('TOPICS', colX.topics, y + 6);
                    doc.text('SOLVE TIME', colX.time, y + 6, { width: 60, align: 'right' });
                    y += 20;
                    doc.font('Helvetica').fontSize(8);
                }

                const q = allSolvedQuestions[i];

                if (i % 2 === 1) {
                    doc.fillColor('#f8fafc')
                       .rect(50, y, 495, 22)
                       .fill();
                }

                doc.strokeColor('#f1f5f9')
                   .lineWidth(1)
                   .moveTo(50, y + 22)
                   .lineTo(545, y + 22)
                   .stroke();

                doc.fillColor('#0f172a').font('Helvetica-Bold');
                const truncatedQTitle = q.title.length > 28 ? q.title.substring(0, 26) + '...' : q.title;
                doc.text(truncatedQTitle, colX.title + 10, y + 7);

                doc.fillColor('#475569').font('Helvetica');
                doc.text(q.type === 'battle' ? 'Battle Arena' : 'Campaign Node', colX.type, y + 7);

                if (q.difficulty === 'Easy') {
                    doc.fillColor('#16a34a').font('Helvetica-Bold');
                } else if (q.difficulty === 'Medium') {
                    doc.fillColor('#d97706').font('Helvetica-Bold');
                } else {
                    doc.fillColor('#dc2626').font('Helvetica-Bold');
                }
                doc.text(q.difficulty, colX.difficulty, y + 7);

                doc.fillColor('#64748b').font('Helvetica');
                const topicsStr = (q.topics || []).slice(0, 2).join(', ') || 'N/A';
                doc.text(topicsStr, colX.topics, y + 7);

                doc.fillColor('#0f172a').font('Helvetica');
                const minutes = Math.floor(q.timeSeconds / 60);
                const seconds = Math.round(q.timeSeconds % 60);
                const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                doc.text(timeStr, colX.time, y + 7, { width: 60, align: 'right' });

                y += 22;
            }

            doc.strokeColor('#cbd5e1')
               .lineWidth(1)
               .moveTo(50, y)
               .lineTo(545, y)
               .stroke();
        }

        // Multi-page Footers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.strokeColor('#e2e8f0')
               .lineWidth(0.5)
               .moveTo(50, 795)
               .lineTo(545, 795)
               .stroke();

            doc.fillColor('#94a3b8')
               .fontSize(7)
               .font('Helvetica')
               .text('CodeArena 1v1 — The Ultimate Real-Time Coding Battlefield.', 50, 805);

            doc.text(`Page ${i + 1} of ${pages.count}`, 380, 805, { align: 'right', width: 165 });
        }

        doc.end();

    } catch (error) {
        console.error('Weekly Report Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate weekly report.' });
    }
};


// Version-2.0