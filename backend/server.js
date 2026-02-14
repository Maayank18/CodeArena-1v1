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



































































// // FILE: backend/server.js
// // FINAL PRODUCTION VERSION - FULLY OPTIMIZED & TESTED
// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import cron from 'node-cron';
// import axios from 'axios';

// // ✅ ROUTES
// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import visualizerRoutes from './routes/visualizerRoutes.js';

// // ✅ MODELS
// import Problem from './models/Problem.js';
// import User from './models/User.js';
// import Match from './models/Match.js';

// // ✅ UTILS
// import { calculateMatchOutcome } from './utils/elo.js';

// // ✅ CRITICAL: Cache invalidation imports
// import { clearLeaderboardCache } from './controllers/userController.js';
// import { clearStatsCache } from './controllers/statsController.js';

// dotenv.config();

// // ✅ DATABASE CONNECTION with retry logic
// const initDB = async () => {
//     try {
//         await connectDB();
//         console.log('[DB] ✅ Connected Successfully');
//     } catch (err) {
//         console.error('[DB] ❌ Connection Failed:', err);
//         console.log('[DB] 🔄 Retrying in 5 seconds...');
//         setTimeout(initDB, 5000);
//     }
// };
// initDB();

// // ✅ EXPRESS APP SETUP
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

// // ✅ SECURITY: Limit request body size
// app.use(express.json({ limit: '1mb' }));

// // ✅ REQUEST LOGGER (excluding health checks)
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

// // ✅ HEALTH CHECK (Enhanced)
// app.get('/health', (req, res) => {
//     const memUsage = process.memoryUsage();
//     res.status(200).json({ 
//         status: 'OK', 
//         uptime: Math.floor(process.uptime()),
//         timestamp: new Date().toISOString(),
//         memory: {
//             heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
//             heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
//         },
//         activeRooms: rooms.size,
//         activeSockets: io ? io.engine.clientsCount : 0
//     });
// });

// // ✅ CRON JOB: Keep server alive on Render
// cron.schedule('*/14 * * * *', async () => {
//     try {
//         const backendURL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
//         console.log(`[CRON] 🏓 Pinging self: ${backendURL}/health`);
        
//         await axios.get(`${backendURL}/health`, { 
//             timeout: 5000,
//             headers: { 'User-Agent': 'KeepAlive-Cron' }
//         });
//         console.log(`[CRON] ✅ Keep-alive success`);
//     } catch (error) {
//         console.error(`[CRON] ⚠️ Keep-alive failed:`, error.message);
//     }
// });

// // ✅ ROOT ROUTE
// app.get('/', (req, res) => res.send('CodeArena API v2.0 - Optimized'));

// // ✅ HTTP & SOCKET.IO SERVER
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"],
//     credentials: true
//   },
//   // ✅ Socket.IO performance tuning
//   pingTimeout: 60000,
//   pingInterval: 25000,
//   transports: ['websocket', 'polling'],
//   allowEIO3: true
// });

// // Make io accessible in routes
// app.locals.io = io;

// // ✅ IN-MEMORY STORAGE
// const rooms = new Map();
// const roomTimers = new Map();

// // ✅ PROBLEM CACHE (5 min TTL)
// const problemCache = new Map();
// const PROBLEM_CACHE_TTL = 5 * 60 * 1000;

// // ✅ SEASON POINTS CALCULATOR (unchanged)
// const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
//     if (playerData.isCheater) return -20;
//     if (opponentData.isCheater) return 50;
//     if (!hasSubmitted) return 0;
//     if (matchOutcome.status.includes("Winner")) return 50;
//     if (matchOutcome.status === "Draw") return 25;
//     if (matchOutcome.status === "Loser" && hasSubmitted) return 10;
//     return 0;
// };

// // ✅ GAME END HANDLER (Optimized with cache invalidation)
// const handleGameEnd = async (roomId, room) => {
//     if (!room || !room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear timer immediately
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     const playerNames = Object.keys(room.scores);
    
