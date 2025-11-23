// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';

// // Routes
// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import authRoutes from './routes/authRoutes.js';

// // Models
// import Problem from './models/Problem.js';
// import User from './models/User.js';

// dotenv.config();
// connectDB();

// const app = express();

// // --- SECURITY: RESTRICT CORS ---
// // Allows Localhost (dev) and Vercel (prod)
// const ALLOWED_ORIGINS = [
//   "http://localhost:5173", 
//   process.env.FRONTEND_URL // This reads from Render Environment Variables
// ];

// app.use(cors({
//   origin: ALLOWED_ORIGINS,
//   methods: ["GET", "POST"],
//   credentials: true
// }));
// app.use(express.json());

// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"]
//   }
// });

// // API Routes
// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);
// app.use('/api/auth', authRoutes);

// // GAME STATE (In-Memory)
// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);
//     // --- FIX: Send Stats Immediately to the NEW User ---
//         try {
//         const totalUsers = await User.countDocuments();
//         const statsData = {
//             live: io.engine.clientsCount,
//             total: totalUsers
//         };
        
//         // 1. Send to the specific user who just connected (Guaranteed delivery)
//         socket.emit('site_stats', statsData);
        
//         // 2. Update everyone else
//         socket.broadcast.emit('site_stats', statsData);
        
//     } catch (err) {
//         console.error("Error fetching stats:", err);
//     }

//   // --- BROADCAST LIVE STATS (Live Count + Total Users) ---
// //   try {
// //     const totalUsers = await User.countDocuments();
// //     io.emit('site_stats', {
// //         live: io.engine.clientsCount,
// //         total: totalUsers
// //     });
// //   } catch (err) {
// //     console.error("Error fetching stats:", err);
// //   }
//   // ------------------------------------------------------

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
      
//       if (!roomId || !username) return; 

//       // 1. Initialize Room
//       if (!rooms.has(roomId)) {
//         try {
//           const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//           rooms.set(roomId, {
//             players: [],
//             round: 1,
//             totalRounds: 5, 
//             problems: problems, 
//             scores: {},
//             isGameActive: true 
//           });
//         } catch (error) {
//           console.error("DB Error fetching problems:", error);
//           return;
//         }
//       }

//       const room = rooms.get(roomId);

//       // 2. Check for Reconnect vs New Player
//       let playerIndex = room.players.findIndex(p => p.username === username);
//       let side;

//       if (playerIndex !== -1) {
//         // RECONNECT: Update socket ID but keep side
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
//       } else {
//         // NEW PLAYER
//         if (room.players.length >= 2) {
//           socket.emit('room_full');
//           return;
//         }

//         // Assign Side
//         if (room.players.length === 0) {
//           side = 'left';
//         } else {
//           side = room.players[0].side === 'left' ? 'right' : 'left';
//         }
        
//         room.players.push({ id: socket.id, username, side });
//         room.scores[username] = 0;
//       }

//       socket.join(roomId);

//       // 3. Send State
//       const currentProblem = room.problems[room.round - 1];
      
//       io.to(roomId).emit('room_joined', { 
//         roomId, 
//         side: side,
//         players: room.players,
//         problem: currentProblem,
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores
//       });

//       socket.to(roomId).emit('player_joined', { username, side });
      
//     } catch (err) {
//       console.error("Join Room Error:", err);
//     }
//   });

//   socket.on('level_completed', async ({ roomId, username }) => {
//     try {
//       const room = rooms.get(roomId);
//       if (!room || !room.isGameActive) return; 

//       console.log(`User ${username} solved Round ${room.round}`);

//       // 1. Update Score
//       if (room.scores[username] !== undefined) {
//         room.scores[username] += 10;
//       }

//       // 2. Broadcast Score Update
//       io.to(roomId).emit('score_update', room.scores);

//       // 3. Move to Next Round OR End Game
//       if (room.round < room.totalRounds) {
//         room.round++;
//         const nextProblem = room.problems[room.round - 1];
        
