// MORE THAN PERFECT SERVER.JS JUST A MINOR CHANGE NOT DONE ABOUT ELO AND LEADERBOARD UPDATION

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
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]);
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problems, 
//             scores: {}, 
//             isGameActive: true,
//             startTime: Date.now(),
//             cheaters: new Set() // ✅ TRACK CHEATERS INTERNALLY
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
            
//             const players = Object.keys(room.scores);
//             let winnerUsername;
//             let isDisqualifiedMatch = room.cheaters && room.cheaters.size > 0;

//             // ✅ DELAYED JUSTICE LOGIC
//             if (isDisqualifiedMatch) {
//                 // Winner is the person who DID NOT cheat.
//                 winnerUsername = players.find(p => !room.cheaters.has(p)) || players[0];
//             } else {
//                 // Normal highest score wins
//                 winnerUsername = players.reduce((a, b) => room.scores[a] >= room.scores[b] ? a : b);
//             }
            
//             const loserUsername = players.find(u => u !== winnerUsername);
//             let eloChanges = {};

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
//                             isDisqualified: isDisqualifiedMatch,
//                             disqualifiedPlayer: isDisqualifiedMatch ? [...room.cheaters][0] : null,
//                             players: [
//                                 { 
//                                   userId: winner._id, 
//                                   username: winnerUsername, 
//                                   avatar: winner.avatar, 
//                                   isWinner: true, 
//                                   score: room.scores[winnerUsername], 
//                                   oldElo: winnerCurrentElo, 
//                                   newElo: newWinnerRating,
//                                   statusText: isDisqualifiedMatch ? "Opponent Disqualified" : "" // ✅ History Message
//                                 },
//                                 { 
//                                   userId: loser._id, 
//                                   username: loserUsername, 
//                                   avatar: loser.avatar, 
//                                   isWinner: false, 
//                                   score: room.scores[loserUsername], 
//                                   oldElo: loserCurrentElo, 
//                                   newElo: newLoserRating,
//                                   statusText: isDisqualifiedMatch ? "Disqualified" : "" // ✅ 'D' Trigger
//                                 }
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
//                     console.error("Match persistence failed:", dbErr);
//                 }
//             }

//             io.to(roomId).emit('game_over', { 
//                 scores: room.scores, 
//                 winner: winnerUsername,
//                 isDisqualified: isDisqualifiedMatch,
//                 disqualifiedPlayer: isDisqualifiedMatch ? [...room.cheaters][0] : null,
//                 eloChanges 
//             });

//             setTimeout(() => rooms.delete(roomId), 60000);
//         }
//     } catch (err) {
//         console.error("Final Level Error:", err);
//     }
//   });

//   // ✅ MODIFIED: CHEATING DETECTED (Silent Flagging)
//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       // Log cheater internally - do NOT stop the match
//       room.cheaters.add(username);
//       console.log(`⚠️ [SERVER] Cheat flagged: ${username} | Reason: ${reason}`);
      
//       // Notify the cheater silently (optional)
//       socket.emit('cheat_warning', { reason });
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

















// // MOST OPTIMAL SERVER.JS FILE WITH CHEATING DETECTION AND ELO UPDATION FIXED ALONG WITH LEADERBOARD UPDATION FIXED AS WELL AS PROPER MATCH HISTORY SAVING DONE
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
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); // ✅ Standardized to 3 rounds
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problems, 
//             scores: {}, 
//             isGameActive: true,
//             startTime: Date.now(),
//             cheaters: new Set() // ✅ Internal flag for Delayed Justice
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

//     socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;

//           // 1. Update In-Game Score (Standard 10pts per round)
//           room.scores[username] = (room.scores[username] || 0) + 10;
//           io.to(roomId).emit('score_update', room.scores);

//           // 2. Check if the game should continue or end
//           if (room.round < room.totalRounds) {
//               room.round++;
//               io.to(roomId).emit('new_round', {
//                   round: room.round,
//                   problem: room.problems[room.round - 1],
//                   scores: room.scores,
//               });
//           } else {
//               room.isGameActive = false;
              
//               const players = Object.keys(room.scores);
//               if (players.length < 2) return; // Safety check for solo rooms

//               // Fetch User records from Database
//               const user1 = await User.findOne({ username: players[0] });
//               const user2 = await User.findOne({ username: players[1] });

//               if (!user1 || !user2) return;

//               // ✅ PREPARE DATA FOR THE DYNAMIC ANALYZER
//               const p1Input = {
//                   username: user1.username,
//                   rating: user1.rating || 1000,
//                   score: room.scores[user1.username] || 0,
//                   isCheater: room.cheaters.has(user1.username)
//               };

//               const p2Input = {
//                   username: user2.username,
//                   rating: user2.rating || 1000,
//                   score: room.scores[user2.username] || 0,
//                   isCheater: room.cheaters.has(user2.username)
//               };

//               // ✅ RUN DYNAMIC ELO & SEASON POINT CALCULATION
//               const outcome = calculateMatchOutcome(p1Input, p2Input);

