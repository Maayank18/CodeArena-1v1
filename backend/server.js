// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import cron from 'node-cron';
// import axios from 'axios';

// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import visualizerRoutes from './routes/visualizerRoutes.js';

// import Problem from './models/Problem.js';
// import User from './models/User.js';
// import Match from './models/Match.js';
// import { calculateMatchOutcome } from './utils/elo.js';

// dotenv.config();

// // Connect DB - Non-blocking
// connectDB().then(() => console.log('[DB] Connected Successfully')).catch(err => console.error('[DB] Connection Failed:', err));

// const app = express();

// const ALLOWED_ORIGINS = [
//   "http://localhost:5173",
//   process.env.FRONTEND_URL
// ].filter(Boolean);

// app.use(cors({
//   origin: ALLOWED_ORIGINS,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   credentials: true
// }));

// app.use(express.json());

// // Request Logger - Reduced noise (only logs API calls)
// app.use((req, res, next) => {
//   if (req.originalUrl !== '/health') {
//      console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
//   }
//   next();
// });

// // ✅ REGISTER ROUTES
// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/stats', statsRoutes);
// app.use('/api/users', userRoutes); 
// app.use('/api/matches', matchRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/visualize', visualizerRoutes);

// // ✅ HEALTH CHECK (Lightweight)
// app.get('/health', (req, res) => {
//     res.status(200).json({ 
//         status: 'OK', 
//         uptime: process.uptime(),
//         timestamp: new Date().toISOString()
//     });
// });

// // ✅ CRON JOB: Keep-Alive Strategy
// // Runs every 14 minutes (Render sleeps after 15 mins of inactivity)
// cron.schedule('*/14 * * * *', async () => {
//     try {
//         const backendURL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
//         console.log(`[CRON] Pinging self to stay awake: ${backendURL}/health`);
        
//         // Timeout set to 5s to avoid hanging connections
//         await axios.get(`${backendURL}/health`, { timeout: 5000 });
//         console.log(`[CRON] ✅ Keep-alive success`);
//     } catch (error) {
//         console.error(`[CRON] ⚠️ Keep-alive failed (Server might be sleeping):`, error.message);
//     }
// });

// app.get('/', (req, res) => res.send('OK'));

// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// app.locals.io = io;

// const rooms = new Map();
// const roomTimers = new Map();

// const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
//     if (playerData.isCheater) return -20;
//     if (opponentData.isCheater) return 50;
//     if (!hasSubmitted) return 0;
//     if (matchOutcome.status.includes("Winner")) return 50;
//     if (matchOutcome.status === "Draw") return 25;
//     if (matchOutcome.status === "Loser" && hasSubmitted) return 10;
//     return 0;
// };

// // ✅ OPTIMIZED: handleGameEnd
// const handleGameEnd = async (roomId, room) => {
//     if (!room || !room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear timer immediately to prevent duplicate calls
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     const playerNames = Object.keys(room.scores);
    
//     if (playerNames.length < 2) {
//         console.log(`[GAME END] Room ${roomId}: Cancelled (Insufficient players).`);
//         io.to(roomId).emit('game_over', { 
//             winner: null, 
//             message: "Match cancelled (Waiting for opponent)" 
//         });
//         rooms.delete(roomId);
//         return;
//     }

//     console.log(`[GAME END] Processing Room: ${roomId}`);
    
//     let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
//     let eloChanges = null;

//     try {
//         const [user1Doc, user2Doc] = await Promise.all([
//             User.findByUsername(playerNames[0]),
//             User.findByUsername(playerNames[1])
//         ]);

//         const p1Data = {
//             username: playerNames[0],
//             rating: user1Doc?.rating || 1000,
//             score: Number(room.scores[playerNames[0]]) || 0,
//             isCheater: room.cheaters.has(playerNames[0]),
//             hasSubmitted: room.submissionAttempts.has(playerNames[0])
//         };

//         const p2Data = {
//             username: playerNames[1] || "Opponent",
//             rating: user2Doc?.rating || 1000,
//             score: Number(room.scores[playerNames[1]]) || 0,
//             isCheater: room.cheaters.has(playerNames[1]),
//             hasSubmitted: room.submissionAttempts.has(playerNames[1])
//         };