//         io.to(roomId).emit('new_round', {
//           round: room.round,
//           problem: nextProblem,
//           scores: room.scores,
//         });
//       } else {
//         // --- GAME OVER LOGIC ---
//         room.isGameActive = false; 

//         const winnerUsername = Object.keys(room.scores).reduce((a, b) => 
//           room.scores[a] > room.scores[b] ? a : b
//         );

//         console.log(`Game Over. Updating DB for players: ${Object.keys(room.scores).join(', ')}`);

//         // --- SECURE DATABASE UPDATE ---
//         const updatePromises = Object.keys(room.scores).map(async (playerUsername) => {
//           const isWinner = playerUsername === winnerUsername;
          
//           const updateFields = {
//             $inc: {
//               'stats.matchesPlayed': 1,
//               'stats.wins': isWinner ? 1 : 0 
//             }
//           };

//           await User.findOneAndUpdate({ username: playerUsername }, updateFields);
//         });

//         await Promise.all(updatePromises);
//         // -----------------------------

//         io.to(roomId).emit('game_over', { 
//           scores: room.scores, 
//           winner: winnerUsername 
//         });
        
//         // Cleanup after 60s
//         setTimeout(() => {
//           if (rooms.has(roomId)) {
//             rooms.delete(roomId);
//             console.log(`Cleaned up room ${roomId}`);
//           }
//         }, 60000);
//       }
//     } catch (err) {
//       console.error("Level Completed Error:", err);
//     }
//   });

//   socket.on('disconnect', async () => {
//     console.log("User Disconnected", socket.id);
    
//     // Update stats on disconnect (Decrease live count)
//     try {
//         const totalUsers = await User.countDocuments();
//         io.emit('site_stats', {
//             live: io.engine.clientsCount,
//             total: totalUsers
//         });
//     } catch (e) { console.error(e); }
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

// import Problem from './models/Problem.js';
// import User from './models/User.js';

// dotenv.config();
// connectDB();

// const app = express();

// const ALLOWED_ORIGINS = [
//   "http://localhost:5173", 
//   process.env.FRONTEND_URL 
// ];

// app.use(cors({
//   origin: ALLOWED_ORIGINS,
//   methods: ["GET", "POST"],
//   credentials: true
// }));
// app.use(express.json());

// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"]
//   }
// });

// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);
// app.use('/api/auth', authRoutes);

// const rooms = new Map();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   // --- 1. SEND STATS IMMEDIATELY ON CONNECT ---
//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = {
//         live: io.engine.clientsCount,
//         total: totalUsers
//     };
    
//     // Send to everyone, including the new user
//     io.emit('site_stats', statsData);
    
//   } catch (err) {
//     console.error("Error fetching stats:", err);
//   }
//   // -------------------------------------------

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return; 

//       if (!rooms.has(roomId)) {
//         try {
//           const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//           rooms.set(roomId, {
//             players: [],
//             round: 1,
//             totalRounds: 5, 
//             problems: problems, 
//             scores: {},
//             isGameActive: true 
//           });
//         } catch (error) {
//           console.error("DB Error:", error);
//           return;
//         }
//       }

//       const room = rooms.get(roomId);

//       let playerIndex = room.players.findIndex(p => p.username === username);
//       let side;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
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

//       io.to(roomId).emit('room_joined', { 
//         roomId, 
//         side: side,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores
//       });

//       socket.to(roomId).emit('player_joined', { username, side });
      
//     } catch (err) {
//       console.error("Join Room Error:", err);
//     }
//   });

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
//         const winner = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);

//         // Update DB
//         const updatePromises = Object.keys(room.scores).map(async (u) => {
//            await User.findOneAndUpdate({ username: u }, { 
//                $inc: { 'stats.matchesPlayed': 1, 'stats.wins': u === winner ? 1 : 0 } 
//            });
//         });
//         await Promise.all(updatePromises);

//         io.to(roomId).emit('game_over', { scores: room.scores, winner });
//         setTimeout(() => rooms.delete(roomId), 60000);
//       }
//     } catch (err) { console.error(err); }
//   });

