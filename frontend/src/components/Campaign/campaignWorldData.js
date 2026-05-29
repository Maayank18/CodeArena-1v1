// // src/components/Campaign/campaignWorldData.js
// // ─────────────────────────────────────────────────────────────────────────────
// // FIXES APPLIED:
// //   BUG 1: buildZonePath — pts.x → pts[0].x (pts is an array, not an object)
// //   BUG 6: getZoneConfig — fallback was returning entire ZONE_CONFIGS array
// //          instead of ZONE_CONFIGS[0]. Spreading an array as a prop = crash.
// // ─────────────────────────────────────────────────────────────────────────────

// // ── Layout constants ──────────────────────────────────────────────────────────
// export const ZONE_W        = 720;
// export const ZONE_H        = 680;
// export const ZONE_GAP      = 60;
// export const NODE_RADIUS   = 28;
// export const BOSS_RADIUS   = 38;
// export const MID_BOSS_IDX  = 7;   // 0-indexed → node 8
// export const MAIN_BOSS_IDX = 14;  // 0-indexed → node 15

// // ── Snake-path layout: 3 rows × 5 cols ───────────────────────────────────────
// // Row 0 (y=560): nodes 0-4   left→right
// // Row 1 (y=360): nodes 5-9   right→left
// // Row 2 (y=160): nodes 10-14 left→right
// const ROW_Y  = [560, 360, 160];
// const COL_XS = [80, 205, 330, 455, 580];

// export const getLocalNodePos = (idx) => {
//   const row      = Math.floor(idx / 5);
//   const posInRow = idx % 5;
//   const col      = row % 2 === 1 ? 4 - posInRow : posInRow;
//   return { x: COL_XS[col], y: ROW_Y[row] };
// };

// export const isBossNode  = (i) => i === MID_BOSS_IDX || i === MAIN_BOSS_IDX;
// export const getBossType = (i) =>
//   i === MID_BOSS_IDX ? 'mid' : i === MAIN_BOSS_IDX ? 'main' : null;

// // ─────────────────────────────────────────────────────────────────────────────
// // buildZonePath — BUG 1 FIX
// // pts is an Array<{x,y}>. The original code wrote `pts.x` and `pts.y` which
// // are UNDEFINED because arrays don't have those properties.
// // The correct first-point access is pts[0].x and pts[0].y.
// // ─────────────────────────────────────────────────────────────────────────────
// export const buildZonePath = () => {
//   const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));

//   // ✅ FIX BUG 1: was `pts.x` / `pts.y` — both undefined on an Array
//   let d = `M ${pts[0].x} ${pts[0].y}`;

//   for (let i = 1; i < pts.length; i++) {
//     const prev    = pts[i - 1];
//     const cur     = pts[i];
//     const sameRow = Math.floor((i - 1) / 5) === Math.floor(i / 5);

//     if (sameRow) {
//       // Horizontal arc within a row
//       const mx = (prev.x + cur.x) / 2;
//       d += ` Q ${mx} ${prev.y - 18} ${cur.x} ${cur.y}`;
//     } else {
//       // U-turn between rows — cubic S-curve
//       d += ` C ${prev.x} ${prev.y + (cur.y - prev.y) * 0.45}`
//          + ` ${cur.x} ${prev.y + (cur.y - prev.y) * 0.55}`
//          + ` ${cur.x} ${cur.y}`;
//     }
//   }