//               // ✅ PERSISTENCE: Player 1
//               user1.rating = outcome.p1.newRating;
//               user1.seasonScore = (user1.seasonScore || 0) + outcome.p1.seasonScore;
//               user1.stats.matchesPlayed += 1;
//               if (outcome.p1.status === "Winner" || outcome.p1.status === "Winner (Opponent DQ)") {
//                   user1.stats.wins += 1;
//               } else if (outcome.p1.status === "Loser") {
//                   user1.stats.losses += 1;
//               }
//               await user1.save();

//               // ✅ PERSISTENCE: Player 2
//               user2.rating = outcome.p2.newRating;
//               user2.seasonScore = (user2.seasonScore || 0) + outcome.p2.seasonScore;
//               user2.stats.matchesPlayed += 1;
//               if (outcome.p2.status === "Winner" || outcome.p2.status === "Winner (Opponent DQ)") {
//                   user2.stats.wins += 1;
//               } else if (outcome.p2.status === "Loser") {
//                   user2.stats.losses += 1;
//               }
//               await user2.save();

//               // ✅ CREATE MATCH RECORD FOR HISTORY
//               await Match.create({
//                   roomId,
//                   winner: outcome.p1.status.includes("Winner") ? user1.username : (outcome.p2.status.includes("Winner") ? user2.username : null),
//                   isDisqualified: room.cheaters.size > 0,
//                   disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//                   players: [
//                       { 
//                           userId: user1._id, 
//                           username: user1.username, 
//                           avatar: user1.avatar, 
//                           isWinner: outcome.p1.status.includes("Winner"), 
//                           score: p1Input.score, 
//                           oldElo: p1Input.rating, 
//                           newElo: outcome.p1.newRating,
//                           statusText: p1Input.isCheater ? "Disqualified" : (outcome.p2.isCheater ? "Opponent DQ" : "")
//                       },
//                       { 
//                           userId: user2._id, 
//                           username: user2.username, 
//                           avatar: user2.avatar, 
//                           isWinner: outcome.p2.status.includes("Winner"), 
//                           score: p2Input.score, 
//                           oldElo: p2Input.rating, 
//                           newElo: outcome.p2.newRating,
//                           statusText: p2Input.isCheater ? "Disqualified" : (outcome.p1.isCheater ? "Opponent DQ" : "")
//                       }
//                   ]
//               });

//               // ✅ EMIT FINAL RESULTS
//               io.to(roomId).emit('game_over', { 
//                   scores: room.scores, 
//                   winner: outcome.p1.status.includes("Winner") ? user1.username : user2.username,
//                   isDisqualified: room.cheaters.size > 0,
//                   eloChanges: {
//                       p1: { username: user1.username, newRating: outcome.p1.newRating, points: outcome.p1.pointsGained },
//                       p2: { username: user2.username, newRating: outcome.p2.newRating, points: outcome.p2.pointsGained }
//                   }
//               });

//               setTimeout(() => rooms.delete(roomId), 60000);
//           }
//       } catch (err) {
//           console.error("Final Level Error:", err);
//       }
//   });
//   // ✅ MODIFIED: Silent Flagging for Anti-Cheat
//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;

//       room.cheaters.add(username);
//       console.log(`⚠️ [SERVER] Cheat flagged: ${username} | Reason: ${reason}`);
      
//       socket.emit('cheat_warning', { reason });
//     } catch (err) {
//       console.error("Cheating Detection Error:", err);
//     }
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
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });









































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
// // 1. GLOBAL TIMER STORAGE
// const roomTimers = new Map();

// // 2. HELPER: END GAME LOGIC (Reuse for Time Up & Completion)
// const handleGameEnd = async (roomId, room) => {
//     if (!room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear Timer
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     const players = Object.keys(room.scores);
//     if (players.length < 2) return; 

//     const user1 = await User.findOne({ username: players[0] });
//     const user2 = await User.findOne({ username: players[1] });

//     if (!user1 || !user2) return;

//     const p1Input = {
//         username: user1.username,
//         rating: user1.rating || 1000,
//         score: room.scores[user1.username] || 0,
//         isCheater: room.cheaters.has(user1.username)
//     };

//     const p2Input = {
//         username: user2.username,
//         rating: user2.rating || 1000,
//         score: room.scores[user2.username] || 0,
//         isCheater: room.cheaters.has(user2.username)
//     };

//     const outcome = calculateMatchOutcome(p1Input, p2Input);

//     // Update DB (P1)
//     user1.rating = outcome.p1.newRating;
//     user1.seasonScore = (user1.seasonScore || 0) + outcome.p1.seasonScore;
//     user1.stats.matchesPlayed += 1;
//     if (outcome.p1.status.includes("Winner")) user1.stats.wins += 1;
//     else if (outcome.p1.status === "Loser") user1.stats.losses += 1;
//     await user1.save();

//     // Update DB (P2)
//     user2.rating = outcome.p2.newRating;
//     user2.seasonScore = (user2.seasonScore || 0) + outcome.p2.seasonScore;
//     user2.stats.matchesPlayed += 1;
//     if (outcome.p2.status.includes("Winner")) user2.stats.wins += 1;
//     else if (outcome.p2.status === "Loser") user2.stats.losses += 1;
//     await user2.save();

