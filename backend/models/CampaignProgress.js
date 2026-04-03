// backend/models/CampaignProgress.js
import mongoose from 'mongoose';

const completedNodeSchema = new mongoose.Schema({
    nodeId:       { type: String, required: true },
    starsAwarded: { type: Number, min: 1, max: 3, required: true },
    bestTimeMs:   { type: Number },
    attempts:     { type: Number, default: 1 },
    language:     { type: String },
    completedAt:  { type: Date, default: Date.now }
}, { _id: false });

const campaignProgressSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        unique: true, 
        required: true,
        index: true 
    },

    // Economy
    knowledgePoints: { type: Number, default: 0 },
    totalStars:      { type: Number, default: 0 },
    totalAttempts:   { type: Number, default: 0 }, // for analytics

    // Map State
    // First node always unlocked — set in initialization
    unlockedNodes:  [{ type: String }],
    completedNodes: [completedNodeSchema],

    // Cosmetics & Inventory
    inventory: [{
        itemId:       String,
        itemType:     { type: String, enum: ['theme', 'border', 'title'] },
        acquiredAt:   { type: Date, default: Date.now },
        acquiredFrom: String // nodeId where they got it
    }],
    activeTheme:  { type: String, default: 'default' },
    activeBorder: { type: String, default: 'default' },
    activeTitle:  { type: String, default: '' },

    // Sage (AI Mentor) tracking — prevent spam & track usage
    sageUsage: [{
        nodeId:    String,
        usedAt:    { type: Date, default: Date.now },
        failCount: { type: Number, default: 0 },
        sageCallCount: { type: Number, default: 0 }
    }],

    // Streak tracking (gamification hook)
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date }

}, { timestamps: true });

// Fast lookup: "has user completed nodeX?"
campaignProgressSchema.index({ userId: 1, 'completedNodes.nodeId': 1 });

// Virtual: easy check of completed node IDs
campaignProgressSchema.virtual('completedNodeIds').get(function() {
    return this.completedNodes.map(n => n.nodeId);
});

export default mongoose.model('CampaignProgress', campaignProgressSchema);