//   return d;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ZONE THEME CONFIGS — 15 zones
// // bgGrad, titleGrad are intentionally arrays so callers can use [0], [1], [2]
// // ─────────────────────────────────────────────────────────────────────────────
// export const ZONE_CONFIGS = [
//   {
//     id: 'array_archipelago',
//     name: 'Array Archipelago', subtitle: 'Where Every Journey Begins', icon: '🏝️', weather: 'fireflies',
//     bgGrad: ['#041c28', '#062e40', '#083a50'], accent: '#22d3ee', path: '#06b6d4',
//     titleGrad: ['#a5f3fc', '#22d3ee'], border: '#0891b2', glow: '#06b6d430',
//     ground: '#052030', decorations: ['🌴', '🦋', '🌺', '🐚'],
//   },
//   {
//     id: 'string_shores',
//     name: 'String Shores', subtitle: 'Walk the Shore of Words', icon: '🌊', weather: 'waves',
//     bgGrad: ['#060d2a', '#0e1f50', '#122870'], accent: '#60a5fa', path: '#3b82f6',
//     titleGrad: ['#bfdbfe', '#60a5fa'], border: '#2563eb', glow: '#3b82f640',
//     ground: '#0c1a42', decorations: ['🐚', '⚓', '🦀', '🐠'],
//   },
//   {
//     id: 'loop_lagoon',
//     name: 'Loop Lagoon', subtitle: 'Where Patterns Repeat', icon: '🌿', weather: 'fireflies',
//     bgGrad: ['#021408', '#042018', '#063020'], accent: '#4ade80', path: '#22c55e',
//     titleGrad: ['#bbf7d0', '#4ade80'], border: '#16a34a', glow: '#22c55e40',
//     ground: '#041a0c', decorations: ['🐸', '🌱', '🍃', '🦎'],
//   },
//   {
//     id: 'sliding_window_sanctum',
//     name: 'Sliding Window Sanctum', subtitle: 'The Glass Valley Awaits', icon: '🔭', weather: 'mist',
//     bgGrad: ['#060e1a', '#0a1a30', '#0e2445'], accent: '#818cf8', path: '#6366f1',
//     titleGrad: ['#c7d2fe', '#818cf8'], border: '#4f46e5', glow: '#6366f140',
//     ground: '#080f22', decorations: ['🔭', '🌀', '💠', '✦'],
//   },
//   {
//     id: 'hashmap_highlands',
//     name: 'HashMap Highlands', subtitle: 'Map the Unmappable', icon: '🗺️', weather: 'mist',
//     bgGrad: ['#1a0e00', '#2d1a08', '#3d2510'], accent: '#fb923c', path: '#f97316',
//     titleGrad: ['#fed7aa', '#fb923c'], border: '#ea580c', glow: '#f9731640',
//     ground: '#2d1e0a', decorations: ['⛰️', '🦅', '🪨', '🗺️'],
//   },
//   {
//     id: 'stack_queue_quarry',
//     name: 'Stack & Queue Quarry', subtitle: 'From the Depths of the Forge', icon: '⚒️', weather: 'sparks',
//     bgGrad: ['#160b00', '#2e1800', '#3d2200'], accent: '#fbbf24', path: '#f59e0b',
//     titleGrad: ['#fef08a', '#fbbf24'], border: '#d97706', glow: '#f59e0b40',
//     ground: '#2a1500', decorations: ['⚙️', '🔩', '⚒️', '💎'],
//   },
//   {
//     id: 'tree_tundra',
//     name: 'Tree Tundra', subtitle: 'Branches in the Frost', icon: '🌲', weather: 'snow',
//     bgGrad: ['#0a1628', '#0f2040', '#162d56'], accent: '#bae6fd', path: '#e0f2fe',
//     titleGrad: ['#f0f9ff', '#7dd3fc'], border: '#0284c7', glow: '#38bdf840',
//     ground: '#1a2e50', decorations: ['❄️', '🌲', '🦌', '⛄'],
//   },
//   {
//     id: 'linked_labyrinth',
//     name: 'Linked List Labyrinth', subtitle: 'Follow the Pointer', icon: '🌳', weather: 'fireflies',
//     bgGrad: ['#061008', '#0a1c0c', '#0e2810'], accent: '#a3e635', path: '#bef264',
//     titleGrad: ['#d9f99d', '#a3e635'], border: '#65a30d', glow: '#84cc1640',
//     ground: '#0c1e0e', decorations: ['🌿', '🕷️', '🦎', '🍄'],
//   },
//   {
//     id: 'winter_carnival',
//     name: 'Winter Carnival', subtitle: 'Celebrate the Cold', icon: '❄️', weather: 'snow',
//     bgGrad: ['#100428', '#1a0840', '#22105a'], accent: '#c084fc', path: '#e9d5ff',
//     titleGrad: ['#f3e8ff', '#c084fc'], border: '#9333ea', glow: '#a855f740',
//     ground: '#1c0c48', decorations: ['🎪', '✨', '🎡', '🎠'],
//   },
//   {
//     id: 'desert_dunes',
//     name: 'Desert Dunes', subtitle: 'Survive the Scorching Sort', icon: '🏜️', weather: 'sand',
//     bgGrad: ['#2a0a00', '#4a1500', '#6b2000'], accent: '#f87171', path: '#fca5a5',
//     titleGrad: ['#fecaca', '#f87171'], border: '#dc2626', glow: '#ef444440',
//     ground: '#4a1800', decorations: ['🦂', '🌵', '🐍', '💀'],
//   },
//   {
//     id: 'graph_gorge',
//     name: 'Graph Gorge', subtitle: 'Navigate the Node Network', icon: '🗻', weather: 'mist',
//     bgGrad: ['#0e0c0a', '#1a1714', '#262220'], accent: '#a8a29e', path: '#d6d3d1',
//     titleGrad: ['#e7e5e4', '#a8a29e'], border: '#78716c', glow: '#a8a29e40',
//     ground: '#1e1a16', decorations: ['🗻', '🦊', '🌫️', '🪨'],
//   },
//   {
//     id: 'dp_dungeon',
//     name: 'DP Dungeon', subtitle: 'Memoize or Perish', icon: '🏰', weather: 'ember',
//     bgGrad: ['#080018', '#100030', '#180048'], accent: '#a78bfa', path: '#c4b5fd',
//     titleGrad: ['#ede9fe', '#a78bfa'], border: '#7c3aed', glow: '#8b5cf640',
//     ground: '#100030', decorations: ['🏰', '⚗️', '🕯️', '🦇'],
//   },
//   {
//     id: 'recursion_ruins',
//     name: 'Recursion Ruins', subtitle: 'The Function Calls Itself', icon: '🏛️', weather: 'dust',
//     bgGrad: ['#160c00', '#221200', '#301a00'], accent: '#facc15', path: '#fde047',
//     titleGrad: ['#fef9c3', '#facc15'], border: '#ca8a04', glow: '#eab30840',
//     ground: '#221400', decorations: ['🏛️', '📜', '🗿', '⚱️'],
//   },
//   {
//     id: 'regex_rainforest',
//     name: 'Regex Rainforest', subtitle: 'Patterns in the Storm', icon: '🌧️', weather: 'rain',
//     bgGrad: ['#020e18', '#041830', '#062040'], accent: '#38bdf8', path: '#7dd3fc',
//     titleGrad: ['#bae6fd', '#38bdf8'], border: '#0284c7', glow: '#0ea5e940',
//     ground: '#041428', decorations: ['🌧️', '🍄', '🌿', '🐢'],
//   },
//   {
//     id: 'algorithm_alps',
//     name: 'Algorithm Alps', subtitle: 'Peak Performance', icon: '🏔️', weather: 'blizzard',
//     bgGrad: ['#04081a', '#080e28', '#0c1438'], accent: '#e2e8f0', path: '#f8fafc',
//     titleGrad: ['#f1f5f9', '#94a3b8'], border: '#64748b', glow: '#94a3b830',
//     ground: '#080f28', decorations: ['🏔️', '🦅', '❄️', '⚡'],
//   },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // getZoneConfig — BUG 6 FIX
// // Was returning the entire ZONE_CONFIGS array as fallback instead of [0].
// // Spreading an array (not an object) as props causes immediate crash.
// // ─────────────────────────────────────────────────────────────────────────────
// export const getZoneConfig = (zoneId) =>
//   // ✅ FIX BUG 6: was `|| ZONE_CONFIGS` (entire array), now correctly `|| ZONE_CONFIGS[0]`
//   ZONE_CONFIGS.find((z) => z.id === zoneId) || ZONE_CONFIGS[0];

