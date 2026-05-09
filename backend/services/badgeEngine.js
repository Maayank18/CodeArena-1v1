// FILE: backend/services/badgeEngine.js
// Event-Driven Badge Engine - 30 unique achievement badges

import User from '../models/User.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';
import CampaignProgress from '../models/CampaignProgress.js';

export const BADGE_DEFINITIONS = [
    { id: 'flash', category: 'speed', name: 'Flash', desc: 'Win a match in under 5 minutes.' },
    { id: 'sub_minute', category: 'speed', name: 'Sub-Minute', desc: 'Solve a problem in under 60 seconds.' },
    { id: 'lightning_round', category: 'speed', name: 'Lightning Round', desc: 'Complete all rounds in under 10 minutes.' },
    { id: 'speed_demon', category: 'speed', name: 'Speed Demon', desc: 'Win 5 matches in under 10 minutes each.' },
    { id: 'time_lord', category: 'speed', name: 'Time Lord', desc: 'Win a match with over 20 minutes remaining.' },
    { id: 'instant_kill', category: 'speed', name: 'Instant Kill', desc: 'Solve the first problem before your opponent submits once.' },

    { id: 'streak_3', category: 'consistency', name: 'Getting Started', desc: 'Maintain a 3-day activity streak.' },
    { id: 'streak_7', category: 'consistency', name: 'Unstoppable', desc: 'Maintain a 7-day consistency streak.' },
    { id: 'streak_14', category: 'consistency', name: 'Iron Will', desc: 'Maintain a 14-day consistency streak.' },
    { id: 'streak_30', category: 'consistency', name: 'Marathon Runner', desc: 'Maintain a 30-day consistency streak.' },
    { id: 'weekend_warrior', category: 'consistency', name: 'Weekend Warrior', desc: 'Play matches on 4 consecutive weekends.' },
    { id: 'night_owl', category: 'consistency', name: 'Night Owl', desc: 'Win 10 matches played after midnight.' },

    { id: 'first_blood', category: 'combat', name: 'First Blood', desc: 'Win your very first 1v1 battle.' },
    { id: 'hat_trick', category: 'combat', name: 'Hat Trick', desc: 'Win 3 matches in a row.' },
    { id: 'arena_gladiator', category: 'combat', name: 'Arena Gladiator', desc: 'Win 25 battles in the Arena.' },
    { id: 'centurion', category: 'combat', name: 'Centurion', desc: 'Play 100 matches in total.' },
    { id: 'perfect_round', category: 'combat', name: 'Perfect Round', desc: 'Solve all problems correctly in a single match.' },
    { id: 'flawless_victory', category: 'combat', name: 'Flawless Victory', desc: 'Win a best-of-3 match 3-0.' },
    { id: 'dominator', category: 'combat', name: 'Dominator', desc: 'Achieve a 10-match win streak.' },
    { id: 'underdog', category: 'combat', name: 'Underdog', desc: 'Beat an opponent rated 200+ ELO above you.' },
    { id: 'survivor', category: 'combat', name: 'Survivor', desc: 'Win a match with less than 1 minute remaining.' },

    { id: 'array_ace', category: 'mastery', name: 'Array Ace', desc: 'Solve 10 Array problems.' },
    { id: 'string_slicer', category: 'mastery', name: 'String Slicer', desc: 'Solve 10 String problems.' },
    { id: 'tree_hugger', category: 'mastery', name: 'Tree Hugger', desc: 'Solve 10 Tree problems.' },
    { id: 'graph_guru', category: 'mastery', name: 'Graph Guru', desc: 'Solve 10 Graph problems.' },
    { id: 'dp_dynamo', category: 'mastery', name: 'DP Dynamo', desc: 'Solve 10 Dynamic Programming problems.' },
    { id: 'sort_king', category: 'mastery', name: 'Sort King', desc: 'Solve 10 Sorting problems.' },
    { id: 'binary_boss', category: 'mastery', name: 'Binary Boss', desc: 'Solve 10 Binary Search problems.' },
    { id: 'hash_master', category: 'mastery', name: 'Hash Master', desc: 'Solve 10 Hash Table problems.' },
    { id: 'diamond_ranked', category: 'mastery', name: 'Diamond Ranked', desc: 'Reach a rating of 1500 ELO or higher.' },
];

