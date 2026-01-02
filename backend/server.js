// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';

// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';

// import Problem from './models/Problem.js';
// import User from './models/User.js';
// // ✅ 1. IMPORT THE MATCH MODEL
// import Match from './models/Match.js';

// // ✅ IMPORT THE NEW ELO HELPER
// import { calculateElo } from './utils/elo.js';

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
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
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

// app.get('/debug/emit-stats', async (req, res) => {
//   try {
//     const total = await User.countDocuments();
//     const payload = { live: io.engine.clientsCount, total };
//     io.emit('site_stats', payload);
//     console.log('Manual emit site_stats', payload);
//     res.json({ sent: payload });
//   } catch (err) {
//     console.error('/debug/emit-stats error', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// (async function logInitialCount() {
//   try {
//     const c = await User.countDocuments();
//     console.log('Initial DB user count:', c);
//   } catch (err) {
//     console.error('Initial DB user count failed:', err);
//   }
// })();

// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };

//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   // ---------------------------------------------------------------------
//   // ✅ JOIN_ROOM LOGIC
//   // ---------------------------------------------------------------------

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       console.log(`🔵 [SERVER] join_room: ${username} → ${roomId} | socket: ${socket.id}`);
//       if (!roomId || !username) {
//         console.log('❌ Missing roomId or username');
//         return;
//       }

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 3 } }]);
//         rooms.set(roomId, { players: [], round: 1, totalRounds: 3, problems, scores: {}, isGameActive: true });
//         console.log(`✅ [SERVER] Created room ${roomId}`);
//       }

//       const room = rooms.get(roomId);
//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         console.log(`🔄 [SERVER] ${username} reconnecting`);
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) {
//           console.log(`❌ [SERVER] Room ${roomId} is FULL`);
//           socket.emit('room_full');
//           return;
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//         console.log(`✅ [SERVER] ${username} assigned to ${side}`);
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId,
//         side,
//         username,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores,
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) {
//       console.error('❌ [SERVER] Join Room Error:', err);
//     }
//   });


//   // ---------------------------------------------------------------------
//   // ✅ UPDATED LEVEL_COMPLETED (ELO + HISTORY SAVE LOGIC)
//   // ---------------------------------------------------------------------

//   socket.on('level_completed', async ({ roomId, username }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       // Update in-game score
//       room.scores[username] = (room.scores[username] || 0) + 10;
//       io.to(roomId).emit('score_update', room.scores);

//       if (room.round < room.totalRounds) {
//         // --- NEXT ROUND LOGIC ---
//         room.round++;
//         io.to(roomId).emit('new_round', {
//           round: room.round,
//           problem: room.problems[room.round - 1],
//           scores: room.scores,
//         });
//       } else {
//         // --- GAME OVER LOGIC (ELO + DB SAVE) ---
//         room.isGameActive = false;
        
//         // 1. Identify Winner and Loser
//         const winnerUsername = Object.keys(room.scores)
//           .reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
        
//         const loserUsername = Object.keys(room.scores).find(u => u !== winnerUsername);

//         let eloChanges = {};

//         // 2. Perform ELO Calculation & Save Match
//         if (winnerUsername && loserUsername) {
//             const winner = await User.findOne({ username: winnerUsername });
//             const loser = await User.findOne({ username: loserUsername });

//             if (winner && loser) {
//                 // NOTE: Using 'elo' instead of 'rating' to match your Match Model
//                 const winnerCurrentElo = winner.elo || 1000;
//                 const loserCurrentElo = loser.elo || 1000;

//                 // Calculate new ratings
//                 const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//                 // ✅ 3. SAVE MATCH HISTORY (The Blueprint we created)
//                 await Match.create({
//                     roomId,
//                     winner: winnerUsername,
//                     players: [
//                         {
//                             userId: winner._id,
//                             username: winnerUsername,
//                             avatar: winner.avatar,
//                             isWinner: true,
//                             score: room.scores[winnerUsername],
//                             oldElo: winnerCurrentElo,
//                             newElo: newWinnerRating
//                         },
//                         {
//                             userId: loser._id,
//                             username: loserUsername,
//                             avatar: loser.avatar,
//                             isWinner: false,
//                             score: room.scores[loserUsername],
//                             oldElo: loserCurrentElo,
//                             newElo: newLoserRating
//                         }
//                     ]
//                 });
//                 console.log(`✅ MATCH SAVED: ${roomId}`);

//                 // 4. Update Winner in DB
//                 winner.elo = newWinnerRating;
//                 winner.seasonScore = (winner.seasonScore || 0) + 10;
//                 winner.stats.wins += 1;
//                 winner.stats.matchesPlayed += 1;
//                 await winner.save();

//                 // 5. Update Loser in DB
//                 loser.elo = newLoserRating;
//                 loser.seasonScore = (loser.seasonScore || 0) + 2;
//                 loser.stats.losses += 1;
//                 loser.stats.matchesPlayed += 1;
//                 await loser.save();

//                 // Store changes to send to frontend
//                 eloChanges = {
//                     winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                     loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//                 };
//             }
//         }

//         // 6. Emit Game Over with Results
//         io.to(roomId).emit('game_over', { 
//             scores: room.scores, 
//             winner: winnerUsername,
//             eloChanges 
//         });

//         setTimeout(() => rooms.delete(roomId), 60000);
//       }
//     } catch (err) {
//       console.error("Level Completed Error:", err);
//     }
//   });

//   socket.on('disconnect', async (reason) => {
//     console.log("User Disconnected", socket.id, "reason:", reason);

//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = {
//         live: io.engine.clientsCount,
//         total: totalUsers
//       };
//       io.emit('site_stats', statsData);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });












// server .js with time counter updation but without the ani cheat mechanism 

// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';

// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';

// import Problem from './models/Problem.js';
// import User from './models/User.js';
// // ✅ 1. IMPORT THE MATCH MODEL
// import Match from './models/Match.js';

// // ✅ IMPORT THE NEW ELO HELPER
// import { calculateElo } from './utils/elo.js';

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
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
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

// app.get('/debug/emit-stats', async (req, res) => {
//   try {
//     const total = await User.countDocuments();
//     const payload = { live: io.engine.clientsCount, total };
//     io.emit('site_stats', payload);
//     console.log('Manual emit site_stats', payload);
//     res.json({ sent: payload });
//   } catch (err) {
//     console.error('/debug/emit-stats error', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// (async function logInitialCount() {
//   try {
//     const c = await User.countDocuments();
//     console.log('Initial DB user count:', c);
//   } catch (err) {
//     console.error('Initial DB user count failed:', err);
//   }
// })();

// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };

//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   // ---------------------------------------------------------------------
//   // ✅ JOIN_ROOM LOGIC
//   // ---------------------------------------------------------------------

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       console.log(`🔵 [SERVER] join_room: ${username} → ${roomId} | socket: ${socket.id}`);
//       if (!roomId || !username) {
//         console.log('❌ Missing roomId or username');
//         return;
//       }

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 3 } }]);
//         // ***************************************************************
//         // CHANGE MADE HERE: Added 'startTime' to track the match start
//         // ***************************************************************
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 3, 
//             problems, 
//             scores: {}, 
//             isGameActive: true,
//             startTime: Date.now() 
//         });
//         console.log(`✅ [SERVER] Created room ${roomId}`);
//       }

