// this would contain all the detail for the room model

import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'finished'],
        default: 'waiting'
    },
    players: [{
        username: String,
        socketId: String,
        side: { type: String, enum: ['left', 'right'] }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto-delete room after 1 hour to save space (optional)
    }
});

export default mongoose.model('Room', roomSchema);