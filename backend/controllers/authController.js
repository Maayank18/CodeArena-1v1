// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';

// // ✅ Helper to Generate Token safely
// const generateToken = (id) => {
//     if (!process.env.JWT_SECRET) {
//         console.error("❌ CRITICAL: JWT_SECRET is missing from environment variables!");
//         throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
//     }
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// export const registerUser = async (req, res) => {
//     const { fullName, username, email, phone, password } = req.body;

//     try {
//         console.log("📝 Registration attempt for:", { username, email });

//         // 1. Strict Validation
//         if (!fullName || !username || !email || !phone || !password) {
//             console.log("❌ Validation failed: Missing fields");
//             return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
//         }
        
//         // Trim whitespace from all inputs
//         const trimmedFullName = fullName.trim();
//         const trimmedUsername = username.trim();
//         const trimmedEmail = email.trim().toLowerCase();
//         const trimmedPhone = phone.trim();

//         if (password.length < 7) {
//             console.log("❌ Validation failed: Password too short");
//             return res.status(400).json({ message: 'Password must be at least 7 characters' });
//         }

//         // 2. Check for Duplicates (case-insensitive)
//         const emailExists = await User.findOne({ email: trimmedEmail });
//         if (emailExists) {
//             console.log("❌ Email already exists:", trimmedEmail);
//             return res.status(400).json({ message: 'This Email is already registered' });
//         }

//         const userExists = await User.findOne({ username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } });
//         if (userExists) {
//             console.log("❌ Username already exists:", trimmedUsername);
//             return res.status(400).json({ message: 'This Username is already taken' });
//         }

//         // 3. Generate Avatar
//         const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`;

//         // 4. ✅ FIXED: Create User with ONLY defined schema fields
//         const user = await User.create({ 
//             fullName: trimmedFullName, 
//             username: trimmedUsername, 
//             email: trimmedEmail, 
//             phone: trimmedPhone, 
//             password: password,  // Will be hashed by pre-save hook
//             avatar: avatar,
//             // Remove explicit defaults - let schema handle it
//         });

//         console.log("✅ User created successfully:", user.username);

//         if (user) {
//             // Generate token
//             const token = generateToken(user._id);

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
//                 token: token,
//             });
//         } else {
//             console.error("❌ User creation returned null");
//             res.status(400).json({ message: 'Invalid user data received' });
//         }
//     } catch (error) {
//         // ✅ ENHANCED ERROR LOGGING
//         console.error("❌❌❌ REGISTRATION ERROR ❌❌❌");
//         console.error("Error Name:", error.name);
//         console.error("Error Message:", error.message);
//         console.error("Error Stack:", error.stack);
        
//         // Handle specific MongoDB errors
//         if (error.code === 11000) {
//             const field = Object.keys(error.keyPattern)[0];
//             console.error(`❌ Duplicate key error on field: ${field}`);
//             return res.status(400).json({ message: `This ${field} is already registered` });
//         }

//         if (error.name === 'ValidationError') {
//             console.error("❌ Mongoose validation error:", error.errors);
//             return res.status(400).json({ message: 'Validation error: ' + error.message });
//         }

//         res.status(500).json({ 
//             message: "Server Error during registration",
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };

// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
    
//     try {
//         console.log("🔐 Login attempt for email:", email);

//         if (!email || !password) {
//             return res.status(400).json({ message: 'Please provide email and password' });
//         }

//         const user = await User.findOne({ email: email.trim().toLowerCase() });

//         if (!user) {
//             console.log("❌ User not found:", email);
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         const isPasswordMatch = await user.matchPassword(password);
        
//         if (!isPasswordMatch) {
//             console.log("❌ Password mismatch for:", email);
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         console.log("✅ Login successful for:", user.username);

//         res.json({
//             _id: user._id,
//             username: user.username,
//             fullName: user.fullName,
//             email: user.email,
//             phone: user.phone,
//             avatar: user.avatar,
//             rating: user.rating,
//             seasonScore: user.seasonScore,
//             stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
//             token: generateToken(user._id),
//         });
//     } catch (error) {
//         console.error("❌ LOGIN ERROR:", error.message);
//         console.error("Error Stack:", error.stack);
//         res.status(500).json({ message: "Server Error during login" });
//     }
// };















import User from '../models/User.js';
import jwt from 'jsonwebtoken';

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

        // 1. Validation
        if (!fullName || !username || !email || !phone || !password) {
            console.log("❌ Validation failed: Missing fields");
            return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
        }
        
        const trimmedFullName = fullName.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        if (password.length < 7) {
            console.log("❌ Validation failed: Password too short");
            return res.status(400).json({ message: 'Password must be at least 7 characters' });
        }

        // 2. Check for Duplicates
        const emailExists = await User.findOne({ email: trimmedEmail });
        if (emailExists) {
            console.log("❌ Email already exists:", trimmedEmail);
            return res.status(400).json({ message: 'This Email is already registered' });
        }

        // ✅ OPTIMIZED: Use smart helper (tries fast query first, falls back to regex)
        const userExists = await User.findByUsername(trimmedUsername);
        if (userExists) {
            console.log("❌ Username already exists:", trimmedUsername);
            return res.status(400).json({ message: 'This Username is already taken' });
        }

        // 3. Create User
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`;

        const user = await User.create({ 
            fullName: trimmedFullName, 
            username: trimmedUsername, 
            email: trimmedEmail, 
            phone: trimmedPhone, 
            password: password,
            avatar: avatar,
            // usernameLower will be auto-created by pre-save hook
        });

        console.log("✅ User created successfully:", user.username);

        if (user) {
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
        console.error("❌❌❌ REGISTRATION ERROR ❌❌❌");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        
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

        // ✅ Login uses email (already fast with index)
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

        // ✅ AUTO-UPGRADE: If user logs in and doesn't have usernameLower, add it
        if (!user.usernameLower) {
            user.usernameLower = user.username.toLowerCase();
            await user.save();
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