//     await Match.create({
//         roomId,
//         winner: outcome.p1.status.includes("Winner") ? user1.username : (outcome.p2.status.includes("Winner") ? user2.username : null),
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         players: [
//             { userId: user1._id, username: user1.username, avatar: user1.avatar, isWinner: outcome.p1.status.includes("Winner"), score: p1Input.score, oldElo: p1Input.rating, newElo: outcome.p1.newRating, statusText: p1Input.isCheater ? "Disqualified" : "" },
//             { userId: user2._id, username: user2.username, avatar: user2.avatar, isWinner: outcome.p2.status.includes("Winner"), score: p2Input.score, oldElo: p2Input.rating, newElo: outcome.p2.newRating, statusText: p2Input.isCheater ? "Disqualified" : "" }
//         ]
//     });

//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: outcome.p1.status.includes("Winner") ? user1.username : user2.username,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: {
//             p1: { username: user1.username, newRating: outcome.p1.newRating, points: outcome.p1.pointsGained },
//             p2: { username: user2.username, newRating: outcome.p2.newRating, points: outcome.p2.pointsGained }
//         }
//     });

//     setTimeout(() => rooms.delete(roomId), 60000);
// };

// // 3. START TIMER FUNCTION
// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));

//     let timeLeft = duration;
    
//     const timerId = setInterval(() => {
//         timeLeft--;
        
//         // Sync time with clients every 30s to fix drift
//         if(timeLeft % 30 === 0) {
//            io.to(roomId).emit('sync_time', timeLeft);
//         }

//         if (timeLeft <= 0) {
//             clearInterval(timerId);
//             const room = rooms.get(roomId);
//             if(room) handleGameEnd(roomId, room); // FORCE END ON TIME OUT
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
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return;

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); 
        
//         // Initialize Room
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problems, 
//             scores: {}, 
//             // TRACK WHO FINISHED CURRENT ROUND
//             roundCompletions: new Set(), 
//             isGameActive: true,
//             startTime: Date.now(),
//             cheaters: new Set() 
//         });

//         // START THE SERVER TIMER (30 Minutes)
//         startRoomTimer(roomId, 30 * 60);
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

//   // ✅ UPDATED LEVEL COMPLETED LOGIC
//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;

//           // Prevent double submission for same round
//           if(room.roundCompletions.has(username)) return;

//           // 1. Give Points
//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username); // Mark user as finished
//           io.to(roomId).emit('score_update', room.scores);

//           // // 2. CHECK: Have ALL players finished?
//           // if (room.roundCompletions.size === room.players.length) {
//              if (room.roundCompletions.size > 0) {
              
//               if (room.round < room.totalRounds) {
//                   // --- NEXT ROUND ---
//                   room.round++;
//                   room.roundCompletions.clear(); // Reset for new round
                  
//                   io.to(roomId).emit('new_round', {
//                       round: room.round,
//                       problem: room.problems[room.round - 1],
//                       scores: room.scores,
//                   });
//               } else {
//                   // --- GAME OVER ---
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
//       console.log(`⚠️ [SERVER] Cheat flagged: ${username} | Reason: ${reason}`);
//       socket.emit('cheat_warning', { reason });
//     } catch (err) {
//       console.error("Cheating Detection Error:", err);
//     }
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
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });














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
// // 1. GLOBAL TIMER STORAGE
// const roomTimers = new Map();

// // 2. HELPER: END GAME LOGIC (Fail-Safe Version)
// const handleGameEnd = async (roomId, room) => {
//     if (!room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear Timer
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     // Calculate basic winner based on score immediately (Fallback)
//     const players = Object.keys(room.scores);
//     let winner = players.length > 0 
//         ? players.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b)
//         : null;

//     let eloChanges = null;

//     // --- DB UPDATE SECTION ---
//     // We wrap this in a TRY block so if it fails (e.g. testing with fake users),
//     // the Game Over screen STILL appears.
//     if (players.length === 2) {
//         try {
//             const user1 = await User.findOne({ username: players[0] });
//             const user2 = await User.findOne({ username: players[1] });

//             // Only run ELO logic if BOTH users exist in DB
//             if (user1 && user2) {
//                 const p1Input = {
//                     username: user1.username,
//                     rating: user1.rating || 1000,
//                     score: room.scores[user1.username] || 0,
//                     isCheater: room.cheaters.has(user1.username)
//                 };

//                 const p2Input = {
//                     username: user2.username,
//                     rating: user2.rating || 1000,
//                     score: room.scores[user2.username] || 0,
//                     isCheater: room.cheaters.has(user2.username)
//                 };

//                 const outcome = calculateMatchOutcome(p1Input, p2Input);

//                 // Update DB (P1)
//                 user1.rating = outcome.p1.newRating;
//                 user1.seasonScore = (user1.seasonScore || 0) + outcome.p1.seasonScore;
//                 user1.stats.matchesPlayed += 1;
//                 if (outcome.p1.status.includes("Winner")) user1.stats.wins += 1;
//                 else if (outcome.p1.status === "Loser") user1.stats.losses += 1;
//                 await user1.save();