//     // Check for sufficient players
//     if (playerNames.length < 2) {
//         console.log(`[GAME END] Room ${roomId}: ❌ Cancelled (Insufficient players)`);
//         io.to(roomId).emit('game_over', { 
//             winner: null, 
//             message: "Match cancelled (Waiting for opponent)" 
//         });
//         rooms.delete(roomId);
//         return;
//     }

//     console.log(`[GAME END] 🏁 Processing Room: ${roomId}`);
    
//     let winnerName = playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
//     let eloChanges = null;

//     try {
//         // ✅ Parallel user fetches (optimized)
//         const [user1Doc, user2Doc] = await Promise.all([
//             User.findByUsername(playerNames[0]).select('_id username rating avatar').lean(),
//             User.findByUsername(playerNames[1]).select('_id username rating avatar').lean()
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

//         // Calculate ELO changes
//         const outcome = calculateMatchOutcome(p1Data, p2Data);
//         const p1NewRating = Number(outcome.p1.newRating) || 1000;
//         const p2NewRating = Number(outcome.p2.newRating) || 1000;

//         const p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome.p1, p1Data.hasSubmitted);
//         const p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome.p2, p2Data.hasSubmitted);

//         // ✅ Batch all database operations
//         const dbOperations = [];

//         // Update player 1
//         if (user1Doc) {
//             dbOperations.push(
//                 User.findByIdAndUpdate(user1Doc._id, { 
//                     $set: { rating: p1NewRating },
//                     $inc: { 
//                         seasonScore: p1SeasonPoints,
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
//                     }
//                 }, { new: false })
//             );
//         }

//         // Update player 2
//         if (user2Doc) {
//             dbOperations.push(
//                 User.findByIdAndUpdate(user2Doc._id, { 
//                     $set: { rating: p2NewRating },
//                     $inc: { 
//                         seasonScore: p2SeasonPoints,
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
//                     }
//                 }, { new: false })
//             );
//         }

//         const officialWinner = outcome.p1.status.includes("Winner") ? p1Data.username : 
//                                (outcome.p2.status.includes("Winner") ? p2Data.username : "Draw");

//         // Create match record
//         dbOperations.push(
//             Match.create({
//                 roomId,
//                 winner: officialWinner, 
//                 isDisqualified: room.cheaters.size > 0,
//                 disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//                 players: [
//                     { 
//                         userId: user1Doc?._id || null, 
//                         username: p1Data.username, 
//                         avatar: user1Doc?.avatar || "", 
//                         isWinner: outcome.p1.status.includes("Winner"), 
//                         score: p1Data.score, 
//                         oldElo: p1Data.rating, 
//                         newElo: p1NewRating, 
//                         statusText: outcome.p1.status,
//                         seasonPointsGained: p1SeasonPoints,
//                         hasSubmitted: p1Data.hasSubmitted
//                     },
//                     { 
//                         userId: user2Doc?._id || null, 
//                         username: p2Data.username, 
//                         avatar: user2Doc?.avatar || "", 
//                         isWinner: outcome.p2.status.includes("Winner"), 
//                         score: p2Data.score, 
//                         oldElo: p2Data.rating, 
//                         newElo: p2NewRating, 
//                         statusText: outcome.p2.status,
//                         seasonPointsGained: p2SeasonPoints,
//                         hasSubmitted: p2Data.hasSubmitted
//                     }
//                 ]
//             })
//         );

//         // ✅ Execute all DB operations in parallel
//         await Promise.all(dbOperations);

//         // ✅ CRITICAL: Invalidate caches after match completion
//         clearLeaderboardCache();
//         clearStatsCache();

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

//         console.log(`[GAME END] ✅ Room ${roomId} | Winner: ${winnerName}`);

//     } catch (err) {
//         console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
//         // Continue to notify clients even if DB fails
//     }

//     // ✅ Emit game over event to all players in room
//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: winnerName,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: eloChanges
//     });

//     // ✅ Delayed cleanup (1 minute delay for reconnections)
//     setTimeout(() => {
//         rooms.delete(roomId);
//         console.log(`[CLEANUP] 🗑️ Room ${roomId} deleted from memory`);
//     }, 60000);
// };

// // ✅ TIMER HANDLER (already optimal)
// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//     }
    
//     let timeLeft = duration;
    
