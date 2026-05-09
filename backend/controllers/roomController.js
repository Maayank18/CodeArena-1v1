// FILE: backend/controllers/roomController.js
import Room from '../models/Room.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { signCustomRoomJoinToken } from '../utils/customRoomAuth.js';

let roomIdPool = [];
const POOL_SIZE = 20;
const CUSTOM_MATCH_LIMITS = { free: 0, plus: 2, pro: 10, premium: Infinity };

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

const isSameCalendarDay = (left, right) => (
    left instanceof Date &&
    right instanceof Date &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
);

const getAllowedCustomLimit = (user) => {
    if (user?.role === 'admin') {
        return Infinity;
    }

    const plan = user?.subscriptionPlan || 'free';
    return CUSTOM_MATCH_LIMITS[plan] ?? 0;
};

const loadQuotaUser = async (userId) => {
    const user = await User.findById(userId)
        .select('username role subscriptionPlan customMatchesPlayedToday lastCustomMatchDate')
        .lean();

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

const getFreshQuotaState = async (userId) => {
    const user = await loadQuotaUser(userId);
    const now = new Date();
    const lastDate = user.lastCustomMatchDate ? new Date(user.lastCustomMatchDate) : null;

    if (!lastDate || !isSameCalendarDay(lastDate, now)) {
        await User.findByIdAndUpdate(userId, {
            $set: {
                customMatchesPlayedToday: 0,
                lastCustomMatchDate: now,
            }
        });
        user.customMatchesPlayedToday = 0;
        user.lastCustomMatchDate = now;
    }

    const limit = getAllowedCustomLimit(user);
    const used = user.customMatchesPlayedToday || 0;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

    return {
        user,
        allowed: limit === Infinity || used < limit,
        used,
        remaining,
        limit,
    };
};

const buildQuotaPayload = (quotaState) => ({
    used: quotaState.limit === Infinity ? 0 : quotaState.used,
    remaining: quotaState.remaining === Infinity ? 'unlimited' : quotaState.remaining,
    limit: quotaState.limit === Infinity ? 'unlimited' : quotaState.limit,
    plan: quotaState.user.subscriptionPlan || 'free',
});

const generateUniqueRoomId = async (prefix = '') => {
    let roomId;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        roomId = `${prefix}${(roomIdPool.shift() || uuidv4().split('-')[0]).toUpperCase()}`;
        const existing = await Room.findOne({ roomId }).select('_id').lean();
        if (!existing) {
            isUnique = true;
        }
        attempts += 1;
    }

    if (roomIdPool.length < 5) {
        setImmediate(refillRoomIdPool);
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique room ID');
    }

    return roomId;
};

// @desc    Create a new room
// @route   POST /api/rooms
export const createRoom = async (req, res) => {
    try {
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

        const quotaState = await getFreshQuotaState(req.user._id);
        if (!quotaState.allowed) {
            return res.status(403).json({
                success: false,
                message: 'Daily custom match quota reached. Upgrade for more.',
                quota: buildQuotaPayload(quotaState),
            });
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
            },
            quota: buildQuotaPayload(quotaState),
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

        const quotaState = await getFreshQuotaState(req.user._id);
        if (!quotaState.allowed) {
            return res.status(403).json({
                success: false,
                message: 'Daily custom match quota reached. Upgrade for more.',
                quota: buildQuotaPayload(quotaState),
            });
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