//                 // Update DB (P2)
//                 user2.rating = outcome.p2.newRating;
//                 user2.seasonScore = (user2.seasonScore || 0) + outcome.p2.seasonScore;
//                 user2.stats.matchesPlayed += 1;
//                 if (outcome.p2.status.includes("Winner")) user2.stats.wins += 1;
//                 else if (outcome.p2.status === "Loser") user2.stats.losses += 1;
//                 await user2.save();

//                 // Save Match History
//                 await Match.create({
//                     roomId,
//                     winner: outcome.p1.status.includes("Winner") ? user1.username : (outcome.p2.status.includes("Winner") ? user2.username : null),
//                     isDisqualified: room.cheaters.size > 0,
//                     disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//                     players: [
//                         { userId: user1._id, username: user1.username, avatar: user1.avatar, isWinner: outcome.p1.status.includes("Winner"), score: p1Input.score, oldElo: p1Input.rating, newElo: outcome.p1.newRating, statusText: p1Input.isCheater ? "Disqualified" : "" },
//                         { userId: user2._id, username: user2.username, avatar: user2.avatar, isWinner: outcome.p2.status.includes("Winner"), score: p2Input.score, oldElo: p2Input.rating, newElo: outcome.p2.newRating, statusText: p2Input.isCheater ? "Disqualified" : "" }
//                     ]
//                 });

//                 // Prepare Data for Frontend
//                 eloChanges = {
//                     p1: { username: user1.username, newRating: outcome.p1.newRating, points: outcome.p1.pointsGained },
//                     p2: { username: user2.username, newRating: outcome.p2.newRating, points: outcome.p2.pointsGained }
//                 };
                
//                 // Update official winner based on ELO/Anti-cheat logic
//                 winner = outcome.p1.status.includes("Winner") ? user1.username : user2.username;
//             } else {
//                 console.warn("⚠️ Game ended but users not found in DB (Testing Mode?)");
//             }
//         } catch (dbErr) {
//             console.error("❌ DB Update Failed in Game End:", dbErr);
//         }
//     }

//     // ✅ ALWAYS EMIT GAME OVER (Crucial Fix)
//     // This runs even if DB fails or players < 2
//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: winner,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: eloChanges
//     });

//     setTimeout(() => rooms.delete(roomId), 60000);
// };

// // 3. START TIMER FUNCTION
// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));

//     let timeLeft = duration;
    
//     const timerId = setInterval(() => {
//         timeLeft--;
        
//         // Sync time with clients every 30s to fix drift
//         if(timeLeft % 30 === 0) {
//            io.to(roomId).emit('sync_time', timeLeft);
//         }

//         if (timeLeft <= 0) {
//             clearInterval(timerId);
//             const room = rooms.get(roomId);
//             if(room) handleGameEnd(roomId, room); // FORCE END ON TIME OUT
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
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return;

//       if (!rooms.has(roomId)) {
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); 
        
//         // Initialize Room
//         rooms.set(roomId, { 
//             players: [], 
//             round: 1, 
//             totalRounds: 2, 
//             problems, 
//             scores: {}, 
//             // TRACK WHO FINISHED CURRENT ROUND
//             roundCompletions: new Set(), 
//             isGameActive: true,
//             startTime: Date.now(),
//             cheaters: new Set() 
//         });

//         // START THE SERVER TIMER (30 Minutes)
//         startRoomTimer(roomId, 30 * 60);
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

//   // ✅ UPDATED LEVEL COMPLETED LOGIC (RACE MODE)
//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;

//           // Prevent double submission for same round
//           if(room.roundCompletions.has(username)) return;

//           // 1. Give Points
//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username); // Mark user as finished
//           io.to(roomId).emit('score_update', room.scores);

//           // 2. CHECK: Has ANYONE finished? (Race Mode)
//           if (room.roundCompletions.size > 0) {
              
//               if (room.round < room.totalRounds) {
//                   // --- NEXT ROUND ---
//                   room.round++;
//                   room.roundCompletions.clear(); // Reset for new round
                  
//                   io.to(roomId).emit('new_round', {
//                       round: room.round,
//                       problem: room.problems[room.round - 1],
//                       scores: room.scores,
//                   });
//               } else {
//                   // --- GAME OVER ---
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
//       console.log(`⚠️ [SERVER] Cheat flagged: ${username} | Reason: ${reason}`);
//       socket.emit('cheat_warning', { reason });
//     } catch (err) {
//       console.error("Cheating Detection Error:", err);
//     }
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
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });








// LITTLE ERROR PRESEN IN IT REGARDING THA STATS
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

// // --- ⚡️ FIXED: ROBUST GAME END LOGIC (Handles Missing Stats Objects) ⚡️ ---
// const handleGameEnd = async (roomId, room) => {
//     if (!room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear Timer
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     const playerNames = Object.keys(room.scores);
    
//     // Fallback winner calculation based purely on score
//     let winnerName = playerNames.length > 0 
//         ? playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b)
//         : null;

//     let eloChanges = null;