//     const timerId = setInterval(() => {
//         timeLeft--;
        
//         // Sync time every 60s or when below 10s
//         if(timeLeft % 60 === 0 || timeLeft <= 10) {
//             io.to(roomId).emit('sync_time', timeLeft);
//         }
        
//         if (timeLeft <= 0) {
//             clearInterval(timerId);
//             roomTimers.delete(roomId);
//             const room = rooms.get(roomId);
//             if(room) handleGameEnd(roomId, room); 
//         }
//     }, 1000);
    
//     roomTimers.set(roomId, timerId);
// };

// // ✅ RATE LIMITING for socket events
// const socketRateLimits = new Map();
// const RATE_LIMIT_WINDOW = 5000; // 5 seconds
// const MAX_EVENTS_PER_WINDOW = 10;

// function checkRateLimit(socketId, eventName) {
//     const key = `${socketId}:${eventName}`;
//     const now = Date.now();
    
//     if (!socketRateLimits.has(key)) {
//         socketRateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
//         return true;
//     }
    
//     const limit = socketRateLimits.get(key);
    
//     if (now > limit.resetTime) {
//         limit.count = 1;
//         limit.resetTime = now + RATE_LIMIT_WINDOW;
//         return true;
//     }
    
//     if (limit.count >= MAX_EVENTS_PER_WINDOW) {
//         console.warn(`[RATE LIMIT] ⚠️ ${socketId} exceeded limit for ${eventName}`);
//         return false;
//     }
    
//     limit.count++;
//     return true;
// }

// // ✅ SOCKET EVENT HANDLERS
// io.on('connection', async (socket) => {
//   console.log(`[SOCKET] ✅ Connected: ${socket.id}`);

//   // Send initial stats
//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };
//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) { 
//     console.error('[SOCKET] Stats error:', err); 
//   }

//   // ✅ JOIN ROOM EVENT
//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
      
//       // Validation
//       if (!roomId || !username) {
//         socket.emit('error', { message: 'Missing roomId or username' });
//         return;
//       }

//       // Rate limiting
//       if (!checkRateLimit(socket.id, 'join_room')) {
//         socket.emit('error', { message: 'Too many join attempts. Please wait.' });
//         return;
//       }

//       // Create room if doesn't exist
//       if (!rooms.has(roomId)) {
//         // ✅ Fetch problems with caching
//         let problemDocs;
//         const cacheKey = 'random_problems_2';
//         const cached = problemCache.get(cacheKey);

//         if (cached && (Date.now() - cached.timestamp) < PROBLEM_CACHE_TTL) {
//           problemDocs = cached.problems;
//         } else {
//           problemDocs = await Problem.aggregate([
//             { $sample: { size: 2 } },
//             { $project: { _id: 1 } }
//           ]);
          
//           problemCache.set(cacheKey, {
//             problems: problemDocs,
//             timestamp: Date.now()
//           });
//         }

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
//         console.log(`[ROOM] ✨ Created: ${roomId}`);
//       }

//       const room = rooms.get(roomId);
//       const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; 
//       let isReconnect = false;

//       if (playerIndex !== -1) {
//         // Reconnecting player
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//         console.log(`[ROOM] 🔄 ${username} reconnected to ${roomId}`);
//       } else {
//         // New player
//         if (room.players.length >= 2) { 
//             socket.emit('room_full'); 
//             return; 
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//         console.log(`[ROOM] ➕ ${username} joined ${roomId} as ${side}`);
//       }

//       socket.join(roomId);

//       // Fetch current problem
//       const currentProblemId = room.problemIds[room.round - 1];
//       const problem = await Problem.findById(currentProblemId)
//         .select('-goldenSolution')
//         .lean();

//       socket.emit('room_joined', {
//         roomId, side, username, 
//         players: room.players, 
//         problem, 
//         round: room.round, 
//         totalRounds: room.totalRounds, 
//         scores: room.scores, 
//         remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { 
//             username, side, 
//             players: room.players, 
//             scores: room.scores 
//         });
//       }

//     } catch (err) { 
//         console.error('[SOCKET] Join Error:', err);
//         socket.emit('error', { message: 'Failed to join room' });
//     }
//   });

