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

// // --- SECURITY FIX 1: RESTRICT CORS ---
// // In production, replace 'http://localhost:5173' with your actual Vercel/Render domain
// const ALLOWED_ORIGINS = [
//   "http://localhost:5173", 
//   process.env.FRONTEND_URL // Add this to your .env file later for production
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

// // GAME STATE
// const rooms = new Map();

// io.on('connection', (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   socket.on('join_room', async (data) => {
//     try {
//       const { roomId, username } = data;
      
//       if (!roomId || !username) return; // Basic validation

//       // 1. Initialize Room
//       if (!rooms.has(roomId)) {
//         try {
//           const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//           rooms.set(roomId, {
//             players: [],
//             round: 1,
//             totalRounds: 5, // Set to 5 for real game
//             problems: problems, 
//             scores: {},
//             isGameActive: true // Flag to prevent actions after game ends
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
//         // RECONNECT
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
//       if (!room || !room.isGameActive) return; // Prevent actions if game ended

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
//         room.isGameActive = false; // Lock the room immediately

//         const winnerUsername = Object.keys(room.scores).reduce((a, b) => 
//           room.scores[a] > room.scores[b] ? a : b
//         );

//         console.log(`Game Over. Updating DB for players: ${Object.keys(room.scores).join(', ')}`);

//         // --- SECURE DATABASE UPDATE ---
//         const updatePromises = Object.keys(room.scores).map(async (playerUsername) => {
//           const isWinner = playerUsername === winnerUsername;
          
//           // Using atomic $inc operator ensures we don't overwrite other concurrent updates
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
        
//         // Cleanup room after 60s
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

//   socket.on('disconnect', () => {
//     console.log("User Disconnected", socket.id);
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

// Routes
import roomRoutes from './routes/roomRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Models
import Problem from './models/Problem.js';
import User from './models/User.js';

dotenv.config();
connectDB();

const app = express();

// --- SECURITY: RESTRICT CORS ---
// Allows Localhost (dev) and Vercel (prod)
const ALLOWED_ORIGINS = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL // This reads from Render Environment Variables
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);

// GAME STATE (In-Memory)
const rooms = new Map();

io.on('connection', async (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // --- BROADCAST LIVE STATS (Live Count + Total Users) ---
  try {
    const totalUsers = await User.countDocuments();
    io.emit('site_stats', {
        live: io.engine.clientsCount,
        total: totalUsers
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
  // ------------------------------------------------------

  socket.on('join_room', async (data) => {
    try {
      const { roomId, username } = data;
      
      if (!roomId || !username) return; 

      // 1. Initialize Room
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
          console.error("DB Error fetching problems:", error);
          return;
        }
      }

      const room = rooms.get(roomId);

      // 2. Check for Reconnect vs New Player
      let playerIndex = room.players.findIndex(p => p.username === username);
      let side;

      if (playerIndex !== -1) {
        // RECONNECT: Update socket ID but keep side
        room.players[playerIndex].id = socket.id;
        side = room.players[playerIndex].side;
      } else {
        // NEW PLAYER
        if (room.players.length >= 2) {
          socket.emit('room_full');
          return;
        }

        // Assign Side
        if (room.players.length === 0) {
          side = 'left';
        } else {
          side = room.players[0].side === 'left' ? 'right' : 'left';
        }
        
        room.players.push({ id: socket.id, username, side });
        room.scores[username] = 0;
      }

      socket.join(roomId);

      // 3. Send State
      const currentProblem = room.problems[room.round - 1];
      
      io.to(roomId).emit('room_joined', { 
        roomId, 
        side: side,
        players: room.players,
        problem: currentProblem,
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

      console.log(`User ${username} solved Round ${room.round}`);

      // 1. Update Score
      if (room.scores[username] !== undefined) {
        room.scores[username] += 10;
      }

      // 2. Broadcast Score Update
      io.to(roomId).emit('score_update', room.scores);

      // 3. Move to Next Round OR End Game
      if (room.round < room.totalRounds) {
        room.round++;
        const nextProblem = room.problems[room.round - 1];
        
        io.to(roomId).emit('new_round', {
          round: room.round,
          problem: nextProblem,
          scores: room.scores,
        });
      } else {
        // --- GAME OVER LOGIC ---
        room.isGameActive = false; 

        const winnerUsername = Object.keys(room.scores).reduce((a, b) => 
          room.scores[a] > room.scores[b] ? a : b
        );

        console.log(`Game Over. Updating DB for players: ${Object.keys(room.scores).join(', ')}`);

        // --- SECURE DATABASE UPDATE ---
        const updatePromises = Object.keys(room.scores).map(async (playerUsername) => {
          const isWinner = playerUsername === winnerUsername;
          
          const updateFields = {
            $inc: {
              'stats.matchesPlayed': 1,
              'stats.wins': isWinner ? 1 : 0 
            }
          };

          await User.findOneAndUpdate({ username: playerUsername }, updateFields);
        });

        await Promise.all(updatePromises);
        // -----------------------------

        io.to(roomId).emit('game_over', { 
          scores: room.scores, 
          winner: winnerUsername 
        });
        
        // Cleanup after 60s
        setTimeout(() => {
          if (rooms.has(roomId)) {
            rooms.delete(roomId);
            console.log(`Cleaned up room ${roomId}`);
          }
        }, 60000);
      }
    } catch (err) {
      console.error("Level Completed Error:", err);
    }
  });

  socket.on('disconnect', async () => {
    console.log("User Disconnected", socket.id);
    
    // Update stats on disconnect (Decrease live count)
    try {
        const totalUsers = await User.countDocuments();
        io.emit('site_stats', {
            live: io.engine.clientsCount,
            total: totalUsers
        });
    } catch (e) { console.error(e); }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});