//     try {
//         // 1. Fetch Users
//         const user1 = await User.findOne({ username: playerNames[0] });
//         const user2 = await User.findOne({ username: playerNames[1] });

//         // Define default data (Handle cases where DB user might be missing)
//         const p1Data = {
//             username: playerNames[0],
//             rating: user1?.rating || 1000,
//             score: room.scores[playerNames[0]] || 0,
//             isCheater: room.cheaters.has(playerNames[0])
//         };

//         const p2Data = {
//             username: playerNames[1] || "Opponent",
//             rating: user2?.rating || 1000,
//             score: room.scores[playerNames[1]] || 0,
//             isCheater: room.cheaters.has(playerNames[1])
//         };

//         // 2. Calculate ELO Outcome
//         const outcome = calculateMatchOutcome(p1Data, p2Data);

//         // 3. Update User 1 (If exists in DB)
//         if (user1) {
//             // ✅ FIX: Initialize stats object if missing (This fixes your bug!)
//             if (!user1.stats) user1.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
            
//             user1.rating = outcome.p1.newRating;
//             user1.seasonScore = (user1.seasonScore || 0) + outcome.p1.seasonScore;
//             user1.stats.matchesPlayed += 1;
            
//             if (outcome.p1.status.includes("Winner")) user1.stats.wins += 1;
//             else if (outcome.p1.status === "Loser") user1.stats.losses += 1;
            
//             await user1.save();
//         }

//         // 4. Update User 2 (If exists in DB)
//         if (user2) {
//             // ✅ FIX: Initialize stats object if missing (This fixes demoaccount2 bug!)
//             if (!user2.stats) user2.stats = { wins: 0, losses: 0, matchesPlayed: 0 };

//             user2.rating = outcome.p2.newRating;
//             user2.seasonScore = (user2.seasonScore || 0) + outcome.p2.seasonScore;
//             user2.stats.matchesPlayed += 1;
            
//             if (outcome.p2.status.includes("Winner")) user2.stats.wins += 1;
//             else if (outcome.p2.status === "Loser") user2.stats.losses += 1;
            
//             await user2.save();
//         }

//         // 5. Save Match History (Even if one user is missing)
//         await Match.create({
//             roomId,
//             winner: outcome.p1.status.includes("Winner") ? p1Data.username : (outcome.p2.status.includes("Winner") ? p2Data.username : null),
//             isDisqualified: room.cheaters.size > 0,
//             disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//             players: [
//                 { 
//                     userId: user1?._id || null, 
//                     username: p1Data.username, 
//                     avatar: user1?.avatar || "", 
//                     isWinner: outcome.p1.status.includes("Winner"), 
//                     score: p1Data.score, 
//                     oldElo: p1Data.rating, 
//                     newElo: outcome.p1.newRating, 
//                     statusText: p1Data.isCheater ? "Disqualified" : "" 
//                 },
//                 { 
//                     userId: user2?._id || null, 
//                     username: p2Data.username, 
//                     avatar: user2?.avatar || "", 
//                     isWinner: outcome.p2.status.includes("Winner"), 
//                     score: p2Data.score, 
//                     oldElo: p2Data.rating, 
//                     newElo: outcome.p2.newRating, 
//                     statusText: p2Data.isCheater ? "Disqualified" : "" 
//                 }
//             ]
//         });

//         // Set Data for Frontend
//         eloChanges = {
//             p1: { username: p1Data.username, newRating: outcome.p1.newRating, points: outcome.p1.pointsGained },
//             p2: { username: p2Data.username, newRating: outcome.p2.newRating, points: outcome.p2.pointsGained }
//         };
//         winnerName = outcome.p1.status.includes("Winner") ? p1Data.username : p2Data.username;

//     } catch (err) {
//         console.error("❌ Critical Error saving match results:", err);
//     }

//     // ✅ EMIT GAME OVER TO CLIENTS
//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: winnerName,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: eloChanges
//     });

//     setTimeout(() => rooms.delete(roomId), 60000);
// };

// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));
//     let timeLeft = duration;
//     const timerId = setInterval(() => {
//         timeLeft--;
//         if(timeLeft % 30 === 0) io.to(roomId).emit('sync_time', timeLeft);
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

//   // Stats Logic
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
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); 
//         rooms.set(roomId, { 
//             players: [], round: 1, totalRounds: 2, problems, scores: {}, 
//             roundCompletions: new Set(), isGameActive: true, startTime: Date.now(), cheaters: new Set() 
//         });
//         startRoomTimer(roomId, 30 * 60);
//       }

//       const room = rooms.get(roomId);
//       const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) { socket.emit('room_full'); return; }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId, side, username, players: room.players, problem: room.problems[room.round - 1],
//         round: room.round, totalRounds: room.totalRounds, scores: room.scores, remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) { console.error('Join Error:', err); }
//   });

//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;
//           if(room.roundCompletions.has(username)) return;

//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username);
//           io.to(roomId).emit('score_update', room.scores);