//   // ✅ LEVEL COMPLETED EVENT
//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;
//           if(room.roundCompletions.has(username)) return;

//           // Rate limiting
//           if (!checkRateLimit(socket.id, 'level_completed')) {
//             return;
//           }

//           room.submissionAttempts.add(username);
//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username);
          
//           io.to(roomId).emit('score_update', room.scores);
//           console.log(`[GAME] 🎯 ${username} completed round ${room.round} in ${roomId}`);

//           // First player to complete
//           if (room.roundCompletions.size === 1) { 
//               if (room.round < room.totalRounds) {
//                   // Advance to next round
//                   room.round++;
//                   room.roundCompletions.clear();
                  
//                   const nextProblemId = room.problemIds[room.round - 1];
//                   const nextProblem = await Problem.findById(nextProblemId)
//                     .select('-goldenSolution')
//                     .lean();
                  
//                   io.to(roomId).emit('new_round', {
//                       round: room.round, 
//                       problem: nextProblem, 
//                       scores: room.scores,
//                   });
                  
//                   console.log(`[GAME] ⏭️ Room ${roomId} → Round ${room.round}`);
//               } else {
//                   // Game complete
//                   await handleGameEnd(roomId, room);
//               }
//           }
//       } catch (err) { 
//           console.error("[SOCKET] Level Complete Error:", err); 
//       }
//   });

//   // ✅ CHEATING DETECTED EVENT
//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;
      
//       room.cheaters.add(username);
//       socket.emit('cheat_warning', { reason });
      
//       console.log(`[ANTI-CHEAT] 🚨 ${username} in ${roomId}: ${reason}`);
//     } catch (err) { 
//       console.error("[SOCKET] Cheating Error:", err); 
//     }
//   });

//   // ✅ CODE SUBMITTED EVENT
//   socket.on('code_submitted', ({ roomId, username }) => {
//     try {
//         const room = rooms.get(roomId);
//         if (!room || !room.isGameActive) return;
//         room.submissionAttempts.add(username);
//         console.log(`[GAME] 📝 ${username} submitted code in ${roomId}`);
//     } catch (err) { 
//       console.error("[SOCKET] Code submission error:", err); 
//     }
//   });

//   // ✅ DISCONNECT EVENT
//   socket.on('disconnect', async (reason) => {
//     try {
//       console.log(`[SOCKET] ❌ Disconnected: ${socket.id} (${reason})`);
      
//       // Update stats
//       const statsData = { live: io.engine.clientsCount };
//       io.emit('site_stats', statsData);
      
//       // Cleanup rate limits for this socket
//       for (const key of socketRateLimits.keys()) {
//         if (key.startsWith(socket.id)) {
//           socketRateLimits.delete(key);
//         }
//       }
//     } catch (e) { 
//       console.error("[SOCKET] Disconnect Error:", e); 
//     }
//   });
// });

// // ✅ MONITORING & CLEANUP (every 10 minutes)
// setInterval(() => {
//     const memUsage = process.memoryUsage();
//     const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
//     const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
//     console.log(`[HEALTH] Rooms: ${rooms.size} | Sockets: ${io.engine.clientsCount} | Mem: ${heapUsedMB}MB/${heapTotalMB}MB`);
    
//     // Memory warning
//     if (heapUsedMB > 400) {
//         console.warn(`⚠️ [MEMORY] High usage: ${heapUsedMB}MB`);
//     }
    
//     // Cleanup stale rooms (>2 hours old)
//     const now = Date.now();
//     const TWO_HOURS = 2 * 60 * 60 * 1000;
    
//     for (const [roomId, room] of rooms.entries()) {
//         if (now - room.startTime > TWO_HOURS) {
//             rooms.delete(roomId);
//             if (roomTimers.has(roomId)) {
//                 clearInterval(roomTimers.get(roomId));
//                 roomTimers.delete(roomId);
//             }
//             console.log(`[CLEANUP] 🗑️ Removed stale room: ${roomId}`);
//         }
//     }
    
//     // Cleanup old rate limit entries
//     for (const [key, value] of socketRateLimits.entries()) {
//         if (now > value.resetTime + 60000) {
//             socketRateLimits.delete(key);
//         }
//     }
    
