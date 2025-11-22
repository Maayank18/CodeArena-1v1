// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js'; // <--- MISSING IMPORT
// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js'; 
// import problemRoutes from './routes/problemRoutes.js';
// import Problem from './models/Problem.js';

// // Load environment variables
// dotenv.config();

// // Connect to Database
// connectDB(); // <--- THIS WAS MISSING!

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173", 
//         methods: ["GET", "POST"]
//     }
// });

// // API Routes
// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes); // Make sure this is here for the runner
// app.use('/api/problems', problemRoutes);

// // ---------------------------------------------------
// // Socket Logic (We will refactor this later to use DB)
// // ---------------------------------------------------
// const rooms = new Map();

// io.on('connection', (socket) => {
//     console.log(`User Connected: ${socket.id}`);

//     socket.on('join_room', async (data) => {
//         const { roomId, username } = data;
        
//         // 1. Create room in memory if it doesn't exist
//         if (!rooms.has(roomId)) {
//             try {
//                 // Fetch a random problem from DB
//                 const count = await Problem.countDocuments();
//                 const random = Math.floor(Math.random() * count);
//                 const randomProblem = await Problem.findOne().skip(random);

//                 rooms.set(roomId, {
//                     players: [],
//                     problem: randomProblem // <--- Assign problem to room
//                 });
//             } catch (error) {
//                 console.error("Error fetching problem:", error);
//                 return; // Handle error appropriately
//             }
//         }

//         const room = rooms.get(roomId);

//         // 2. Check if room is full
//         if (room.players.length >= 2) {
//             socket.emit('room_full', { message: "Room is full!" });
//             return;
//         }

//         // 3. Assign Side
//         const side = room.players.length === 0 ? 'left' : 'right';
        
//         // 4. Add player
//         // Check if user already exists to prevent duplicates on re-join
//         const existingPlayerIndex = room.players.findIndex(p => p.username === username);
//         if (existingPlayerIndex === -1) {
//             room.players.push({ id: socket.id, username, side });
//         }

//         socket.join(roomId);

//         // 5. Send Room Data (Including the Problem!)
//         socket.emit('room_joined', { 
//             roomId, 
//             side, 
//             players: room.players,
//             problem: room.problem // <--- Send problem to client
//         });

//         socket.to(roomId).emit('player_joined', { 
//             username, 
//             side 
//         });
        
//         console.log(`User ${username} joined ${roomId} as ${side}`);
//     });

//     socket.on('disconnect', () => {
//         console.log("User Disconnected", socket.id);
//     });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });






// somewhere correctly working backend will flawed in reconnection of refresh 
// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import roomRoutes from './routes/roomRoutes.js';
// import submissionRoutes from './routes/submissionRoutes.js';
// import problemRoutes from './routes/problemRoutes.js';
// import Problem from './models/Problem.js';

// // Load environment variables
// dotenv.config();

// // Connect to Database
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:5173", 
//         methods: ["GET", "POST"]
//     }
// });

// // API Routes
// app.use('/api/rooms', roomRoutes);
// app.use('/api/run', submissionRoutes);
// app.use('/api/problems', problemRoutes);

// // ---------------------------------------------------
// // GAME STATE MANAGEMENT (In-Memory)
// // ---------------------------------------------------
// // Structure: 
// // { 
// //   roomId: { 
// //     players: [{ id, username, side }], 
// //     round: 1, 
// //     totalRounds: 5, 
// //     problems: [Problem1, Problem2...], 
// //     scores: { "username": 0 } 
// //   } 
// // }
// const rooms = new Map();

// io.on('connection', (socket) => {
//     console.log(`User Connected: ${socket.id}`);

//     socket.on('join_room', async (data) => {
//         const { roomId, username } = data;
        
//         // 1. Initialize Room if it doesn't exist
//         if (!rooms.has(roomId)) {
//             try {
//                 // Fetch 5 Random Problems for the match
//                 const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
                
//                 rooms.set(roomId, {
//                     players: [],
//                     round: 1,
//                     totalRounds: 5,
//                     problems: problems, // Store the 5 problems for this session
//                     scores: {} 
//                 });
//             } catch (error) {
//                 console.error("Error fetching problems:", error);
//                 return;
//             }
//         }

//         const room = rooms.get(roomId);

//         // 2. Check if room is full (Allow reconnects)
//         const existingPlayer = room.players.find(p => p.username === username);
        
//         if (!existingPlayer && room.players.length >= 2) {
//             socket.emit('room_full', { message: "Room is full!" });
//             return;
//         }

//         // 3. Assign Side (Left vs Right)
//         const side = room.players.length === 0 ? 'left' : 'right';
        
//         // 4. Add Player to State
//         if (!existingPlayer) {
//             room.players.push({ id: socket.id, username, side });
//             room.scores[username] = 0; // Initialize score
//         } else {
//             // Update socket ID on reconnect
//             existingPlayer.id = socket.id;
//         }

//         socket.join(roomId);