//         const outcome = calculateMatchOutcome(p1Data, p2Data);
//         const p1NewRating = Number(outcome.p1.newRating) || 1000;
//         const p2NewRating = Number(outcome.p2.newRating) || 1000;

//         const p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome.p1, p1Data.hasSubmitted);
//         const p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome.p2, p2Data.hasSubmitted);

//         const updatePromises = [];

//         if (user1Doc) {
//             updatePromises.push(
//                 User.findByIdAndUpdate(user1Doc._id, { 
//                     $set: { rating: p1NewRating },
//                     $inc: { 
//                         seasonScore: p1SeasonPoints,
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
//                     }
//                 }, { new: true })
//             );
//         }

//         if (user2Doc) {
//             updatePromises.push(
//                 User.findByIdAndUpdate(user2Doc._id, { 
//                     $set: { rating: p2NewRating },
//                     $inc: { 
//                         seasonScore: p2SeasonPoints,
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
//                     }
//                 }, { new: true })
//             );
//         }

//         await Promise.all(updatePromises);

//         const officialWinner = outcome.p1.status.includes("Winner") ? p1Data.username : 
//                                (outcome.p2.status.includes("Winner") ? p2Data.username : "Draw");

//         await Match.create({
//             roomId,
//             winner: officialWinner, 
//             isDisqualified: room.cheaters.size > 0,
//             disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//             players: [
//                 { 
//                     userId: user1Doc?._id || null, 
//                     username: p1Data.username, 
//                     avatar: user1Doc?.avatar || "", 
//                     isWinner: outcome.p1.status.includes("Winner"), 
//                     score: p1Data.score, 
//                     oldElo: p1Data.rating, 
//                     newElo: p1NewRating, 
//                     statusText: outcome.p1.status,
//                     seasonPointsGained: p1SeasonPoints,
//                     hasSubmitted: p1Data.hasSubmitted
//                 },
//                 { 
//                     userId: user2Doc?._id || null, 
//                     username: p2Data.username, 
//                     avatar: user2Doc?.avatar || "", 
//                     isWinner: outcome.p2.status.includes("Winner"), 
//                     score: p2Data.score, 
//                     oldElo: p2Data.rating, 
//                     newElo: p2NewRating, 
//                     statusText: outcome.p2.status,
//                     seasonPointsGained: p2SeasonPoints,
//                     hasSubmitted: p2Data.hasSubmitted
//                 }
//             ]
//         });

//         eloChanges = {
//             p1: { username: p1Data.username, newRating: p1NewRating, eloChange: outcome.p1.pointsGained, seasonPoints: p1SeasonPoints },
//             p2: { username: p2Data.username, newRating: p2NewRating, eloChange: outcome.p2.pointsGained, seasonPoints: p2SeasonPoints }
//         };
//         winnerName = officialWinner;

//     } catch (err) {
//         console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
//     }

//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: winnerName,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: eloChanges
//     });

//     setTimeout(() => {
//         rooms.delete(roomId);
//         console.log(`[CLEANUP] Room ${roomId} deleted`);
//     }, 60000);
// };

// // ✅ TIMER LOGIC: Prevent Interval Leaks
// const startRoomTimer = (roomId, duration) => {
//     // 1. Clear existing timer if any (prevents double speed timers)
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//     }
    
//     let timeLeft = duration;
    
//     const timerId = setInterval(() => {
//         timeLeft--;
        
//         // Sync every 60s OR near end
//         if(timeLeft % 60 === 0 || timeLeft <= 10) {
//             io.to(roomId).emit('sync_time', timeLeft);
//         }
        
//         if (timeLeft <= 0) {
//             clearInterval(timerId); // Stop timer
//             roomTimers.delete(roomId); // Remove from map
//             const room = rooms.get(roomId);
//             if(room) handleGameEnd(roomId, room); 
//         }
//     }, 1000);
    
//     roomTimers.set(roomId, timerId);
// };

// io.on('connection', async (socket) => {
//   // console.log(`User Connected: ${socket.id}`); // Reduce log noise

//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };
//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) { console.error(err); }

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return;

//       if (!rooms.has(roomId)) {
//         // Optimized: Only fetch ID for setup
//         const problemDocs = await Problem.aggregate([{ $sample: { size: 2 } }]);
//         const problemIds = problemDocs.map(p => p._id.toString());
        
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problemIds, 
//             scores: {}, 
//             roundCompletions: new Set(), 
//             isGameActive: true, 
//             startTime: Date.now(), 
//             cheaters: new Set(), 
//             submissionAttempts: new Set()
//         });
//         startRoomTimer(roomId, 30 * 60);
//       }

//       const room = rooms.get(roomId);
//       const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; 
//       let isReconnect = false;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) { 
//             socket.emit('room_full'); 
//             return; 
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//       }

//       socket.join(roomId);

//       // Fetch full problem details ONLY when user joins/reconnects
//       const currentProblemId = room.problemIds[room.round - 1];
//       const problem = await Problem.findById(currentProblemId);

//       socket.emit('room_joined', {
//         roomId, side, username, players: room.players, 
//         problem, round: room.round, totalRounds: room.totalRounds, 
//         scores: room.scores, remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { 
//             username, side, players: room.players, scores: room.scores 
//         });
//       }
//     } catch (err) { 
//         console.error('Join Error:', err); 
//     }
//   });

//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;
//           if(room.roundCompletions.has(username)) return;

//           room.submissionAttempts.add(username);
//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username);
//           io.to(roomId).emit('score_update', room.scores);

//           if (room.roundCompletions.size === 1) { 
//               if (room.round < room.totalRounds) {
//                   room.round++;
//                   room.roundCompletions.clear();
                  
//                   const nextProblemId = room.problemIds[room.round - 1];
//                   const nextProblem = await Problem.findById(nextProblemId);
                  
//                   io.to(roomId).emit('new_round', {
//                       round: room.round, problem: nextProblem, scores: room.scores,
//                   });
//               } else {
//                   await handleGameEnd(roomId, room);
//               }
//           }
//       } catch (err) { 
//           console.error("Level Complete Error:", err); 
//       }
//   });

//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;
//       room.cheaters.add(username);
//       socket.emit('cheat_warning', { reason });
//     } catch (err) { console.error("Cheating Error:", err); }
//   });

//   socket.on('disconnect', async () => {
//     // Only update stats if counts actually change significantly (optional, kept simple here)
//     try {
//       const statsData = { live: io.engine.clientsCount }; // Avoid DB call on every disconnect
//       io.emit('site_stats', statsData);
//     } catch (e) { console.error("Disconnect Error:", e); }
//   });

//   socket.on('code_submitted', ({ roomId, username }) => {
//     try {
//         const room = rooms.get(roomId);
//         if (!room || !room.isGameActive) return;
//         room.submissionAttempts.add(username);
//       } catch (err) { console.error("Code submission tracking error:", err); }
//   });
// });

// // ✅ MONITORING (Reduced frequency to 10 mins to save logs)
// setInterval(() => {
//     const memUsage = process.memoryUsage();
//     console.log(`[HEALTH] Rooms: ${rooms.size} | Sockets: ${io.engine.clientsCount} | Mem: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
// }, 10 * 60 * 1000);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));



































































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
import { evaluateBadges } from './services/badgeEngine.js';
import { verifyCustomRoomJoinToken } from './utils/customRoomAuth.js';

dotenv.config();