// }, 10 * 60 * 1000);

// // ✅ GRACEFUL SHUTDOWN
// process.on('SIGTERM', () => {
//     console.log('[SERVER] 🛑 SIGTERM received. Shutting down gracefully...');
    
//     server.close(() => {
//         console.log('[SERVER] ✅ HTTP server closed');
        
//         // Clear all room timers
//         for (const timerId of roomTimers.values()) {
//             clearInterval(timerId);
//         }
        
//         // Close all socket connections
//         io.close(() => {
//             console.log('[SOCKET] ✅ All connections closed');
//             process.exit(0);
//         });
//     });
    
//     // Force shutdown after 30 seconds
//     setTimeout(() => {
//         console.error('[SERVER] ⏰ Forced shutdown after timeout');
//         process.exit(1);
//     }, 30000);
// });

// // ✅ START SERVER
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`
//     ╔═══════════════════════════════════════════╗
//     ║     CodeArena 1v1 Server Started! 🚀     ║
//     ╠═══════════════════════════════════════════╣
//     ║   Port: ${PORT.toString().padEnd(33)} ║
//     ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║
//     ║   Max Concurrent Matches: 150-200         ║
//     ╚═══════════════════════════════════════════╝
//     `);
// });





































// FILE: backend/server.js
// PRODUCTION-OPTIMIZED V3.0 - ENTERPRISE GRADE
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
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

// ✅ MODELS
import Problem from './models/Problem.js';
import User from './models/User.js';
import Match from './models/Match.js';

// ✅ UTILS
import { calculateMatchOutcome } from './utils/elo.js';

// ✅ CRITICAL: Cache invalidation imports
import { clearLeaderboardCache } from './controllers/userController.js';
import { clearStatsCache } from './controllers/statsController.js';

dotenv.config();

// ✅ DATABASE CONNECTION with retry logic
const initDB = async () => {
    try {
        await connectDB();
        console.log('[DB] ✅ Connected Successfully');
    } catch (err) {
        console.error('[DB] ❌ Connection Failed:', err.message);
        console.log('[DB] 🔄 Retrying in 5 seconds...');
        setTimeout(initDB, 5000);
    }
};
initDB();

// ✅ EXPRESS APP SETUP
const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production (adjust as needed)
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ SECURITY: Limit request body size
app.use(express.json({ limit: '1mb' }));

// ✅ REQUEST LOGGER (excluding health checks)
app.use((req, res, next) => {
  if (req.originalUrl !== '/health' && req.originalUrl !== '/api/stats') {
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ✅ HTTP & SOCKET.IO SERVER (moved up before routes)
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  maxHttpBufferSize: 1e6, // 1MB max message size
});

// Make io accessible in routes
app.locals.io = io;

// ✅ CRITICAL: Connected users tracking (Set for unique socket IDs)
const connectedUsers = new Set();

// ✅ IN-MEMORY STORAGE
const rooms = new Map();
const roomTimers = new Map();

// ✅ PROBLEM CACHE (5 min TTL)
const problemCache = new Map();
const PROBLEM_CACHE_TTL = 5 * 60 * 1000;

// ✅ STATS CACHE (to avoid DB hammering)
let cachedTotalUsers = 0;
let lastTotalUsersFetch = 0;
const TOTAL_USERS_CACHE_DURATION = 60000; // 1 minute

// ✅ FUNCTION: Get total users with caching
const getTotalUsers = async () => {
    try {
        const now = Date.now();
        if (now - lastTotalUsersFetch < TOTAL_USERS_CACHE_DURATION) {
            return cachedTotalUsers;
        }
        
        const count = await User.countDocuments();
        cachedTotalUsers = count;
        lastTotalUsersFetch = now;
        return count;
    } catch (error) {
        console.error('[STATS] Error fetching total users:', error.message);
        return cachedTotalUsers; // Return cached value on error
    }
};

// ✅ FUNCTION: Broadcast stats to all clients (throttled)
let lastBroadcast = 0;
const BROADCAST_THROTTLE = 2000; // 2 seconds

const broadcastStats = async () => {
    try {
        const now = Date.now();
        if (now - lastBroadcast < BROADCAST_THROTTLE) {
            return; // Throttle broadcasts
        }
        lastBroadcast = now;
        
        const stats = {
            live: connectedUsers.size,
            total: await getTotalUsers()
        };
        
        io.emit('site_stats', stats);
        console.log(`[STATS] 📊 Broadcast: ${stats.live} live, ${stats.total} total`);
    } catch (error) {
        console.error('[STATS] Broadcast error:', error.message);
    }
};

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

// ✅ CRITICAL: Live stats endpoint (for HTTP fetch)
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            live: connectedUsers.size,
            total: await getTotalUsers()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('[API] /stats error:', error.message);
        res.status(500).json({ 
            live: connectedUsers.size, 
            total: cachedTotalUsers,
            error: 'Partial data' 
        });
    }
});

