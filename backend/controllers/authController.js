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
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ fullName, username, email, phone, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName, // Send back full name
                token: generateToken(user._id),
                stats: user.stats
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
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
                token: generateToken(user._id),
                stats: user.stats
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};