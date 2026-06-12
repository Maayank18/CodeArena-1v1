// FILE: backend/server.js
// FINAL PRODUCTION VERSION - FULLY OPTIMIZED & TESTED
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import cron from 'node-cron';
import axios from 'axios';

// ✅ ROUTES
import roomRoutes from './routes/roomRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import visualizerRoutes from './routes/visualizerRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { getSmtpDiagnostics, verifySmtpConnection } from './services/authEmailService.js';

// ✅ MODELS
import Problem from './models/Problem.js';
import User from './models/User.js';
import Match from './models/Match.js';
import Room from './models/Room.js';
import Metadata from './models/Metadata.js';
import { ensurePaymentTransactionIndexes } from './models/PaymentTransaction.js';

// ✅ UTILS
import { calculateMatchOutcome } from './utils/elo.js';
import { checkAndResetDailyUsage, getUsageLimits } from './utils/usageTracker.js';
import { AI_DAILY_LIMITS, AI_TIER_MAP } from './config/aiConfig.js';

// ✅ CRITICAL: Cache invalidation imports
import { clearLeaderboardCache } from './controllers/userController.js';
import { clearStatsCache } from './controllers/statsController.js';

// ✅ PRESENCE TRACKING (Real-time admin telemetry)
import { attachPresenceTracking } from './services/presenceTracker.js';

// ✅ BADGE ENGINE (Event-driven achievement system)
import { processAchievementEvent } from './services/achievementEngine.js';
import { verifyCustomRoomJoinToken } from './utils/customRoomAuth.js';

dotenv.config();

const isDatabaseReady = () => mongoose.connection.readyState === 1;
const toPublicProblem = (problem) => {
  if (!problem) return problem;

  const rawProblem = typeof problem.toObject === 'function' ? problem.toObject() : problem;

  return {
    ...rawProblem,
    boilerplates: rawProblem.boilerplates || rawProblem.starterCode || {},
    testCases: Array.isArray(rawProblem.testCases)
      ? rawProblem.testCases.filter((testCase) => testCase?.isPublic)
      : [],
  };
};

// ✅ DATABASE CONNECTION with retry logic
const waitForDatabase = async () => {
  try {
    await connectDB();
    console.log('[DB] ✅ Connected Successfully');
  } catch (err) {
    console.error('[DB] ❌ Connection Failed:', err);
    console.log('[DB] 🔄 Retrying in 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return waitForDatabase();
  }
};

// ✅ EXPRESS APP SETUP
const app = express();

// ✅ CRITICAL: Trust proxy in production (Vercel, Render, etc.)
// This allows Express to read x-forwarded-for header and correctly identify the real client IP.
// Without this, rate limiting groups all users under the proxy's IP in production.
app.set('trust proxy', 1);

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://code-arena-1v1.vercel.app',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean),
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(normalizeOrigin(origin));
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn('[CORS] Blocked origin', { origin, allowed: ALLOWED_ORIGINS });
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ SECURITY: Limit request body size
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// ✅ REQUEST LOGGER (excluding health checks)
app.use((req, res, next) => {
  if (req.originalUrl !== '/health') {
    // console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ✅ READINESS GATE: avoid buffering DB-backed requests during local startup/reconnects
app.use('/api', (req, res, next) => {
  if (isDatabaseReady()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'Server is still connecting to the database. Please retry in a few seconds.'
  });
});

// ✅ REGISTER ROUTES
app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/visualize', visualizerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/uploads', express.static('uploads'));

// ✅ HEALTH CHECK (Enhanced)
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const dbReady = isDatabaseReady();

  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'OK' : 'DEGRADED',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      ready: dbReady,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null,
    },
    smtp: getSmtpDiagnostics(),
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    activeRooms: rooms.size,
    activeSockets: io ? io.engine.clientsCount : 0
  });
});