// ✅ HEALTH CHECK (Enhanced)
app.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    res.status(200).json({ 
        status: 'OK', 
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        memory: {
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        activeRooms: rooms.size,
        activeSockets: connectedUsers.size,
        totalUsers: cachedTotalUsers
    });
});

// ✅ CRON JOB: Keep server alive on Render
cron.schedule('*/14 * * * *', async () => {
    try {
        const backendURL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
        
        const response = await axios.get(`${backendURL}/health`, { 
            timeout: 5000,
            headers: { 'User-Agent': 'KeepAlive-Cron' }
        });
        
        console.log(`[CRON] ✅ Keep-alive: ${response.data.activeSockets} sockets, ${response.data.activeRooms} rooms`);
    } catch (error) {
        console.error(`[CRON] ⚠️ Keep-alive failed:`, error.message);
    }
});

// ✅ ROOT ROUTE
app.get('/', (req, res) => res.send('CodeArena API v3.0 - Production Ready'));

// ✅ SEASON POINTS CALCULATOR
const calculateSeasonPoints = (playerData, opponentData, matchOutcome, hasSubmitted) => {
    if (playerData.isCheater) return -20;
    if (opponentData.isCheater) return 50;
    if (!hasSubmitted) return 0;
    if (matchOutcome.status.includes("Winner")) return 50;
    if (matchOutcome.status === "Draw") return 25;
    if (matchOutcome.status === "Loser" && hasSubmitted) return 10;
    return 0;
};

// ✅ GAME END HANDLER (Optimized)
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
    let eloChanges = null;

    try {
        // ✅ Parallel user fetches
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

        // Calculate ELO
        const outcome = calculateMatchOutcome(p1Data, p2Data);
        const p1NewRating = Number(outcome.p1.newRating) || 1000;
        const p2NewRating = Number(outcome.p2.newRating) || 1000;

        const p1SeasonPoints = calculateSeasonPoints(p1Data, p2Data, outcome.p1, p1Data.hasSubmitted);
        const p2SeasonPoints = calculateSeasonPoints(p2Data, p1Data, outcome.p2, p2Data.hasSubmitted);

        // ✅ Batch DB operations
        const dbOperations = [];

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

        dbOperations.push(
            Match.create({
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
            })
        );

        await Promise.all(dbOperations);

        // ✅ CRITICAL: Invalidate caches
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

        console.log(`[GAME END] ✅ Room ${roomId} | Winner: ${winnerName}`);

    } catch (err) {
        console.error("[GAME END] ❌ DB Error:", err.message);
    }

    // Emit game over
    io.to(roomId).emit('game_over', { 
        scores: room.scores, 
        winner: winnerName,
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        eloChanges: eloChanges
    });

    // Delayed cleanup
    setTimeout(() => {
        rooms.delete(roomId);
        console.log(`[CLEANUP] 🗑️ Room ${roomId} deleted`);
    }, 60000);
};