//   socket.on('disconnect', async () => {
//     console.log("User Disconnected", socket.id);
    
//     // Update stats on disconnect
//     try {
//         const totalUsers = await User.countDocuments();
//         io.emit('site_stats', {
//             live: io.engine.clientsCount,
//             total: totalUsers
//         });
//     } catch (e) {}
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

// import Problem from './models/Problem.js';
// import User from './models/User.js';

// dotenv.config();
// connectDB();

// const app = express();

// // Ensure undefined FRONTEND_URL is filtered out
// const ALLOWED_ORIGINS = [
//   "http://localhost:5173",
//   process.env.FRONTEND_URL
// ].filter(Boolean);

// app.use(cors({
//   origin: ALLOWED_ORIGINS,
//   methods: ["GET", "POST"],
//   credentials: true
// }));
// app.use(express.json());

// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);
// app.use('/api/auth', authRoutes);

// // New: an HTTP endpoint that returns live + total counts (useful for debugging and fallback)
// app.get('/api/stats', async (req, res) => {
//   try {
//     const total = await User.countDocuments();
//     return res.json({ live: io.engine.clientsCount, total });
//   } catch (err) {
//     console.error("Error in /api/stats:", err);
//     return res.status(500).json({ message: 'Failed to read stats' });
//   }
// });

// const rooms = new Map();

// // On server start: print initial DB user count (helps confirm DB config)
// (async function logInitialCount() {
//   try {
//     const c = await User.countDocuments();
//     console.log('Initial DB user count:', c);
//   } catch (err) {
//     console.error('Initial DB user count failed:', err);
//   }
// })();

// io.on('connection', async (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   // Send initial stats directly to the connecting socket (no race)
//   try {
//     const totalUsers = await User.countDocuments();
//     const statsData = {
//       live: io.engine.clientsCount,
//       total: totalUsers
//     };

//     // Guarantee connecting client receives the stats (avoid race)
//     socket.emit('site_stats', statsData);

//     // Notify everyone else about the updated stats
//     socket.broadcast.emit('site_stats', statsData);

//     console.log("Emitted initial site_stats", statsData, "clientsCount:", io.engine.clientsCount);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
//       if (!roomId || !username) return;

//       if (!rooms.has(roomId)) {
//         try {
//           const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//           rooms.set(roomId, {
//             players: [],
//             round: 1,
//             totalRounds: 5,
//             problems: problems,
//             scores: {},
//             isGameActive: true
//           });
//         } catch (error) {
//           console.error("DB Error (problems sample):", error);
//           return;
//         }
//       }

//       const room = rooms.get(roomId);

//       let playerIndex = room.players.findIndex(p => p.username === username);
//       let side;

//       if (playerIndex !== -1) {
//         room.players[playerIndex].id = socket.id;
//         side = room.players[playerIndex].side;
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

//       io.to(roomId).emit('room_joined', {
//         roomId,
//         side: side,
//         players: room.players,
//         problem: room.problems[room.round - 1],
//         round: room.round,
//         totalRounds: room.totalRounds,
//         scores: room.scores
//       });

//       socket.to(roomId).emit('player_joined', { username, side });

//     } catch (err) {
//       console.error("Join Room Error:", err);
//     }
//   });

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
//         const winner = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);

//         // Update DB
//         const updatePromises = Object.keys(room.scores).map(async (u) => {
//           await User.findOneAndUpdate({ username: u }, {
//             $inc: { 'stats.matchesPlayed': 1, 'stats.wins': u === winner ? 1 : 0 }
//           });
//         });
//         await Promise.all(updatePromises);

//         io.to(roomId).emit('game_over', { scores: room.scores, winner });
//         setTimeout(() => rooms.delete(roomId), 60000);
//       }
//     } catch (err) {
//       console.error("Level Completed Error:", err);
//     }
//   });

//   socket.on('disconnect', async (reason) => {
//     console.log("User Disconnected", socket.id, "reason:", reason);