// // ─────────────────────────────────────────────────────────────────────────────
// // DATA STITCHING — bullet-proof wildcard imports
// // Handles all export styles: `export const ZONES`, `export default`, etc.
// // ─────────────────────────────────────────────────────────────────────────────
// import * as batch1 from '../../data/campaignData';
// import * as batch2 from '../../data/campaignDataBatch2';

// // Resolve the array from whichever export shape each file uses
// const ZONES_BATCH_1 = batch1.ZONES || batch1.default || [];
// const ZONES_BATCH_2 = batch2.BATCH_2_ZONES || batch2.ZONES || batch2.default || [];

// export const ALL_ZONES = [
//   ...(Array.isArray(ZONES_BATCH_1) ? ZONES_BATCH_1 : []),
//   ...(Array.isArray(ZONES_BATCH_2) ? ZONES_BATCH_2 : []),
// ].filter(Boolean);

// // ─────────────────────────────────────────────────────────────────────────────
// // generateMockWorld
// // Converts ALL_ZONES flat data into the node-position format consumed by
// // WorldMap, CampaignMapCanvas and CampaignEditor.
// // Supports both field names used in the data files:
// //   - Batch 1/2 data files: node.problem.title
// //   - API / MongoDB populate response: node.problemId.title
// // ─────────────────────────────────────────────────────────────────────────────
// export const generateMockWorld = () => {
//   const nodes = [];