//           // RACE MODE: First to finish ends the round
//           if (room.roundCompletions.size > 0) { 
//               if (room.round < room.totalRounds) {
//                   room.round++;
//                   room.roundCompletions.clear(); 
//                   io.to(roomId).emit('new_round', {
//                       round: room.round, problem: room.problems[room.round - 1], scores: room.scores,
//                   });
//               } else {
//                   await handleGameEnd(roomId, room);
//               }
//           }
//       } catch (err) { console.error("Level Complete Error:", err); }
//   });

//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;
//       room.cheaters.add(username);
//       socket.emit('cheat_warning', { reason });
//     } catch (err) { console.error("Cheating Error:", err); }
//   });

//   socket.on('disconnect', () => {});
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));




























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

// // --- ⚡️ FIXED: ATOMIC GAME END LOGIC (Solves the "Stats Not Saving" Bug) ⚡️ ---
// const handleGameEnd = async (roomId, room) => {
//     if (!room.isGameActive) return;
//     room.isGameActive = false;

//     // Clear Timer
//     if (roomTimers.has(roomId)) {
//         clearInterval(roomTimers.get(roomId));
//         roomTimers.delete(roomId);
//     }
    
//     const playerNames = Object.keys(room.scores);
    
//     // Fallback winner calculation
//     let winnerName = playerNames.length > 0 
//         ? playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b)
//         : null;

//     let eloChanges = null;

//     try {
//         // 1. Fetch Users (We use .lean() for speed, we won't .save() these directly)
//         const user1Doc = await User.findOne({ username: playerNames[0] }).lean();
//         const user2Doc = await User.findOne({ username: playerNames[1] }).lean();

//         // 2. Prepare Data for ELO Calc (Handle missing users/defaults)
//         const p1Data = {
//             username: playerNames[0],
//             rating: user1Doc?.rating || 1000,
//             score: room.scores[playerNames[0]] || 0,
//             isCheater: room.cheaters.has(playerNames[0])
//         };

//         const p2Data = {
//             username: playerNames[1] || "Opponent",
//             rating: user2Doc?.rating || 1000,
//             score: room.scores[playerNames[1]] || 0,
//             isCheater: room.cheaters.has(playerNames[1])
//         };

//         // 3. Calculate ELO Outcome
//         const outcome = calculateMatchOutcome(p1Data, p2Data);

//         // 4. ATOMIC DB UPDATES (The Magic Fix)
//         // We use findOneAndUpdate with $inc. This forces Mongo to create the stats 
//         // fields if they are missing, bypassing the Mongoose save() issues.
        
//         let updatedUser1 = null;
//         let updatedUser2 = null;

//         if (user1Doc) {
//             updatedUser1 = await User.findOneAndUpdate(
//                 { username: p1Data.username },
//                 { 
//                     $set: { 
//                         rating: outcome.p1.newRating,
//                         seasonScore: (user1Doc.seasonScore || 0) + outcome.p1.seasonScore
//                     },
//                     $inc: { 
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p1.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p1.status === "Loser" ? 1 : 0
//                     }
//                 },
//                 { new: true } // Return the updated document
//             );
//         }

//         if (user2Doc) {
//             updatedUser2 = await User.findOneAndUpdate(
//                 { username: p2Data.username },
//                 { 
//                     $set: { 
//                         rating: outcome.p2.newRating,
//                         seasonScore: (user2Doc.seasonScore || 0) + outcome.p2.seasonScore
//                     },
//                     $inc: { 
//                         "stats.matchesPlayed": 1,
//                         "stats.wins": outcome.p2.status.includes("Winner") ? 1 : 0,
//                         "stats.losses": outcome.p2.status === "Loser" ? 1 : 0
//                     }
//                 },
//                 { new: true }
//             );
//         }

//         // 5. Save Match History (Using the freshly updated data)
//         await Match.create({
//             roomId,
//             winner: outcome.p1.status.includes("Winner") ? p1Data.username : (outcome.p2.status.includes("Winner") ? p2Data.username : null),
//             isDisqualified: room.cheaters.size > 0,
//             disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//             players: [
//                 { 
//                     userId: updatedUser1?._id || null, 
//                     username: p1Data.username, 
//                     avatar: user1Doc?.avatar || "", 
//                     isWinner: outcome.p1.status.includes("Winner"), 
//                     score: p1Data.score, 
//                     oldElo: p1Data.rating, 
//                     newElo: outcome.p1.newRating, 
//                     statusText: p1Data.isCheater ? "Disqualified" : "" 
//                 },
//                 { 
//                     userId: updatedUser2?._id || null, 
//                     username: p2Data.username, 
//                     avatar: user2Doc?.avatar || "", 
//                     isWinner: outcome.p2.status.includes("Winner"), 
//                     score: p2Data.score, 
//                     oldElo: p2Data.rating, 
//                     newElo: outcome.p2.newRating, 
//                     statusText: p2Data.isCheater ? "Disqualified" : "" 
//                 }
//             ]
//         });

//         // Set Data for Frontend
//         eloChanges = {
//             p1: { username: p1Data.username, newRating: outcome.p1.newRating, points: outcome.p1.pointsGained },
//             p2: { username: p2Data.username, newRating: outcome.p2.newRating, points: outcome.p2.pointsGained }
//         };
//         winnerName = outcome.p1.status.includes("Winner") ? p1Data.username : p2Data.username;

