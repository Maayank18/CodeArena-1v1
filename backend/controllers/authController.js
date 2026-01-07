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



// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';

// // ✅ Helper to Generate Token safely
// const generateToken = (id) => {
//     if (!process.env.JWT_SECRET) {
//         throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
//     }
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// export const registerUser = async (req, res) => {
//     const { fullName, username, email, phone, password } = req.body;

//     try {
//         // 1. Strict Validation
//         if (!fullName || !username || !email || !phone || !password) {
//             return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
//         }
        
//         if (password.length < 7) {
//             return res.status(400).json({ message: 'Password must be at least 7 characters' });
//         }

//         // 2. Check for Duplicates
//         // We check email and username separately to give a precise error message
//         const emailExists = await User.findOne({ email });
//         if (emailExists) return res.status(400).json({ message: 'This Email is already registered' });

//         const userExists = await User.findOne({ username });
//         if (userExists) return res.status(400).json({ message: 'This Username is already taken' });

//         // 3. Generate Assets
//         const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

//         // 4. Create User (Explicitly set defaults to be 100% safe)
//         const user = await User.create({ 
//             fullName, 
//             username, 
//             email, 
//             phone, 
//             password,
//             avatar,
//             rating: 1000,
//             seasonScore: 0,
//             stats: { wins: 0, losses: 0, matchesPlayed: 0 },
//             matchHistory: []
//         });

//         if (user) {
//             res.status(201).json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phone: user.phone,
//                 avatar: user.avatar,
//                 rating: user.rating,
//                 seasonScore: user.seasonScore,
//                 stats: user.stats,
//                 token: generateToken(user._id),
//             });
//         } else {
//             res.status(400).json({ message: 'Invalid user data received' });
//         }
//     } catch (error) {
//         // ✅ CRITICAL: Log the actual error to the console so you can see it in Render logs
//         console.error("❌ Registration Error:", error.message); 
//         res.status(500).json({ message: error.message || "Server Error during registration" });
//     }
// };

// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         const user = await User.findOne({ email });

//         if (user && (await user.matchPassword(password))) {
//             res.json({
//                 _id: user._id,
//                 username: user.username,
//                 fullName: user.fullName,
//                 email: user.email,
//                 phone: user.phone,
//                 avatar: user.avatar,
//                 rating: user.rating,
//                 seasonScore: user.seasonScore,
//                 stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 }, // Safety fallback
//                 token: generateToken(user._id),
//             });
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         console.error("Login Error:", error.message);
//         res.status(500).json({ message: "Server Error during login" });
//     }
// };








import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// ✅ Helper to Generate Token safely
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error("❌ CRITICAL: JWT_SECRET is missing from environment variables!");
        throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    try {
        console.log("📝 Registration attempt for:", { username, email });

        // 1. Strict Validation
        if (!fullName || !username || !email || !phone || !password) {
            console.log("❌ Validation failed: Missing fields");
            return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
        }
        
        // Trim whitespace from all inputs
        const trimmedFullName = fullName.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        if (password.length < 7) {
            console.log("❌ Validation failed: Password too short");
            return res.status(400).json({ message: 'Password must be at least 7 characters' });
        }

        // 2. Check for Duplicates (case-insensitive)
        const emailExists = await User.findOne({ email: trimmedEmail });
        if (emailExists) {
            console.log("❌ Email already exists:", trimmedEmail);
            return res.status(400).json({ message: 'This Email is already registered' });
        }

        const userExists = await User.findOne({ username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } });
        if (userExists) {
            console.log("❌ Username already exists:", trimmedUsername);
            return res.status(400).json({ message: 'This Username is already taken' });
        }

        // 3. Generate Avatar
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`;

        // 4. ✅ FIXED: Create User with ONLY defined schema fields
        const user = await User.create({ 
            fullName: trimmedFullName, 
            username: trimmedUsername, 
            email: trimmedEmail, 
            phone: trimmedPhone, 
            password: password,  // Will be hashed by pre-save hook
            avatar: avatar,
            // Remove explicit defaults - let schema handle it
        });

        console.log("✅ User created successfully:", user.username);

        if (user) {
            // Generate token
            const token = generateToken(user._id);

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
                token: token,
            });
        } else {
            console.error("❌ User creation returned null");
            res.status(400).json({ message: 'Invalid user data received' });
        }
    } catch (error) {
        // ✅ ENHANCED ERROR LOGGING
        console.error("❌❌❌ REGISTRATION ERROR ❌❌❌");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            console.error(`❌ Duplicate key error on field: ${field}`);
            return res.status(400).json({ message: `This ${field} is already registered` });
        }

        if (error.name === 'ValidationError') {
            console.error("❌ Mongoose validation error:", error.errors);
            return res.status(400).json({ message: 'Validation error: ' + error.message });
        }

        res.status(500).json({ 
            message: "Server Error during registration",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        console.log("🔐 Login attempt for email:", email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordMatch = await user.matchPassword(password);
        
        if (!isPasswordMatch) {
            console.log("❌ Password mismatch for:", email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log("✅ Login successful for:", user.username);

        res.json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            rating: user.rating,
            seasonScore: user.seasonScore,
            stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("❌ LOGIN ERROR:", error.message);
        console.error("Error Stack:", error.stack);
        res.status(500).json({ message: "Server Error during login" });
    }
};