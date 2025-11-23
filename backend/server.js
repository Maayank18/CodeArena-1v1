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

  // socket.on('join_room', async (data) => {
  //   try {
  //     const { roomId, username } = data;
  //     if (!roomId || !username) return; 

  //     if (!rooms.has(roomId)) {
  //       try {
  //         const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
  //         rooms.set(roomId, {
  //           players: [],
  //           round: 1,
  //           totalRounds: 5, 
  //           problems: problems, 
  //           scores: {},
  //           isGameActive: true 
  //         });
  //       } catch (error) {
  //         console.error("DB Error:", error);
  //         return;
  //       }
  //     }

  //     const room = rooms.get(roomId);

  //     let playerIndex = room.players.findIndex(p => p.username === username);
  //     let side;

  //     if (playerIndex !== -1) {
  //       room.players[playerIndex].id = socket.id;
  //       side = room.players[playerIndex].side;
  //     } else {
  //       if (room.players.length >= 2) {
  //         socket.emit('room_full');
  //         return;
  //       }
  //       side = room.players.length === 0 ? 'left' : 'right';
  //       room.players.push({ id: socket.id, username, side });
  //       room.scores[username] = 0;
  //     }

  //     socket.join(roomId);

  //     io.to(roomId).emit('room_joined', { 
  //       roomId, 
  //       side: side,
  //       players: room.players,
  //       problem: room.problems[room.round - 1],
  //       round: room.round,
  //       totalRounds: room.totalRounds,
  //       scores: room.scores
  //     });

  //     socket.to(roomId).emit('player_joined', { username, side });
      
  //   } catch (err) {
  //     console.error("Join Room Error:", err);
  //   }
  // });

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





















// server.js
// server.js (debug-ready)
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
// import statsRoutes from './routes/statsRoutes.js'; // ensure this path & name match

// import Problem from './models/Problem.js';
// import User from './models/User.js';

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

// // TEMP: simple request logger to confirm incoming requests reach this process
// app.use((req, res, next) => {
//   console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Host:${req.headers.host}`);
//   next();
// });

// // Register core API routes BEFORE any static/catch-all that might swallow them
// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);
// app.use('/api/auth', authRoutes);

// // Mount stats route now (this responds to GET /api/stats)
// app.use('/api/stats', statsRoutes);

// // Small health check
// app.get('/', (req, res) => res.send('OK'));

// // create HTTP server + socket.io
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ALLOWED_ORIGINS,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// // attach io so controllers can read clientsCount via req.app.locals.io
// app.locals.io = io;

// // Temporary debug emit route — visit in browser to force an emit and check client reception
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

// // initial DB count log
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

//     console.log("Emitted initial site_stats", statsData, "clientsCount:", io.engine.clientsCount);
//   } catch (err) {
//     console.error("Error fetching stats on connection:", err);
//   }

//   // ... rest of your socket logic (join_room, level_completed, disconnect etc)
//   // keep the existing handlers exactly as you had them
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
//             totalRounds: 1, // testing purpose
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

//   // socket.on('disconnect', async (reason) => {
//   //   console.log("User Disconnected", socket.id, "reason:", reason);
//   //   try {
//   //     const totalUsers = await User.countDocuments();
//   //     const statsData = { live: io.engine.clientsCount, total: totalUsers };
//   //     io.emit('site_stats', statsData);
//   //     console.log("Emitted site_stats after disconnect", statsData, "clientsCount:", io.engine.clientsCount);
//   //   } catch (e) {
//   //     console.error("Error fetching stats on disconnect:", e);
//   //   }
//   // });
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

import Problem from './models/Problem.js';
import User from './models/User.js';

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

app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

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
    console.log('Manual emit site_stats', payload);
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

    console.log("Emitted initial site_stats", statsData, "clientsCount:", io.engine.clientsCount);
  } catch (err) {
    console.error("Error fetching stats on connection:", err);
  }

  // ---------------------------------------------------------------------
  // ✅ FIXED JOIN_ROOM (THE ONLY MODIFIED PART)
  // ---------------------------------------------------------------------
