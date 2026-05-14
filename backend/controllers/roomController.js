// FILE: backend/controllers/roomController.js
import Room from '../models/Room.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { signCustomRoomJoinToken } from '../utils/customRoomAuth.js';
import { checkAndResetDailyUsage, getUsageLimits } from '../utils/usageTracker.js';

let roomIdPool = [];
const POOL_SIZE = 20;

function refillRoomIdPool() {
    while (roomIdPool.length < POOL_SIZE) {
        roomIdPool.push(uuidv4().split('-')[0]);
    }
}

refillRoomIdPool();

const sanitizeCustomTopics = (topics) => {
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

const generateUniqueRoomId = async (prefix = '') => {
    let roomId;
    let isUnique = false;
    while (!isUnique) {
        roomId = prefix + uuidv4().split('-')[0].toUpperCase();
        const existingRoom = await Room.findOne({ roomId });
        if (!existingRoom) isUnique = true;
    }
    return roomId;
};

// @desc    Create a new room
// @route   POST /api/rooms
export const createRoom = async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            const userDoc = await User.findById(user._id);
            if (!userDoc) return res.status(404).json({ message: 'User not found' });

            await checkAndResetDailyUsage(userDoc);
            const plan = userDoc.subscriptionPlan || 'free';
            const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;
            const limits = getUsageLimits(plan);
            
            // ✅ PRO/PREMIUM BYPASS: Unlimited normal matches
            if (userTier < 2) {
                if (userDoc.usageStats.matchesToday >= limits.matches) {
                    return res.status(403).json({ 
                        success: false,
                        message: `Daily normal match limit reached (${limits.matches}/day). Upgrade for more!`,
                        code: 'LIMIT_REACHED'
                    });
                }
            }
        }

        const battleProblemCount = await Problem.countDocuments({ type: 'battle' });
        if (battleProblemCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No Battle Arena problems available. Please add one via the Admin Panel.'
            });
        }

        const roomId = await generateUniqueRoomId('');
        const room = await Room.create({
            roomId,
            players: [],
            status: 'waiting',
            isCustom: false,
        });

        return res.status(201).json({
            success: true,
            roomId: room.roomId,
            message: 'Room created successfully'
        });
    } catch (error) {
        console.error('Create Room Error:', error);
        return res.status(500).json({ message: 'Failed to create room' });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
export const getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId })
            .select('roomId status players currentRound totalRounds problems winner createdAt isCustom customSettings')
            .lean();

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        return res.json(room);
    } catch (error) {
        console.error('Get Room Error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

export const createCustomRoom = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userDoc = await User.findById(req.user._id);
        if (!userDoc) return res.status(404).json({ message: 'User not found' });

        await checkAndResetDailyUsage(userDoc);
        const plan = userDoc.subscriptionPlan || 'free';
        const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;
        const limits = getUsageLimits(plan);

        // ✅ TIERED BYPASS: 
        // - Normal matches: unlimited for Pro+ (Tier 2+)
        // - Custom matches: limited for Pro (Tier 2), unlimited for Premium (Tier 3)
        const isCustomReq = req.route.path.includes('custom');
        const bypassTier = isCustomReq ? 3 : 2;

        if (userTier < bypassTier) {
            if (plan === 'free' && isCustomReq) {
                return res.status(403).json({
                    success: false,
                    message: 'Custom matches require Plus tier or higher. Upgrade to unlock!',
                    code: 'PREMIUM_REQUIRED'
                });
            }

            const currentUsage = isCustomReq ? userDoc.usageStats.customMatchesToday : userDoc.usageStats.matchesToday;
            const limit = isCustomReq ? limits.customMatches : limits.matches;
            const matchType = isCustomReq ? 'custom ' : 'normal ';

            if (currentUsage >= limit) {
                return res.status(403).json({
                    success: false,
                    message: `Daily ${matchType}match limit reached (${limit}/day). Upgrade for more!`,
                    code: 'LIMIT_REACHED'
                });
            }
        }

        const timeLimit = Math.min(Math.max(Number(req.body.timeLimit) || 1800, 600), 1800);
        const numQuestions = Math.min(Math.max(Number(req.body.numQuestions) || 3, 1), 5);
        const topics = sanitizeCustomTopics(req.body.topics);

        const problemQuery = { type: 'battle' };
        if (topics.length > 0) {
            problemQuery.topics = { $in: topics };
        }

        const problemCount = await Problem.countDocuments(problemQuery);
        if (problemCount < numQuestions) {
            return res.status(400).json({
                success: false,
                message: `Not enough problems. Found ${problemCount}, need ${numQuestions}.`
            });
        }

        const roomId = await generateUniqueRoomId('C-');
        const room = await Room.create({
            roomId,
            status: 'waiting',
            isCustom: true,
            players: [{
                userId: req.user._id,
                username: quotaState.user.username,
                side: 'left',
                currentScore: 0,
            }],
            customSettings: {
                timeLimit,
                numQuestions,
                topics,
                createdBy: req.user._id,
            },
            activatedAt: null,
            quotaChargedAt: null,
        });

        return res.status(201).json({
            success: true,
            roomId: room.roomId,
            message: 'Custom battle room created',
            joinToken: signCustomRoomJoinToken({ roomId: room.roomId, userId: req.user._id }),
            customSettings: {
                timeLimit,
                numQuestions,
                topics,
            }
        });
    } catch (error) {
        console.error('[CUSTOM ROOM] Create error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create custom room' });
    }
};

