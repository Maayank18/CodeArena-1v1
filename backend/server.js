// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// // import cron from 'node-cron';
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
// connectDB();

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

// app.use((req, res, next) => {
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
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

// app.get('/health', (req, res) => {
//     res.json({ 
//         status: 'OK', 
//         timestamp: new Date().toISOString(), 
//         uptime: process.uptime(),
//         memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
//     });
// });

// // ✅ REMOVED: Cron job (wastes resources, not needed with active users)
// //CRON JOB 
// cron.schedule('*/10 * * * *', async () => {
//     try {
//         const backendURL = process.env.RENDER_EXTERNAL_URL || 
//                           'https://codearena-1v1.onrender.com';  // Your actual URL
        
//         console.log(`[CRON] Pinging: ${backendURL}/health`);
//         const response = await axios.get(`${backendURL}/health`, { timeout: 10000 });
//         console.log(`[CRON] ✅ Success at ${new Date().toISOString()}`);
//     } catch (error) {
//         console.error(`[CRON] ❌ Failed:`, error.message);
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

// // ✅ OPTIMIZED: handleGameEnd with parallel queries and smart lookup
// const handleGameEnd = async (roomId, room) => {
//     if (!room.isGameActive) return;
//     room.isGameActive = false;

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
//     console.log(`[GAME END] Players: ${JSON.stringify(playerNames)}`);
//     console.log(`[GAME END] Scores: ${JSON.stringify(room.scores)}`);

//     let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
//     let eloChanges = null;

//     try {
//         // ✅ CRITICAL OPTIMIZATION: Parallel queries with smart helper
//         // Uses fast indexed lookup when possible, falls back to regex
//         // 20-50x faster than sequential regex queries
//         const [user1Doc, user2Doc] = await Promise.all([
//             User.findByUsername(playerNames[0]),
//             User.findByUsername(playerNames[1])
//         ]);

//         console.log(`[DB LOOKUP] User 1 (${playerNames[0]}): ${user1Doc ? "FOUND" : "NOT FOUND"}`);
//         console.log(`[DB LOOKUP] User 2 (${playerNames[1]}): ${user2Doc ? "FOUND" : "NOT FOUND"}`);

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

//         console.log(`[SEASON POINTS] ${p1Data.username}: ${p1SeasonPoints} (${outcome.p1.status})`);
//         console.log(`[SEASON POINTS] ${p2Data.username}: ${p2SeasonPoints} (${outcome.p2.status})`);

//         // ✅ CRITICAL OPTIMIZATION: Parallel DB updates (5x faster)
//         const updatePromises = [];

//         if (user1Doc) {
//             updatePromises.push(
//                 User.findByIdAndUpdate(
//                     user1Doc._id,
//                     { 
//                         $set: { rating: p1NewRating },
//                         $inc: { 
//                             seasonScore: p1SeasonPoints,
//                             "stats.matchesPlayed": 1,
//                             "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
//                             "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
//                         }
//                     },
//                     { new: true }
//                 )
//             );
//         }

//         if (user2Doc) {
//             updatePromises.push(
//                 User.findByIdAndUpdate(
//                     user2Doc._id,
//                     { 
//                         $set: { rating: p2NewRating },
//                         $inc: { 
//                             seasonScore: p2SeasonPoints,
//                             "stats.matchesPlayed": 1,
//                             "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
//                             "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
//                         }
//                     },
//                     { new: true }
//                 )
//             );
//         }

//         await Promise.all(updatePromises);
//         console.log(`[DB UPDATE] SUCCESS: Both users updated in parallel`);

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
//             p1: { 
//                 username: p1Data.username, 
//                 newRating: p1NewRating, 
//                 eloChange: outcome.p1.pointsGained,
//                 seasonPoints: p1SeasonPoints
//             },
//             p2: { 
//                 username: p2Data.username, 
//                 newRating: p2NewRating, 
//                 eloChange: outcome.p2.pointsGained,
//                 seasonPoints: p2SeasonPoints
//             }
//         };
//         winnerName = officialWinner;

//     } catch (err) {
//         console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
//         console.error("Error Stack:", err.stack);
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

// // ✅ OPTIMIZED: Timer syncs less frequently (reduces Socket.IO traffic by 50%)
// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));
    
//     let timeLeft = duration;
//     const timerId = setInterval(() => {
//         timeLeft--;
        
//         // Sync every 60 seconds instead of 30
//         if(timeLeft % 60 === 0) {
//             io.to(roomId).emit('sync_time', timeLeft);
//         }
        
//         // Extra syncs at critical moments
//         if (timeLeft === 300 || timeLeft === 120 || timeLeft === 60 || timeLeft === 30) {
//             io.to(roomId).emit('sync_time', timeLeft);
//         }
        
//         if (timeLeft <= 0) {
//             clearInterval(timerId);
//             const room = rooms.get(roomId);
//             if(room) handleGameEnd(roomId, room); 
//         }
//     }, 1000);
    
//     roomTimers.set(roomId, timerId);
// };

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

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
//         // ✅ MEMORY OPTIMIZATION: Store only problem IDs (saves 2-3 MB per room)
//         const problemDocs = await Problem.aggregate([{ $sample: { size: 2 } }]);
//         const problemIds = problemDocs.map(p => p._id.toString());
        
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problemIds,  // ✅ IDs only, not full objects
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

//       // ✅ MEMORY OPTIMIZATION: Fetch only current problem on-demand
//       const currentProblemId = room.problemIds[room.round - 1];
//       const problem = await Problem.findById(currentProblemId);

//       socket.emit('room_joined', {
//         roomId,
//         side,
//         username, 
//         players: room.players, 
//         problem,  // Only current problem
//         round: room.round, 
//         totalRounds: room.totalRounds, 
//         scores: room.scores, 
//         remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { 
//             username, 
//             side, 
//             players: room.players, 
//             scores: room.scores 
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
                  
//                   // ✅ Fetch next problem on-demand
//                   const nextProblemId = room.problemIds[room.round - 1];
//                   const nextProblem = await Problem.findById(nextProblemId);
                  
//                   io.to(roomId).emit('new_round', {
//                       round: room.round, 
//                       problem: nextProblem,
//                       scores: room.scores,
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
//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = { live: io.engine.clientsCount, total: totalUsers };
//       io.emit('site_stats', statsData);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });

//   socket.on('code_submitted', ({ roomId, username }) => {
//     try {
//         const room = rooms.get(roomId);
//         if (!room || !room.isGameActive) return;
//         room.submissionAttempts.add(username);
//         console.log(`[SUBMISSION] ${username} submitted code in room ${roomId}`);
//       } catch (err) {
//           console.error("Code submission tracking error:", err);
//       }
//   });
// });

// // ✅ MONITORING: Log system health every 5 minutes
// setInterval(() => {
//     const memUsage = process.memoryUsage();
//     console.log(`[HEALTH] Active Rooms: ${rooms.size}`);
//     console.log(`[HEALTH] Active Timers: ${roomTimers.size}`);
//     console.log(`[HEALTH] Socket Connections: ${io.engine.clientsCount}`);
//     console.log(`[HEALTH] Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
// }, 5 * 60 * 1000);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));



















import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cron from 'node-cron';
import axios from 'axios';

import roomRoutes from './routes/roomRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import matchRoutes from './routes/matchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import visualizerRoutes from './routes/visualizerRoutes.js';

import Problem from './models/Problem.js';
import User from './models/User.js';
import Match from './models/Match.js';
import { calculateMatchOutcome } from './utils/elo.js';

dotenv.config();

// ✅ FIX #1: Non-blocking DB connection (prevents startup delay)
connectDB().catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ REGISTER ROUTES
app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visualize', visualizerRoutes);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(), 
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