//       const room = rooms.get(roomId);

//       // ***************************************************************
//       // CHANGE MADE HERE: Calculate remaining time based on startTime
//       // ***************************************************************
//       const totalTimeLimit = 30 * 60; // 1800 seconds
//       const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
//       const remainingTime = Math.max(0, totalTimeLimit - elapsedSeconds);

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         console.log(`🔄 [SERVER] ${username} reconnecting`);
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) {
//           console.log(`❌ [SERVER] Room ${roomId} is FULL`);
//           socket.emit('room_full');
//           return;
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//         console.log(`✅ [SERVER] ${username} assigned to ${side}`);
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId,
//         side,
//         username,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores,
//         // ***************************************************************
//         // CHANGE MADE HERE: Send remainingTime to the client
//         // ***************************************************************
//         remainingTime: remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) {
//       console.error('❌ [SERVER] Join Room Error:', err);
//     }
//   });


//   // ---------------------------------------------------------------------
//   // ✅ UPDATED LEVEL_COMPLETED (ELO + HISTORY SAVE LOGIC)
//   // ---------------------------------------------------------------------

//   socket.on('level_completed', async ({ roomId, username }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       // Update in-game score
//       room.scores[username] = (room.scores[username] || 0) + 10;
//       io.to(roomId).emit('score_update', room.scores);

//       if (room.round < room.totalRounds) {
//         // --- NEXT ROUND LOGIC ---
//         room.round++;
//         io.to(roomId).emit('new_round', {
//           round: room.round,
//           problem: room.problems[room.round - 1],
//           scores: room.scores,
//         });
//       } else {
//         // --- GAME OVER LOGIC (ELO + DB SAVE) ---
//         room.isGameActive = false;
        
//         // 1. Identify Winner and Loser
//         const winnerUsername = Object.keys(room.scores)
//           .reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
        
//         const loserUsername = Object.keys(room.scores).find(u => u !== winnerUsername);

//         let eloChanges = {};

//         // 2. Perform ELO Calculation & Save Match
//         if (winnerUsername && loserUsername) {
//             const winner = await User.findOne({ username: winnerUsername });
//             const loser = await User.findOne({ username: loserUsername });

//             if (winner && loser) {
//                 // NOTE: Using 'elo' instead of 'rating' to match your Match Model
//                 const winnerCurrentElo = winner.elo || 1000;
//                 const loserCurrentElo = loser.elo || 1000;

//                 // Calculate new ratings
//                 const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//                 // ✅ 3. SAVE MATCH HISTORY (The Blueprint we created)
//                 await Match.create({
//                     roomId,
//                     winner: winnerUsername,
//                     players: [
//                         {
//                             userId: winner._id,
//                             username: winnerUsername,
//                             avatar: winner.avatar,
//                             isWinner: true,
//                             score: room.scores[winnerUsername],
//                             oldElo: winnerCurrentElo,
//                             newElo: newWinnerRating
//                         },
//                         {
//                             userId: loser._id,
//                             username: loserUsername,
//                             avatar: loser.avatar,
//                             isWinner: false,
//                             score: room.scores[loserUsername],
//                             oldElo: loserCurrentElo,
//                             newElo: newLoserRating
//                         }
//                     ]
//                 });
//                 console.log(`✅ MATCH SAVED: ${roomId}`);

//                 // 4. Update Winner in DB
//                 winner.elo = newWinnerRating;
//                 winner.seasonScore = (winner.seasonScore || 0) + 10;
//                 winner.stats.wins += 1;
//                 winner.stats.matchesPlayed += 1;
//                 await winner.save();

//                 // 5. Update Loser in DB
//                 loser.elo = newLoserRating;
//                 loser.seasonScore = (loser.seasonScore || 0) + 2;
//                 loser.stats.losses += 1;
//                 loser.stats.matchesPlayed += 1;
//                 await loser.save();

//                 // Store changes to send to frontend
//                 eloChanges = {
//                     winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                     loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//                 };
//             }
//         }

//         // 6. Emit Game Over with Results
//         io.to(roomId).emit('game_over', { 
//             scores: room.scores, 
//             winner: winnerUsername,
//             eloChanges 
//         });

//         setTimeout(() => rooms.delete(roomId), 60000);
//       }
//     } catch (err) {
//       console.error("Level Completed Error:", err);
//     }
//   });

//   socket.on('disconnect', async (reason) => {
//     console.log("User Disconnected", socket.id, "reason:", reason);

//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = {
//         live: io.engine.clientsCount,
//         total: totalUsers
//       };
//       io.emit('site_stats', statsData);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });







// server js code with proper time updation and with anti cheat mechanism
// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';

// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';

// import Problem from './models/Problem.js';
// import User from './models/User.js';
// // ✅ 1. IMPORT THE MATCH MODEL
// import Match from './models/Match.js';

// // ✅ IMPORT THE NEW ELO HELPER
// import { calculateElo } from './utils/elo.js';

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
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
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

// app.get('/debug/emit-stats', async (req, res) => {
//   try {
//     const total = await User.countDocuments();
//     const payload = { live: io.engine.clientsCount, total };
//     io.emit('site_stats', payload);
//     console.log('Manual emit site_stats', payload);
//     res.json({ sent: payload });
//   } catch (err) {
//     console.error('/debug/emit-stats error', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// (async function logInitialCount() {
//   try {
//     const c = await User.countDocuments();
//     console.log('Initial DB user count:', c);
//   } catch (err) {
//     console.error('Initial DB user count failed:', err);
//   }
// })();

// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };

//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   // ---------------------------------------------------------------------
//   // ✅ JOIN_ROOM LOGIC
//   // ---------------------------------------------------------------------

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       console.log(`🔵 [SERVER] join_room: ${username} → ${roomId} | socket: ${socket.id}`);
//       if (!roomId || !username) {
//         console.log('❌ Missing roomId or username');
//         return;
//       }

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 3 } }]);
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 3, 
//             problems, 
//             scores: {}, 
//             isGameActive: true,
//             startTime: Date.now() 
//         });
//         console.log(`✅ [SERVER] Created room ${roomId}`);
//       }