//     } catch (err) {
//         console.error("❌ Critical Error saving match results:", err);
//     }

//     // ✅ EMIT GAME OVER TO CLIENTS
//     io.to(roomId).emit('game_over', { 
//         scores: room.scores, 
//         winner: winnerName,
//         isDisqualified: room.cheaters.size > 0,
//         disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
//         eloChanges: eloChanges
//     });

//     setTimeout(() => rooms.delete(roomId), 60000);
// };

// const startRoomTimer = (roomId, duration) => {
//     if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));
//     let timeLeft = duration;
//     const timerId = setInterval(() => {
//         timeLeft--;
//         if(timeLeft % 30 === 0) io.to(roomId).emit('sync_time', timeLeft);
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

//   // Stats Logic
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
//         const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); 
//         rooms.set(roomId, { 
//             players: [], round: 1, totalRounds: 2, problems, scores: {}, 
//             roundCompletions: new Set(), isGameActive: true, startTime: Date.now(), cheaters: new Set() 
//         });
//         startRoomTimer(roomId, 30 * 60);
//       }

//       const room = rooms.get(roomId);
//       const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

//       let playerIndex = room.players.findIndex((p) => p.username === username);
//       let side; let isReconnect = false;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//         isReconnect = true;
//       } else {
//         if (room.players.length >= 2) { socket.emit('room_full'); return; }
//         side = room.players.length === 0 ? 'left' : 'right';
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//       }

//       socket.join(roomId);
//       socket.emit('room_joined', {
//         roomId, side, username, players: room.players, problem: room.problems[room.round - 1],
//         round: room.round, totalRounds: room.totalRounds, scores: room.scores, remainingTime 
//       });

//       if (!isReconnect) {
//         socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
//       }
//     } catch (err) { console.error('Join Error:', err); }
//   });

//   socket.on('level_completed', async ({ roomId, username }) => {
//       try {
//           const room = rooms.get(roomId);
//           if (!room || !room.isGameActive) return;
//           if(room.roundCompletions.has(username)) return;

//           room.scores[username] = (room.scores[username] || 0) + 10;
//           room.roundCompletions.add(username);
//           io.to(roomId).emit('score_update', room.scores);

//           // RACE MODE: First to finish ends the round
//           if (room.roundCompletions.size > 0) { 
//               if (room.round < room.totalRounds) {
//                   room.round++;
//                   room.roundCompletions.clear(); 
//                   io.to(roomId).emit('new_round', {
//                       round: room.round, problem: room.problems[room.round - 1], scores: room.scores,
//                   });
//               } else {
//                   await handleGameEnd(roomId, room);
//               }
//           }
//       } catch (err) { console.error("Level Complete Error:", err); }
//   });

//   socket.on('cheating_detected', async ({ roomId, username, reason }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return;
//       room.cheaters.add(username);
//       socket.emit('cheat_warning', { reason });
//     } catch (err) { console.error("Cheating Error:", err); }
//   });

//   socket.on('disconnect', () => {});
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));














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
import { calculateMatchOutcome } from './utils/elo.js';

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

const rooms = new Map();
const roomTimers = new Map();

