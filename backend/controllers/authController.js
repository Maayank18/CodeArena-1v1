// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         const user = await User.findOne({ email });

//         if (user && (await user.matchPassword(password))) {
//             res.json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 email: user.email,     // Good practice to return email for profile usage
//                 phone: user.phone,     // Return phone if you need it on the profile page
                
//                 // 🏆 NEW RANKING DATA (Required for Navbar & Profile)
//                 rating: user.rating,          // e.g., 1200
//                 seasonScore: user.seasonScore,// e.g., 0
//                 stats: user.stats,            // e.g., { wins: 5 }
                
//                 token: generateToken(user._id),
//             });
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// backend/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    try {
        if (!fullName || !username || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (password.length < 7) {
            return res.status(400).json({ message: 'Password must be at least 7 characters' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'Email or Username already taken' });
        }

        // ✅ ADDED: Default Avatar logic to prevent Match Save errors later
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const user = await User.create({ 
            fullName, 
            username, 
            email, 
            phone, 
            password,
            avatar // Ensure your User model has this field!
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                rating: user.rating,
                seasonScore: user.seasonScore,
                stats: user.stats,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error during registration" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // We find by email, but we must make sure stats are populated
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar, // ✅ Critical for UI
                rating: user.rating,
                seasonScore: user.seasonScore,
                stats: user.stats,
                token: generateToken(user._id),
            });
        } else {
            // ✅ IMPROVED: Specific error for wrong credentials
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};