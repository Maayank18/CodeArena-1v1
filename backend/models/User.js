// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     fullName: { type: String, required: true }, // New
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true },    // New
//     password: { type: String, required: true, minlength: 7 }, // Min 7 chars
//     stats: {
//         wins: { type: Number, default: 0 },
//         matchesPlayed: { type: Number, default: 0 },
//         score: { type: Number, default: 0 }
//     },
//     createdAt: { type: Date, default: Date.now },
// });

// // Encrypt password
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) next();
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// export default User;


import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // --- Identity ---
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 7 },

    // --- 🏆 RANKING SYSTEM (New) ---
    
    // 1. ELO RATING (Skill)
    // Starts at 1200. Used for Matchmaking and "Level 5 Coder" titles.
    // Index: true makes finding opponents fast.
    rating: { 
        type: Number, 
        default: 1000, 
        index: true 
    },

    // 2. SEASON SCORE (Grind)
    // Starts at 0. Resets monthly via Cron Job.
    // Used for the "Top 50" Leaderboard UI.
    seasonScore: { 
        type: Number, 
        default: 0, 
        index: true 
    },

    // --- Statistics ---
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }, // Added: vital for Win Rate %
        matchesPlayed: { type: Number, default: 0 },
        // score: { type: Number, default: 0 } // DEPRECATED: We use rating/seasonScore now
    },

    createdAt: { type: Date, default: Date.now },
});

// --- Encryption Middleware (unchanged) ---
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;