const TOPIC_BADGE_MAP = {
    array: 'array_ace',
    arrays: 'array_ace',
    string: 'string_slicer',
    strings: 'string_slicer',
    tree: 'tree_hugger',
    trees: 'tree_hugger',
    graph: 'graph_guru',
    graphs: 'graph_guru',
    'dynamic programming': 'dp_dynamo',
    dp: 'dp_dynamo',
    sorting: 'sort_king',
    sort: 'sort_king',
    'binary search': 'binary_boss',
    'hash table': 'hash_master',
    'hash tables': 'hash_master',
    hashing: 'hash_master',
};

const MASTERY_THRESHOLD = 10;

const getWeekendBucketStart = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return date.getTime();
};

const countConsecutiveWeekendBuckets = (timestamps) => {
    const buckets = [...new Set(
        timestamps
            .filter(Boolean)
            .map((value) => {
                const date = new Date(value);
                const day = date.getDay();
                if (day !== 0 && day !== 6) {
                    return null;
                }

                return getWeekendBucketStart(date);
            })
            .filter(Boolean)
    )].sort((a, b) => a - b);

    if (buckets.length === 0) {
        return 0;
    }

    let longest = 1;
    let current = 1;

    for (let index = 1; index < buckets.length; index += 1) {
        if (buckets[index] - buckets[index - 1] === 7 * 24 * 60 * 60 * 1000) {
            current += 1;
        } else {
            current = 1;
        }
        longest = Math.max(longest, current);
    }

    return longest;
};

const countCurrentWinStreak = (matches, userId) => {
    let streak = 0;
    for (const match of matches) {
        const me = match.players?.find((player) => String(player.userId) === String(userId));
        if (me?.isWinner) {
            streak += 1;
        } else {
            break;
        }
    }
    return streak;
};

const normalizeTopic = (topic) => String(topic || '').trim().toLowerCase();