//       const room = rooms.get(roomId);

//       const totalTimeLimit = 30 * 60; // 1800 seconds
//       const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
//       const remainingTime = Math.max(0, totalTimeLimit - elapsedSeconds);

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         console.log(`🔄 [SERVER] ${username} reconnecting`);
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) {
//           console.log(`❌ [SERVER] Room ${roomId} is FULL`);
//           socket.emit('room_full');
//           return;
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//         console.log(`✅ [SERVER] ${username} assigned to ${side}`);
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId,
//         side,
//         username,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores,
//         remainingTime: remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) {
//       console.error('❌ [SERVER] Join Room Error:', err);
//     }
//   });


//   // ---------------------------------------------------------------------
//   // ✅ UPDATED LEVEL_COMPLETED (ELO + HISTORY SAVE LOGIC)
//   // ---------------------------------------------------------------------

//   socket.on('level_completed', async ({ roomId, username }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       room.scores[username] = (room.scores[username] || 0) + 10;
//       io.to(roomId).emit('score_update', room.scores);

//       if (room.round < room.totalRounds) {
//         room.round++;
//         io.to(roomId).emit('new_round', {
//           round: room.round,
//           problem: room.problems[room.round - 1],
//           scores: room.scores,
//         });
//       } else {
//         room.isGameActive = false;
//         const winnerUsername = Object.keys(room.scores)
//           .reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
//         const loserUsername = Object.keys(room.scores).find(u => u !== winnerUsername);

//         let eloChanges = {};

//         if (winnerUsername && loserUsername) {
//             const winner = await User.findOne({ username: winnerUsername });
//             const loser = await User.findOne({ username: loserUsername });

//             if (winner && loser) {
//                 const winnerCurrentElo = winner.elo || 1000;
//                 const loserCurrentElo = loser.elo || 1000;
//                 const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//                 await Match.create({
//                     roomId,
//                     winner: winnerUsername,
//                     players: [
//                         {
//                             userId: winner._id,
//                             username: winnerUsername,
//                             avatar: winner.avatar,
//                             isWinner: true,
//                             score: room.scores[winnerUsername],
//                             oldElo: winnerCurrentElo,
//                             newElo: newWinnerRating
//                         },
//                         {
//                             userId: loser._id,
//                             username: loserUsername,
//                             avatar: loser.avatar,
//                             isWinner: false,
//                             score: room.scores[loserUsername],
//                             oldElo: loserCurrentElo,
//                             newElo: newLoserRating
//                         }
//                     ]
//                 });

//                 winner.elo = newWinnerRating;
//                 winner.seasonScore = (winner.seasonScore || 0) + 10;
//                 winner.stats.wins += 1;
//                 winner.stats.matchesPlayed += 1;
//                 await winner.save();

//                 loser.elo = newLoserRating;
//                 loser.seasonScore = (loser.seasonScore || 0) + 2;
//                 loser.stats.losses += 1;
//                 loser.stats.matchesPlayed += 1;
//                 await loser.save();

//                 eloChanges = {
//                     winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                     loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//                 };
//             }
//         }

//         io.to(roomId).emit('game_over', { 
//             scores: room.scores, 
//             winner: winnerUsername,
//             eloChanges 
//         });

//         setTimeout(() => rooms.delete(roomId), 60000);
//       }
//     } catch (err) {
//       console.error("Level Completed Error:", err);
//     }
//   });

//   // *********************************************************************
//   // ✅ CHANGE MADE HERE: Added 'cheating_detected' listener
//   // *********************************************************************
//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       room.isGameActive = false;
//       const loserUsername = username;
//       const winnerUsername = room.players.find(p => p.username !== loserUsername)?.username;

//       if (winnerUsername && loserUsername) {
//         const winner = await User.findOne({ username: winnerUsername });
//         const loser = await User.findOne({ username: loserUsername });

//         if (winner && loser) {
//           const winnerCurrentElo = winner.elo || 1000;
//           const loserCurrentElo = loser.elo || 1000;
          
//           // Penalize cheater more severely (pointsExchanged + fixed penalty)
//           const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//           await Match.create({
//             roomId,
//             winner: winnerUsername,
//             isDisqualified: true,
//             disqualifiedPlayer: loserUsername,
//             players: [
//               {
//                 userId: winner._id,
//                 username: winnerUsername,
//                 avatar: winner.avatar,
//                 isWinner: true,
//                 score: room.scores[winnerUsername],
//                 oldElo: winnerCurrentElo,
//                 newElo: newWinnerRating,
//                 statusText: "Opponent Disqualification"
//               },
//               {
//                 userId: loser._id,
//                 username: loserUsername,
//                 avatar: loser.avatar,
//                 isWinner: false,
//                 score: room.scores[loserUsername],
//                 oldElo: loserCurrentElo,
//                 newElo: newLoserRating,
//                 statusText: "Unfair Practice"
//               }
//             ]
//           });

//           // Update Winner stats
//           winner.elo = newWinnerRating;
//           winner.stats.wins += 1;
//           winner.stats.matchesPlayed += 1;
//           await winner.save();

//           // Update Loser stats
//           loser.elo = newLoserRating;
//           loser.stats.losses += 1;
//           loser.stats.matchesPlayed += 1;
//           await loser.save();

//           io.to(roomId).emit('game_over', {
//             winner: winnerUsername,
//             scores: room.scores,
//             isDisqualified: true,
//             disqualifiedPlayer: loserUsername,
//             reason: reason,
//             eloChanges: {
//                 winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                 loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//             }
//           });
//         }
//       }
//       setTimeout(() => rooms.delete(roomId), 60000);
//     } catch (err) {
//       console.error("Cheating Detection Error:", err);
//     }
//   });

//   socket.on('disconnect', async (reason) => {
//     console.log("User Disconnected", socket.id, "reason:", reason);

//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = {
//         live: io.engine.clientsCount,
//         total: totalUsers
//       };
//       io.emit('site_stats', statsData);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });





// updated server code with proper time , anti cheat and dealyed cold start fix 
// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';

// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';
// import statsRoutes from './routes/statsRoutes.js';
// import userRoutes from './routes/userRoutes.js'; 
// import matchRoutes from './routes/matchRoutes.js';

// import Problem from './models/Problem.js';
// import User from './models/User.js';
// import Match from './models/Match.js';
// import { calculateElo } from './utils/elo.js';

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


// // // NEED TO BE CROSSCHECKED 
// // // ✅ PLACE THIS AT THE VERY TOP (Right after const app = express())
// // app.get('/api/health', (req, res) => {
// //     res.status(200).json({ status: 'warm', timestamp: new Date() });
// // });

// // // ✅ UPDATED INTERNAL SELF-PING
// // setInterval(async () => {
// //     try {
// //         // We prioritize the Render URL directly to avoid any "undefined" issues
// //         const url = "https://codearena-1v1.onrender.com"; 
// //         const response = await fetch(`${url}/api/health`);
        
// //         if (response.ok) {
// //             console.log('💓 Heartbeat: Internal keep-alive successful.');
// //         } else {
// //             console.warn(`💓 Heartbeat: Server responded with ${response.status}`);
// //         }
// //     } catch (err) {
// //         console.error('💔 Heartbeat failed:', err.message);
// //     }
// // }, 840000); // 14 minutes

// app.use((req, res, next) => {
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
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

// app.get('/debug/emit-stats', async (req, res) => {
//   try {
//     const total = await User.countDocuments();
//     const payload = { live: io.engine.clientsCount, total };
//     io.emit('site_stats', payload);
//     res.json({ sent: payload });
//   } catch (err) {
//     console.error('/debug/emit-stats error', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// (async function logInitialCount() {
//   try {
//     const c = await User.countDocuments();
//     console.log('Initial DB user count:', c);
//   } catch (err) {
//     console.error('Initial DB user count failed:', err);
//   }
// })();

// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = { live: io.engine.clientsCount, total: totalUsers };
//     socket.emit('site_stats', statsData);
//     socket.broadcast.emit('site_stats', statsData);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return;

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 3 } }]);
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 3, 
//             problems, 
//             scores: {}, 
//             isGameActive: true,
//             startTime: Date.now() 
//         });
//       }