//   socket.on('join_room', async (data) => {
//   try {
//     const { roomId, username } = data;
//     console.log(`🔵 join_room called: ${username} → room ${roomId}`);
    
//     if (!roomId || !username) return; 

//     // Create room if doesn't exist
//     if (!rooms.has(roomId)) {
//       const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//       rooms.set(roomId, {
//         players: [],
//         round: 1,
//         totalRounds: 5, 
//         problems: problems, 
//         scores: {},
//         isGameActive: true 
//       });
//       console.log(`✅ Created new room: ${roomId}`);
//     }

//     const room = rooms.get(roomId);
//     let playerIndex = room.players.findIndex(p => p.username === username);
//     let side;
//     let isReconnect = false;

//     // Check if player already exists (reconnection)
//     if (playerIndex !== -1) {
//       console.log(`🔄 ${username} reconnecting, updating socket ID`);
//       room.players[playerIndex].id = socket.id;
//       side = room.players[playerIndex].side;
//       isReconnect = true;
//     } else {
//       // New player joining
//       if (room.players.length >= 2) {
//         console.log(`❌ Room ${roomId} is full`);
//         socket.emit('room_full');
//         return;
//       }
//       side = room.players.length === 0 ? 'left' : 'right';
//       room.players.push({ id: socket.id, username, side });
//       room.scores[username] = 0;
//       console.log(`✅ ${username} assigned to ${side} side`);
//     }

//     // Join the socket room FIRST
//     socket.join(roomId);
//     console.log(`🔗 ${username} joined socket room ${roomId}`);

//     // Send room_joined ONLY to the joining/reconnecting player
//     socket.emit('room_joined', { 
//       roomId, 
//       side: side,
//       players: room.players,
//       problem: room.problems[room.round - 1],
//       round: room.round,
//       totalRounds: room.totalRounds,
//       scores: room.scores
//     });
//     console.log(`📤 Sent room_joined to ${username} with side: ${side}`);

//     // If this is a NEW player (not reconnect), notify others
//     if (!isReconnect) {
//       socket.to(roomId).emit('player_joined', { 
//         username, 
//         side,
//         players: room.players,
//         scores: room.scores
//       });
//       console.log(`📢 Notified others in ${roomId} about ${username} joining`);
//     }
    
//   } catch (err) {
//     console.error("❌ Join Room Error:", err);
//   }
// });

// socket.on('join_room', async (data) => {
//   try {
//     const { roomId, username } = data;
//     console.log(`🔵 [SERVER] join_room: ${username} → ${roomId} | socket: ${socket.id}`);
    
//     if (!roomId || !username) {
//       console.log('❌ Missing roomId or username');
//       return;
//     }

//     // Create room if doesn't exist
//     if (!rooms.has(roomId)) {
//       const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//       rooms.set(roomId, {
//         players: [],
//         round: 1,
//         totalRounds: 5, 
//         problems: problems, 
//         scores: {},
//         isGameActive: true 
//       });
//       console.log(`✅ [SERVER] Created room ${roomId}`);
//     }

//     const room = rooms.get(roomId);
//     console.log(`📊 [SERVER] Room ${roomId} before join:`, room.players.map(p => `${p.username}(${p.side})`));
    
//     let playerIndex = room.players.findIndex(p => p.username === username);
//     let side;
//     let isReconnect = false;

//     // Check if player already exists (reconnection)
//     if (playerIndex !== -1) {
//       console.log(`🔄 [SERVER] ${username} reconnecting`);
//       room.players[playerIndex].id = socket.id;
//       side = room.players[playerIndex].side;
//       isReconnect = true;
//     } else {
//       // New player joining
//       if (room.players.length >= 2) {
//         console.log(`❌ [SERVER] Room ${roomId} is FULL`);
//         socket.emit('room_full');
//         return;
//       }
//       side = room.players.length === 0 ? 'left' : 'right';
//       room.players.push({ id: socket.id, username, side });
//       room.scores[username] = 0;
//       console.log(`✅ [SERVER] ${username} assigned to ${side}`);
//     }

