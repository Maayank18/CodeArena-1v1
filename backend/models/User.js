// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     // --- Identity ---
//     fullName: { type: String, required: true },
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true },
//     password: { type: String, required: true, minlength: 7 },

//     // --- 🏆 RANKING SYSTEM (New) ---
    
//     // 1. ELO RATING (Skill)
//     // Starts at 1200. Used for Matchmaking and "Level 5 Coder" titles.
//     // Index: true makes finding opponents fast.
//     rating: { 
//         type: Number, 
//         default: 1000, 
//         index: true 
//     },

//     // 2. SEASON SCORE (Grind)
//     // Starts at 0. Resets monthly via Cron Job.
//     // Used for the "Top 50" Leaderboard UI.
//     seasonScore: { 
//         type: Number, 
//         default: 0, 
//         index: true 
//     },

//     // --- Statistics ---
//     stats: {
//         wins: { type: Number, default: 0 },
//         losses: { type: Number, default: 0 }, // Added: vital for Win Rate %
//         matchesPlayed: { type: Number, default: 0 },
//         // score: { type: Number, default: 0 } // DEPRECATED: We use rating/seasonScore now
//     },

//     createdAt: { type: Date, default: Date.now },
// });

// // --- Encryption Middleware (unchanged) ---
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




// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     // --- Identity ---
//     fullName: { type: String, required: true },
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true },
//     password: { type: String, required: true, minlength: 7 },

//     // ***************************************************************
//     // ✅ KEEPING: Avatar field for high-tier Match History UI
//     // ***************************************************************
//     avatar: { 
//         type: String, 
//         default: function() {
//             return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
//         }
//     },

//     // --- 🏆 RANKING SYSTEM ---
//     // rating (ELO) and seasonScore (Leaderboard) are now primary
//     rating: { 
//         type: Number, 
//         default: 1000, 
//         index: true 
//     },

//     seasonScore: { 
//         type: Number, 
//         default: 0, 
//         index: true 
//     },

//     // --- Statistics ---
//     stats: {
//         wins: { type: Number, default: 0 },
//         losses: { type: Number, default: 0 }, 
//         matchesPlayed: { type: Number, default: 0 },
//     },

//     createdAt: { type: Date, default: Date.now },
// });

// // --- Encryption Middleware ---
// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
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

    // ✅ avatar: Dynamic generation based on username
    avatar: { 
        type: String, 
        default: function() {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
        }
    },

    // --- 🏆 RANKING SYSTEM ---
    // ✅ rating: Standardized to 1000 for Novice start
    rating: { 
        type: Number, 
        default: 1000, 
        index: true // Optimized for Elo-based matching
    },

    // ✅ seasonScore: Leaderboard ranking points
    seasonScore: { 
        type: Number, 
        default: 0, 
        index: true // Optimized for Leaderboard sorting
    },

    // --- Statistics ---
    // ✅ Strict Defaults: Prevents the "0 Matches" bug on Leaderboard
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }, 
        matchesPlayed: { type: Number, default: 0 },
    },

    createdAt: { type: Date, default: Date.now },
});

// --- Encryption Middleware (Do not change) ---
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Add this line to ensure stats object exists on creation
userSchema.pre('save', function(next) {
    if (!this.stats) {
        this.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
    }
    next();
});

const User = mongoose.model('User', userSchema);
export default User;