//       const room = rooms.get(roomId);
//       const totalTimeLimit = 30 * 60;
//       const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
//       const remainingTime = Math.max(0, totalTimeLimit - elapsedSeconds);

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) {
//           socket.emit('room_full');
//           return;
//         }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId, side, username,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores,
//         remainingTime: remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) {
//       console.error('❌ [SERVER] Join Room Error:', err);
//     }
//   });

//   // socket.on('level_completed', async ({ roomId, username }) => {
//   //   try {
//   //     const room = rooms.get(roomId);
//   //     if (!room || !room.isGameActive) return;

//   //     room.scores[username] = (room.scores[username] || 0) + 10;
//   //     io.to(roomId).emit('score_update', room.scores);

//   //     if (room.round < room.totalRounds) {
//   //       room.round++;
//   //       io.to(roomId).emit('new_round', {
//   //         round: room.round,
//   //         problem: room.problems[room.round - 1],
//   //         scores: room.scores,
//   //       });
//   //     } else {
//   //       room.isGameActive = false;
//   //       const winnerUsername = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
//   //       const loserUsername = Object.keys(room.scores).find(u => u !== winnerUsername);

//   //       let eloChanges = {};
//   //       if (winnerUsername && loserUsername) {
//   //           const winner = await User.findOne({ username: winnerUsername });
//   //           const loser = await User.findOne({ username: loserUsername });

//   //           if (winner && loser) {
//   //               const winnerCurrentElo = winner.elo || 1000;
//   //               const loserCurrentElo = loser.elo || 1000;
//   //               const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//   //               await Match.create({
//   //                   roomId, winner: winnerUsername,
//   //                   players: [
//   //                       { userId: winner._id, username: winnerUsername, avatar: winner.avatar, isWinner: true, score: room.scores[winnerUsername], oldElo: winnerCurrentElo, newElo: newWinnerRating },
//   //                       { userId: loser._id, username: loserUsername, avatar: loser.avatar, isWinner: false, score: room.scores[loserUsername], oldElo: loserCurrentElo, newElo: newLoserRating }
//   //                   ]
//   //               });

//   //               winner.elo = newWinnerRating;
//   //               winner.seasonScore = (winner.seasonScore || 0) + 10;
//   //               winner.stats.wins += 1;
//   //               winner.stats.matchesPlayed += 1;
//   //               await winner.save();

//   //               loser.elo = newLoserRating;
//   //               loser.seasonScore = (loser.seasonScore || 0) + 2;
//   //               loser.stats.losses += 1;
//   //               loser.stats.matchesPlayed += 1;
//   //               await loser.save();

//   //               eloChanges = {
//   //                   winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//   //                   loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//   //               };
//   //           }
//   //       }
//   //       io.to(roomId).emit('game_over', { scores: room.scores, winner: winnerUsername, eloChanges });
//   //       setTimeout(() => rooms.delete(roomId), 60000);
//   //     }
//   //   } catch (err) {
//   //     console.error("Level Completed Error:", err);
//   //   }
//   // });
//   socket.on('level_completed', async ({ roomId, username }) => {
//     try {
//         const room = rooms.get(roomId);
//         if (!room || !room.isGameActive) return;

//         room.scores[username] = (room.scores[username] || 0) + 10;
//         io.to(roomId).emit('score_update', room.scores);

//         if (room.round < room.totalRounds) {
//             room.round++;
//             io.to(roomId).emit('new_round', {
//                 round: room.round,
//                 problem: room.problems[room.round - 1],
//                 scores: room.scores,
//             });
//         } else {
//             room.isGameActive = false;
            
//             // ✅ Fix: Robust Winner Logic
//             const players = Object.keys(room.scores);
//             const winnerUsername = players.length > 0 
//                 ? players.reduce((a, b) => room.scores[a] >= room.scores[b] ? a : b)
//                 : username;
            
//             const loserUsername = players.find(u => u !== winnerUsername);
//             let eloChanges = {};

//             // ✅ Fix: Field Name Consistency (using .rating from your User Model)
//             if (winnerUsername && loserUsername) {
//                 try {
//                     const winner = await User.findOne({ username: winnerUsername });
//                     const loser = await User.findOne({ username: loserUsername });

//                     if (winner && loser) {
//                         const winnerCurrentElo = winner.rating || 1000;
//                         const loserCurrentElo = loser.rating || 1000;
//                         const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//                         await Match.create({
//                             roomId,
//                             winner: winnerUsername,
//                             players: [
//                                 { userId: winner._id, username: winnerUsername, avatar: winner.avatar, isWinner: true, score: room.scores[winnerUsername], oldElo: winnerCurrentElo, newElo: newWinnerRating },
//                                 { userId: loser._id, username: loserUsername, avatar: loser.avatar, isWinner: false, score: room.scores[loserUsername], oldElo: loserCurrentElo, newElo: newLoserRating }
//                             ]
//                         });

//                         winner.rating = newWinnerRating;
//                         winner.stats.wins += 1;
//                         winner.stats.matchesPlayed += 1;
//                         await winner.save();

//                         loser.rating = newLoserRating;
//                         loser.stats.losses += 1;
//                         loser.stats.matchesPlayed += 1;
//                         await loser.save();

//                         eloChanges = {
//                             winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                             loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//                         };
//                     }
//                 } catch (dbErr) {
//                     console.error("Database save failed, but ending game anyway:", dbErr);
//                 }
//             }

//             // ✅ CRITICAL: Move emit outside the nested try to ensure it ALWAYS reaches the user
//             io.to(roomId).emit('game_over', { 
//                 scores: room.scores, 
//                 winner: winnerUsername,
//                 isDisqualified: false,
//                 eloChanges 
//             });

//             setTimeout(() => rooms.delete(roomId), 60000);
//         }
//     } catch (err) {
//         console.error("Final Level Error:", err);
//     }
// });

//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       room.isGameActive = false;
//       const loserUsername = username;
//       const winnerUsername = room.players.find(p => p.username !== loserUsername)?.username;

//       if (winnerUsername && loserUsername) {
//         const winner = await User.findOne({ username: winnerUsername });
//         const loser = await User.findOne({ username: loserUsername });

//         if (winner && loser) {
//           const winnerCurrentElo = winner.elo || 1000;
//           const loserCurrentElo = loser.elo || 1000;
//           const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

//           await Match.create({
//             roomId, winner: winnerUsername, isDisqualified: true, disqualifiedPlayer: loserUsername,
//             players: [
//               { userId: winner._id, username: winnerUsername, avatar: winner.avatar, isWinner: true, score: room.scores[winnerUsername], oldElo: winnerCurrentElo, newElo: newWinnerRating, statusText: "Opponent Disqualification" },
//               { userId: loser._id, username: loserUsername, avatar: loser.avatar, isWinner: false, score: room.scores[loserUsername], oldElo: loserCurrentElo, newElo: newLoserRating, statusText: "Unfair Practice" }
//             ]
//           });

//           winner.elo = newWinnerRating; winner.stats.wins += 1; winner.stats.matchesPlayed += 1; await winner.save();
//           loser.elo = newLoserRating; loser.stats.losses += 1; loser.stats.matchesPlayed += 1; await loser.save();

//           io.to(roomId).emit('game_over', {
//             winner: winnerUsername, scores: room.scores, isDisqualified: true, disqualifiedPlayer: loserUsername, reason,
//             eloChanges: {
//                 winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
//                 loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
//             }
//           });
//         }
//       }
//       setTimeout(() => rooms.delete(roomId), 60000);
//     } catch (err) {
//       console.error("Cheating Detection Error:", err);
//     }
//   });

//   socket.on('disconnect', async (reason) => {
//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = { live: io.engine.clientsCount, total: totalUsers };
//       io.emit('site_stats', statsData);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });






















import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import roomRoutes from './routes/roomRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import matchRoutes from './routes/matchRoutes.js';

import Problem from './models/Problem.js';
import User from './models/User.js';
import Match from './models/Match.js';
import { calculateElo } from './utils/elo.js';

dotenv.config();
connectDB();

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
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
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

app.get('/', (req, res) => res.send('OK'));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.locals.io = io;

app.get('/debug/emit-stats', async (req, res) => {
  try {
    const total = await User.countDocuments();
    const payload = { live: io.engine.clientsCount, total };
    io.emit('site_stats', payload);
    res.json({ sent: payload });
  } catch (err) {
    console.error('/debug/emit-stats error', err);
    res.status(500).json({ error: err.message });
  }
});

(async function logInitialCount() {
  try {
    const c = await User.countDocuments();
    console.log('Initial DB user count:', c);
  } catch (err) {
    console.error('Initial DB user count failed:', err);
  }
})();

const rooms = new Map();

io.on('connection', async (socket) => {
  console.log(`User Connected: ${socket.id}`);

  try {
    const totalUsers = await User.countDocuments();
    const statsData = { live: io.engine.clientsCount, total: totalUsers };
    socket.emit('site_stats', statsData);
    socket.broadcast.emit('site_stats', statsData);
  } catch (err) {
    console.error("Error fetching stats on connection:", err);
  }

  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      if (!roomId || !username) return;

      if (!rooms.has(roomId)) {
        const problems = await Problem.aggregate([{ $sample: { size: 3 } }]);
        rooms.set(roomId, { 
            players: [], 
            round: 1, 
            totalRounds: 3, 
            problems, 
            scores: {}, 
            isGameActive: true,
            startTime: Date.now() 
        });
      }

      const room = rooms.get(roomId);
      const totalTimeLimit = 30 * 60;
      const elapsedSeconds = Math.floor((Date.now() - room.startTime) / 1000);
      const remainingTime = Math.max(0, totalTimeLimit - elapsedSeconds);

      let playerIndex = room.players.findIndex((p) => p.username === username);
      let side; let isReconnect = false;

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
      socket.emit('room_joined', {
        roomId, side, username,
        players: room.players,
        problem: room.problems[room.round - 1],
        round: room.round,
        totalRounds: room.totalRounds,
        scores: room.scores,
        remainingTime: remainingTime 
      });

      if (!isReconnect) {
        socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
      }
    } catch (err) {
      console.error('❌ [SERVER] Join Room Error:', err);
    }
  });

  socket.on('level_completed', async ({ roomId, username }) => {
    try {
        const room = rooms.get(roomId);
        if (!room || !room.isGameActive) return;

        room.scores[username] = (room.scores[username] || 0) + 10;
        io.to(roomId).emit('score_update', room.scores);

        if (room.round < room.totalRounds) {
            room.round++;
            io.to(roomId).emit('new_round', {
                round: room.round,
                problem: room.problems[room.round - 1],
                scores: room.scores,
            });
        } else {
            room.isGameActive = false;
            
            const players = Object.keys(room.scores);
            const winnerUsername = players.length > 0 
                ? players.reduce((a, b) => room.scores[a] >= room.scores[b] ? a : b)
                : username;
            
            const loserUsername = players.find(u => u !== winnerUsername);
            let eloChanges = {};

            if (winnerUsername && loserUsername) {
                try {
                    const winner = await User.findOne({ username: winnerUsername });
                    const loser = await User.findOne({ username: loserUsername });

                    if (winner && loser) {
                        // ✅ FIELD CONSISTENCY: Using .rating
                        const winnerCurrentElo = winner.rating || 1000;
                        const loserCurrentElo = loser.rating || 1000;
                        const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

                        await Match.create({
                            roomId,
                            winner: winnerUsername,
                            players: [
                                { userId: winner._id, username: winnerUsername, avatar: winner.avatar, isWinner: true, score: room.scores[winnerUsername], oldElo: winnerCurrentElo, newElo: newWinnerRating },
                                { userId: loser._id, username: loserUsername, avatar: loser.avatar, isWinner: false, score: room.scores[loserUsername], oldElo: loserCurrentElo, newElo: newLoserRating }
                            ]
                        });

                        winner.rating = newWinnerRating;
                        winner.stats.wins += 1;
                        winner.stats.matchesPlayed += 1;
                        await winner.save();

                        loser.rating = newLoserRating;
                        loser.stats.losses += 1;
                        loser.stats.matchesPlayed += 1;
                        await loser.save();

                        eloChanges = {
                            winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
                            loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
                        };
                    }
                } catch (dbErr) {
                    console.error("Match History update error:", dbErr);
                }
            }

            // ✅ SCORECARD FIX: Emit outside DB logic to ensure it reaches frontend
            io.to(roomId).emit('game_over', { 
                scores: room.scores, 
                winner: winnerUsername,
                isDisqualified: false,
                eloChanges 
            });

            setTimeout(() => rooms.delete(roomId), 60000);
        }
    } catch (err) {
        console.error("Final Level Error:", err);
    }
  });

  socket.on('cheating_detected', async ({ roomId, username, reason }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;

      room.isGameActive = false;
      const loserUsername = username;
      const winnerUsername = room.players.find(p => p.username !== loserUsername)?.username;

      if (winnerUsername && loserUsername) {
        const winner = await User.findOne({ username: winnerUsername });
        const loser = await User.findOne({ username: loserUsername });

        if (winner && loser) {
          // ✅ FIELD CONSISTENCY: Using .rating
          const winnerCurrentElo = winner.rating || 1000;
          const loserCurrentElo = loser.rating || 1000;
          const { newWinnerRating, newLoserRating, pointsExchanged } = calculateElo(winnerCurrentElo, loserCurrentElo);

          await Match.create({
            roomId, winner: winnerUsername, isDisqualified: true, disqualifiedPlayer: loserUsername,
            players: [
              { userId: winner._id, username: winnerUsername, avatar: winner.avatar, isWinner: true, score: room.scores[winnerUsername], oldElo: winnerCurrentElo, newElo: newWinnerRating, statusText: "Opponent Disqualification" },
              { userId: loser._id, username: loserUsername, avatar: loser.avatar, isWinner: false, score: room.scores[loserUsername], oldElo: loserCurrentElo, newElo: newLoserRating, statusText: "Unfair Practice" }
            ]
          });

          winner.rating = newWinnerRating; winner.stats.wins += 1; winner.stats.matchesPlayed += 1; await winner.save();
          loser.rating = newLoserRating; loser.stats.losses += 1; loser.stats.matchesPlayed += 1; await loser.save();

          io.to(roomId).emit('game_over', {
            winner: winnerUsername, scores: room.scores, isDisqualified: true, disqualifiedPlayer: loserUsername, reason,
            eloChanges: {
                winner: { username: winnerUsername, newRating: newWinnerRating, points: pointsExchanged },
                loser: { username: loserUsername, newRating: newLoserRating, points: -pointsExchanged }
            }
          });
        }
      }
      setTimeout(() => rooms.delete(roomId), 60000);
    } catch (err) {
      console.error("Cheating Detection Error:", err);
    }
  });

  socket.on('disconnect', async (reason) => {
    try {
      const totalUsers = await User.countDocuments();
      const statsData = { live: io.engine.clientsCount, total: totalUsers };
      io.emit('site_stats', statsData);
    } catch (e) {
      console.error("Error fetching stats on disconnect:", e);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});