// backend/data/campaignMapSeed.js

const campaignMapSeed = [
    // ZONE 1: ARRAY ARCHIPELAGO
    {
        nodeId: 'aa_01', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 1,
        problemSlug: 'sum-of-array', nodeType: 'standard', prerequisites: [],
        mapPosition: { x: 100, y: 300 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_02', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 2,
        problemSlug: 'find-maximum', nodeType: 'standard', prerequisites: ['aa_01'],
        mapPosition: { x: 250, y: 280 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_03', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 3,
        problemSlug: 'reverse-array', nodeType: 'standard', prerequisites: ['aa_02'],
        mapPosition: { x: 400, y: 300 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 180, threeStarTimeMs: 70 }
    },
    {
        nodeId: 'aa_04', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 4,
        problemSlug: 'count-even-odd', nodeType: 'standard', prerequisites: ['aa_03'],
        mapPosition: { x: 550, y: 280 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_05', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 5,
        problemSlug: 'array-left-rotation', nodeType: 'standard', prerequisites: ['aa_04'],
        mapPosition: { x: 700, y: 300 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 }
    },
    {
        nodeId: 'aa_06', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 6,
        problemSlug: 'zigzag-array', nodeType: 'standard', prerequisites: ['aa_05'],
        mapPosition: { x: 850, y: 280 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 }
    },
    {
        nodeId: 'aa_07', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 7,
        problemSlug: 'missing-number', nodeType: 'standard', prerequisites: ['aa_06'],
        mapPosition: { x: 1000, y: 300 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_08', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 8,
        problemSlug: 'max-subarray-sum', nodeType: 'boss', prerequisites: ['aa_07'],
        mapPosition: { x: 1150, y: 300 },
        rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    // ✅ FIX: Node 9 correctly unlocks AFTER Node 8 (Mid-Boss)
    {
        nodeId: 'aa_09', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 9,
        problemSlug: 'count-pairs-sum', nodeType: 'standard', prerequisites: ['aa_08'],
        mapPosition: { x: 1150, y: 150 }, // Visually moving "Up"
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_10', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 10,
        problemSlug: 'majority-element', nodeType: 'standard', prerequisites: ['aa_09'],
        mapPosition: { x: 1000, y: 150 },
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_11', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 11,
        problemSlug: 'merge-sorted', nodeType: 'standard', prerequisites: ['aa_10'],
        mapPosition: { x: 850, y: 150 },
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_12', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 12,
        problemSlug: 'matrix-diagonal-sum', nodeType: 'standard', prerequisites: ['aa_11'],
        mapPosition: { x: 700, y: 150 },
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_13', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 13,
        problemSlug: 'trapping-rain', nodeType: 'standard', prerequisites: ['aa_12'],
        mapPosition: { x: 550, y: 150 },
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_14', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 14,
        problemSlug: 'next-permutation', nodeType: 'standard', prerequisites: ['aa_13'],
        mapPosition: { x: 400, y: 150 },
        rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 }
    },
    {
        nodeId: 'aa_15', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 15,
        problemSlug: 'array-king', nodeType: 'boss', prerequisites: ['aa_14'],
        mapPosition: { x: 250, y: 150 },
        rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 }
    },

    // ──────────────────────────────────────────────────────────
    // ZONE 2: STRING SHORES
    // ──────────────────────────────────────────────────────────
    {
        nodeId: 'ss_01', region: 'String_Shores', regionOrder: 2, nodeOrder: 1,
        problemSlug: 'reverse-string', nodeType: 'standard', 
        // ✅ FIX: Region 2 ONLY unlocks when the Region 1 Zone Boss is completed
        prerequisites: ['aa_15'], 
        mapPosition: { x: 1500, y: 300 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 }
    },
    {
        nodeId: 'ss_02', region: 'String_Shores', regionOrder: 2, nodeOrder: 2,
        problemSlug: 'palindrome-string', nodeType: 'standard', prerequisites: ['ss_01'],
        mapPosition: { x: 1650, y: 280 },
        rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 }
    }
    // ... continue mapping ss_03 to ss_15 following this exact pattern ...
];

export default campaignMapSeed;