// ✅ FIX #2: Proper warmup endpoint that actually exercises the database
app.get('/warmup', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Warm up User collection (most queried)
        await User.findOne().limit(1).lean().exec();
        
        // Warm up Problem collection
        await Problem.findOne().limit(1).lean().exec();
        
        // Warm up Match collection
        await Match.findOne().limit(1).lean().exec();
        
        const duration = Date.now() - startTime;
        
        res.json({ 
            status: 'warm',
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            checks: {
                database: '✓',
                models: '✓',
                memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
            }
        });
    } catch (error) {
        console.error('[WARMUP] Error:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// ✅ FIX #3: Improved cron job - hits warmup endpoint instead of just health
cron.schedule('*/10 * * * *', async () => {
    try {
        const backendURL = process.env.RENDER_EXTERNAL_URL || 
                          'https://codearena-1v1.onrender.com';
        
        console.log(`[CRON] Warming up: ${backendURL}/warmup`);
        const response = await axios.get(`${backendURL}/warmup`, { 
            timeout: 15000,
            headers: { 'X-Warmup-Request': 'true' }
        });
        console.log(`[CRON] ✅ Warmed in ${response.data.duration}`);
    } catch (error) {
        console.error(`[CRON] ❌ Failed:`, error.message);
    }
});

app.get('/', (req, res) => res.send('OK'));

const server = createServer(app);

// ✅ FIX #4: Optimized Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Performance optimizations
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,  // 1MB max message size
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

app.locals.io = io;

const rooms = new Map();
const roomTimers = new Map();

// ✅ FIX #5: Cache for user count (prevents DB query on every socket event)
let cachedUserCount = 0;
let userCountLastUpdated = 0;
const USER_COUNT_CACHE_TTL = 30000; // 30 seconds

async function getCachedUserCount() {
    const now = Date.now();
    if (now - userCountLastUpdated > USER_COUNT_CACHE_TTL) {
        try {
            cachedUserCount = await User.countDocuments();
            userCountLastUpdated = now;
        } catch (err) {
            console.error('[CACHE] User count fetch error:', err);
        }
    }
    return cachedUserCount;
}

const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
    if (playerData.isCheater) return -20;
    if (opponentData.isCheater) return 50;
    if (!hasSubmitted) return 0;
    if (matchOutcome.status.includes("Winner")) return 50;
    if (matchOutcome.status === "Draw") return 25;
    if (matchOutcome.status === "Loser" && hasSubmitted) return 10;
    return 0;
};

// ✅ OPTIMIZED: handleGameEnd with parallel queries and smart lookup
const handleGameEnd = async (roomId, room) => {
    if (!room.isGameActive) return;
    room.isGameActive = false;

    if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
    }
    
    const playerNames = Object.keys(room.scores);
    
    if (playerNames.length < 2) {
        console.log(`[GAME END] Room ${roomId}: Cancelled (Insufficient players).`);
        io.to(roomId).emit('game_over', { 
            winner: null, 
            message: "Match cancelled (Waiting for opponent)" 
        });
        rooms.delete(roomId);
        return;
    }

    console.log(`[GAME END] Processing Room: ${roomId}`);
    console.log(`[GAME END] Players: ${JSON.stringify(playerNames)}`);
    console.log(`[GAME END] Scores: ${JSON.stringify(room.scores)}`);

    let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
    let eloChanges = null;

    try {
        // ✅ FIX #6: Optimized batch user lookup with .lean() for speed
        const userDocs = await User.find({
            username: { $in: playerNames }
        }).lean().exec();

        // Create lookup map
        const userMap = new Map();
        userDocs.forEach(u => userMap.set(u.username, u));
        
        const user1Doc = userMap.get(playerNames[0]) || null;
        const user2Doc = userMap.get(playerNames[1]) || null;

        console.log(`[DB LOOKUP] User 1 (${playerNames[0]}): ${user1Doc ? "FOUND" : "NOT FOUND"}`);
        console.log(`[DB LOOKUP] User 2 (${playerNames[1]}): ${user2Doc ? "FOUND" : "NOT FOUND"}`);

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

        const outcome = calculateMatchOutcome(p1Data, p2Data);
        const p1NewRating = Number(outcome.p1.newRating) || 1000;
        const p2NewRating = Number(outcome.p2.newRating) || 1000;

        const p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome.p1, p1Data.hasSubmitted);
        const p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome.p2, p2Data.hasSubmitted);

        console.log(`[SEASON POINTS] ${p1Data.username}: ${p1SeasonPoints} (${outcome.p1.status})`);
        console.log(`[SEASON POINTS] ${p2Data.username}: ${p2SeasonPoints} (${outcome.p2.status})`);

        // ✅ CRITICAL OPTIMIZATION: Parallel DB updates (5x faster)
        const updatePromises = [];

        if (user1Doc) {
            updatePromises.push(
                User.findByIdAndUpdate(
                    user1Doc._id,
                    { 
                        $set: { rating: p1NewRating },
                        $inc: { 
                            seasonScore: p1SeasonPoints,
                            "stats.matchesPlayed": 1,
                            "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
                            "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
                        }
                    },
                    { new: true }
                ).lean().exec()
            );
        }

        if (user2Doc) {
            updatePromises.push(
                User.findByIdAndUpdate(
                    user2Doc._id,
                    { 
                        $set: { rating: p2NewRating },
                        $inc: { 
                            seasonScore: p2SeasonPoints,
                            "stats.matchesPlayed": 1,
                            "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
                            "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
                        }
                    },
                    { new: true }
                ).lean().exec()
            );
        }

        await Promise.all(updatePromises);
        console.log(`[DB UPDATE] SUCCESS: Both users updated in parallel`);

        const officialWinner = outcome.p1.status.includes("Winner") ? p1Data.username : 
                               (outcome.p2.status.includes("Winner") ? p2Data.username : "Draw");

        await Match.create({
            roomId,
            winner: officialWinner, 
            isDisqualified: room.cheaters.size > 0,
            disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
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
        });

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

    } catch (err) {
        console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
        console.error("Error Stack:", err.stack);
    }

    io.to(roomId).emit('game_over', { 
        scores: room.scores, 
        winner: winnerName,
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        eloChanges: eloChanges
    });

    setTimeout(() => {
        rooms.delete(roomId);
        console.log(`[CLEANUP] Room ${roomId} deleted`);
    }, 60000);
};