//   ALL_ZONES.forEach((zone, zIdx) => {
//     // Failsafe: skip malformed zone entries
//     if (!zone || !Array.isArray(zone.nodes)) return;

//     zone.nodes.forEach((node, nIdx) => {
//       // Support both data-file field name (problem) and API field name (problemId)
//       const problemSrc = node.problem || node.problemId || {};

//         },

//         // Keep problemId alias so API-sourced nodes remain compatible
//         problemId: {
//           title:       problemSrc.title       || `Challenge ${nIdx + 1}`,
//           difficulty:  problemSrc.difficulty  || 'Easy',
//           description: problemSrc.description || '',
//           examples:    problemSrc.examples    || [],
//           constraints: problemSrc.constraints || [],
//           testCases:   problemSrc.testCases   || [],
//           starterCode: problemSrc.starterCode || {},
//           timeLimit:   problemSrc.timeLimit,
//         },

//         // Economy
//         rewards:        node.rewards        || { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
//         starThresholds: node.starThresholds || { twoStarTimeMs: 200, threeStarTimeMs: 80 },

//         // Prerequisites
//         prerequisites:
//           nIdx === 0
//             ? (zIdx === 0 || !ALL_ZONES[zIdx - 1]
//                 ? []
//                 : [`${ALL_ZONES[zIdx - 1].id}_15`])
//             : [`${zone.id}_${nIdx}`],

//         isActive: true,
//       });
//     });
//   });

//   return nodes;
// };



























































// src/components/Campaign/campaignWorldData.js
import { CAMPAIGN_REGIONS } from '../../data/campaignConfig';
// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED:
//   BUG 1: buildZonePath — pts.x → pts[0].x (pts is an array, not an object)
//   BUG 6: getZoneConfig — fallback was returning entire ZONE_CONFIGS array
//   BUG A: generateMockWorld — batch2 nodes use flat structure (title/description
//          directly on node, no `problem` wrapper). Fix: `|| node` fallback so
//          `problemSrc.title` reads `node.title` for batch2 nodes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Layout constants ──────────────────────────────────────────────────────────
export const ZONE_W        = 720;
export const ZONE_H        = 680;
export const ZONE_GAP      = 60;
export const NODE_RADIUS   = 28;
export const BOSS_RADIUS   = 38;
export const MID_BOSS_IDX  = 7;   // 0-indexed → node 8
export const MAIN_BOSS_IDX = 14;  // 0-indexed → node 15

// ── Snake-path layout: 3 rows × 5 cols ───────────────────────────────────────
// Row 0 (y=560): nodes 0-4   left→right
// Row 1 (y=360): nodes 5-9   right→left
// Row 2 (y=160): nodes 10-14 left→right
const ROW_Y  = [560, 360, 160];
const COL_XS = [80, 205, 330, 455, 580];

export const getLocalNodePos = (idx) => {
  const row      = Math.floor(idx / 5);
  const posInRow = idx % 5;
  const col      = row % 2 === 1 ? 4 - posInRow : posInRow;
  return { x: COL_XS[col], y: ROW_Y[row] };
};

export const isBossNode  = (i) => i === MID_BOSS_IDX || i === MAIN_BOSS_IDX;
export const getBossType = (i) =>
  i === MID_BOSS_IDX ? 'mid' : i === MAIN_BOSS_IDX ? 'main' : null;

// ── buildZonePath — BUG 1 FIX ─────────────────────────────────────────────────
export const buildZonePath = () => {
  const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
  // ✅ was `pts.x` / `pts.y` — both undefined on an Array
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev    = pts[i - 1];
    const cur     = pts[i];
    const sameRow = Math.floor((i - 1) / 5) === Math.floor(i / 5);
    if (sameRow) {
      const mx = (prev.x + cur.x) / 2;
      d += ` Q ${mx} ${prev.y - 18} ${cur.x} ${cur.y}`;
    } else {
      d += ` C ${prev.x} ${prev.y + (cur.y - prev.y) * 0.45}`
         + ` ${cur.x} ${prev.y + (cur.y - prev.y) * 0.55}`
         + ` ${cur.x} ${cur.y}`;
    }
  }
  return d;
};

// ── ZONE THEME CONFIGS ────────────────────────────────────────────────────────
export const ZONE_CONFIGS = CAMPAIGN_REGIONS;

