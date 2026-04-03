// backend/models/CampaignMap.js
import mongoose from 'mongoose';

const campaignMapSchema = new mongoose.Schema({
    nodeId: { 
        type: String, 
        required: true, 
        unique: true 
        // e.g. 'array_01', 'array_boss_01', 'tree_01'
    },
    region: { 
        type: String, 
        required: true,
        enum: [
            'Array_Archipelago',
            'String_Shores', 
            'HashMap_Highlands',
            'Tree_Territory',
            'Graph_Gorge',
            'DP_Dungeon'
        ]
    },
    regionOrder: { type: Number, required: true }, // 1,2,3... for map ordering
    nodeOrder:   { type: Number, required: true }, // position within region

    problemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Problem',
        required: true 
    },

    nodeType: { 
        type: String, 
        enum: ['standard', 'boss', 'challenge'],
        default: 'standard'
        // standard  = normal problem
        // boss      = time-trial, harder hidden tests, drops loot
        // challenge = optional bonus node
    },

    // Map graph edges — what must be done before this unlocks
    prerequisites: [{ type: String }], // array of nodeIds

    // Visual position on the map (frontend uses these for SVG layout)
    mapPosition: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },

    rewards: {
        oneStarKP:   { type: Number, default: 10  },
        twoStarKP:   { type: Number, default: 20  },
        threeStarKP: { type: Number, default: 35  },
        // Boss nodes drop loot
        lootPool: [{
            itemId:      String,
            itemType:    { type: String, enum: ['theme', 'border', 'title', 'none'] },
            dropChance:  Number  // 0.0 to 1.0
        }]
    },

    // 3-star thresholds — time only (memory from Piston is unreliable)
    starThresholds: {
        twoStarTimeMs:   { type: Number, required: true },
        threeStarTimeMs: { type: Number, required: true }
    },

    isActive: { type: Boolean, default: true } // admin can disable a node
}, { timestamps: true });

campaignMapSchema.index({ region: 1, nodeOrder: 1 });
campaignMapSchema.index({ nodeId: 1 });

export default mongoose.model('CampaignMap', campaignMapSchema);