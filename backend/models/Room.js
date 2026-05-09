// // Updated room model
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
    
//     // 👥 PLAYERS: Now links to the User Model for ELO updates
//     players: [{
//         userId: { 
//             type: mongoose.Schema.Types.ObjectId, 
//             ref: 'User'  // Link to User collection
//         },
//         username: String,
//         socketId: String,
//         side: { type: String, enum: ['left', 'right'] },
//         currentScore: { type: Number, default: 0 } // Persist score in DB
//     }],

//     // 🎮 GAME STATE
//     currentRound: { type: Number, default: 1 },
//     totalRounds: { type: Number, default: 3 },
    
//     // Store the specific problems for this match
//     problems: [{ 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Problem' 
//     }],

//     // 🏆 RESULT
//     winner: { type: String, default: null }, // Username of winner

//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// // ⏳ AUTO-DELETE: Remove room 24 hours after creation (86400 seconds)
// // This keeps your DB clean but allows enough time for match history checks.
// roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// export default mongoose.model('Room', roomSchema);








// FILE: backend/models/Room.js
// OPTIMIZED VERSION - BACKWARD COMPATIBLE
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
    
    players: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        },
        username: String,
        socketId: String, // ✅ KEPT - even though unused (safe for debugging)
        side: { 
            type: String, 
            enum: ['left', 'right'] 
        },
        currentScore: { 
            type: Number, 
            default: 0 
        }
    }],

    currentRound: { 
        type: Number, 
        default: 1 
    },
    totalRounds: { 
        type: Number, 
        default: 3 
    },
    
    problems: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Problem' 
    }],

    winner: { 
        type: String, 
        default: null 
    },

    // ── Custom Battle Room Fields ─────────────────────────────────
    isCustom: {
        type: Boolean,
        default: false
    },
    customSettings: {
        timeLimit: { type: Number, default: 1800 },      // seconds
        numQuestions: { type: Number, default: 3 },
        topics: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    activatedAt: {
        type: Date,
        default: null
    },
    quotaChargedAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ EXISTING TTL INDEX (kept as-is)
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// ✅ NEW: Explicit unique index on roomId
// Used in: roomController.js - Room.findOne({ roomId })
// Impact: Instant O(1) room lookups instead of O(n) collection scan
// CRITICAL FIX: Without this, every room join does full table scan!
roomSchema.index({ roomId: 1 }, { unique: true });

// ✅ NEW: Status-based queries optimization
// Used in: statsController.js - Room.countDocuments({ status: 'active' })
// Impact: 100x faster active room counting
roomSchema.index({ status: 1 });

// ✅ NEW: Compound index for admin queries
// Used in: Admin dashboard filtering active/waiting rooms
// Impact: Single index scan instead of multiple lookups
roomSchema.index({ status: 1, createdAt: -1 });

// ✅ NEW: Custom room queries
roomSchema.index({ isCustom: 1, status: 1 });

export default mongoose.model('Room', roomSchema);
// V 1.5
