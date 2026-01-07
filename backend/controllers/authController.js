// // backend/controllers/authController.js
// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';

// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// export const registerUser = async (req, res) => {
//     const { fullName, username, email, phone, password } = req.body;

//     try {
//         if (!fullName || !username || !email || !phone || !password) {
//             return res.status(400).json({ message: 'All fields are required' });
//         }
        
//         if (password.length < 7) {
//             return res.status(400).json({ message: 'Password must be at least 7 characters' });
//         }

//         const userExists = await User.findOne({ $or: [{ email }, { username }] });
//         if (userExists) {
//             return res.status(400).json({ message: 'Email or Username already taken' });
//         }

//         // ✅ ADDED: Default Avatar logic to prevent Match Save errors later
//         const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

//         const user = await User.create({ 
//             fullName, 
//             username, 
//             email, 
//             phone, 
//             password,
//             avatar // Ensure your User model has this field!
//         });

//         if (user) {
//             res.status(201).json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 email: user.email,
//                 avatar: user.avatar,
//                 rating: user.rating,
//                 seasonScore: user.seasonScore,
//                 stats: user.stats,
//                 token: generateToken(user._id),
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Server Error during registration" });
//     }
// };

// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         // We find by email, but we must make sure stats are populated
//         const user = await User.findOne({ email });

//         if (user && (await user.matchPassword(password))) {
//             res.json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phone: user.phone,
//                 avatar: user.avatar, // ✅ Critical for UI
//                 rating: user.rating,
//                 seasonScore: user.seasonScore,
//                 stats: user.stats,
//                 token: generateToken(user._id),
//             });
//         } else {
//             // ✅ IMPROVED: Specific error for wrong credentials
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };



import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// ✅ Helper to Generate Token safely
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    try {
        // 1. Strict Validation
        if (!fullName || !username || !email || !phone || !password) {
            return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
        }
        
        if (password.length < 7) {
            return res.status(400).json({ message: 'Password must be at least 7 characters' });
        }

        // 2. Check for Duplicates
        // We check email and username separately to give a precise error message
        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: 'This Email is already registered' });

        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'This Username is already taken' });

        // 3. Generate Assets
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        // 4. Create User (Explicitly set defaults to be 100% safe)
        const user = await User.create({ 
            fullName, 
            username, 
            email, 
            phone, 
            password,
            avatar,
            rating: 1000,
            seasonScore: 0,
            stats: { wins: 0, losses: 0, matchesPlayed: 0 },
            matchHistory: []
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                rating: user.rating,
                seasonScore: user.seasonScore,
                stats: user.stats,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data received' });
        }
    } catch (error) {
        // ✅ CRITICAL: Log the actual error to the console so you can see it in Render logs
        console.error("❌ Registration Error:", error.message); 
        res.status(500).json({ message: error.message || "Server Error during registration" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                rating: user.rating,
                seasonScore: user.seasonScore,
                stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 }, // Safety fallback
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Server Error during login" });
    }
};