// ✅ CRON JOB: Keep server alive on Render
cron.schedule('*/5 * * * *', async () => {
  try {
    // ⚠️ CRITICAL FIX: The ping interval is now 5 minutes. 
    // Render's inactivity timeout is 15 minutes, so a 14-minute interval was too risky.
    // We also removed the Sleep Window logic, because it was actively forcing the 
    // server to sleep for 7.5 hours, which caused the 5-10s cold starts when users visited.
    
    const backendURL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    console.log(`[CRON] 🏓 Pinging self: ${backendURL}/health`);

    const response = await axios.get(`${backendURL}/health`, {
      timeout: 5000,
      headers: { 'User-Agent': 'KeepAlive-Cron' }
    });
    
    if (response.status === 200) {
      console.log(`[CRON] ✅ Keep-alive success (Status: ${response.status})`);
    } else {
      console.warn(`[CRON] ⚠️ Keep-alive returned unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[CRON] ⚠️ Keep-alive failed:`, error.message);
  }
});

// ✅ CRON JOB: Daily Subscription Expiry Downgrade
// Runs at 00:00 every day
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const result = await User.updateMany(
      {
        subscriptionExpiry: { $ne: null, $lt: now },
        isPro: true
      },
      {
        $set: {
          isPro: false,
          planId: null,
          subscriptionPlan: 'free'
        }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[CRON] 🛡️ Downgraded ${result.modifiedCount} users due to subscription expiry.`);
    }
  } catch (error) {
    console.error(`[CRON] ⚠️ Downgrade CRON failed:`, error.message);
  }
});

// ✅ CRON JOB: Pre-compute heavy analytics
// Runs at 01:00 every day
cron.schedule('0 1 * * *', async () => {
  try {
    console.log(`[CRON] 📊 Pre-computing heavy topic analytics...`);
    const totalTopicAgg = await Problem.aggregate([
      { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$topics', total: { $sum: 1 } } }
    ]);

    const totalTopicCounts = totalTopicAgg.reduce((acc, item) => {
      if (item._id && typeof item._id === 'string') {
        const normalizedTopic = item._id.trim().toLowerCase();
        if (normalizedTopic) {
          acc[normalizedTopic] = item.total;
        }
      }
      return acc;
    }, {});

    await Metadata.findOneAndUpdate(
      { key: 'topicCounts' },
      {
        data: totalTopicCounts,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`[CRON] ✅ Topic analytics pre-computed successfully!`);
  } catch (error) {
    console.error(`[CRON] ⚠️ Topic analytics pre-computation failed:`, error.message);
  }
});

// ✅ ROOT ROUTE
app.get('/', (req, res) => res.send('CodeArena API v2.0 - Optimized'));

// ✅ HTTP & SOCKET.IO SERVER
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  // ✅ Socket.IO performance tuning
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const resolveSocketToken = (socket) => {
  const handshakeAuthToken = socket.handshake?.auth?.token;
  if (typeof handshakeAuthToken === 'string' && handshakeAuthToken.trim()) {
    return handshakeAuthToken.trim();
  }

  const authHeader = socket.handshake?.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
};

io.use(async (socket, next) => {
  try {
    const token = resolveSocketToken(socket);
    if (!token || !process.env.JWT_SECRET) {
      console.warn('[SOCKET AUTH] Missing token or JWT secret', {
        socketId: socket.id,
        hasToken: Boolean(token),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
      });
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return next(new Error('Unauthorized'));
    }

    const user = await User.findById(decoded.id)
      .select('_id username avatar subscriptionPlan role customization passwordChangedAt')
      .lean();

    if (!user) {
      console.warn('[SOCKET AUTH] User not found for token', {
        socketId: socket.id,
        userId: decoded.id,
      });
      return next(new Error('Unauthorized'));
    }

    if (user.passwordChangedAt && decoded.iat && (decoded.iat * 1000) < new Date(user.passwordChangedAt).getTime() - 1000) {
      console.warn('[SOCKET AUTH] Token is stale after password change', {
        socketId: socket.id,
        userId: decoded.id,
      });
      return next(new Error('Unauthorized'));
    }

    socket.data.user = {
      _id: String(user._id),
      username: user.username,
      subscriptionPlan: user.subscriptionPlan || 'free',
      role: user.role || 'user',
      avatar: user.avatar || '',
      customization: user.customization || {
        entranceBanner: 'default-dark',
        tagline: 'Novice',
        avatarFrame: 'none',
        signatureStack: []
      }
    };

    return next();
  } catch (error) {
    console.warn('[SOCKET AUTH] JWT verification failed', {
      socketId: socket.id,
      name: error?.name,
      message: error?.message,
    });
    return next(new Error('Unauthorized'));
  }
});

// Make io accessible in routes
app.locals.io = io;

// ✅ PRESENCE TRACKING: Attach non-destructive telemetry handlers
attachPresenceTracking(io);

// ✅ IN-MEMORY STORAGE
const rooms = new Map();
const roomTimers = new Map();
const disconnectGraceTimers = new Map();
const connectedSocketsByUsername = new Map();
const publicProblemCache = new Map();
const PUBLIC_PROBLEM_CACHE_TTL = 5 * 60 * 1000;
const SITE_STATS_TTL = 30 * 1000;
const siteStatsCache = {
  totalUsers: 0,
  timestamp: 0,
};

// ✅ PROBLEM CACHE (5 min TTL)
const problemCache = new Map();
const PROBLEM_CACHE_TTL = 5 * 60 * 1000;

const getDisconnectGraceKey = (roomId, username) => `${roomId}:${String(username || '').trim().toLowerCase()}`;

const registerConnectedSocket = (socket) => {
  const username = socket.data?.user?.username;
  if (!username) return;

  const key = String(username).trim().toLowerCase();
  const activeSockets = connectedSocketsByUsername.get(key) || new Set();
  activeSockets.add(socket.id);
  connectedSocketsByUsername.set(key, activeSockets);
};

const unregisterConnectedSocket = (socket) => {
  const username = socket.data?.user?.username;
  if (!username) return;

  const key = String(username).trim().toLowerCase();
  const activeSockets = connectedSocketsByUsername.get(key);
  if (!activeSockets) return;

  activeSockets.delete(socket.id);
  if (activeSockets.size === 0) {
    connectedSocketsByUsername.delete(key);
    return;
  }

  connectedSocketsByUsername.set(key, activeSockets);
};

const getCachedTotalUsers = async () => {
  if (siteStatsCache.timestamp && (Date.now() - siteStatsCache.timestamp) < SITE_STATS_TTL) {
    return siteStatsCache.totalUsers;
  }

  siteStatsCache.totalUsers = await User.countDocuments();
  siteStatsCache.timestamp = Date.now();
  return siteStatsCache.totalUsers;
};

const emitSiteStats = async (targetSocket = null) => {
  try {
    const payload = {
      live: connectedSocketsByUsername.size,
      total: await getCachedTotalUsers(),
    };

    if (targetSocket) {
      targetSocket.emit('site_stats', payload);
      return;
    }

    io.emit('site_stats', payload);
  } catch (error) {
    console.error('[SOCKET] Stats error:', error);
  }
};

const getCachedPublicProblem = async (problemId) => {
  if (!problemId) return null;

  const cacheKey = String(problemId);
  const cached = publicProblemCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < PUBLIC_PROBLEM_CACHE_TTL) {
    return cached.problem;
  }

  const problem = await Problem.findById(problemId)
    .select('-goldenSolution')
    .lean();
  const publicProblem = toPublicProblem(problem);

  if (!publicProblem) {
    publicProblemCache.delete(cacheKey);
    return null;
  }

  publicProblemCache.set(cacheKey, {
    problem: publicProblem,
    timestamp: Date.now(),
  });
  return publicProblem;
};

const loadBattleProblemIdsForRoom = async ({ count = 2, topics = [] } = {}) => {
  const normalizedTopics = [...new Set(
    (Array.isArray(topics) ? topics : [])
      .filter((topic) => typeof topic === 'string')
      .map((topic) => topic.trim().toLowerCase())
      .filter(Boolean)
  )];
  const cacheKey = `battle_problems_${count}_${normalizedTopics.join('|')}`;
  const cached = problemCache.get(cacheKey);
  let problemDocs = null;

  if (cached && (Date.now() - cached.timestamp) < PROBLEM_CACHE_TTL) {
    problemDocs = cached.problems;
  } else {
    const matchStage = { type: 'battle' };
    if (normalizedTopics.length > 0) {
      matchStage.topics = { $in: normalizedTopics };
    }

    problemDocs = await Problem.aggregate([
      { $match: matchStage },
      { $sample: { size: count } },
      { $project: { _id: 1 } }
    ]);
  }

  const normalizedIds = (problemDocs ?? [])
    .map((problem) => problem?._id?.toString?.())
    .filter(Boolean);

  const uniqueIds = [...new Set(normalizedIds)];

  if (uniqueIds.length === 0) {
    problemCache.delete(cacheKey);
    return [];
  }

  const existingDocs = await Problem.find({
    _id: { $in: uniqueIds },
    type: 'battle'
  })
    .select('_id')
    .lean();

  const existingIds = existingDocs.map((problem) => problem._id.toString());

  if (existingIds.length === 0) {
    problemCache.delete(cacheKey);
    return [];
  }

  problemCache.set(cacheKey, {
    problems: existingIds.map((_id) => ({ _id })),
    timestamp: Date.now()
  });

  if (existingIds.length === 1 && count > 1) {
    return Array(count).fill(existingIds[0]);
  }

  return existingIds.slice(0, count);
};

const persistCustomRoomPlayers = async (roomId, players, extraSet = {}) => {
  try {
    await Room.findOneAndUpdate(
      { roomId, isCustom: true },
      {
        $set: {
          players: players.map((player) => ({
            userId: player.userId || null,
            username: player.username,
            socketId: player.id,
            side: player.side,
            currentScore: 0,
          })),
          ...extraSet,
        }
      }
    );
  } catch (error) {
    console.error('[CUSTOM ROOM] Failed to persist players:', error.message);
  }
};

const activateCustomRoomInDb = async (roomId, room) => {
  const now = new Date();
  const participantIds = room.players
    .map((player) => player.userId)
    .filter(Boolean);

  const activatedRoom = await Room.findOneAndUpdate(
    { roomId, isCustom: true, quotaChargedAt: null },
    {
      $set: {
        status: 'active',
        activatedAt: now,
        quotaChargedAt: now,
        problems: room.problemIds,
        players: room.players.map((player) => ({
          userId: player.userId || null,
          username: player.username,
          socketId: player.id,
          side: player.side,
          currentScore: 0,
        })),
      }
    },
    { new: true }
  ).lean();

  if (activatedRoom && participantIds.length > 0) {
    await User.updateMany(
      { _id: { $in: participantIds } },
      {
        $inc: { customMatchesPlayedToday: 1 },
        $set: { lastCustomMatchDate: now }
      }
    );
    return true;
  }

  await persistCustomRoomPlayers(roomId, room.players, {
    status: 'active',
    problems: room.problemIds,
    activatedAt: now,
  });
  return false;
};

// ✅ SEASON POINTS CALCULATOR (unchanged)
const DEFAULT_PLAYER_RATING = 1000;
const DEFAULT_PLAYER_USERNAME = 'Unknown Player';

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeUsername = (value, fallback = DEFAULT_PLAYER_USERNAME) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
};

const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
  if (!playerData || !matchOutcome) return 5;

  const pRating = toFiniteNumber(playerData.rating, DEFAULT_PLAYER_RATING);
  const oRating = opponentData ? toFiniteNumber(opponentData.rating, DEFAULT_PLAYER_RATING) : DEFAULT_PLAYER_RATING;
  const pScore = toFiniteNumber(playerData.score, 0);

  // 1. CHEATER PENALTY
  if (playerData.isCheater) {
    const dynamicPenalty = 20 + Math.min(30, Math.max(0, Math.round((pRating - 1000) / 50)));
    return -dynamicPenalty;
  }

  // 2. CHEATER BOUNTY
  if (opponentData?.isCheater) {
    const dynamicBounty = 40 + Math.min(20, Math.max(0, Math.round(oRating / 100)));
    return dynamicBounty;
  }

  // 3. WINNER OUTCOME
  if (matchOutcome.status?.includes("Winner")) {
    const baseWin = 35;
    // Dynamic ELO Difference Bonus: Reward more points for defeating a stronger player
    const eloDiff = oRating - pRating;
    const eloBonus = eloDiff > 0 ? Math.min(20, Math.round(eloDiff / 15)) : 0;
    // Score/Performance Bonus: reward based on score
    const scoreBonus = Math.min(15, Math.round(pScore / 2));

    return baseWin + eloBonus + scoreBonus;
  }

  // 4. DRAW OUTCOME
  if (matchOutcome.status === "Draw") {
    if (!hasSubmitted) return 0;
    const baseDraw = 15;
    const scoreBonus = Math.min(10, Math.round(pScore / 3));
    return baseDraw + scoreBonus;
  }

  // 5. LOSER OUTCOME
  if (matchOutcome.status === "Loser") {
    if (pScore === 0 || !hasSubmitted) return -10;
    const baseLoss = 5; // Baseline participation points to avoid 0
    const scoreBonus = hasSubmitted ? Math.min(10, Math.round(pScore / 4)) : 0;
    return baseLoss + scoreBonus;
  }

  return 5;
};

const FORFEIT_ELO_K = 32;
const FORFEIT_WIN_POINTS = 25;

const calculateExpectedScore = (playerRating, opponentRating) =>
  1 / (1 + Math.pow(10, ((opponentRating || DEFAULT_PLAYER_RATING) - (playerRating || DEFAULT_PLAYER_RATING)) / 400));

const calculateSoloPracticeOutcome = (playerData, reason) => {
  const rating = toFiniteNumber(playerData?.rating, DEFAULT_PLAYER_RATING);
  const score = Math.max(0, toFiniteNumber(playerData?.score, 0));
  const hasSubmitted = Boolean(playerData?.hasSubmitted);

  // 1. Cheater check
  if (playerData?.isCheater) {
    const penalty = 15 + Math.min(20, Math.max(0, Math.round((rating - 1000) / 100)));
    return {
      p1: {
        newRating: Math.max(0, rating - penalty),
        pointsGained: -penalty,
        seasonScore: -penalty,
        status: 'Disqualified',
      }
    };
  }

  // 2. Forfeit/Leave Scenario (Maya vs undefined case)
  if (reason === 'forfeit') {
    const eloPenalty = Math.min(12, Math.max(4, Math.round(Math.max(0, rating - DEFAULT_PLAYER_RATING) / 100) + 4));
    const dynamicParticipationPoints = hasSubmitted ? (5 + Math.min(10, Math.round(score / 4))) : 0;

    return {
      p1: {
        newRating: Math.max(0, rating - eloPenalty),
        pointsGained: -eloPenalty,
        seasonScore: dynamicParticipationPoints, // Dynamic points even on forfeit!
        status: 'Loser',
      }
    };
  }

  // 3. Timeout or Quit without submission
  if (!hasSubmitted) {
    return {
      p1: {
        newRating: rating,
        pointsGained: 0,
        seasonScore: 0, // Since they did not attempt, 0 points
        status: 'Loser', // Always a Loss (not a Draw) if they didn't attempt
      }
    };
  }

  // 4. Completed Solo Match
  const eloGain = Math.min(12, Math.max(2, Math.round(score / 4) || 2));
  const practicePoints = Math.min(30, Math.max(8, Math.round(score / 2) || 8));

  return {
    p1: {
      newRating: Math.max(0, rating + eloGain),
      pointsGained: eloGain,
      seasonScore: practicePoints,
      status: 'Winner',
    }
  };
};

const buildPlayerStatsUpdate = ({ newRating, seasonPoints, outcomeStatus }) => ({
  $set: {
    rating: Math.max(0, toFiniteNumber(newRating, DEFAULT_PLAYER_RATING)),
  },
  $inc: {
    seasonScore: toFiniteNumber(seasonPoints, 0),
    'stats.matchesPlayed': 1,
    'stats.wins': outcomeStatus?.includes('Winner') ? 1 : 0,
    'stats.losses': outcomeStatus === 'Loser' ? 1 : 0,
  }
});

const normalizeRoundSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return {};

  return Object.entries(snapshot).reduce((normalized, [round, value]) => {
    if (value === undefined || value === null) return normalized;
    normalized[String(round)] = typeof value === 'string' ? value : String(value);
    return normalized;
  }, {});
};

const capturePlayerSubmission = ({ room, playerObj, code, language, markSubmitted = false }) => {
  if (!room || !playerObj) return null;

  const roundKey = String(room.round || 1);
  const submittedCode = typeof code === 'string' ? code : '';
  const submittedLanguage = typeof language === 'string' ? language : '';

  playerObj.roundCodes = normalizeRoundSnapshot(playerObj.roundCodes);
  playerObj.roundLanguages = normalizeRoundSnapshot(playerObj.roundLanguages);

  if (submittedCode || !playerObj.roundCodes[roundKey]) {
    playerObj.roundCodes[roundKey] = submittedCode;
  }

  if (submittedLanguage || !playerObj.roundLanguages[roundKey]) {
    playerObj.roundLanguages[roundKey] = submittedLanguage;
  }

  if (submittedCode || !playerObj.code) {
    playerObj.code = submittedCode;
  }

  if (submittedLanguage || !playerObj.language) {
    playerObj.language = submittedLanguage;
  }

  if (markSubmitted) {
    playerObj.hasSubmitted = true;
  }

  return {
    roundKey,
    codeLength: submittedCode.length,
    language: submittedLanguage || playerObj.language || 'N/A',
  };
};

const buildMatchPlayerRecord = ({ userDoc, playerData, outcome, newRating, seasonPoints }) => {
  const roundCodes = normalizeRoundSnapshot(playerData?.roundCodes);
  const roundLanguages = normalizeRoundSnapshot(playerData?.roundLanguages);
  const record = {
    userId: userDoc?._id || null,
    username: toSafeUsername(playerData?.username),
    avatar: typeof userDoc?.avatar === 'string' ? userDoc.avatar : '',
    isWinner: Boolean(outcome?.status?.includes('Winner')),
    score: toFiniteNumber(playerData?.score, 0),
    oldElo: toFiniteNumber(playerData?.rating, DEFAULT_PLAYER_RATING),
    newElo: Math.max(0, toFiniteNumber(newRating, DEFAULT_PLAYER_RATING)),
    statusText: outcome?.status || 'Draw',
    seasonPointsGained: toFiniteNumber(seasonPoints, 0),
    hasSubmitted: Boolean(playerData?.hasSubmitted),
    code: playerData?.code || '',
    language: playerData?.language || '',
    roundCodes,
    roundLanguages,
  };
  console.log(`[MATCH SAVE] buildMatchPlayerRecord for "${record.username}": code=${record.code ? `${record.code.length} chars` : 'EMPTY'}, roundCodes keys=${JSON.stringify(Object.keys(record.roundCodes))}, language=${record.language}`);
  return record;
};

const logMatchResolutionError = (roomId, stage, error, context = {}) => {
  console.error(`[MATCH RESOLUTION] ${stage} failed for room ${roomId}:`, {
    ...context,
    message: error?.message,
    stack: error?.stack,
  });
};

const buildForfeitOutcome = (p1Data, p2Data, winnerUsername, matchDurationSeconds = 60) => {
  const p1Rating = p1Data?.rating || 1000;
  const p2Rating = p2Data?.rating || 1000;
  const expectedP1 = calculateExpectedScore(p1Rating, p2Rating);
  const expectedP2 = calculateExpectedScore(p2Rating, p1Rating);
  const p1IsWinner = p1Data?.username === winnerUsername;
  const p1Actual = p1IsWinner ? 1 : 0;
  const p2Actual = 1 - p1Actual;

  const p1IsCheater = Boolean(p1Data?.isCheater);
  const p2IsCheater = Boolean(p2Data?.isCheater);

  // Scenario A: BOTH ARE CHEATERS
  if (p1IsCheater && p2IsCheater) {
    return {
      p1: { newRating: Math.max(0, p1Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" },
      p2: { newRating: Math.max(0, p2Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
    };
  }

  // Scenario B: ONE IS CHEATER
  if (p1IsCheater || p2IsCheater) {
    const fairRating = p1IsCheater ? p2Rating : p1Rating;
    const cheaterRating = p1IsCheater ? p1Rating : p2Rating;
    const bounty = 40 + Math.min(20, Math.max(0, Math.round(cheaterRating / 100)));
    const ratingGain = 15 + Math.min(15, Math.max(0, Math.round((cheaterRating - fairRating) / 20)));

    return {
      p1: p1IsCheater
        ? { newRating: Math.max(0, p1Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
        : { newRating: p1Rating + ratingGain, pointsGained: ratingGain, seasonScore: bounty, status: "Winner" },
      p2: p2IsCheater
        ? { newRating: Math.max(0, p2Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
        : { newRating: p2Rating + ratingGain, pointsGained: ratingGain, seasonScore: bounty, status: "Winner" }
    };
  }

  // Scenario C: STANDARD FORFEIT / DISCONNECT
  let p1Delta = Math.round(FORFEIT_ELO_K * (p1Actual - expectedP1));
  let p2Delta = Math.round(FORFEIT_ELO_K * (p2Actual - expectedP2));

  // Lobby Dodge check: if left in under 20 seconds
  const isLobbyDodge = matchDurationSeconds < 20;

  // Check if the winner made any submission attempts
  const p1Attempted = Boolean(p1Data?.hasSubmitted);
  const p2Attempted = Boolean(p2Data?.hasSubmitted);
  const winnerAttempted = p1IsWinner ? p1Attempted : p2Attempted;

  // Scale down points and ELO gain if the winner did not even try to attempt the question
  let winnerPoints = isLobbyDodge ? 25 : 30;
  if (!winnerAttempted) {
    winnerPoints = isLobbyDodge ? 5 : 10;
  }

  let p1SeasonPoints = 0;
  let p2SeasonPoints = 0;

  if (p1IsWinner) {
    p1SeasonPoints = winnerPoints;
    p2SeasonPoints = isLobbyDodge ? -10 : (p2Attempted ? 5 : -10); // -10 for dodge, +5 for benefit of doubt if attempted, else -10

    if (!p1Attempted) {
      // Winner p1 did not attempt: scale down their ELO gain by 50%
      p1Delta = Math.round(p1Delta * 0.5);
    }

    if (isLobbyDodge) {
      p2Delta = Math.min(p2Delta, -15); // Stiffer Elo drop for dodging
    }
  } else {
    p2SeasonPoints = winnerPoints;
    p1SeasonPoints = isLobbyDodge ? -10 : (p1Attempted ? 5 : -10);

    if (!p2Attempted) {
      // Winner p2 did not attempt: scale down their ELO gain by 50%
      p2Delta = Math.round(p2Delta * 0.5);
    }

    if (isLobbyDodge) {
      p1Delta = Math.min(p1Delta, -15);
    }
  }

  return {
    p1: {
      newRating: Math.max(0, p1Rating + p1Delta),
      pointsGained: p1Delta,
      seasonScore: p1SeasonPoints,
      status: p1IsWinner ? 'Winner' : 'Loser',
    },
    p2: {
      newRating: Math.max(0, p2Rating + p2Delta),
      pointsGained: p2Delta,
      seasonScore: p2SeasonPoints,
      status: p1IsWinner ? 'Loser' : 'Winner',
    }
  };
};

// ✅ AUTHORITATIVE MATCH RESOLUTION ENGINE
const handleGameEnd = async (roomId, room) => {
  if (!room) return null;
  if (room.resolutionResult || room.isResolving) return room.resolutionResult || null;
  if (!room.isGameActive) return room.resolutionResult || null;
  room.isResolving = true;
  room.isGameActive = false;

  // Clear timer immediately
  if (roomTimers.has(roomId)) {
    clearInterval(roomTimers.get(roomId));
    roomTimers.delete(roomId);
  }

  const matchReason = room.matchEndReason || 'submission';
  const forcedWinnerUsername = room.forcedWinnerUsername || null;
  if (!room.scores || typeof room.scores !== 'object') {
    room.scores = {};
  }
  room.cheaters = room.cheaters instanceof Set ? room.cheaters : new Set(room.cheaters || []);
  room.submissionAttempts = room.submissionAttempts instanceof Set
    ? room.submissionAttempts
    : new Set(room.submissionAttempts || []);
  for (const player of room.players || []) {
    if (player?.username && room.scores[player.username] === undefined) {
      room.scores[player.username] = 0;
    }
  }
  const playerNames = (room.players || [])
    .map((player) => player?.username)
    .filter(Boolean);

  // Check for sufficient players
  if (playerNames.length === 0) {
    console.log(`[GAME END] Room ${roomId}: ❌ Cancelled (No scored players)`);
    const cancelledPayload = {
      winner: null,
      winnerName: null,
      winnerId: null,
      reason: 'cancelled',
      scores: room.scores || {},
      eloChanges: {},
      playerResults: {},
      pointsEarned: 0,
      newElo: null,
      isDisqualified: false,
      disqualifiedPlayer: null,
      message: "Match cancelled (No valid players finished the challenge)."
    };
    room.resolutionResult = cancelledPayload;
    io.to(roomId).emit('game_over', cancelledPayload);
    io.to(roomId).emit('match_ended', cancelledPayload);
    room.isResolving = false;
    rooms.delete(roomId);
    return cancelledPayload;
  }

  console.log(`[GAME END] 🏁 Processing Room: ${roomId}`);

  const isSoloMatch = playerNames.length === 1;
  let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
  let winnerId = null;
  let eloChanges = null;
  let playerResults = {};

  try {
    // ✅ Parallel user fetches (optimized)
    const userDocs = await Promise.all(
      playerNames.slice(0, 2).map((playerName) =>
        User.findByUsername(playerName)
      )
    );
    const [user1Doc, user2Doc] = userDocs;

    // Extract player objects once (avoid repeated find calls)
    const p1PlayerObj = room.players?.find(p => p.username.toLowerCase() === playerNames[0].toLowerCase());
    const p2PlayerObj = !isSoloMatch ? room.players?.find(p => p.username.toLowerCase() === (playerNames[1] || '').toLowerCase()) : null;

    console.log(`[GAME END] Player code state at save time: P1="${playerNames[0]}" code=${p1PlayerObj?.code ? p1PlayerObj.code.length + ' chars' : 'EMPTY'}, roundCodes=${JSON.stringify(Object.keys(p1PlayerObj?.roundCodes || {}))}, language=${p1PlayerObj?.language || 'N/A'}${p2PlayerObj ? `, P2="${playerNames[1]}" code=${p2PlayerObj?.code ? p2PlayerObj.code.length + ' chars' : 'EMPTY'}, roundCodes=${JSON.stringify(Object.keys(p2PlayerObj?.roundCodes || {}))}, language=${p2PlayerObj?.language || 'N/A'}` : ''}`);

    const p1Data = {
      username: playerNames[0],
      rating: user1Doc?.rating || 1000,
      score: Number(room.scores[playerNames[0]]) || 0,
      isCheater: room.cheaters.has(playerNames[0]),
      hasSubmitted: room.submissionAttempts.has(playerNames[0]),
      code: p1PlayerObj?.code || "",
      language: p1PlayerObj?.language || "",
      roundCodes: p1PlayerObj?.roundCodes || {},
      roundLanguages: p1PlayerObj?.roundLanguages || {}
    };

    const p2Data = isSoloMatch
      ? null
      : {
        username: playerNames[1] || "Opponent",
        rating: user2Doc?.rating || 1000,
        score: Number(room.scores[playerNames[1]]) || 0,
        isCheater: room.cheaters.has(playerNames[1]),
        hasSubmitted: room.submissionAttempts.has(playerNames[1]),
        code: p2PlayerObj?.code || "",
        language: p2PlayerObj?.language || "",
        roundCodes: p2PlayerObj?.roundCodes || {},
        roundLanguages: p2PlayerObj?.roundLanguages || {}
      };

    let matchDurationSeconds = Math.max(0, Math.floor((Date.now() - (room.startTime || Date.now())) / 1000));

    let outcome;
    let p1NewRating;
    let p2NewRating;
    let p1SeasonPoints;
    let p2SeasonPoints;
    let officialWinner;

    if (isSoloMatch) {
      outcome = calculateSoloPracticeOutcome(p1Data, matchReason);
      p1NewRating = toFiniteNumber(outcome?.p1?.newRating, p1Data.rating);
      p1SeasonPoints = toFiniteNumber(outcome?.p1?.seasonScore, 0);
      officialWinner = outcome?.p1?.status?.includes('Winner') ? p1Data.username : null;
      p2NewRating = null;
      p2SeasonPoints = 0;
    } else if (matchReason === 'forfeit' && forcedWinnerUsername) {
      outcome = buildForfeitOutcome(p1Data, p2Data, forcedWinnerUsername, matchDurationSeconds);
      p1NewRating = toFiniteNumber(outcome?.p1?.newRating, DEFAULT_PLAYER_RATING);
      p2NewRating = toFiniteNumber(outcome?.p2?.newRating, DEFAULT_PLAYER_RATING);
      p1SeasonPoints = toFiniteNumber(outcome?.p1?.seasonScore, 0);
      p2SeasonPoints = toFiniteNumber(outcome?.p2?.seasonScore, 0);
      officialWinner = forcedWinnerUsername;
    } else {
      outcome = calculateMatchOutcome(p1Data, p2Data);
      p1NewRating = toFiniteNumber(outcome?.p1?.newRating, DEFAULT_PLAYER_RATING);
      p2NewRating = toFiniteNumber(outcome?.p2?.newRating, DEFAULT_PLAYER_RATING);

      p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome?.p1, p1Data.hasSubmitted);
      p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome?.p2, p2Data?.hasSubmitted);

      const p1IsWinner = outcome?.p1?.status?.includes("Winner");
      const p2IsWinner = outcome?.p2?.status?.includes("Winner");
      officialWinner = p1IsWinner ? p1Data.username : (p2IsWinner ? p2Data?.username : null);
    }

    // ✅ Batch all database operations
    const resolvedPlayers = [
      {
        key: 'p1',
        userDoc: user1Doc,
        data: p1Data,
        outcome: outcome?.p1,
        newRating: p1NewRating,
        seasonPoints: p1SeasonPoints,
      }
    ];

    if (p2Data && outcome?.p2) {
      resolvedPlayers.push({
        key: 'p2',
        userDoc: user2Doc,
        data: p2Data,
        outcome: outcome.p2,
        newRating: p2NewRating,
        seasonPoints: p2SeasonPoints,
      });
    }

    // Update player 1
    if (!user1Doc) {
      console.warn(`[MATCH RESOLUTION] Missing user document for ${p1Data.username} in room ${roomId}`);
    }

    // Update player 2
    if (p2Data && !user2Doc) {
      console.warn(`[MATCH RESOLUTION] Missing user document for ${p2Data.username} in room ${roomId}`);
    }

    winnerName = officialWinner;
    winnerId = officialWinner ? room.players.find((player) => player.username.toLowerCase() === officialWinner.toLowerCase())?.userId || null : null;
    playerResults = Object.fromEntries(
      resolvedPlayers.map((player) => [
        toSafeUsername(player.data.username),
        {
          username: toSafeUsername(player.data.username),
          score: toFiniteNumber(player.data.score, 0),
          seasonPoints: toFiniteNumber(player.seasonPoints, 0),
          newElo: Math.max(0, toFiniteNumber(player.newRating, DEFAULT_PLAYER_RATING)),
          eloChange: toFiniteNumber(player.outcome?.pointsGained, 0),
          isWinner: Boolean(player.outcome?.status?.includes('Winner')),
        }
      ])
    );
    eloChanges = Object.fromEntries(
      resolvedPlayers.map((player) => [
        player.key,
        {
          username: toSafeUsername(player.data.username),
          newRating: Math.max(0, toFiniteNumber(player.newRating, DEFAULT_PLAYER_RATING)),
          eloChange: toFiniteNumber(player.outcome?.pointsGained, 0),
          seasonPoints: toFiniteNumber(player.seasonPoints, 0),
        }
      ])
    );

    matchDurationSeconds = Math.max(0, Math.floor((Date.now() - (room.startTime || Date.now())) / 1000));

    await Promise.all(
      resolvedPlayers
        .filter((player) => player.userDoc?._id)
        .map(async (player) => {
          try {
            await User.findByIdAndUpdate(
              player.userDoc._id,
              buildPlayerStatsUpdate({
                newRating: player.newRating,
                seasonPoints: player.seasonPoints,
                outcomeStatus: player.outcome?.status,
              }),
              { new: false }
            );
          } catch (error) {
            logMatchResolutionError(roomId, 'user stats update', error, {
              username: player.data.username,
            });
          }
        })
    );

    try {
      await Match.create({
        roomId,
        winner: officialWinner || 'Draw',
        status: 'completed',
        reason: officialWinner ? matchReason : (matchReason === 'forfeit' ? 'forfeit' : 'draw'),
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        problemIds: room.problemIds || [],
        isCustom: Boolean(room.isCustom),
        matchDurationSeconds,
        timeLimitSeconds: room.durationSeconds || (30 * 60),
        totalRoundsConfigured: room.totalRounds || 0,
        fastestSolveMsByUser: room.fastestSolveMsByUser || {},
        firstRoundFirstSolverUsername: room.firstRoundFirstSolverUsername || null,
        firstRoundOpponentSubmissionCounts: room.firstRoundOpponentSubmissionCounts || {},
        players: resolvedPlayers.map((player) => buildMatchPlayerRecord({
          userDoc: player.userDoc,
          playerData: player.data,
          outcome: player.outcome,
          newRating: player.newRating,
          seasonPoints: player.seasonPoints,
        })),
      });
    } catch (error) {
      logMatchResolutionError(roomId, 'match record save', error, {
        players: resolvedPlayers.map((player) => toSafeUsername(player.data.username)),
        reason: matchReason,
      });
    }

    try {
      await Room.findOneAndUpdate(
        { roomId, status: { $ne: 'finished' } },
        { $set: { status: 'finished', winner: officialWinner || 'Draw' } }
      );
    } catch (error) {
      logMatchResolutionError(roomId, 'room finalization', error, {
        winner: officialWinner || 'Draw',
      });
    }

    clearLeaderboardCache();
    clearStatsCache();

    console.log(`[GAME END] Room ${roomId} | Winner: ${winnerName || 'Draw'}`);

    /*
        Room.findOneAndUpdate(
            { roomId, status: { $ne: 'finished' } },
            { $set: { status: 'finished', winner: officialWinner || 'Draw' } }
        )
    );

    // ✅ Execute all DB operations in parallel
    await Promise.all(dbOperations);

    // ✅ CRITICAL: Invalidate caches after match completion
    clearLeaderboardCache();
    clearStatsCache();

    eloChanges = {
        p1: { 
            username: p1Data.username, 
            newRating: p1NewRating, 
            eloChange: outcome.p1.pointsGained, 
            seasonPoints: p1SeasonPoints 
        }
    };
    if (p2Data && outcome?.p2) {
        eloChanges.p2 = { 
            username: p2Data.username, 
            newRating: p2NewRating, 
            eloChange: outcome.p2.pointsGained, 
            seasonPoints: p2SeasonPoints 
        };
    }
    winnerName = officialWinner;
    winnerId = room.players.find((player) => player.username.toLowerCase() === officialWinner.toLowerCase())?.userId || null;
    playerResults = {
        [p1Data.username]: {
            username: p1Data.username,
            score: p1Data.score,
            seasonPoints: p1SeasonPoints,
            newElo: p1NewRating,
            eloChange: outcome.p1.pointsGained,
            isWinner: outcome.p1.status.includes("Winner"),
        }
    };
    if (p2Data && outcome?.p2) {
        playerResults[p2Data.username] = {
            username: p2Data.username,
            score: p2Data.score,
            seasonPoints: p2SeasonPoints,
            newElo: p2NewRating,
            eloChange: outcome.p2.pointsGained,
            isWinner: outcome.p2.status.includes("Winner"),
        };
    }

    console.log(`[GAME END] ✅ Room ${roomId} | Winner: ${winnerName}`);

    // ✅ Increment analytics tracking fields
    const matchDurationSeconds = Math.max(0, Math.floor((Date.now() - (room.startTime || Date.now())) / 1000));
    const matchDurationMinutes = Number((matchDurationSeconds / 60).toFixed(2));
    const remainingTimeSeconds = Math.max(
        0,
        (room.durationSeconds || (30 * 60)) - matchDurationSeconds
    );

    */
    await Promise.all(
      resolvedPlayers
        .filter((player) => player.userDoc?._id)
        .map(async (player) => {
          try {
            await User.findByIdAndUpdate(player.userDoc._id, {
              $inc: {
                totalTimeSpent: matchDurationMinutes,
                totalSolved: player.outcome?.status?.includes('Winner')
                  ? (room.totalRounds || room.round || 0)
                  : 0
              }
            });
          } catch (error) {
            logMatchResolutionError(roomId, 'analytics update', error, {
              username: player.data.username,
            });
          }
        })
    );

    // ✅ ACHIEVEMENT ENGINE: Evaluate achievements asynchronously (fire-and-forget)
    try {
      if (user1Doc?._id) {
        processAchievementEvent(user1Doc._id, 'MATCH_COMPLETED', {
          isWin: Boolean(outcome?.p1?.status?.includes('Winner')),
          isSolo: isSoloMatch,
          opponentRating: p2Data?.rating || 1000,
          matchDurationSeconds: matchDurationMinutes * 60,
          timeRemainingSeconds: remainingTimeSeconds,
          isCustom: Boolean(room.isCustom),
          myScore: p1Data.score,
          opponentSubmissions: room.firstRoundFirstSolverUsername === p1Data.username && ((room.firstRoundOpponentSubmissionCounts?.[p1Data.username] || 0) === 0) ? 0 : 1,
          allSolvedCorrectly: p1Data.score === 10 * (room.totalRounds || 0)
        }).then(res => {
          if (res && res.newlyUnlocked?.length > 0) {
            io.to(roomId).emit('badges_unlocked', { userId: user1Doc._id, badges: res.newlyUnlocked });
          }
        }).catch(e => console.error('[ACHIEVEMENT] P1 eval error:', e.message));
      }
      if (user2Doc?._id && p2Data && outcome?.p2) {
        processAchievementEvent(user2Doc._id, 'MATCH_COMPLETED', {
          isWin: Boolean(outcome?.p2?.status?.includes('Winner')),
          isSolo: isSoloMatch,
          opponentRating: p1Data?.rating || 1000,
          matchDurationSeconds: matchDurationMinutes * 60,
          timeRemainingSeconds: remainingTimeSeconds,
          isCustom: Boolean(room.isCustom),
          myScore: p2Data.score,
          opponentSubmissions: room.firstRoundFirstSolverUsername === p2Data.username && ((room.firstRoundOpponentSubmissionCounts?.[p2Data.username] || 0) === 0) ? 0 : 1,
          allSolvedCorrectly: p2Data.score === 10 * (room.totalRounds || 0)
        }).then(res => {
          if (res && res.newlyUnlocked?.length > 0) {
            io.to(roomId).emit('badges_unlocked', { userId: user2Doc._id, badges: res.newlyUnlocked });
          }
        }).catch(e => console.error('[ACHIEVEMENT] P2 eval error:', e.message));
      }
    } catch (badgeErr) {
      console.error('[ACHIEVEMENT] Non-critical error:', badgeErr.message);
    }

  } catch (err) {
    console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
    // Continue to notify clients even if DB fails
  }

  // ✅ Emit game over event to all players in room
  const payload = {
    scores: room.scores || {},
    winner: winnerName || 'Draw',
    winnerName: winnerName || 'Draw',
    winnerId,
    pointsEarned: winnerName ? (playerResults?.[winnerName]?.seasonPoints ?? 0) : 0,
    newElo: winnerName ? (playerResults?.[winnerName]?.newElo ?? null) : null,
    isDisqualified: room.cheaters.size > 0,
    disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
    eloChanges: eloChanges || {},
    playerResults,
    reason: matchReason,
    message: matchReason === 'forfeit'
      ? (winnerName ? `${winnerName} wins by forfeit.` : 'Match ended by forfeit.')
      : matchReason === 'timeout'
        ? 'Time ran out. Final standings locked in.'
        : '',
  };
  room.resolutionResult = payload;
  room.status = 'finished';
  io.to(roomId).emit('game_over', payload);
  io.to(roomId).emit('match_ended', payload);
  if (room.isCustom) {
    await persistCustomRoomPlayers(roomId, room.players, {
      status: 'finished',
      winner: winnerName || 'Draw',
    });
  }

  // ✅ Delayed cleanup (1 minute delay for reconnections)
  setTimeout(() => {
    rooms.delete(roomId);
    console.log(`[CLEANUP] 🗑️ Room ${roomId} deleted from memory`);
  }, 60000);
  room.isResolving = false;
  return payload;
};

const resolveMatch = async (roomId, winnerUsername = null, reason = 'submission', roomOverride = null) => {
  const room = roomOverride || rooms.get(roomId);
  if (!room) return null;

  room.matchEndReason = reason;
  room.forcedWinnerUsername = winnerUsername || null;

  return handleGameEnd(roomId, room);
};

// ✅ TIMER HANDLER (already optimal)
const startRoomTimer = (roomId, duration) => {
  if (roomTimers.has(roomId)) {
    clearInterval(roomTimers.get(roomId));
  }

  let timeLeft = duration;

  const timerId = setInterval(() => {
    timeLeft--;

    // Sync time every 60s or when below 10s
    if (timeLeft % 60 === 0 || timeLeft <= 10) {
      io.to(roomId).emit('sync_time', timeLeft);
    }

    if (timeLeft <= 0) {
      clearInterval(timerId);
      roomTimers.delete(roomId);
      const room = rooms.get(roomId);
      if (room) resolveMatch(roomId, null, 'timeout', room);
    }
  }, 1000);

  roomTimers.set(roomId, timerId);
};

// ✅ RATE LIMITING for socket events
const socketRateLimits = new Map();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_EVENTS_PER_WINDOW = 10;

function checkRateLimit(socketId, eventName) {
  const key = `${socketId}:${eventName}`;
  const now = Date.now();

  if (!socketRateLimits.has(key)) {
    socketRateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = socketRateLimits.get(key);

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }

  if (limit.count >= MAX_EVENTS_PER_WINDOW) {
    console.warn(`[RATE LIMIT] ⚠️ ${socketId} exceeded limit for ${eventName}`);
    return false;
  }

  limit.count++;
  return true;
}

// ✅ SOCKET EVENT HANDLERS
io.on('connection', async (socket) => {
  console.log(`[SOCKET] ✅ Connected: ${socket.id}`);

  // Send initial stats
  try {
    registerConnectedSocket(socket);
    await emitSiteStats();
  } catch (err) {
    console.error('[SOCKET] Stats error:', err);
  }

  // ✅ JOIN ROOM EVENT
  socket.on('join_room', async (data) => {
    try {
      const authUser = socket.data.user;
      const roomId = typeof data?.roomId === 'string' ? data.roomId.trim() : '';
      const joinToken = typeof data?.joinToken === 'string' ? data.joinToken.trim() : '';
      const username = authUser?.username;

      // Validation
      if (!roomId || !username) {
        socket.emit('error', { message: 'Authentication and room ID are required' });
        return;
      }

      // Rate limiting
      // Check if this room has already finished (either in-memory or persisted Match)
      let isMatchFinished = false;
      let finishedMatchPayload = null;

      if (rooms.has(roomId) && (rooms.get(roomId).status === 'finished' || rooms.get(roomId).resolutionResult)) {
        isMatchFinished = true;
        finishedMatchPayload = rooms.get(roomId).resolutionResult;
      } else {
        const finishedMatch = await Match.findOne({ roomId }).lean();
        if (finishedMatch) {
          isMatchFinished = true;
          const pResults = {};
          if (finishedMatch.players) {
            for (const p of finishedMatch.players) {
              pResults[p.username] = {
                username: p.username,
                score: p.score || 0,
                seasonPoints: p.seasonPoints || 0,
                newElo: p.newElo || 1000,
                eloChange: p.eloChange || 0,
                isWinner: p.username === finishedMatch.winner
              };
            }
          }
          finishedMatchPayload = {
            scores: finishedMatch.players?.reduce((acc, p) => { acc[p.username] = p.score || 0; return acc; }, {}) || {},
            winner: finishedMatch.winner || 'Draw',
            winnerName: finishedMatch.winner || 'Draw',
            winnerId: null,
            isDisqualified: finishedMatch.status === 'abandoned' || finishedMatch.status === 'cancelled',
            eloChanges: finishedMatch.players?.reduce((acc, p) => {
              acc[p.username] = { username: p.username, newRating: p.newElo, eloChange: p.eloChange, seasonPoints: p.seasonPoints };
              return acc;
            }, {}) || {},
            playerResults: pResults,
            reason: finishedMatch.reason || 'submission',
            message: 'Match ended.'
          };
        }
      }

      if (isMatchFinished) {
        socket.join(roomId);
        socket.emit('room_joined', {
          roomId,
          players: finishedMatchPayload?.playerResults ? Object.keys(finishedMatchPayload.playerResults).map(username => ({ username, side: 'left' })) : [],
          problem: null,
          round: 1,
          totalRounds: 1,
          scores: finishedMatchPayload?.scores || {},
          remainingTime: 0,
          gameOverData: finishedMatchPayload,
          isFinished: true
        });
        return;
      }

      if (!checkRateLimit(socket.id, 'join_room')) {
        socket.emit('error', { message: 'Too many join attempts. Please wait.' });
        return;
      }

      // ✅ DAILY MATCH AND AI USAGE
      let persistentCustomRoom = null;
      if (!rooms.has(roomId) && roomId.startsWith('C-')) {
        persistentCustomRoom = await Room.findOne({ roomId, isCustom: true })
          .select('roomId status players customSettings quotaChargedAt problems activatedAt currentRound winner aiHelpsUsed')
          .lean();
      }
      const isActuallyCustom = roomId.startsWith('C-') || (rooms.has(roomId) && rooms.get(roomId).isCustom) || Boolean(persistentCustomRoom);
      const userDoc = await User.findById(authUser._id);
      let shouldChargeUsage = false;

      if (userDoc) {
        if (typeof userDoc.checkAndResetDailyStats === 'function') {
          await userDoc.checkAndResetDailyStats();
        } else {
          // Defensive bulletproof fallback in case instance method is not loaded on this document
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (!userDoc.usageStats) {
            userDoc.usageStats = {
              chatQueriesToday: 0,
              matchesToday: 0,
              customMatchesToday: 0,
              visualizationsToday: 0,
              visualizerTrialUsed: false,
              aiHelpToday: 0,
              lastResetDate: today
            };
          }
          const lastReset = userDoc.usageStats.lastResetDate ? new Date(userDoc.usageStats.lastResetDate) : today;
          const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
          if (today.getTime() > lastResetDay.getTime()) {
            userDoc.usageStats.chatQueriesToday = 0;
            userDoc.usageStats.matchesToday = 0;
            userDoc.usageStats.customMatchesToday = 0;
            userDoc.usageStats.visualizationsToday = 0;
            userDoc.usageStats.aiHelpToday = 0;
            userDoc.usageStats.lastResetDate = today;
            await User.updateOne({ _id: userDoc._id }, { $set: { usageStats: userDoc.usageStats } });
          }
        }
        const plan = userDoc.subscriptionPlan || 'free';
        const userTier = AI_TIER_MAP[plan] || 0;
        const limits = getUsageLimits(userDoc);

        // We check for re-join to avoid double-charging
        let playerAlreadyIn = false;
        if (rooms.has(roomId)) {
          playerAlreadyIn = rooms.get(roomId).players.some(p => p.username === username);
        } else if (persistentCustomRoom) {
          playerAlreadyIn = (persistentCustomRoom.players || []).some((player) =>
            String(player.userId) === String(authUser._id) ||
            String(player.username || '').toLowerCase() === String(username || '').toLowerCase()
          );
        }

        if (!playerAlreadyIn) {
          const customUsage = userDoc.usageStats.customMatchesToday || 0;
          const totalUsage = (userDoc.usageStats.matchesToday || 0) + customUsage;

          if (limits.matches !== Infinity && totalUsage >= limits.matches) {
            socket.emit('error', { message: `Daily total match limit reached (${limits.matches}/day). Upgrade for more!`, code: 'LIMIT_REACHED' });
            return;
          }

          if (isActuallyCustom) {
            if (plan === 'free') {
              socket.emit('error', { message: 'Custom matches require Plus tier or higher. Upgrade to unlock!', code: 'PREMIUM_REQUIRED' });
              return;
            }
            const limit = limits.customMatches;
            if (limit !== Infinity && customUsage >= limit) {
              socket.emit('error', { message: 'Daily custom match limit reached.', code: 'LIMIT_REACHED' });
              return;
            }
          }
          shouldChargeUsage = true;
        }
      }

      if (!rooms.has(roomId)) {
        if (persistentCustomRoom) {
          if (!joinToken) {
            socket.emit('error', { message: 'Custom room authorization is required.' });
            return;
          }

          const tokenPayload = verifyCustomRoomJoinToken(joinToken);
          if (tokenPayload.roomId !== roomId || tokenPayload.userId !== String(authUser._id)) {
            socket.emit('error', { message: 'Invalid custom room authorization.' });
            return;
          }

          const reservedParticipant = (persistentCustomRoom.players || []).find(
            (player) => String(player.userId) === String(authUser._id)
          );
          if (!reservedParticipant) {
            socket.emit('error', { message: 'You are not authorized for this custom room.' });
            return;
          }

          // Hydrate the in-memory room map with existing database fields (to support re-connection / page refreshes)
          const hydratedPlayers = (persistentCustomRoom.players || []).map(p => ({
            id: p.socketId || '',
            username: p.username,
            side: p.side,
            avatar: '',
            userId: p.userId,
            customization: {}
          }));

          const hydratedScores = (persistentCustomRoom.players || []).reduce((acc, p) => {
            acc[p.username] = p.currentScore || 0;
            return acc;
          }, {});

          const problemIdsMapped = (persistentCustomRoom.problems || []).map(id => id.toString());

          rooms.set(roomId, {
            players: hydratedPlayers,
            round: persistentCustomRoom.currentRound || 1,
            totalRounds: problemIdsMapped.length || persistentCustomRoom.customSettings?.numQuestions || 3,
            problemIds: problemIdsMapped,
            scores: hydratedScores,
            roundCompletions: new Set(),
            isGameActive: persistentCustomRoom.status === 'active',
            startTime: persistentCustomRoom.activatedAt ? new Date(persistentCustomRoom.activatedAt).getTime() : null,
            roundStartAt: persistentCustomRoom.activatedAt ? new Date(persistentCustomRoom.activatedAt).getTime() : null,
            cheaters: new Set(),
            submissionAttempts: new Set(),
            submissionCountByUser: {},
            fastestSolveMsByUser: {},
            firstRoundFirstSolverUsername: null,
            firstRoundOpponentSubmissionCounts: {},
            isCustom: true,
            durationSeconds: persistentCustomRoom.customSettings?.timeLimit || (30 * 60),
            customSettings: persistentCustomRoom.customSettings || {},
            roomDocId: String(persistentCustomRoom._id),
            quotaCharged: Boolean(persistentCustomRoom.quotaChargedAt),
            aiHelpsUsed: persistentCustomRoom.aiHelpsUsed || {},
          });
        } else {
          const problemIds = await loadBattleProblemIdsForRoom();
          if (problemIds.length === 0) {
            socket.emit('error', {
              message: 'No Battle Arena problems available. Please add one via the Admin Panel.'
            });
            return;
          }

          rooms.set(roomId, {
            players: [],
            round: 1,
            totalRounds: problemIds.length,
            problemIds,
            scores: {},
            roundCompletions: new Set(),
            isGameActive: true,
            startTime: Date.now(),
            roundStartAt: Date.now(),
            cheaters: new Set(),
            submissionAttempts: new Set(),
            submissionCountByUser: {},
            fastestSolveMsByUser: {},
            firstRoundFirstSolverUsername: null,
            firstRoundOpponentSubmissionCounts: {},
            isCustom: false,
            durationSeconds: 30 * 60,
            aiHelpsUsed: {}
          });

          startRoomTimer(roomId, 30 * 60);
        }
        console.log(`[ROOM] ✨ Created: ${roomId}`);
      }

      const room = rooms.get(roomId);

      if (persistentCustomRoom?.aiHelpsUsed) {
        room.aiHelpsUsed = persistentCustomRoom.aiHelpsUsed;
      } else {
        try {
          const dbRoom = await Room.findOne({ roomId }).select('aiHelpsUsed').lean();
          if (dbRoom && dbRoom.aiHelpsUsed) {
            room.aiHelpsUsed = dbRoom.aiHelpsUsed;
          }
        } catch (err) {
          console.error('[ROOM] Failed to sync aiHelpsUsed from DB:', err.message);
        }
      }

      const remainingTime = room.startTime
        ? Math.max(0, (room.durationSeconds || (30 * 60)) - Math.floor((Date.now() - room.startTime) / 1000))
        : (room.durationSeconds || (30 * 60));

      // ✅ Fetch user customization
      let reservedSide = null;
      if (room.isCustom) {
        const sourceRoom = persistentCustomRoom || await Room.findOne({ roomId, isCustom: true })
          .select('players')
          .lean();
        reservedSide = sourceRoom?.players?.find(
          (player) => String(player.userId) === String(authUser._id)
        )?.side || null;
      }

      let playerIndex = room.players.findIndex((p) => p.username.toLowerCase() === username.toLowerCase());
      let side;
      let isReconnect = false;

      if (playerIndex !== -1) {
        // Reconnecting player
        room.players[playerIndex].id = socket.id;
        room.players[playerIndex].avatar = authUser.avatar || '';
        room.players[playerIndex].customization = authUser.customization;
        side = room.players[playerIndex].side;
        isReconnect = true;
        const graceKey = getDisconnectGraceKey(roomId, username);
        if (disconnectGraceTimers.has(graceKey)) {
          clearTimeout(disconnectGraceTimers.get(graceKey));
          disconnectGraceTimers.delete(graceKey);
        }
        io.to(roomId).emit('player_connection_state', {
          roomId,
          username,
          connected: true,
        });
        console.log(`[ROOM] 🔄 ${username} reconnected to ${roomId}`);
      } else {
        // New player
        if (room.players.length >= 2) {
          socket.emit('room_full');
          return;
        }
      }

      // ✅ SYNC AI USAGE STATS TO ROOM
      if (userDoc) {
        // Sync daily AI usage to room data for this user
        if (!room.aiHelpsUsed) room.aiHelpsUsed = {};
        room.aiHelpsUsed[authUser._id.toString()] = userDoc.usageStats.aiHelpToday || 0;
      }

      if (!isReconnect) {
        side = reservedSide || (room.players.length === 0 ? 'left' : 'right');
        room.players.push({ id: socket.id, username, side, avatar: authUser.avatar || '', customization: authUser.customization, userId: authUser._id });
        room.scores[username] = room.scores[username] || 0;
        room.submissionCountByUser[username] = room.submissionCountByUser[username] || 0;
        console.log(`[ROOM] ➕ ${username} joined ${roomId} as ${side}`);
      }

      if (!isReconnect && userDoc && shouldChargeUsage) {
        if (isActuallyCustom) {
          userDoc.usageStats.customMatchesToday += 1;
        } else {
          userDoc.usageStats.matchesToday += 1;
        }
        await userDoc.save();
      }

      socket.join(roomId);
      if (room.isCustom) {
        await persistCustomRoomPlayers(roomId, room.players, { status: room.isGameActive ? 'active' : 'waiting' });
      }

      if (room.isCustom && !room.isGameActive && room.players.length < 2) {
        socket.emit('room_joined', {
          roomId, side, username,
          players: room.players,
          problem: null,
          round: room.round,
          totalRounds: room.totalRounds,
          scores: room.scores,
          remainingTime,
          waitingForOpponent: true,
          customSettings: room.customSettings
        });
        return;
      }

      if (room.isCustom && !room.isGameActive && room.players.length === 2) {
        const problemIds = await loadBattleProblemIdsForRoom({
          count: room.customSettings?.numQuestions || 3,
          topics: room.customSettings?.topics || []
        });

        if (problemIds.length === 0) {
          socket.emit('error', { message: 'No custom battle problems are available right now.' });
          return;
        }

        room.problemIds = problemIds;
        room.totalRounds = problemIds.length;
        room.round = 1;
        room.isGameActive = true;
        room.startTime = Date.now();
        room.roundStartAt = Date.now();
        room.quotaCharged = room.quotaCharged || await activateCustomRoomInDb(roomId, room);
        startRoomTimer(roomId, room.durationSeconds || (30 * 60));
      }

      const currentProblemId = room.problemIds[room.round - 1];
      let problem = currentProblemId
        ? await getCachedPublicProblem(currentProblemId)
        : null;

      if (!problem && !room.isCustom) {
        const fallbackProblemIds = await loadBattleProblemIdsForRoom({ count: room.totalRounds || 2 });

        if (fallbackProblemIds.length === 0) {
          socket.emit('error', {
            message: 'No Battle Arena problems available. Please add one via the Admin Panel.'
          });
          return;
        }

        room.problemIds = fallbackProblemIds;
        room.totalRounds = fallbackProblemIds.length;
        problem = await getCachedPublicProblem(room.problemIds[room.round - 1]);
      }

      if (room.isGameActive && !problem) {
        socket.emit('error', { message: 'Failed to load a valid Battle Arena problem.' });
        return;
      }

      room.currentProblem = problem || null;

      socket.emit('room_joined', {
        roomId, side, username,
        players: room.players,
        problem,
        round: room.round,
        totalRounds: room.totalRounds,
        scores: room.scores,
        remainingTime: room.startTime
          ? Math.max(0, (room.durationSeconds || (30 * 60)) - Math.floor((Date.now() - room.startTime) / 1000))
          : (room.durationSeconds || (30 * 60)),
        customSettings: room.isCustom ? room.customSettings : undefined,
        aiHelpsUsed: room.aiHelpsUsed || {},
        dailyAIHelpLimit: AI_DAILY_LIMITS[userDoc?.subscriptionPlan || 'free'] || 1
      });

      if (!isReconnect) {
        socket.to(roomId).emit('player_joined', {
          username, side,
          players: room.players,
          scores: room.scores
        });

        if (room.isGameActive && room.players.length === 2) {
          socket.to(roomId).emit('new_round', {
            problem,
            round: room.round,
            totalRounds: room.totalRounds,
            scores: room.scores,
            remainingTime: room.durationSeconds || (30 * 60)
          });
        }
      }

    } catch (err) {
      console.error('[SOCKET] Join Error:', err);
      socket.emit('error', { message: err.message || 'Failed to join room' });
    }
  });

  // NOTE: code_submitted handler is consolidated below (single handler) to avoid duplicate event processing

  // ✅ LEVEL COMPLETED EVENT
  socket.on('level_completed', async ({ roomId, username, code, language }) => {
    try {
      const resolvedUsername = socket.data.user?.username || username;
      console.log(`[GAME] Socket level_completed received: roomId=${roomId}, username=${username}, resolvedUsername=${resolvedUsername}`);
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) {
        console.warn(`[GAME] Level completion ignored: room is missing or inactive for ID ${roomId}`);
        return;
      }

      // Rate limiting
      if (!checkRateLimit(socket.id, 'level_completed')) {
        console.warn(`[GAME] Rate limit triggered for level_completed: socket=${socket.id}`);
        return;
      }

      // Save player code and language inside the room players
      const playerObj = room.players?.find(p => p.username.toLowerCase() === resolvedUsername.toLowerCase());
      if (!playerObj) {
        console.warn(`[GAME] Casing match lookup failed: resolvedUsername "${resolvedUsername}" not found in players of room ${roomId}`);
        return;
      }

      // Use the canonical casing from the room players list to prevent dynamic key conflicts
      const normalizedUsername = playerObj.username;
      console.log(`[GAME] Username casing normalized: "${resolvedUsername}" -> "${normalizedUsername}"`);

      if (room.roundCompletions.has(normalizedUsername)) {
        console.log(`[GAME] Player "${normalizedUsername}" already marked completed for round ${room.round}`);
        return;
      }

      const capturedSubmission = capturePlayerSubmission({
        room,
        playerObj,
        code,
        language,
        markSubmitted: true,
      });
      console.log(`[GAME] Captured solution code for player "${normalizedUsername}" on round ${capturedSubmission?.roundKey || room.round} (${capturedSubmission?.codeLength || 0} chars)`);

      const solveTimeMs = room.roundStartAt ? Math.max(0, Date.now() - room.roundStartAt) : null;
      room.submissionAttempts.add(normalizedUsername);
      room.scores[normalizedUsername] = (room.scores[normalizedUsername] || 0) + 10;
      room.roundCompletions.add(normalizedUsername);
      if (solveTimeMs !== null) {
        const currentFastest = room.fastestSolveMsByUser?.[normalizedUsername];
        if (!currentFastest || solveTimeMs < currentFastest) {
          room.fastestSolveMsByUser[normalizedUsername] = solveTimeMs;
        }
      }
      if (room.round === 1 && !room.firstRoundFirstSolverUsername) {
        room.firstRoundFirstSolverUsername = normalizedUsername;
        const opponentName = room.players.find((player) => player.username.toLowerCase() !== normalizedUsername.toLowerCase())?.username;
        room.firstRoundOpponentSubmissionCounts[normalizedUsername] = opponentName
          ? (room.submissionCountByUser?.[opponentName] || 0)
          : 0;
      }

      io.to(roomId).emit('score_update', room.scores);
      console.log(`[GAME] 🎯 ${username} completed round ${room.round} in ${roomId}`);

      // Evaluate PROBLEM_SOLVED achievement
      try {
        const currentProblemId = room.problemIds[room.round - 1];
        const solvedProblem = room.currentProblem || await getCachedPublicProblem(currentProblemId);
        if (solvedProblem && socket.data.user?._id) {
          processAchievementEvent(socket.data.user._id, 'PROBLEM_SOLVED', {
            solveTimeSeconds: (solveTimeMs || 0) / 1000,
            tags: solvedProblem.topics || [],
            problemId: currentProblemId
          }).then(res => {
            if (res && res.newlyUnlocked?.length > 0) {
              io.to(roomId).emit('badges_unlocked', { userId: socket.data.user._id, badges: res.newlyUnlocked });
            }
          }).catch(e => console.error('[ACHIEVEMENT] PROBLEM_SOLVED eval error:', e.message));
        }
      } catch (badgeErr) {
        console.error('[ACHIEVEMENT] Non-critical error fetching problem for badges:', badgeErr.message);
      }

      // First player to complete
      if (room.roundCompletions.size === 1) {
        if (room.round < room.totalRounds) {
          // Advance to next round
          room.round++;
          room.roundCompletions.clear();
          room.roundStartAt = Date.now();

          const nextProblemId = room.problemIds[room.round - 1];
          let nextProblem = await getCachedPublicProblem(nextProblemId);

          if (!nextProblem) {
            const fallbackProblemIds = await loadBattleProblemIdsForRoom({
              count: room.totalRounds || 2,
              topics: room.customSettings?.topics || []
            });
            if (fallbackProblemIds.length === 0) {
              io.to(roomId).emit('error', {
                message: 'No Battle Arena problems available. Please add one via the Admin Panel.'
              });
              return;
            }

            room.problemIds = fallbackProblemIds;
            nextProblem = await getCachedPublicProblem(room.problemIds[room.round - 1]);
          }

          if (!nextProblem) {
            io.to(roomId).emit('error', { message: 'Failed to load the next Battle Arena problem.' });
            return;
          }
          room.currentProblem = nextProblem;

          io.to(roomId).emit('new_round', {
            round: room.round,
            problem: nextProblem,
            scores: room.scores,
            totalRounds: room.totalRounds,
            remainingTime: room.startTime
              ? Math.max(0, (room.durationSeconds || (30 * 60)) - Math.floor((Date.now() - room.startTime) / 1000))
              : (room.durationSeconds || (30 * 60)),
          });

          console.log(`[GAME] ⏭️ Room ${roomId} → Round ${room.round}`);
        } else {
          // Game complete
          await handleGameEnd(roomId, room);
        }
      }
    } catch (err) {
      console.error("[SOCKET] Level Complete Error:", err);
    }
  });

  // ✅ CHEATING DETECTED EVENT
  socket.on('cheating_detected', async ({ roomId, username, reason }) => {
    try {
      const resolvedUsername = socket.data.user?.username || username;
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;

      const playerObj = room.players?.find(p => p.username.toLowerCase() === resolvedUsername.toLowerCase());
      const normalizedUsername = playerObj ? playerObj.username : resolvedUsername;

      room.cheaters.add(normalizedUsername);
      socket.emit('cheat_warning', { reason });

      console.log(`[ANTI-CHEAT] 🚨 ${username} in ${roomId}: ${reason}`);
    } catch (err) {
      console.error("[SOCKET] Cheating Error:", err);
    }
  });

  // ✅ CODE SUBMITTED EVENT (single consolidated handler)
  socket.on('code_submitted', ({ roomId, username, code, language }) => {
    try {
      const resolvedUsername = socket.data.user?.username || username;
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;

      const playerObj = room.players?.find(p => p.username.toLowerCase() === resolvedUsername.toLowerCase());
      const normalizedUsername = playerObj ? playerObj.username : resolvedUsername;

      const capturedSubmission = capturePlayerSubmission({
        room,
        playerObj,
        code,
        language,
        markSubmitted: true,
      });

      room.submissionAttempts.add(normalizedUsername);
      room.submissionCountByUser[normalizedUsername] = (room.submissionCountByUser[normalizedUsername] || 0) + 1;
      console.log(`[GAME] 📝 ${normalizedUsername} submitted code in ${roomId} (round ${room.round}, ${code ? code.length + ' chars' : 'no code'})`);
    } catch (err) {
      console.error("[SOCKET] Code submission error:", err);
    }
  });

  // ✅ DISCONNECT EVENT
  socket.on('disconnect', async (reason) => {
    try {
      // Find the room this socket belongs to
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          console.log(`[DISCONNECT] Player ${player.username} left room ${roomId} (socket: ${socket.id})`);

          if (room.isGameActive && !room.resolutionResult && !room.isResolving) {
            const graceKey = getDisconnectGraceKey(roomId, player.username);
            io.to(roomId).emit('player_connection_state', {
              roomId,
              username: player.username,
              connected: false,
            });

            if (disconnectGraceTimers.has(graceKey)) {
              clearTimeout(disconnectGraceTimers.get(graceKey));
            }

            disconnectGraceTimers.set(graceKey, setTimeout(async () => {
              disconnectGraceTimers.delete(graceKey);
              const latestRoom = rooms.get(roomId);
              if (!latestRoom || latestRoom.resolutionResult || latestRoom.isResolving || !latestRoom.isGameActive) {
                return;
              }

              const disconnectedPlayer = latestRoom.players.find((entry) => entry.username === player.username);
              if (disconnectedPlayer?.id && disconnectedPlayer.id !== socket.id) {
                return;
              }

              const opponent = latestRoom.players.find((entry) => entry.username !== player.username);
              const winnerUsername = opponent ? opponent.username : null;
              console.log(`[DISCONNECT] Active game in room ${roomId}. Winner by default: ${winnerUsername || 'Draw'}`);
              await resolveMatch(roomId, winnerUsername, 'forfeit', latestRoom);
            }, 10000));
          }
          break;
        }
      }
    } catch (e) {
      console.error("[SOCKET] Disconnect Resolution Error:", e);
    }
    try {
      console.log(`[SOCKET] ❌ Disconnected: ${socket.id} (${reason})`);

      unregisterConnectedSocket(socket);
      await emitSiteStats();

      // Cleanup rate limits for this socket
      for (const key of socketRateLimits.keys()) {
        if (key.startsWith(socket.id)) {
          socketRateLimits.delete(key);
        }
      }
    } catch (e) {
      console.error("[SOCKET] Disconnect Error:", e);
    }
  });
});

// ✅ MONITORING & CLEANUP (every 10 minutes)
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  console.log(`[HEALTH] Rooms: ${rooms.size} | Sockets: ${io.engine.clientsCount} | Mem: ${heapUsedMB}MB/${heapTotalMB}MB`);

  // Memory warning
  if (heapUsedMB > 400) {
    console.warn(`⚠️ [MEMORY] High usage: ${heapUsedMB}MB`);
  }

  // Cleanup stale rooms (>2 hours old)
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.startTime > TWO_HOURS) {
      rooms.delete(roomId);
      if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
      }
      console.log(`[CLEANUP] 🗑️ Removed stale room: ${roomId}`);
    }
  }

  // Cleanup old rate limit entries
  for (const [key, value] of socketRateLimits.entries()) {
    if (now > value.resetTime + 60000) {
      socketRateLimits.delete(key);
    }
  }

}, 10 * 60 * 1000);

// ✅ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('[SERVER] 🛑 SIGTERM received. Shutting down gracefully...');

  server.close(() => {
    console.log('[SERVER] ✅ HTTP server closed');

    // Clear all room timers
    for (const timerId of roomTimers.values()) {
      clearInterval(timerId);
    }

    // Close all socket connections
    io.close(() => {
      console.log('[SOCKET] ✅ All connections closed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('[SERVER] ⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await waitForDatabase();
  await ensurePaymentTransactionIndexes();
  await verifySmtpConnection();

  console.log('[BOOT] Runtime configuration', {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: PORT,
    frontendOrigins: ALLOWED_ORIGINS,
    apiBaseHint: process.env.RENDER_EXTERNAL_URL || 'local-only',
    smtp: getSmtpDiagnostics(),
  });

  server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║     CodeArena 1v1 Server Started! 🚀     ║
    ╠═══════════════════════════════════════════╣
    ║   Port: ${PORT.toString().padEnd(33)} ║
    ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║
    ║   Max Concurrent Matches: 150-200         ║
    ╚═══════════════════════════════════════════╝
    `);
  });
};

startServer().catch((error) => {
  console.error('[SERVER] ❌ Failed to start:', error);
  process.exit(1);
});
// V 1.5

// Version-2.0