// ── getZoneConfig — BUG 6 FIX ──────────────────────────────────────────────────
// Was: `|| ZONE_CONFIGS` — returns the whole array, spreading it crashes React.
export const getZoneConfig = (zoneId) =>
  CAMPAIGN_REGIONS.find((z) => z.key === zoneId || z.id === zoneId) || CAMPAIGN_REGIONS[0];

// ── Data stitching ────────────────────────────────────────────────────────────
import { ZONES as ZONES_BATCH_1 } from '../../data/campaignData';
import { BATCH_2_ZONES as ZONES_BATCH_2 } from '../../data/campaignDataBatch2';

export const ALL_ZONES = [
  ...(Array.isArray(ZONES_BATCH_1) ? ZONES_BATCH_1 : []),
  ...(Array.isArray(ZONES_BATCH_2) ? ZONES_BATCH_2 : []),
].filter(Boolean);

// ── generateMockWorld — BUG A FIX ─────────────────────────────────────────────
// Batch-2 nodes use a FLAT structure: title/description/difficulty are directly
// on the node object (NOT nested inside `problem`).
// Old code: `problemSrc = node.problem || node.problemId || {}`
//   → for batch2 nodes: `node.problem = undefined`, `node.problemId = undefined`
//   → `problemSrc = {}`, `problemSrc.title = undefined`
//   → falls back to `Challenge ${nIdx + 1}` for EVERY batch-2 node.
//
// Fix: add `|| node` as final fallback so `problemSrc.title` reads `node.title`.
export const generateMockWorld = () => {
  const nodes = [];

  ALL_ZONES.forEach((zone, zIdx) => {
    if (!zone || !Array.isArray(zone.nodes)) return;

    zone.nodes.forEach((node, nIdx) => {
      // ✅ FIX BUG A: was `|| {}` — batch2 nodes have title/difficulty on the
      //    node itself (flat), not nested in .problem. Adding `|| node` makes
      //    problemSrc.title read node.title for batch2 nodes.
      const problemSrc = node.problem || node.problemId || node;

      nodes.push({
        // Canonical routing key — must match backend nodeId
        nodeId:     node.nodeId || node.id || `${zone.id}_${nIdx + 1}`,

        // Zone membership
        region:     zone.key || zone.id,
        zoneId:     zone.key || zone.id,
        zoneIndex:  zIdx,

        // Position within zone (0-14)
        nodeNum:    node.nodeNum || nIdx + 1,
        localIndex: nIdx,

        // Type
        nodeType:   node.nodeType  || (isBossNode(nIdx) ? 'boss' : 'standard'),
        bossType:   node.bossType  || (node.isBoss ? (nIdx === MID_BOSS_IDX ? 'mid' : 'main') : getBossType(nIdx)),

        // Local SVG position
        localPos: node.localPos || getLocalNodePos(nIdx),

        // Normalised problem — readable by WorldMap labels and NodeDetailPanel
        // Both `problem` and `problemId` set so CampaignEditor can read either.
        problem: {
          title:       problemSrc.title       || `Challenge ${nIdx + 1}`,
          difficulty:  problemSrc.difficulty  || 'Easy',
          description: problemSrc.description || '',
          examples:    problemSrc.examples    || [],
          constraints: (problemSrc.constraints || []).filter(Boolean),
          testCases:   problemSrc.testCases   || [],
          starterCode: problemSrc.starterCode || {},
        },

        problemId: {
          title:       problemSrc.title       || `Challenge ${nIdx + 1}`,
          difficulty:  problemSrc.difficulty  || 'Easy',
          description: problemSrc.description || '',
          examples:    problemSrc.examples    || [],
          constraints: problemSrc.constraints || [],
          testCases:   problemSrc.testCases   || [],
          starterCode: problemSrc.starterCode || {},
          timeLimit:   problemSrc.timeLimit,
        },

        // Economy
        rewards:        node.rewards        || { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35, lootPool: [] },
        starThresholds: node.starThresholds || { twoStarTimeMs: 200, threeStarTimeMs: 80 },

        // Prerequisites
        prerequisites:
          nIdx === 0
            ? (zIdx === 0 || !ALL_ZONES[zIdx - 1]
                ? []
                : [`${ALL_ZONES[zIdx - 1].key || ALL_ZONES[zIdx - 1].id}_15`])
            : [`${zone.key || zone.id}_${nIdx}`],

        isActive: true,
      });
    });
  });

  return nodes;
};
// V 1.5
