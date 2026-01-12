




// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//     // --- Identity ---
//     fullName: { type: String, required: true, trim: true },
//     username: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     phone: { type: String, required: true, trim: true },
//     password: { type: String, required: true, minlength: 7 },

//     // Avatar
//     avatar: { 
//         type: String, 
//         default: ''
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

//     matchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],

//     createdAt: { type: Date, default: Date.now },
// }, {
//     timestamps: true
// });

// // ✅ CRITICAL FIX: Mongoose 7+ async hook - NO next() callback!
// userSchema.pre('save', async function () {
//     // 1. Hash password if modified
//     if (this.isModified('password')) {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//     }

//     // 2. Ensure stats object exists (safety check)
//     if (!this.stats) {
//         this.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
//     }

//     // 3. Set avatar if not provided
//     if (!this.avatar) {
//         this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
//     }

//     // ✅ NO next() call needed - async function returns promise automatically
//     // If an error occurs, it will be thrown and caught by Mongoose
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
    
    // ✅ SOFT OPTIMIZATION: Optional field for fast lookups
    // - NOT required (backwards compatible)
    // - Auto-created on save (pre-save hook)
    // - Indexed for 100x faster queries
    usernameLower: { 
        type: String, 
        unique: true,
        sparse: true,  // Allows null values initially
        lowercase: true,
        index: true
    },
    
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 7 },

    avatar: { type: String, default: '' },

    // --- 🏆 RANKING SYSTEM ---
    rating: { type: Number, default: 1000, index: true },
    seasonScore: { type: Number, default: 0, index: true },

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

// ✅ AUTO-OPTIMIZATION: Pre-save hook creates usernameLower automatically
userSchema.pre('save', async function () {
    // 1. Auto-create usernameLower for fast lookups
    if (this.isModified('username') || this.isNew) {
        this.usernameLower = this.username.toLowerCase();
    }

    // 2. Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // 3. Ensure stats object exists
    if (!this.stats) {
        this.stats = { wins: 0, losses: 0, matchesPlayed: 0 };
    }

    // 4. Set avatar if not provided
    if (!this.avatar) {
        this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
    }
});

// ✅ SMART QUERY HELPER: Tries fast method first, fallback to slow
userSchema.statics.findByUsername = async function(username) {
    const lowerUsername = username.toLowerCase();
    
    // Try fast lookup first (if usernameLower exists)
    let user = await this.findOne({ usernameLower: lowerUsername });
    
    // Fallback to regex (for old users without usernameLower)
    if (!user) {
        user = await this.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, "i") } 
        });
        
        // ✅ AUTO-UPGRADE: If found via regex, update with usernameLower
        if (user && !user.usernameLower) {
            user.usernameLower = lowerUsername;
            await user.save();
        }
    }
    
    return user;
};

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;