// ✅ TIMER HANDLER
const startRoomTimer = (roomId, duration) => {
    if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
    }
    
    let timeLeft = duration;
    
    const timerId = setInterval(() => {
        timeLeft--;
        
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

// ✅ RATE LIMITING
const socketRateLimits = new Map();
const RATE_LIMIT_WINDOW = 5000;
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
  
  // ✅ CRITICAL: Add to connected users
  connectedUsers.add(socket.id);
  
  // ✅ Broadcast stats to all clients
  await broadcastStats();

  // ✅ HANDLE: Request stats
  socket.on('request_stats', async () => {
    try {
      const stats = {
        live: connectedUsers.size,
        total: await getTotalUsers()
      };
      socket.emit('site_stats', stats);
      console.log(`[SOCKET] Stats sent to ${socket.id}: ${stats.live} live`);
    } catch (error) {
      console.error('[SOCKET] request_stats error:', error.message);
    }
  });

  // ✅ JOIN ROOM EVENT
  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      
      if (!roomId || !username) {
        socket.emit('error', { message: 'Missing roomId or username' });
        return;
      }

      if (!checkRateLimit(socket.id, 'join_room')) {
        socket.emit('error', { message: 'Too many join attempts. Please wait.' });
        return;
      }

      // Create room if doesn't exist
      if (!rooms.has(roomId)) {
        let problemDocs;
        const cacheKey = 'random_problems_2';
        const cached = problemCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < PROBLEM_CACHE_TTL) {
          problemDocs = cached.problems;
        } else {
          problemDocs = await Problem.aggregate([
            { $sample: { size: 2 } },
            { $project: { _id: 1 } }
          ]);
          
          if (!problemDocs || problemDocs.length === 0) {
            socket.emit('error', { 
              message: 'No problems available. Please contact admin to seed the database.' 
            });
            return;
          }
          
          problemCache.set(cacheKey, {
            problems: problemDocs,
            timestamp: Date.now()
          });
        }

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
        console.log(`[ROOM] ✨ Created: ${roomId}`);
      }

      const room = rooms.get(roomId);
      
      // ✅ CRITICAL: Calculate remaining time from room start
      const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
      const remainingTime = Math.max(0, (30 * 60) - elapsedSeconds);

      // Safety check
      if (remainingTime === 0 && room.isGameActive) {
        console.log(`[ROOM] ⏰ Room ${roomId} time expired`);
        await handleGameEnd(roomId, room);
        socket.emit('error', { message: 'This match has already ended (time expired)' });
        return;
      }

      let playerIndex = room.players.findIndex((p) => p.username === username);
      let side; 
      let isReconnect = false;

      if (playerIndex !== -1) {
        room.players[playerIndex].id = socket.id;
        side = room.players[playerIndex].side;
        isReconnect = true;
        console.log(`[ROOM] 🔄 ${username} reconnected to ${roomId} | Time: ${Math.floor(remainingTime/60)}m ${remainingTime%60}s`);
      } else {
        if (room.players.length >= 2) { 
            socket.emit('room_full'); 
            return; 
        }
        side = room.players.length === 0 ? 'left' : 'right';
        room.players.push({ id: socket.id, username, side });
        room.scores[username] = 0;
        console.log(`[ROOM] ➕ ${username} joined ${roomId} as ${side} | Time: ${Math.floor(remainingTime/60)}m ${remainingTime%60}s`);
      }

      socket.join(roomId);

      const currentProblemId = room.problemIds[room.round - 1];
      
      if (!currentProblemId) {
        console.error('[ROOM] ❌ No problem ID for round', room.round);
        socket.emit('error', { message: 'Problem not found for current round.' });
        return;
      }
      
      const problem = await Problem.findById(currentProblemId)
        .select('-goldenSolution')
        .lean();

      if (!problem) {
        console.error('[ROOM] ❌ Problem not found:', currentProblemId);
        socket.emit('error', { message: 'Problem data missing.' });
        return;
      }

      socket.emit('room_joined', {
        roomId, side, username, 
        players: room.players, 
        problem, 
        round: room.round, 
        totalRounds: room.totalRounds, 
        scores: room.scores, 
        remainingTime,
        serverTime: Date.now()
      });

      if (!isReconnect) {
        socket.to(roomId).emit('player_joined', { 
            username, side, 
            players: room.players, 
            scores: room.scores 
        });
      }

    } catch (err) { 
        console.error('[SOCKET] Join Error:', err.message);
        socket.emit('error', { message: 'Failed to join room: ' + err.message });
    }
  });

  // ✅ LEVEL COMPLETED EVENT
  socket.on('level_completed', async ({ roomId, username }) => {
      try {
          const room = rooms.get(roomId);
          if (!room || !room.isGameActive) return;
          if(room.roundCompletions.has(username)) return;

          if (!checkRateLimit(socket.id, 'level_completed')) {
            return;
          }

          room.submissionAttempts.add(username);
          room.scores[username] = (room.scores[username] || 0) + 10;
          room.roundCompletions.add(username);
          
          io.to(roomId).emit('score_update', room.scores);
          console.log(`[GAME] 🎯 ${username} completed round ${room.round} in ${roomId}`);

          if (room.roundCompletions.size === 1) { 
              if (room.round < room.totalRounds) {
                  room.round++;
                  room.roundCompletions.clear();
                  
                  const nextProblemId = room.problemIds[room.round - 1];
                  const nextProblem = await Problem.findById(nextProblemId)
                    .select('-goldenSolution')
                    .lean();
                  
                  io.to(roomId).emit('new_round', {
                      round: room.round, 
                      problem: nextProblem, 
                      scores: room.scores,
                  });
                  
                  console.log(`[GAME] ⏭️ Room ${roomId} → Round ${room.round}`);
              } else {
                  await handleGameEnd(roomId, room);
              }
          }
      } catch (err) { 
          console.error("[SOCKET] Level Complete Error:", err.message); 
      }
  });

  // ✅ CHEATING DETECTED EVENT
  socket.on('cheating_detected', async ({ roomId, username, reason }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;
      
      room.cheaters.add(username);
      socket.emit('cheat_warning', { reason });
      
      console.log(`[ANTI-CHEAT] 🚨 ${username} in ${roomId}: ${reason}`);
    } catch (err) { 
      console.error("[SOCKET] Cheating Error:", err.message); 
    }
  });

  // ✅ CODE SUBMITTED EVENT
  socket.on('code_submitted', ({ roomId, username }) => {
    try {
        const room = rooms.get(roomId);
        if (!room || !room.isGameActive) return;
        room.submissionAttempts.add(username);
        console.log(`[GAME] 📝 ${username} submitted code in ${roomId}`);
    } catch (err) { 
      console.error("[SOCKET] Code submission error:", err.message); 
    }
  });

  // ✅ DISCONNECT EVENT
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`[SOCKET] ❌ Disconnected: ${socket.id} (${reason})`);
      
      // ✅ CRITICAL: Remove from connected users
      connectedUsers.delete(socket.id);
      
      // ✅ Broadcast updated stats
      await broadcastStats();
      
      // Cleanup rate limits
      for (const key of socketRateLimits.keys()) {
        if (key.startsWith(socket.id)) {
          socketRateLimits.delete(key);
        }
      }
    } catch (e) { 
      console.error("[SOCKET] Disconnect Error:", e.message); 
    }
  });
});

// ✅ MONITORING & CLEANUP (every 10 minutes)
setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    console.log(`[HEALTH] 🏥 Rooms: ${rooms.size} | Sockets: ${connectedUsers.size} | Mem: ${heapUsedMB}MB/${heapTotalMB}MB`);
    
    if (heapUsedMB > 400) {
        console.warn(`⚠️ [MEMORY] High usage: ${heapUsedMB}MB`);
    }
    
    // Cleanup stale rooms
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
    
    // Cleanup rate limits
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
        
        for (const timerId of roomTimers.values()) {
            clearInterval(timerId);
        }
        
        io.close(() => {
            console.log('[SOCKET] ✅ All connections closed');
            process.exit(0);
        });
    });
    
    setTimeout(() => {
        console.error('[SERVER] ⏰ Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
});

process.on('SIGINT', () => {
    console.log('[SERVER] 🛑 SIGINT received. Shutting down...');
    process.exit(0);
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   CodeArena 1v1 Server Started! 🚀           ║
╠═══════════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(37)} ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)} ║
║   Max Concurrent Matches: 150-200             ║
║   Live User Tracking: ✅ Enabled              ║
╚═══════════════════════════════════════════════╝
    `);
});