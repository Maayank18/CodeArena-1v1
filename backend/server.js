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
import Problem from './models/Problem.js';
// --- FIX 1: IMPORT USER MODEL ---
import User from './models/User.js'; 
// --------------------------------

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
            side: side,
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

    // Note: Added 'async' here because we will do DB operations now
    socket.on('level_completed', async ({ roomId, username }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        room.scores[username] += 10;
        io.to(roomId).emit('score_update', room.scores);

        if (room.round < room.totalRounds) {
            // Next Round Logic
            room.round++;
            const nextProblem = room.problems[room.round - 1];
            io.to(roomId).emit('new_round', {
                round: room.round,
                problem: nextProblem,
                scores: room.scores,
            });
        } else {
            // --- GAME OVER LOGIC ---
            const winnerUsername = Object.keys(room.scores).reduce((a, b) => room.scores[a] > room.scores[b] ? a : b);

            console.log(`Game Over. Updating DB for players: ${Object.keys(room.scores).join(', ')}`);

            // --- FIX 2: THE MISSING DATABASE UPDATE LOGIC ---
            try {
                // We create an array of promises to update all players in parallel
                const updatePromises = Object.keys(room.scores).map(async (playerUsername) => {
                    const isWinner = playerUsername === winnerUsername;
                    
                    // We use $inc (increment) Mongo operator
                    // Ensure your User schema has a 'stats' object with these fields!
                    const updateFields = {
                        $inc: {
                            'stats.matchesPlayed': 1,
                            // Only increment wins if they are the winner
                            'stats.wins': isWinner ? 1 : 0 
                        }
                    };

                    // Find user by username and update their stats
                    await User.findOneAndUpdate({ username: playerUsername }, updateFields);
                    console.log(`Updated stats for user: ${playerUsername}`);
                });

                // Wait for all DB updates to finish before sending final results
                await Promise.all(updatePromises);

            } catch (error) {
                console.error("Error updating user stats in DB:", error);
            }
            // --------------------------------------------------

            // Send final results to frontend
            io.to(roomId).emit('game_over', { scores: room.scores, winner: winnerUsername });
            
            // Optional: Clean up memory after a short delay
            setTimeout(() => {
                console.log(`Cleaning up room ${roomId}`);
                rooms.delete(roomId);
            }, 60000); // clear after 1 minute
        }
    });

    socket.on('disconnect', () => {
        console.log("User Disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});