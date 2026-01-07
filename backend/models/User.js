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





// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     // --- Identity ---
//     fullName: { type: String, required: true, trim: true },
//     username: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     phone: { type: String, required: true, trim: true },
//     password: { type: String, required: true, minlength: 7 },

//     // ✅ FIXED: Avatar now uses simple string default
//     avatar: { 
//         type: String, 
//         default: ''  // Will be set explicitly during registration
//     },

//     // --- 🏆 RANKING SYSTEM ---
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

//     // ✅ ADDED: Missing matchHistory field
//     matchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],

//     createdAt: { type: Date, default: Date.now },
// }, {
//     timestamps: true  // Automatically adds createdAt and updatedAt
// });

// // ✅ FIXED: Single pre-save hook with ALL logic
// userSchema.pre('save', async function (next) {
//     try {
//         // 1. Hash password if modified
//         if (this.isModified('password')) {
//             const salt = await bcrypt.genSalt(10);
//             this.password = await bcrypt.hash(this.password, salt);
//         }

//         // 2. Ensure stats object exists (safety check)
//         if (!this.stats) {
//             this.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
//         }

//         // 3. Set avatar if not provided
//         if (!this.avatar) {
//             this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
//         }

//         next();
//     } catch (error) {
//         next(error);  // Pass error to Mongoose
//     }
// });

// // Password comparison method
// userSchema.methods.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// export default User;





import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // --- Identity ---
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 7 },

    // Avatar
    avatar: { 
        type: String, 
        default: ''
    },

    // --- 🏆 RANKING SYSTEM ---
    rating: { 
        type: Number, 
        default: 1000, 
        index: true
    },

    seasonScore: { 
        type: Number, 
        default: 0, 
        index: true
    },

    // --- Statistics ---
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }, 
        matchesPlayed: { type: Number, default: 0 },
    },

    matchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],

    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

// ✅ CRITICAL FIX: Mongoose 7+ async hook - NO next() callback!
userSchema.pre('save', async function () {
    // 1. Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // 2. Ensure stats object exists (safety check)
    if (!this.stats) {
        this.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
    }

    // 3. Set avatar if not provided
    if (!this.avatar) {
        this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
    }

    // ✅ NO next() call needed - async function returns promise automatically
    // If an error occurs, it will be thrown and caught by Mongoose
});

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;