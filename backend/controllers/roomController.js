import Room from '../models/Room.js';
import { v4 as uuidv4 } from 'uuid'; // We need to install uuid

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Public
export const createRoom = async (req, res) => {
    try {
        const roomId = uuidv4().split('-')[0]; // Generate short ID
        
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
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
    }
};