//     // Recompute and broadcast stats after disconnect
//     try {
//       const totalUsers = await User.countDocuments();
//       const statsData = {
//         live: io.engine.clientsCount,
//         total: totalUsers
//       };
//       io.emit('site_stats', statsData);
//       console.log("Emitted site_stats after disconnect", statsData, "clientsCount:", io.engine.clientsCount);
//     } catch (e) {
//       console.error("Error fetching stats on disconnect:", e);
//     }
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });










// server.js
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

// Import your stats routes (you said you created this)
import statsRoutes from './routes/statsRoutes.js';

import Problem from './models/Problem.js';
import User from './models/User.js';

dotenv.config();
connectDB();

const app = express();

// Make sure FRONTEND_URL (or other env) if undefined won't break things
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

// Register standard API routes (stats route wired below AFTER io creation)
app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);

// small health check
app.get('/', (req, res) => res.send('OK'));

// create HTTP server + socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Attach io to app.locals so controllers (like statsController) can access io
app.locals.io = io;

// Now that io is available, mount stats route which may use req.app.locals.io
app.use('/api/stats', statsRoutes);

// Optional: log initial DB count (helps confirm you are connected to the DB you expect)
(async function logInitialCount() {
  try {
    const c = await User.countDocuments();
    console.log('Initial DB user count:', c);
  } catch (err) {
    console.error('Initial DB user count failed:', err);
  }
})();

// Rooms map (existing app logic)
const rooms = new Map();

io.on('connection', async (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // --- Send initial stats directly to the connecting socket (no race) ---
  try {
    const totalUsers = await User.countDocuments();
    const statsData = {
      live: io.engine.clientsCount,
      total: totalUsers
    };

    // Guarantee connecting client receives the stats
    socket.emit('site_stats', statsData);

    // Notify everyone else about the updated stats
    socket.broadcast.emit('site_stats', statsData);

    console.log("Emitted initial site_stats", statsData, "clientsCount:", io.engine.clientsCount);
  } catch (err) {
    console.error("Error fetching stats on connection:", err);
  }
  // --------------------------------------------------------------------

  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      if (!roomId || !username) return;

      if (!rooms.has(roomId)) {
        try {
          const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
          rooms.set(roomId, {
            players: [],
            round: 1,
            totalRounds: 5,
            problems: problems,
            scores: {},
            isGameActive: true
          });
        } catch (error) {
          console.error("DB Error (problems sample):", error);
          return;
        }
      }

      const room = rooms.get(roomId);

      let playerIndex = room.players.findIndex(p => p.username === username);
      let side;

      if (playerIndex !== -1) {
        room.players[playerIndex].id = socket.id;
        side = room.players[playerIndex].side;
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

      io.to(roomId).emit('room_joined', {
        roomId,
        side: side,
        players: room.players,
        problem: room.problems[room.round - 1],
        round: room.round,
        totalRounds: room.totalRounds,
        scores: room.scores
      });

      socket.to(roomId).emit('player_joined', { username, side });

    } catch (err) {
      console.error("Join Room Error:", err);
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
        const winner = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);

        // Update DB
        const updatePromises = Object.keys(room.scores).map(async (u) => {
          await User.findOneAndUpdate({ username: u }, {
            $inc: { 'stats.matchesPlayed': 1, 'stats.wins': u === winner ? 1 : 0 }
          });
        });
        await Promise.all(updatePromises);

        io.to(roomId).emit('game_over', { scores: room.scores, winner });
        setTimeout(() => rooms.delete(roomId), 60000);
      }
    } catch (err) {
      console.error("Level Completed Error:", err);
    }
  });

  socket.on('disconnect', async (reason) => {
    console.log("User Disconnected", socket.id, "reason:", reason);

    // Recompute and broadcast stats after disconnect
    try {
      const totalUsers = await User.countDocuments();
      const statsData = {
        live: io.engine.clientsCount,
        total: totalUsers
      };
      io.emit('site_stats', statsData);
      console.log("Emitted site_stats after disconnect", statsData, "clientsCount:", io.engine.clientsCount);
    } catch (e) {
      console.error("Error fetching stats on disconnect:", e);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
