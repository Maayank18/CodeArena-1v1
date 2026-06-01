// backend/models/ShadowReplay.js
import mongoose from 'mongoose';

const shadowReplaySchema = new mongoose.Schema({
    nodeId:   { type: String, required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    language: { type: String, required: true },
    stars:    { type: Number },
    timeMs:   { type: Number },

    // Compressed Yjs update stream
    // Each entry = one doc.on('update') callback result, Base64 encoded
    yjsUpdates: [{
        updateBase64:    { type: String },
        timestampOffset: { type: Number } // ms since recording started
    }],

    isPublic:  { type: Boolean, default: false }, // admin approves best replays
    createdAt: { type: Date, default: Date.now }
});

// Only keep one replay per user per node per language
shadowReplaySchema.index({ nodeId: 1, timeMs: 1 });
shadowReplaySchema.index({ nodeId: 1, userId: 1, language: 1 }, { unique: true });

export default mongoose.model('ShadowReplay', shadowReplaySchema);
// V 1.5

// Version-2.0