export async function evaluateBadges(userId, matchData = {}) {
    try {
        const user = await User.findById(userId)
            .select('badges stats rating totalSolved')
            .lean();

        if (!user) {
            return [];
        }

        const stats = user.stats || { wins: 0, losses: 0, matchesPlayed: 0 };
        const earnedBadges = new Set(user.badges || []);
        const newBadges = [];

        const award = (badgeId) => {
            if (!earnedBadges.has(badgeId)) {
                earnedBadges.add(badgeId);
                newBadges.push(badgeId);
            }
        };

        const [
            recentMatches,
            campaignProgress,
            fastWinsCount,
            wonMatches,
        ] = await Promise.all([
            Match.find({ 'players.userId': userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .select('players createdAt problemIds matchDurationSeconds')
                .lean(),
            CampaignProgress.findOne({ userId })
                .select('currentStreak completedNodes')
                .lean(),
            Match.countDocuments({
                players: { $elemMatch: { userId, isWinner: true } },
                matchDurationSeconds: { $gt: 0, $lt: 600 },
            }),
            Match.find({
                players: { $elemMatch: { userId, isWinner: true } }
            })
                .select('problemIds')
                .lean(),
        ]);

        const currentWinStreak = countCurrentWinStreak(recentMatches, userId);
        const nightWins = recentMatches.filter((match) => {
            const me = match.players?.find((player) => String(player.userId) === String(userId));
            const hour = new Date(match.createdAt).getHours();
            return Boolean(me?.isWinner) && hour >= 0 && hour < 5;
        }).length;

        const activityDates = [
            ...recentMatches.map((match) => match.createdAt),
            ...(campaignProgress?.completedNodes || []).map((node) => node?.completedAt),
        ];
        const consecutiveWeekends = countConsecutiveWeekendBuckets(activityDates);
        const currentStreak = campaignProgress?.currentStreak || 0;

        const solvedProblemIds = wonMatches.flatMap((match) => match.problemIds || []);
        const completedCampaignNodeIds = (campaignProgress?.completedNodes || [])
            .map((node) => node?.nodeId)
            .filter(Boolean);

        const [battleProblems, campaignProblems] = await Promise.all([
            solvedProblemIds.length > 0
                ? Problem.find({ _id: { $in: solvedProblemIds } }).select('topics').lean()
                : [],
            completedCampaignNodeIds.length > 0
                ? Problem.find({ type: 'campaign', campaignNodeId: { $in: completedCampaignNodeIds } })
                    .select('topics')
                    .lean()
                : [],
        ]);

        const topicCounts = {};
        for (const problem of [...battleProblems, ...campaignProblems]) {
            for (const topic of (problem.topics || [])) {
                const normalizedTopic = normalizeTopic(topic);
                if (!normalizedTopic) continue;
                topicCounts[normalizedTopic] = (topicCounts[normalizedTopic] || 0) + 1;
            }
        }

        // Combat badges
        if (matchData.isWinner && stats.wins <= 1) {
            award('first_blood');
        }
        if (stats.wins >= 25) {
            award('arena_gladiator');
        }
        if (stats.matchesPlayed >= 100) {
            award('centurion');
        }
        if (matchData.isWinner && matchData.roundsWon === matchData.totalRounds) {
            award('perfect_round');
        }
        if (matchData.isWinner && matchData.totalRounds === 3 && matchData.roundsWon === 3 && matchData.opponentScore === 0) {
            award('flawless_victory');
        }
        if (currentWinStreak >= 3) {
            award('hat_trick');
        }
        if (currentWinStreak >= 10) {
            award('dominator');
        }
        if (matchData.isWinner && Number(matchData.opponentRating) - Number(matchData.userRating) >= 200) {
            award('underdog');
        }
        if (matchData.isWinner && Number(matchData.remainingTimeSeconds) > 0 && Number(matchData.remainingTimeSeconds) < 60) {
            award('survivor');
        }

        // Speed badges
        if (matchData.isWinner && Number(matchData.matchDurationMinutes) > 0 && Number(matchData.matchDurationMinutes) < 5) {
            award('flash');
        }
        if (Number(matchData.fastestSolveMs) > 0 && Number(matchData.fastestSolveMs) < 60000) {
            award('sub_minute');
        }
        if (matchData.isWinner && Number(matchData.matchDurationMinutes) > 0 && Number(matchData.matchDurationMinutes) < 10) {
            award('lightning_round');
        }
        if (fastWinsCount >= 5) {
            award('speed_demon');
        }
        if (matchData.isWinner && Number(matchData.remainingTimeSeconds) > 1200) {
            award('time_lord');
        }
        if (matchData.instantKill) {
            award('instant_kill');
        }

        // Consistency badges
        if (currentStreak >= 3) {
            award('streak_3');
        }
        if (currentStreak >= 7) {
            award('streak_7');
        }
        if (currentStreak >= 14) {
            award('streak_14');
        }
        if (currentStreak >= 30) {
            award('streak_30');
        }
        if (consecutiveWeekends >= 4) {
            award('weekend_warrior');
        }
        if (nightWins >= 10) {
            award('night_owl');
        }

        // Mastery badges
        for (const [topic, count] of Object.entries(topicCounts)) {
            const badgeId = TOPIC_BADGE_MAP[topic];
            if (badgeId && count >= MASTERY_THRESHOLD) {
                award(badgeId);
            }
        }
        if (user.rating >= 1500) {
            award('diamond_ranked');
        }

        if (newBadges.length > 0) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: { $each: newBadges } }
            });
        }

        return newBadges;
    } catch (error) {
        console.error('[BADGES] evaluateBadges error:', error);
        return [];
    }
}

export default { evaluateBadges, BADGE_DEFINITIONS };
