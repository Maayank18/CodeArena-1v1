import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};


export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    try {
        // 1. Validate all inputs
        if (!fullName || !username || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // 2. Password Strength Check
        if (password.length < 7) {
            return res.status(400).json({ message: 'Password must be at least 7 characters' });
        }

        // 3. Check for existing user (Email OR Username)
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // 4. Create User
        // Note: 'rating' (1200) and 'seasonScore' (0) are added automatically by Mongoose Defaults
        const user = await User.create({ 
            fullName, 
            username, 
            email, 
            phone, 
            password 
        });

        if (user) {
            // 5. CRITICAL: Send back the new fields!
            // The frontend needs 'rating' immediately to calculate "Level 1 Novice"
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                
                // ✅ NEW FIELDS FOR FRONTEND STATE
                rating: user.rating,       // Will be 1200
                seasonScore: user.seasonScore, // Will be 0
                stats: user.stats,         // Wins/Losses
                
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.error("Register Error:", error); // Helpful for debugging
        res.status(500).json({ message: "Server Error during registration" });
    }
};

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
//         if (userExists) return res.status(400).json({ message: 'User already exists' });

//         const user = await User.create({ fullName, username, email, phone, password });

//         if (user) {
//             res.status(201).json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName, // Send back full name
//                 token: generateToken(user._id),
//                 stats: user.stats
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };







export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,     // Good practice to return email for profile usage
                phone: user.phone,     // Return phone if you need it on the profile page
                
                // 🏆 NEW RANKING DATA (Required for Navbar & Profile)
                rating: user.rating,          // e.g., 1200
                seasonScore: user.seasonScore,// e.g., 0
                stats: user.stats,            // e.g., { wins: 5 }
                
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({ email });
//         if (user && (await user.matchPassword(password))) {
//             res.json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 token: generateToken(user._id),
//                 stats: user.stats
//             });
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };