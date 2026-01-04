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

  // socket.on('disconnect', async () => {
  //   try {
  //     const totalUsers = await User.countDocuments();
  //     const statsData = { live: io.engine.clientsCount, total: totalUsers };
  //     io.emit('site_stats', statsData);
  //   } catch (e) {
  //     console.error("Error fetching stats on disconnect:", e);
  //   }
  // });
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

// --- ⚡️ MISSING FUNCTION ADDED: GAME END LOGIC ⚡️ ---
const handleGameEnd = async (roomId, room) => {
    if (!room.isGameActive) return;
    room.isGameActive = false;

    // Clear Timer
    if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
    }
    
    const playerNames = Object.keys(room.scores);
    console.log(`[GAME END] Processing Room: ${roomId}`);
    console.log(`[GAME END] Players involved: ${JSON.stringify(playerNames)}`);

    // Fallback winner calculation
    let winnerName = playerNames.length > 0 
        ? playerNames.reduce((a, b) => room.scores[a] > room.scores[b] ? a : b)
        : null;

    let eloChanges = null;

    try {
        // 1. FETCH USERS WITH CASE-INSENSITIVE SEARCH
        const user1Doc = await User.findOne({ 
            username: { $regex: new RegExp(`^${playerNames[0]}$`, "i") } 
        });
        
        const user2Doc = playerNames[1] ? await User.findOne({ 
            username: { $regex: new RegExp(`^${playerNames[1]}$`, "i") } 
        }) : null;

        console.log(`[DB LOOKUP] User 1 (${playerNames[0]}): ${user1Doc ? "FOUND" : "NOT FOUND"}`);
        if(playerNames[1]) console.log(`[DB LOOKUP] User 2 (${playerNames[1]}): ${user2Doc ? "FOUND" : "NOT FOUND"}`);

        // 2. Prepare Match Data
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

        // 3. Calculate Outcome
        const outcome = calculateMatchOutcome(p1Data, p2Data);

        const p1NewRating = Number(outcome.p1.newRating) || 1000;
        const p1SeasonPoints = Number(outcome.p1.seasonScore) || 0;
        const p2NewRating = Number(outcome.p2.newRating) || 1000;
        const p2SeasonPoints = Number(outcome.p2.seasonScore) || 0;

        // 4. ATOMIC DB UPDATES
        if (user1Doc) {
             await User.findByIdAndUpdate(
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
            );
            console.log(`[DB UPDATE] SUCCESS: Updated stats for ${p1Data.username}`);
        } else {
            console.error(`[DB ERROR] Could not update stats for ${p1Data.username} - User document missing`);
        }

        if (user2Doc) {
             await User.findByIdAndUpdate(
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
            );
            console.log(`[DB UPDATE] SUCCESS: Updated stats for ${p2Data.username}`);
        }

        // 5. Save Match History
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

        eloChanges = {
            p1: { username: p1Data.username, newRating: p1NewRating, points: outcome.p1.pointsGained },
            p2: { username: p2Data.username, newRating: p2NewRating, points: outcome.p2.pointsGained }
        };
        winnerName = officialWinner;

    } catch (err) {
        console.error("❌ CRITICAL DB ERROR in handleGameEnd:", err);
    }

    io.to(roomId).emit('game_over', { 
        scores: room.scores, 
        winner: winnerName,
        isDisqualified: room.cheaters.size > 0,
        disqualifiedPlayer: room.cheaters.size > 0 ? Array.from(room.cheaters)[0] : null,
        eloChanges: eloChanges
    });

    setTimeout(() => rooms.delete(roomId), 60000);
};

// --- Timer Logic ---
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

          // RACE MODE: Only FIRST completion increments round
          if (room.roundCompletions.size === 1) { 
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

  socket.on('disconnect', async () => {
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
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));