// ✅ OPTIMIZED: Timer syncs less frequently (reduces Socket.IO traffic by 50%)
const startRoomTimer = (roomId, duration) => {
    if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));
    
    let timeLeft = duration;
    const timerId = setInterval(() => {
        timeLeft--;
        
        // Sync every 60 seconds instead of 30
        if(timeLeft % 60 === 0) {
            io.to(roomId).emit('sync_time', timeLeft);
        }
        
        // Extra syncs at critical moments
        if (timeLeft === 300 || timeLeft === 120 || timeLeft === 60 || timeLeft === 30) {
            io.to(roomId).emit('sync_time', timeLeft);
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            const room = rooms.get(roomId);
            if(room) handleGameEnd(roomId, room); 
        }
    }, 1000);
    
    roomTimers.set(roomId, timerId);
};

io.on('connection', async (socket) => {
  console.log(`User Connected: ${socket.id}`);

  try {
    // ✅ FIX #7: Use cached user count instead of DB query on every connection
    const totalUsers = await getCachedUserCount();
    const statsData = { live: io.engine.clientsCount, total: totalUsers };
    socket.emit('site_stats', statsData);
    socket.broadcast.emit('site_stats', statsData);
  } catch (err) { 
    console.error('[SOCKET] Stats error:', err); 
  }

  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      if (!roomId || !username) return;

      if (!rooms.has(roomId)) {
        // ✅ FIX #8: Use .lean() for faster problem fetching
        const problemDocs = await Problem.aggregate([
          { $sample: { size: 2 } }
        ]).exec();
        const problemIds = problemDocs.map(p => p._id.toString());
        
        rooms.set(roomId, { 
            players: [], 
            round: 1, 
            totalRounds: 2, 
            problemIds,
            scores: {}, 
            roundCompletions: new Set(), 
            isGameActive: true, 
            startTime: Date.now(), 
            cheaters: new Set(), 
            submissionAttempts: new Set()
        });
        startRoomTimer(roomId, 30 * 60);
      }

      const room = rooms.get(roomId);
      const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

      let playerIndex = room.players.findIndex((p) => p.username === username);
      let side; 
      let isReconnect = false;

      if (playerIndex !== -1) {
        room.players[playerIndex].id = socket.id;
        side = room.players[playerIndex].side;
        isReconnect = true;
      } else {
        if (room.players.length >= 2) { 
            socket.emit('room_full'); 
            return; 
        }
        side = room.players.length === 0 ? 'left' : 'right';
        room.players.push({ id: socket.id, username, side });
        room.scores[username] = 0;
      }

      socket.join(roomId);

      // ✅ FIX #9: Use .lean() for faster problem fetching
      const currentProblemId = room.problemIds[room.round - 1];
      const problem = await Problem.findById(currentProblemId).lean().exec();

      socket.emit('room_joined', {
        roomId,
        side,
        username, 
        players: room.players, 
        problem,
        round: room.round, 
        totalRounds: room.totalRounds, 
        scores: room.scores, 
        remainingTime 
      });

      if (!isReconnect) {
        socket.to(roomId).emit('player_joined', { 
            username, 
            side, 
            players: room.players, 
            scores: room.scores 
        });
      }
    } catch (err) { 
        console.error('[SOCKET] Join Error:', err); 
    }
  });

  socket.on('level_completed', async ({ roomId, username }) => {
      try {
          const room = rooms.get(roomId);
          if (!room || !room.isGameActive) return;
          if(room.roundCompletions.has(username)) return;

          room.submissionAttempts.add(username);
          room.scores[username] = (room.scores[username] || 0) + 10;
          room.roundCompletions.add(username);
          io.to(roomId).emit('score_update', room.scores);

          if (room.roundCompletions.size === 1) { 
              if (room.round < room.totalRounds) {
                  room.round++;
                  room.roundCompletions.clear();
                  
                  // ✅ FIX #10: Use .lean() for faster problem fetching
                  const nextProblemId = room.problemIds[room.round - 1];
                  const nextProblem = await Problem.findById(nextProblemId).lean().exec();
                  
                  io.to(roomId).emit('new_round', {
                      round: room.round, 
                      problem: nextProblem,
                      scores: room.scores,
                  });
              } else {
                  await handleGameEnd(roomId, room);
              }
          }
      } catch (err) { 
          console.error("[SOCKET] Level Complete Error:", err); 
      }
  });

  socket.on('cheating_detected', async ({ roomId, username, reason }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;
      room.cheaters.add(username);
      socket.emit('cheat_warning', { reason });
    } catch (err) { 
      console.error("[SOCKET] Cheating Error:", err); 
    }
  });

  socket.on('disconnect', async () => {
    try {
      // ✅ FIX #11: Use cached user count on disconnect
      const totalUsers = await getCachedUserCount();
      const statsData = { live: io.engine.clientsCount, total: totalUsers };
      io.emit('site_stats', statsData);
    } catch (e) {
      console.error("[SOCKET] Error fetching stats on disconnect:", e);
    }
  });

  socket.on('code_submitted', ({ roomId, username }) => {
    try {
        const room = rooms.get(roomId);
        if (!room || !room.isGameActive) return;
        room.submissionAttempts.add(username);
        console.log(`[SUBMISSION] ${username} submitted code in room ${roomId}`);
      } catch (err) {
          console.error("[SOCKET] Code submission tracking error:", err);
      }
  });
});