const isDatabaseReady = () => mongoose.connection.readyState === 1;
const toPublicProblem = (problem) => {
  if (!problem) return problem;

  return {
    ...problem,
    boilerplates: problem.boilerplates || problem.starterCode || {},
    testCases: Array.isArray(problem.testCases)
      ? problem.testCases.filter((testCase) => testCase?.isPublic)
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
     console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
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
cron.schedule('*/14 * * * *', async () => {
    try {
        const backendURL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
        console.log(`[CRON] 🏓 Pinging self: ${backendURL}/health`);
        
        await axios.get(`${backendURL}/health`, { 
            timeout: 5000,
            headers: { 'User-Agent': 'KeepAlive-Cron' }
        });
        console.log(`[CRON] ✅ Keep-alive success`);
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

// ✅ PROBLEM CACHE (5 min TTL)
const problemCache = new Map();
const PROBLEM_CACHE_TTL = 5 * 60 * 1000;

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
const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
    if (playerData.isCheater) return -20;
    if (opponentData.isCheater) return 50;
    if (!hasSubmitted) return 0;
    if (matchOutcome.status.includes("Winner")) return 50;
    if (matchOutcome.status === "Draw") return 25;
    if (matchOutcome.status === "Loser" && hasSubmitted) return 10;
    return 0;
};

// ✅ GAME END HANDLER (Optimized with cache invalidation)
const handleGameEnd = async (roomId, room) => {
    if (!room || !room.isGameActive) return;
    room.isGameActive = false;

    // Clear timer immediately
    if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
    }
    
    const playerNames = Object.keys(room.scores);
    
    // Check for sufficient players
    if (playerNames.length < 2) {
        console.log(`[GAME END] Room ${roomId}: ❌ Cancelled (Insufficient players)`);
        io.to(roomId).emit('game_over', { 
            winner: null, 
            message: "Match cancelled (Waiting for opponent)" 
        });
        rooms.delete(roomId);
        return;
    }

    console.log(`[GAME END] 🏁 Processing Room: ${roomId}`);
    
    let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
    let winnerId = null;
    let eloChanges = null;
    let playerResults = {};

    try {
        // ✅ Parallel user fetches (optimized)
        const [user1Doc, user2Doc] = await Promise.all([
            User.findByUsername(playerNames[0]).select('_id username rating avatar').lean(),
            User.findByUsername(playerNames[1]).select('_id username rating avatar').lean()
        ]);

        const p1Data = {
            username: playerNames[0],
            rating: user1Doc?.rating || 1000,
            score: Number(room.scores[playerNames[0]]) || 0,
            isCheater: room.cheaters.has(playerNames[0]),
            hasSubmitted: room.submissionAttempts.has(playerNames[0])
        };

        const p2Data = {
            username: playerNames[1] || "Opponent",
            rating: user2Doc?.rating || 1000,
            score: Number(room.scores[playerNames[1]]) || 0,
            isCheater: room.cheaters.has(playerNames[1]),
            hasSubmitted: room.submissionAttempts.has(playerNames[1])
        };

        // Calculate ELO changes
        const outcome = calculateMatchOutcome(p1Data, p2Data);
        const p1NewRating = Number(outcome.p1.newRating) || 1000;
        const p2NewRating = Number(outcome.p2.newRating) || 1000;

        const p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome.p1, p1Data.hasSubmitted);
        const p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome.p2, p2Data.hasSubmitted);

        // ✅ Batch all database operations
        const dbOperations = [];

        // Update player 1
        if (user1Doc) {
            dbOperations.push(
                User.findByIdAndUpdate(user1Doc._id, { 
                    $set: { rating: p1NewRating },
                    $inc: { 
                        seasonScore: p1SeasonPoints,
                        "stats.matchesPlayed": 1,
                        "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
                        "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
                    }
                }, { new: false })
            );
        }

        // Update player 2
        if (user2Doc) {
            dbOperations.push(
                User.findByIdAndUpdate(user2Doc._id, { 
                    $set: { rating: p2NewRating },
                    $inc: { 
                        seasonScore: p2SeasonPoints,
                        "stats.matchesPlayed": 1,
                        "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
                        "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
                    }
                }, { new: false })
            );
        }

        const officialWinner = outcome.p1.status.includes("Winner") ? p1Data.username : 
                               (outcome.p2.status.includes("Winner") ? p2Data.username : "Draw");

        // Create match record
        dbOperations.push(
            Match.create({
                roomId,
                winner: officialWinner, 
                isDisqualified: room.cheaters.size > 0,
                disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
                problemIds: room.problemIds || [],
                isCustom: Boolean(room.isCustom),
                matchDurationSeconds: Math.max(0, Math.floor((Date.now() - (room.startTime || Date.now())) / 1000)),
                timeLimitSeconds: room.durationSeconds || (30 * 60),
                totalRoundsConfigured: room.totalRounds || 0,
                fastestSolveMsByUser: room.fastestSolveMsByUser || {},
                firstRoundFirstSolverUsername: room.firstRoundFirstSolverUsername || null,
                firstRoundOpponentSubmissionCounts: room.firstRoundOpponentSubmissionCounts || {},
                players: [
                    { 
                        userId: user1Doc?._id || null, 
                        username: p1Data.username, 
                        avatar: user1Doc?.avatar || "", 
                        isWinner: outcome.p1.status.includes("Winner"), 
                        score: p1Data.score, 
                        oldElo: p1Data.rating, 
                        newElo: p1NewRating, 
                        statusText: outcome.p1.status,
                        seasonPointsGained: p1SeasonPoints,
                        hasSubmitted: p1Data.hasSubmitted
                    },
                    { 
                        userId: user2Doc?._id || null, 
                        username: p2Data.username, 
                        avatar: user2Doc?.avatar || "", 
                        isWinner: outcome.p2.status.includes("Winner"), 
                        score: p2Data.score, 
                        oldElo: p2Data.rating, 
                        newElo: p2NewRating, 
                        statusText: outcome.p2.status,
                        seasonPointsGained: p2SeasonPoints,
                        hasSubmitted: p2Data.hasSubmitted
                    }
                ]
            })
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
            },
            p2: { 
                username: p2Data.username, 
                newRating: p2NewRating, 
                eloChange: outcome.p2.pointsGained, 
                seasonPoints: p2SeasonPoints 
            }
        };
        winnerName = officialWinner;
        winnerId = room.players.find((player) => player.username === officialWinner)?.userId || null;
        playerResults = {
            [p1Data.username]: {
                username: p1Data.username,
                score: p1Data.score,
                seasonPoints: p1SeasonPoints,
                newElo: p1NewRating,
                eloChange: outcome.p1.pointsGained,
                isWinner: outcome.p1.status.includes("Winner"),
            },
            [p2Data.username]: {
                username: p2Data.username,
                score: p2Data.score,
                seasonPoints: p2SeasonPoints,
                newElo: p2NewRating,
                eloChange: outcome.p2.pointsGained,
                isWinner: outcome.p2.status.includes("Winner"),
            }
        };

        console.log(`[GAME END] ✅ Room ${roomId} | Winner: ${winnerName}`);

        // ✅ Increment analytics tracking fields
        const matchDurationSeconds = Math.max(0, Math.floor((Date.now() - (room.startTime || Date.now())) / 1000));
        const matchDurationMinutes = Number((matchDurationSeconds / 60).toFixed(2));
        const remainingTimeSeconds = Math.max(
            0,
            (room.durationSeconds || (30 * 60)) - matchDurationSeconds
        );

        const analyticsOps = [];
        if (user1Doc) {
            analyticsOps.push(User.findByIdAndUpdate(user1Doc._id, {
                $inc: {
                    totalTimeSpent: matchDurationMinutes,
                    totalSolved: outcome.p1.status.includes('Winner') ? (room.totalRounds || room.round || 0) : 0
                }
            }));
        }
        if (user2Doc) {
            analyticsOps.push(User.findByIdAndUpdate(user2Doc._id, {
                $inc: {
                    totalTimeSpent: matchDurationMinutes,
                    totalSolved: outcome.p2.status.includes('Winner') ? (room.totalRounds || room.round || 0) : 0
                }
            }));
        }
        await Promise.all(analyticsOps);

        // ✅ BADGE ENGINE: Evaluate achievements asynchronously (fire-and-forget)
        try {
            const badgeContext = {
                matchDurationMinutes,
                remainingTimeSeconds,
                totalRounds: room.totalRounds,
            };

            if (user1Doc?._id) {
                evaluateBadges(user1Doc._id, {
                    ...badgeContext,
                    isWinner: outcome.p1.status.includes('Winner'),
                    score: p1Data.score,
                    opponentScore: p2Data.score,
                    userRating: p1Data.rating,
                    opponentRating: p2Data.rating,
                    roundsWon: Math.floor(p1Data.score / 10),
                    fastestSolveMs: room.fastestSolveMsByUser?.[p1Data.username],
                    instantKill: room.firstRoundFirstSolverUsername === p1Data.username &&
                        ((room.firstRoundOpponentSubmissionCounts?.[p1Data.username] || 0) === 0),
                }).catch(e => console.error('[BADGES] P1 eval error:', e.message));
            }
            if (user2Doc?._id) {
                evaluateBadges(user2Doc._id, {
                    ...badgeContext,
                    isWinner: outcome.p2.status.includes('Winner'),
                    score: p2Data.score,
                    opponentScore: p1Data.score,
                    userRating: p2Data.rating,
                    opponentRating: p1Data.rating,
                    roundsWon: Math.floor(p2Data.score / 10),
                    fastestSolveMs: room.fastestSolveMsByUser?.[p2Data.username],
                    instantKill: room.firstRoundFirstSolverUsername === p2Data.username &&
                        ((room.firstRoundOpponentSubmissionCounts?.[p2Data.username] || 0) === 0),
                }).catch(e => console.error('[BADGES] P2 eval error:', e.message));
            }
        } catch (badgeErr) {
            console.error('[BADGES] Non-critical badge error:', badgeErr.message);
        }

    } catch (err) {
        console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
        // Continue to notify clients even if DB fails
    }

    // ✅ Emit game over event to all players in room
    io.to(roomId).emit('game_over', { 
        scores: room.scores || {},
        winner: winnerName,
        winnerName,
        winnerId,
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        eloChanges: eloChanges || {},
        playerResults,
    });

    // ✅ Delayed cleanup (1 minute delay for reconnections)
    setTimeout(() => {
        rooms.delete(roomId);
        console.log(`[CLEANUP] 🗑️ Room ${roomId} deleted from memory`);
    }, 60000);
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
        if(timeLeft % 60 === 0 || timeLeft <= 10) {
            io.to(roomId).emit('sync_time', timeLeft);
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            roomTimers.delete(roomId);
            const room = rooms.get(roomId);
            if(room) handleGameEnd(roomId, room); 
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
    const totalUsers = await User.countDocuments();
    const statsData = { live: io.engine.clientsCount, total: totalUsers };
    socket.emit('site_stats', statsData);
    socket.broadcast.emit('site_stats', statsData);
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
      if (!checkRateLimit(socket.id, 'join_room')) {
        socket.emit('error', { message: 'Too many join attempts. Please wait.' });
        return;
      }

      // ✅ DAILY MATCH AND AI USAGE
      const isActuallyCustom = roomId.startsWith('C-') || (rooms.has(roomId) && rooms.get(roomId).isCustom) || (await Room.exists({ roomId, isCustom: true }));
      const userDoc = await User.findById(authUser._id);
      
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
          }

          if (!playerAlreadyIn) {
              if (isActuallyCustom) {
                  const limit = limits.customMatches;
                  if (limit !== Infinity && userDoc.usageStats.customMatchesToday >= limit) {
                      socket.emit('error', { message: 'Daily custom match limit reached.', code: 'LIMIT_REACHED' });
                      return;
                  }
                  userDoc.usageStats.customMatchesToday += 1;
              } else {
                  const limit = limits.matches;
                  if (limit !== Infinity && userDoc.usageStats.matchesToday >= limit) {
                      socket.emit('error', { message: 'Daily normal match limit reached.', code: 'LIMIT_REACHED' });
                      return;
                  }
                  userDoc.usageStats.matchesToday += 1;
              }
              await userDoc.save();
          }
      }

      let persistentCustomRoom = null;
      if (!rooms.has(roomId)) {
        persistentCustomRoom = await Room.findOne({ roomId, isCustom: true })
          .select('roomId status players customSettings quotaChargedAt problems activatedAt currentRound winner aiHelpsUsed')
          .lean();

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
      
      // Sync aiHelpsUsed from DB on every join/reconnect to stay consistent
      try {
        const dbRoom = await Room.findOne({ roomId }).select('aiHelpsUsed').lean();
        if (dbRoom && dbRoom.aiHelpsUsed) {
          room.aiHelpsUsed = dbRoom.aiHelpsUsed;
        }
      } catch (err) {
        console.error('[ROOM] Failed to sync aiHelpsUsed from DB:', err.message);
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
        ? await Problem.findById(currentProblemId)
            .select('-goldenSolution')
            .lean()
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
        problem = await Problem.findById(room.problemIds[room.round - 1])
          .select('-goldenSolution')
          .lean();
      }

      problem = toPublicProblem(problem);

      if (room.isGameActive && !problem) {
        socket.emit('error', { message: 'Failed to load a valid Battle Arena problem.' });
        return;
      }

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

  // ✅ LEVEL COMPLETED EVENT
  socket.on('level_completed', async ({ roomId, username }) => {
      try {
          const resolvedUsername = socket.data.user?.username || username;
          const room = rooms.get(roomId);
          if (!room || !room.isGameActive) return;
          if(room.roundCompletions.has(resolvedUsername)) return;

          // Rate limiting
          if (!checkRateLimit(socket.id, 'level_completed')) {
            return;
          }

          const solveTimeMs = room.roundStartAt ? Math.max(0, Date.now() - room.roundStartAt) : null;
          room.submissionAttempts.add(resolvedUsername);
          room.scores[resolvedUsername] = (room.scores[resolvedUsername] || 0) + 10;
          room.roundCompletions.add(resolvedUsername);
          if (solveTimeMs !== null) {
            const currentFastest = room.fastestSolveMsByUser?.[resolvedUsername];
            if (!currentFastest || solveTimeMs < currentFastest) {
              room.fastestSolveMsByUser[resolvedUsername] = solveTimeMs;
            }
          }
          if (room.round === 1 && !room.firstRoundFirstSolverUsername) {
            room.firstRoundFirstSolverUsername = resolvedUsername;
            const opponentName = room.players.find((player) => player.username !== resolvedUsername)?.username;
            room.firstRoundOpponentSubmissionCounts[resolvedUsername] = opponentName
              ? (room.submissionCountByUser?.[opponentName] || 0)
              : 0;
          }
          
          io.to(roomId).emit('score_update', room.scores);
          console.log(`[GAME] 🎯 ${username} completed round ${room.round} in ${roomId}`);

          // First player to complete
          if (room.roundCompletions.size === 1) { 
              if (room.round < room.totalRounds) {
                  // Advance to next round
                  room.round++;
                  room.roundCompletions.clear();
                  room.roundStartAt = Date.now();
                  
                  const nextProblemId = room.problemIds[room.round - 1];
                  let nextProblem = await Problem.findById(nextProblemId)
                    .select('-goldenSolution')
                    .lean();

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
                    nextProblem = await Problem.findById(room.problemIds[room.round - 1])
                      .select('-goldenSolution')
                      .lean();
                  }

                  nextProblem = toPublicProblem(nextProblem);

                  if (!nextProblem) {
                    io.to(roomId).emit('error', { message: 'Failed to load the next Battle Arena problem.' });
                    return;
                  }
                  
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
      
      room.cheaters.add(resolvedUsername);
      socket.emit('cheat_warning', { reason });
      
      console.log(`[ANTI-CHEAT] 🚨 ${username} in ${roomId}: ${reason}`);
    } catch (err) { 
      console.error("[SOCKET] Cheating Error:", err); 
    }
  });

  // ✅ CODE SUBMITTED EVENT
  socket.on('code_submitted', ({ roomId, username }) => {
    try {
        const resolvedUsername = socket.data.user?.username || username;
        const room = rooms.get(roomId);
        if (!room || !room.isGameActive) return;
        room.submissionAttempts.add(resolvedUsername);
        room.submissionCountByUser[resolvedUsername] = (room.submissionCountByUser[resolvedUsername] || 0) + 1;
        console.log(`[GAME] 📝 ${username} submitted code in ${roomId}`);
    } catch (err) { 
      console.error("[SOCKET] Code submission error:", err); 
    }
  });

  // ✅ DISCONNECT EVENT
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`[SOCKET] ❌ Disconnected: ${socket.id} (${reason})`);
      
      // Update stats
      const statsData = { live: io.engine.clientsCount };
      io.emit('site_stats', statsData);
      
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
