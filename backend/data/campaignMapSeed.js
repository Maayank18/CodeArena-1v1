// backend/data/campaignMapSeed.js
// Run once: node backend/data/campaignMapSeed.js

import mongoose  from 'mongoose';
import CampaignMap from '../models/CampaignMap.js';
import Problem   from '../models/Problem.js';
import dotenv    from 'dotenv';
dotenv.config();

const seedCampaignMap = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[SEED] Connected to MongoDB');

    // Pull existing problems to link
    const problems = await Problem.find({}).lean();
    const getProb = (slug) => problems.find(p => p.slug === slug)?._id;

    await CampaignMap.deleteMany({}); // Clean slate

    const nodes = [
        // ── REGION 1: Array Archipelago ──────────────────────────────────
        {
            nodeId: 'array_01', region: 'Array_Archipelago',
            regionOrder: 1, nodeOrder: 1,
            problemId: getProb('missing-number'),
            nodeType: 'standard',
            prerequisites: [],                    // Starting node
            mapPosition: { x: 100, y: 300 },
            rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
            starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
        },
        {
            nodeId: 'array_02', region: 'Array_Archipelago',
            regionOrder: 1, nodeOrder: 2,
            problemId: getProb('array-left-rotation'),
            nodeType: 'standard',
            prerequisites: ['array_01'],
            mapPosition: { x: 250, y: 280 },
            rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
            starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
        },
        {
            nodeId: 'array_03', region: 'Array_Archipelago',
            regionOrder: 1, nodeOrder: 3,
            problemId: getProb('zigzag-array'),
            nodeType: 'standard',
            prerequisites: ['array_02'],
            mapPosition: { x: 400, y: 300 },
            rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
            starThresholds: { twoStarTimeMs: 180, threeStarTimeMs: 70 }
        },
        {
            nodeId: 'array_04', region: 'Array_Archipelago',
            regionOrder: 1, nodeOrder: 4,
            problemId: getProb('max-subarray-sum'),
            nodeType: 'standard',
            prerequisites: ['array_03'],
            mapPosition: { x: 550, y: 280 },
            rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 40, lootPool: [] },
            starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
        },
        {
            nodeId: 'array_boss_01', region: 'Array_Archipelago',
            regionOrder: 1, nodeOrder: 5,
            problemId: getProb('count-pairs-sum'),
            nodeType: 'boss',
            prerequisites: ['array_04'],
            mapPosition: { x: 700, y: 300 },
            rewards: {
                oneStarKP: 30, twoStarKP: 50, threeStarKP: 80,
                lootPool: [
                    { itemId: 'border_gold',     itemType: 'border', dropChance: 0.4 },
                    { itemId: 'title_arrayking', itemType: 'title',  dropChance: 0.2 }
                ]
            },
            starThresholds: { twoStarTimeMs: 150, threeStarTimeMs: 60 }
        },

        // ── REGION 2: String Shores ───────────────────────────────────────
        {
            nodeId: 'string_01', region: 'String_Shores',
            regionOrder: 2, nodeOrder: 1,
            problemId: getProb('pangram-check'),
            nodeType: 'standard',
            prerequisites: ['array_boss_01'],    // unlocks after beating Array boss
            mapPosition: { x: 900, y: 300 },
            rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
            starThresholds: { twoStarTimeMs: 150, threeStarTimeMs: 60 }
        },
        {
            nodeId: 'string_02', region: 'String_Shores',
            regionOrder: 2, nodeOrder: 2,
            problemId: getProb('anagram-check'),
            nodeType: 'standard',
            prerequisites: ['string_01'],
            mapPosition: { x: 1050, y: 280 },
            rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
            starThresholds: { twoStarTimeMs: 150, threeStarTimeMs: 60 }
        },
    ];

    // Filter out nodes where problem wasn't found
    const validNodes = nodes.filter(n => n.problemId);
    
    await CampaignMap.insertMany(validNodes);
    console.log(`[SEED] Inserted ${validNodes.length} campaign nodes`);
    
    await mongoose.disconnect();
    console.log('[SEED] Done');
};

seedCampaignMap().catch(console.error);