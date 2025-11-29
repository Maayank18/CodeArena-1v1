// import Room from '../models/Room.js';
// import { v4 as uuidv4 } from 'uuid'; // We need to install uuid

// // @desc    Create a new room
// // @route   POST /api/rooms
// // @access  Public
// export const createRoom = async (req, res) => {
//     try {
//         const roomId = uuidv4().split('-')[0]; // Generate short ID
        
//         const room = await Room.create({
//             roomId,
//             players: []
//         });

//         res.status(201).json({
//             success: true,
//             roomId: room.roomId,
//             message: "Room created successfully"
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Get room details
// // @route   GET /api/rooms/:roomId
// // @access  Public
// export const getRoom = async (req, res) => {
//     try {
//         const room = await Room.findOne({ roomId: req.params.roomId });
        
//         if (!room) {
//             return res.status(404).json({ message: 'Room not found' });
//         }

//         res.json(room);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };






import Room from '../models/Room.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Public
export const createRoom = async (req, res) => {
    try {
        let roomId;
        let isUnique = false;

        // 1. COLLISION CHECK: Ensure the short ID doesn't already exist
        // This loop runs until it finds a unique ID (usually finds it instantly)
        while (!isUnique) {
            roomId = uuidv4().split('-')[0];
            const existing = await Room.findOne({ roomId });
            if (!existing) isUnique = true;
        }

        const room = await Room.create({
            roomId,
            players: []
        });

        res.status(201).json({
            success: true,
            roomId: room.roomId,
            message: "Room created successfully"
        });
    } catch (error) {
        console.error("Create Room Error:", error);
        res.status(500).json({ message: "Failed to create room" });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Public
export const getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        console.error("Get Room Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};