//     // Join socket room
//     socket.join(roomId);
//     console.log(`🔗 [SERVER] ${username} (${socket.id}) joined socket room ${roomId}`);
//     console.log(`📊 [SERVER] Room ${roomId} after join:`, room.players.map(p => `${p.username}(${p.side})`));

//     // ✅ CRITICAL: Use socket.emit (NOT io.to().emit) to send ONLY to this socket
//     socket.emit('room_joined', { 
//       roomId, 
//       side: side,
//       players: room.players,
//       problem: room.problems[room.round - 1],
//       round: room.round,
//       totalRounds: room.totalRounds,
//       scores: room.scores
//     });
//     console.log(`📤 [SERVER] Sent room_joined to ${username} ONLY (socket ${socket.id}) with side: ${side}`);

//     // ✅ Notify OTHER players (not the one who just joined)
//     if (!isReconnect) {
//       socket.to(roomId).emit('player_joined', { 
//         username, 
//         side,
//         players: room.players,
//         scores: room.scores
//       });
//       console.log(`📢 [SERVER] Notified others in ${roomId} about ${username} joining`);
//     }
    
//   } catch (err) {
//     console.error("❌ [SERVER] Join Room Error:", err);
//   }
// });

// In your server socket connection block:
socket.on('join_room', async (data) => {
  try {
    const { roomId, username } = data;
    console.log(`🔵 [SERVER] join_room: ${username} → ${roomId} | socket: ${socket.id}`);
    if (!roomId || !username) {
      console.log('❌ Missing roomId or username');
      return;
    }

    if (!rooms.has(roomId)) {
      const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
      rooms.set(roomId, { players: [], round: 1, totalRounds: 5, problems, scores: {}, isGameActive: true });
      console.log(`✅ [SERVER] Created room ${roomId}`);
    }

    const room = rooms.get(roomId);
    let playerIndex = room.players.findIndex((p) => p.username === username);
    let side; let isReconnect = false;

    if (playerIndex !== -1) {
      console.log(`🔄 [SERVER] ${username} reconnecting`);
      room.players[playerIndex].id = socket.id;
      side = room.players[playerIndex].side;
      isReconnect = true;
    } else {
      if (room.players.length >= 2) {
        console.log(`❌ [SERVER] Room ${roomId} is FULL`);
        socket.emit('room_full');
        return;
      }
      side = room.players.length === 0 ? 'left' : 'right';
      room.players.push({ id: socket.id, username, side });
      room.scores[username] = 0;
      console.log(`✅ [SERVER] ${username} assigned to ${side}`);
    }

    socket.join(roomId);
    socket.emit('room_joined', {
      roomId,
      side,
      username,
      players: room.players,
      problem: room.problems[room.round - 1],
      round: room.round,
      totalRounds: room.totalRounds,
      scores: room.scores,
    });

    if (!isReconnect) {
      socket.to(roomId).emit('player_joined', { username, side, players: room.players, scores: room.scores });
    }
  } catch (err) {
    console.error('❌ [SERVER] Join Room Error:', err);
  }
});


  // ---------------------------------------------------------------------
  // END OF FIXED PART
  // ---------------------------------------------------------------------

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
        const winner = Object.keys(room.scores)
          .reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);

        await Promise.all(Object.keys(room.scores).map(async (u) => {
          await User.findOneAndUpdate(
            { username: u },
            { $inc: { 'stats.matchesPlayed': 1, 'stats.wins': u === winner ? 1 : 0 } }
          );
        }));

        io.to(roomId).emit('game_over', { scores: room.scores, winner });
        setTimeout(() => rooms.delete(roomId), 60000);
      }
    } catch (err) {
      console.error("Level Completed Error:", err);
    }
  });

  socket.on('disconnect', async (reason) => {
    console.log("User Disconnected", socket.id, "reason:", reason);

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