export const joinCustomRoom = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userDoc = await User.findById(req.user._id);
        if (!userDoc) return res.status(404).json({ message: 'User not found' });

        await checkAndResetDailyUsage(userDoc);
        const plan = userDoc.subscriptionPlan || 'free';
        const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;
        const limits = getUsageLimits(plan);

        // ✅ TIERED BYPASS: 
        // - Normal matches: unlimited for Pro+ (Tier 2+)
        // - Custom matches: limited for Pro (Tier 2), unlimited for Premium (Tier 3)
        const isCustomReq = req.route.path.includes('custom');
        const bypassTier = isCustomReq ? 3 : 2;

        if (userTier < bypassTier) {
            if (plan === 'free' && isCustomReq) {
                return res.status(403).json({
                    success: false,
                    message: 'Custom matches require Plus tier or higher. Upgrade to unlock!',
                    code: 'PREMIUM_REQUIRED'
                });
            }

            const currentUsage = isCustomReq ? userDoc.usageStats.customMatchesToday : userDoc.usageStats.matchesToday;
            const limit = isCustomReq ? limits.customMatches : limits.matches;
            const matchType = isCustomReq ? 'custom ' : 'normal ';

            if (currentUsage >= limit) {
                return res.status(403).json({
                    success: false,
                    message: `Daily ${matchType}match limit reached (${limit}/day). Upgrade for more!`,
                    code: 'LIMIT_REACHED'
                });
            }
        }

        const { roomId } = req.params;
        const room = await Room.findOne({ roomId, isCustom: true })
            .select('roomId status players customSettings')
            .lean();

        if (!room) {
            return res.status(404).json({ success: false, message: 'Custom room not found' });
        }
        if (room.status !== 'waiting') {
            return res.status(400).json({ success: false, message: 'Room is no longer accepting players' });
        }

        const alreadyParticipant = (room.players || []).some(
            (player) => String(player.userId) === String(req.user._id)
        );

        let updatedRoom = room;
        if (!alreadyParticipant) {
            if ((room.players || []).length >= 2) {
                return res.status(400).json({ success: false, message: 'Room is full' });
            }

            updatedRoom = await Room.findOneAndUpdate(
                {
                    _id: room._id,
                    status: 'waiting',
                    isCustom: true,
                    'players.1': { $exists: false },
                },
                {
                    $push: {
                        players: {
                            userId: req.user._id,
                            username: quotaState.user.username,
                            side: 'right',
                            currentScore: 0,
                        }
                    }
                },
                { new: true }
            ).lean();

            if (!updatedRoom) {
                return res.status(409).json({
                    success: false,
                    message: 'Room was claimed by another player. Try a different code.'
                });
            }
        }

        return res.json({
            success: true,
            message: 'Custom room join authorized.',
            roomId,
            joinToken: signCustomRoomJoinToken({ roomId, userId: req.user._id }),
            customSettings: updatedRoom.customSettings,
            quota: buildQuotaPayload(quotaState),
        });
    } catch (error) {
        console.error('[CUSTOM ROOM] Join error:', error);
        return res.status(500).json({ success: false, message: 'Failed to join custom room' });
    }
};

// @desc    Register for a live contest (Premium Only)
// @route   POST /api/rooms/contest/register
export const registerForContest = async (req, res) => {
    try {
        const userPlan = req.user?.subscriptionPlan || 'free';
        const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };
        const userTier = tiers[userPlan];

        if (userTier < 3) {
            return res.status(403).json({ 
                success: false, 
                message: "Contest registration requires Premium tier." 
            });
        }

        // Logic for contest registration would go here
        // For now, return success
        return res.json({
            success: true,
            message: "Successfully registered for the upcoming contest!"
        });
    } catch (error) {
        console.error('Contest Registration Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to register for contest' });
    }
};

export const getCustomQuota = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const quotaState = await getFreshQuotaState(req.user._id);

        return res.json({
            success: true,
            quota: buildQuotaPayload(quotaState),
        });
    } catch (error) {
        console.error('[CUSTOM ROOM] Quota check error:', error);
        return res.status(500).json({ success: false, message: 'Failed to check quota' });
    }
};