// --- ⚡️ FIXED: SENIOR-LEVEL ROBUST GAME END LOGIC ⚡️ ---
const handleGameEnd = async (roomId, room) => {
    // 1. Prevent Double Execution (Race Condition Fix)
    if (!room.isGameActive) return;
    room.isGameActive = false;

    // Clear Timer immediately
    if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
    }
    
    const playerNames = Object.keys(room.scores);
    
    // Fallback winner calculation
    let winnerName = playerNames.length > 0 
        ? playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b)
        : null;

    let eloChanges = null;

    try {
        console.log(`[GAME END] Processing for: ${playerNames.join(' vs ')}`);

        // 2. Fetch Users (Using lean for performance)
        const user1Doc = await User.findOne({ username: playerNames[0] }).lean();
        const user2Doc = await User.findOne({ username: playerNames[1] }).lean();

        // 3. Prepare Data (With Defaults to prevent crashes)
        const p1Data = {
            username: playerNames[0],
            rating: user1Doc?.rating || 1000,
            score: Number(room.scores[playerNames[0]]) || 0,
            isCheater: room.cheaters.has(playerNames[0])
        };

        const p2Data = {
            username: playerNames[1] || "Opponent",
            rating: user2Doc?.rating || 1000,
            score: Number(room.scores[playerNames[1]]) || 0,
            isCheater: room.cheaters.has(playerNames[1])
        };

        // 4. Calculate Outcome
        const outcome = calculateMatchOutcome(p1Data, p2Data);

        // 🛡️ SANITIZATION: Ensure we never send NaN or undefined to DB
        const p1NewRating = Number(outcome.p1.newRating) || 1000;
        const p1SeasonPoints = Number(outcome.p1.seasonScore) || 0;
        const p2NewRating = Number(outcome.p2.newRating) || 1000;
        const p2SeasonPoints = Number(outcome.p2.seasonScore) || 0;

        let updatedUser1 = null;
        let updatedUser2 = null;

        // 5. ATOMIC DB UPDATES (Using findOneAndUpdate to handle missing stats)
        if (user1Doc) {
            updatedUser1 = await User.findOneAndUpdate(
                { username: p1Data.username },
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
            );
            console.log(`[DB] Updated P1: ${p1Data.username}`);
        }

        if (user2Doc) {
            updatedUser2 = await User.findOneAndUpdate(
                { username: p2Data.username },
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
            );
            console.log(`[DB] Updated P2: ${p2Data.username}`);
        }

        // 6. Save Match History
        // Ensure winnerName is never null if there is a winner status
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
                    statusText: p1Data.isCheater ? "Disqualified" : "" 
                },
                { 
                    userId: user2Doc?._id || null, 
                    username: p2Data.username, 
                    avatar: user2Doc?.avatar || "", 
                    isWinner: outcome.p2.status.includes("Winner"), 
                    score: p2Data.score, 
                    oldElo: p2Data.rating, 
                    newElo: p2NewRating, 
                    statusText: p2Data.isCheater ? "Disqualified" : "" 
                }
            ]
        });
        console.log(`[DB] Match History Created.`);

        // 7. Prepare Data for Frontend
        eloChanges = {
            p1: { username: p1Data.username, newRating: p1NewRating, points: outcome.p1.pointsGained },
            p2: { username: p2Data.username, newRating: p2NewRating, points: outcome.p2.pointsGained }
        };
        winnerName = officialWinner;

    } catch (err) {
        console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
        // Important: Even if DB fails, we don't crash the socket server
    }

    // 8. EMIT GAME OVER TO CLIENTS
    io.to(roomId).emit('game_over', { 
        scores: room.scores, 
        winner: winnerName,
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        eloChanges: eloChanges
    });

    setTimeout(() => rooms.delete(roomId), 60000);
};

const startRoomTimer = (roomId, duration) => {
    if (roomTimers.has(roomId)) clearInterval(roomTimers.get(roomId));
    let timeLeft = duration;
    const timerId = setInterval(() => {
        timeLeft--;
        if(timeLeft % 30 === 0) io.to(roomId).emit('sync_time', timeLeft);
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

  // Stats Logic
  try {
    const totalUsers = await User.countDocuments();
    const statsData = { live: io.engine.clientsCount, total: totalUsers };
    socket.emit('site_stats', statsData);
    socket.broadcast.emit('site_stats', statsData);
  } catch (err) { console.error(err); }

  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      if (!roomId || !username) return;

      if (!rooms.has(roomId)) {
        const problems = await Problem.aggregate([{ $sample: { size: 2 } }]); 
        rooms.set(roomId, { 
            players: [], round: 1, totalRounds: 2, problems, scores: {}, 
            roundCompletions: new Set(), isGameActive: true, startTime: Date.now(), cheaters: new Set() 
        });
        startRoomTimer(roomId, 30 * 60);
      }

      const room = rooms.get(roomId);
      const remainingTime = Math.max(0, (30 * 60) - Math.floor((Date.now() - room.startTime) / 1000));

      let playerIndex = room.players.findIndex((p) => p.username === username);
      let side; let isReconnect = false;

      if (playerIndex !== -1) {
        room.players[playerIndex].id = socket.id;
        side = room.players[playerIndex].side;
        isReconnect = true;
      } else {
        if (room.players.length >= 2) { socket.emit('room_full'); return; }
        side = room.players.length === 0 ? 'left' : 'right';
        room.players.push({ id: socket.id, username, side });
        room.scores[username] = 0;
      }

      socket.join(roomId);
      socket.emit('room_joined', {
        roomId, side, username, players: room.players, problem: room.problems[room.round - 1],
        round: room.round, totalRounds: room.totalRounds, scores: room.scores, remainingTime 
      });

      if (!isReconnect) {
        socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
      }
    } catch (err) { console.error('Join Error:', err); }
  });

  socket.on('level_completed', async ({ roomId, username }) => {
      try {
          const room = rooms.get(roomId);
          if (!room || !room.isGameActive) return;
          if(room.roundCompletions.has(username)) return;

          room.scores[username] = (room.scores[username] || 0) + 10;
          room.roundCompletions.add(username);
          io.to(roomId).emit('score_update', room.scores);

          // RACE MODE: First to finish ends the round
          if (room.roundCompletions.size > 0) { 
              if (room.round < room.totalRounds) {
                  room.round++;
                  room.roundCompletions.clear(); 
                  io.to(roomId).emit('new_round', {
                      round: room.round, problem: room.problems[room.round - 1], scores: room.scores,
                  });
              } else {
                  await handleGameEnd(roomId, room);
              }
          }
      } catch (err) { console.error("Level Complete Error:", err); }
  });

  socket.on('cheating_detected', async ({ roomId, username, reason }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || !room.isGameActive) return;
      room.cheaters.add(username);
      socket.emit('cheat_warning', { reason });
    } catch (err) { console.error("Cheating Error:", err); }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));