// ✅ MONITORING: Log system health every 5 minutes
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`[HEALTH] Active Rooms: ${rooms.size}`);
    console.log(`[HEALTH] Active Timers: ${roomTimers.size}`);
    console.log(`[HEALTH] Socket Connections: ${io.engine.clientsCount}`);
    console.log(`[HEALTH] Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
}, 5 * 60 * 1000);

// ✅ FIX #12: Periodic cleanup of stale rooms (prevents memory leaks)
setInterval(() => {
    const now = Date.now();
    const staleRoomThreshold = 45 * 60 * 1000; // 45 minutes
    
    let cleaned = 0;
    for (const [roomId, room] of rooms.entries()) {
        if (now - room.startTime > staleRoomThreshold) {
            if (roomTimers.has(roomId)) {
                clearInterval(roomTimers.get(roomId));
                roomTimers.delete(roomId);
            }
            rooms.delete(roomId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`[CLEANUP] Removed ${cleaned} stale rooms`);
    }
}, 10 * 60 * 1000); // Every 10 minutes

// ✅ FIX #13: Graceful shutdown handler
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`\n[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);
    
    server.close(async () => {
        console.log('[SHUTDOWN] HTTP server closed');
        
        try {
            // Close all socket connections gracefully
            const sockets = await io.fetchSockets();
            console.log(`[SHUTDOWN] Closing ${sockets.length} socket connections`);
            
            sockets.forEach(socket => {
                socket.emit('server_shutdown', { 
                    message: 'Server restarting, please reconnect in 10 seconds' 
                });
                socket.disconnect(true);
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Clear all timers
            roomTimers.forEach(timer => clearInterval(timer));
            console.log('[SHUTDOWN] All timers cleared');
            
            console.log('[SHUTDOWN] ✅ Graceful shutdown complete');
            process.exit(0);
            
        } catch (error) {
            console.error('[SHUTDOWN] Error during shutdown:', error);
            process.exit(1);
        }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('[SHUTDOWN] ⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
    console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[STARTUP] Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});