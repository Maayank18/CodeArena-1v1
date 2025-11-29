// // this would contain all the detail for the room model

// import mongoose from 'mongoose';

// const roomSchema = new mongoose.Schema({
//     roomId: { 
//         type: String, 
//         required: true, 
//         unique: true 
//     },
//     status: {
//         type: String,
//         enum: ['waiting', 'active', 'finished'],
//         default: 'waiting'
//     },
//     players: [{
//         username: String,
//         socketId: String,
//         side: { type: String, enum: ['left', 'right'] }
//     }],
//     createdAt: {
//         type: Date,
//         default: Date.now,
//         expires: 3600 // Auto-delete room after 1 hour to save space (optional)
//     }
// });

// export default mongoose.model('Room', roomSchema);






// Updated room model
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'finished'],
        default: 'waiting'
    },
    
    // 👥 PLAYERS: Now links to the User Model for ELO updates
    players: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'  // Link to User collection
        },
        username: String,
        socketId: String,
        side: { type: String, enum: ['left', 'right'] },
        currentScore: { type: Number, default: 0 } // Persist score in DB
    }],

    // 🎮 GAME STATE
    currentRound: { type: Number, default: 1 },
    totalRounds: { type: Number, default: 3 },
    
    // Store the specific problems for this match
    problems: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Problem' 
    }],

    // 🏆 RESULT
    winner: { type: String, default: null }, // Username of winner

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ⏳ AUTO-DELETE: Remove room 24 hours after creation (86400 seconds)
// This keeps your DB clean but allows enough time for match history checks.
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('Room', roomSchema);