//         // 5. Send Initial Game State to Client
//         // We send the CURRENT problem based on the round
//         const currentProblem = room.problems[room.round - 1];

//         io.to(roomId).emit('room_joined', { 
//             roomId, 
//             side: existingPlayer ? existingPlayer.side : side,
//             players: room.players,
//             problem: currentProblem,
//             round: room.round,
//             totalRounds: room.totalRounds,
//             scores: room.scores
//         });

//         // Notify others
//         socket.to(roomId).emit('player_joined', { 
//             username, 
//             side: existingPlayer ? existingPlayer.side : side
//         });
        
//         console.log(`User ${username} joined ${roomId} as ${side}`);
//     });

//     // ---------------------------------------------------
//     // GAME LOGIC: Level Completed / Next Round
//     // ---------------------------------------------------
//     socket.on('level_completed', ({ roomId, username }) => {
//         const room = rooms.get(roomId);
//         if (!room) return;

//         console.log(`User ${username} solved Round ${room.round}`);

//         // 1. Update Score (+10 for winning the round)
//         if (room.scores[username] !== undefined) {
//             room.scores[username] += 10;
//         }

//         // 2. Broadcast new scores immediately
//         io.to(roomId).emit('score_update', room.scores);

//         // 3. Move to Next Round
//         if (room.round < room.totalRounds) {
//             room.round++;
//             const nextProblem = room.problems[room.round - 1];
            
//             // Notify everyone to switch problem
//             io.to(roomId).emit('new_round', {
//                 round: room.round,
//                 problem: nextProblem,
//                 scores: room.scores,
//                 triggerBy: username
//             });
//         } else {
//             // 4. Game Over Logic
//             // Determine Winner
//             const winner = Object.keys(room.scores).reduce((a, b) => 
//                 room.scores[a] > room.scores[b] ? a : b
//             );

//             io.to(roomId).emit('game_over', {
//                 scores: room.scores,
//                 winner: winner
//             });
            
//             // Optional: Clear room after delay
//             // rooms.delete(roomId);
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log("User Disconnected", socket.id);
//         // We keep the room in memory briefly in case of refresh/reconnect
//     });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });







// updated flawed code 
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import roomRoutes from './routes/roomRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import authRoutes from './routes/authRoutes.js'; // <--- 1. Import Routes
import Problem from './models/Problem.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});

app.use('/api/rooms', roomRoutes);
app.use('/api/run', submissionRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);

// GAME STATE
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        const { roomId, username } = data;
        
        // 1. Initialize Room
        if (!rooms.has(roomId)) {
            try {
                const problems = await Problem.aggregate([{ $sample: { size: 5 } }]);
                rooms.set(roomId, {
                    players: [],
                    round: 1,
                    totalRounds: 1, // round 1 for testing purpose only 
                    problems: problems, 
                    scores: {} 
                });
            } catch (error) {
                console.error(error);
                return;
            }
        }

        const room = rooms.get(roomId);

        // 2. Check if this user is ALREADY in the room (Reconnect based on Username)
        let playerIndex = room.players.findIndex(p => p.username === username);
        let side;

        if (playerIndex !== -1) {
            // RECONNECT: Update socket ID but keep side
            room.players[playerIndex].id = socket.id;
            side = room.players[playerIndex].side;
        } else {
            // NEW PLAYER:
            if (room.players.length >= 2) {
                socket.emit('room_full');
                return;
            }

            // Assign Side based on who is already there
            // If 0 players -> Left
            // If 1 player -> The opposite of that player
            if (room.players.length === 0) {
                side = 'left';
            } else {
                side = room.players[0].side === 'left' ? 'right' : 'left';
            }
            
            // Add new player
            room.players.push({ id: socket.id, username, side });
            room.scores[username] = 0;
        }

        socket.join(roomId);

        // 3. Send State to THIS user
        socket.emit('room_joined', { 
            roomId, 
            side: side, // Correct side is sent here
            players: room.players,
            problem: room.problems[room.round - 1],
            round: room.round,
            totalRounds: room.totalRounds,
            scores: room.scores
        });

        // 4. Notify OTHERS that a player joined/rejoined
        socket.to(roomId).emit('player_joined', { username, side });
        
        console.log(`User ${username} joined ${roomId} as ${side}`);
    });
    socket.on('level_completed', ({ roomId, username }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        room.scores[username] += 10;
        io.to(roomId).emit('score_update', room.scores);

        if (room.round < room.totalRounds) {
            room.round++;
            const nextProblem = room.problems[room.round - 1];
            io.to(roomId).emit('new_round', {
                round: room.round,
                problem: nextProblem,
                scores: room.scores,
            });
        } else {
            const winner = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);
            io.to(roomId).emit('game_over', { scores: room.scores, winner });
        }
    });

    socket.on('disconnect', () => {
        console.log("User Disconnected", socket.id);
        // Note: We do NOT remove the player from the array immediately. 
        // This allows them to refresh the page and reconnect as the same "side".
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});