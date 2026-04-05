// src/components/Campaign/campaignWorldData.js  — V4 MASTER DATA FILE
// ─────────────────────────────────────────────────────────────────────────────
// This file is the SINGLE source of truth for ALL zone configs and node layout.
// It imports all data batches and concatenates them.
//
// DATA SOURCES:
//   ZONES_BATCH_1  — zones 1-3  (Array, String, Loop)        from campaignData.js
//   ZONES_BATCH_2  — zones 4-6  (Sliding, HashMap, Stack)    from campaignDataBatch2.js
//
// NODE ROUTING:
//   Node clicked on map → navigate(`/campaign/${node.nodeId}`)
//   CampaignEditor      → GET /api/campaign/node/:nodeId
//   The nodeId field in EACH zone's node array is the canonical routing key.
// ─────────────────────────────────────────────────────────────────────────────

// ── Layout constants (used by WorldMap, ZoneContainer, CampaignMapCanvas) ────
export const ZONE_W        = 720;
export const ZONE_H        = 680;
export const ZONE_GAP      = 60;
export const NODE_RADIUS   = 28;
export const BOSS_RADIUS   = 38;
export const MID_BOSS_IDX  = 7;    // 0-indexed (node 8)
export const MAIN_BOSS_IDX = 14;   // 0-indexed (node 15)

// ── Snake-path layout: 3 rows × 5 cols ───────────────────────────────────────
// Row 0 (y=560): nodes 0-4  L→R
// Row 1 (y=360): nodes 5-9  R→L
// Row 2 (y=160): nodes 10-14 L→R
const ROW_Y  = [560, 360, 160];
const COL_XS = [80, 205, 330, 455, 580];

export const getLocalNodePos = (idx) => {
  const row      = Math.floor(idx / 5);
  const posInRow = idx % 5;
  const col      = (row % 2 === 1) ? 4 - posInRow : posInRow;
  return { x: COL_XS[col], y: ROW_Y[row] };
};

export const isBossNode  = (i) => i === MID_BOSS_IDX || i === MAIN_BOSS_IDX;
export const getBossType = (i) => i === MID_BOSS_IDX ? 'mid' : i === MAIN_BOSS_IDX ? 'main' : null;

// Build the SVG path string for all 15 nodes in a zone
export const buildZonePath = () => {
  const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], cur = pts[i];
    const sameRow = Math.floor((i-1)/5) === Math.floor(i/5);
    if (sameRow) {
      d += ` Q ${(prev.x+cur.x)/2} ${prev.y-18} ${cur.x} ${cur.y}`;
    } else {
      d += ` C ${prev.x} ${prev.y+(cur.y-prev.y)*.45} ${cur.x} ${prev.y+(cur.y-prev.y)*.55} ${cur.x} ${cur.y}`;
    }
  }
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// ZONE THEME CONFIGS (visual-only, no node data)
// Each zone in ZONES_BATCH_1 / ZONES_BATCH_2 references one of these by `id`.
// ─────────────────────────────────────────────────────────────────────────────
export const ZONE_CONFIGS = [
  {
    id:'array_archipelago',   name:'Array Archipelago',   subtitle:'Where Every Journey Begins',    icon:'🏝️', weather:'fireflies',
    bgGrad:['#041c28','#062e40','#083a50'], accent:'#22d3ee', path:'#06b6d4', titleGrad:['#a5f3fc','#22d3ee'], border:'#0891b2', glow:'#06b6d430', ground:'#052030', decorations:['🌴','🦋','🌺','🐚'],
  },
  {
    id:'string_shores',       name:'String Shores',       subtitle:'Walk the Shore of Words',       icon:'🌊', weather:'waves',
    bgGrad:['#060d2a','#0e1f50','#122870'], accent:'#60a5fa', path:'#3b82f6', titleGrad:['#bfdbfe','#60a5fa'], border:'#2563eb', glow:'#3b82f640', ground:'#0c1a42', decorations:['🐚','⚓','🦀','🐠'],
  },
  {
    id:'loop_lagoon',         name:'Loop Lagoon',         subtitle:'Where Patterns Repeat',         icon:'🌿', weather:'fireflies',
    bgGrad:['#021408','#042018','#063020'], accent:'#4ade80', path:'#22c55e', titleGrad:['#bbf7d0','#4ade80'], border:'#16a34a', glow:'#22c55e40', ground:'#041a0c', decorations:['🐸','🌱','🍃','🦎'],
  },
  {
    id:'sliding_window_sanctum', name:'Sliding Window Sanctum', subtitle:'The Glass Valley Awaits', icon:'🔭', weather:'mist',
    bgGrad:['#060e1a','#0a1a30','#0e2445'], accent:'#818cf8', path:'#6366f1', titleGrad:['#c7d2fe','#818cf8'], border:'#4f46e5', glow:'#6366f140', ground:'#080f22', decorations:['🔭','🌀','💠','✦'],
  },
  {
    id:'hashmap_highlands',   name:'HashMap Highlands',   subtitle:'Map the Unmappable',            icon:'🗺️', weather:'mist',
    bgGrad:['#1a0e00','#2d1a08','#3d2510'], accent:'#fb923c', path:'#f97316', titleGrad:['#fed7aa','#fb923c'], border:'#ea580c', glow:'#f9731640', ground:'#2d1e0a', decorations:['⛰️','🦅','🪨','🗺️'],
  },
  {
    id:'stack_queue_quarry',  name:'Stack & Queue Quarry', subtitle:'From the Depths of the Forge', icon:'⚒️', weather:'sparks',
    bgGrad:['#160b00','#2e1800','#3d2200'], accent:'#fbbf24', path:'#f59e0b', titleGrad:['#fef08a','#fbbf24'], border:'#d97706', glow:'#f59e0b40', ground:'#2a1500', decorations:['⚙️','🔩','⚒️','💎'],
  },
  // Placeholder configs for zones 7-15 (add your data batches 3-5 here)
  {
    id:'tree_tundra',         name:'Tree Tundra',         subtitle:'Branches in the Frost',         icon:'🌲', weather:'snow',
    bgGrad:['#0a1628','#0f2040','#162d56'], accent:'#bae6fd', path:'#e0f2fe', titleGrad:['#f0f9ff','#7dd3fc'], border:'#0284c7', glow:'#38bdf840', ground:'#1a2e50', decorations:['❄️','🌲','🦌','⛄'],
  },
  {
    id:'linked_labyrinth',    name:'Linked List Labyrinth', subtitle:'Follow the Pointer',          icon:'🌳', weather:'fireflies',
    bgGrad:['#061008','#0a1c0c','#0e2810'], accent:'#a3e635', path:'#bef264', titleGrad:['#d9f99d','#a3e635'], border:'#65a30d', glow:'#84cc1640', ground:'#0c1e0e', decorations:['🌿','🕷️','🦎','🍄'],
  },
  {
    id:'winter_carnival',     name:'Winter Carnival',     subtitle:'Celebrate the Cold',            icon:'❄️', weather:'snow',
    bgGrad:['#100428','#1a0840','#22105a'], accent:'#c084fc', path:'#e9d5ff', titleGrad:['#f3e8ff','#c084fc'], border:'#9333ea', glow:'#a855f740', ground:'#1c0c48', decorations:['🎪','✨','🎡','🎠'],
  },
  {
    id:'desert_dunes',        name:'Desert Dunes',        subtitle:'Survive the Scorching Sort',    icon:'🏜️', weather:'sand',
    bgGrad:['#2a0a00','#4a1500','#6b2000'], accent:'#f87171', path:'#fca5a5', titleGrad:['#fecaca','#f87171'], border:'#dc2626', glow:'#ef444440', ground:'#4a1800', decorations:['🦂','🌵','🐍','💀'],
  },
  {
    id:'graph_gorge',         name:'Graph Gorge',         subtitle:'Navigate the Node Network',     icon:'🗻', weather:'mist',
    bgGrad:['#0e0c0a','#1a1714','#262220'], accent:'#a8a29e', path:'#d6d3d1', titleGrad:['#e7e5e4','#a8a29e'], border:'#78716c', glow:'#a8a29e40', ground:'#1e1a16', decorations:['🗻','🦊','🌫️','🪨'],
  },
  {
    id:'dp_dungeon',          name:'DP Dungeon',           subtitle:'Memoize or Perish',            icon:'🏰', weather:'ember',
    bgGrad:['#080018','#100030','#180048'], accent:'#a78bfa', path:'#c4b5fd', titleGrad:['#ede9fe','#a78bfa'], border:'#7c3aed', glow:'#8b5cf640', ground:'#100030', decorations:['🏰','⚗️','🕯️','🦇'],
  },
  {
    id:'recursion_ruins',     name:'Recursion Ruins',      subtitle:'The Function Calls Itself',   icon:'🏛️', weather:'dust',
    bgGrad:['#160c00','#221200','#301a00'], accent:'#facc15', path:'#fde047', titleGrad:['#fef9c3','#facc15'], border:'#ca8a04', glow:'#eab30840', ground:'#221400', decorations:['🏛️','📜','🗿','⚱️'],
  },
  {
    id:'regex_rainforest',    name:'Regex Rainforest',     subtitle:'Patterns in the Storm',       icon:'🌧️', weather:'rain',
    bgGrad:['#020e18','#041830','#062040'], accent:'#38bdf8', path:'#7dd3fc', titleGrad:['#bae6fd','#38bdf8'], border:'#0284c7', glow:'#0ea5e940', ground:'#041428', decorations:['🌧️','🍄','🌿','🐢'],
  },
  {
    id:'algorithm_alps',      name:'Algorithm Alps',       subtitle:'Peak Performance',            icon:'🏔️', weather:'blizzard',
    bgGrad:['#04081a','#080e28','#0c1438'], accent:'#e2e8f0', path:'#f8fafc', titleGrad:['#f1f5f9','#94a3b8'], border:'#64748b', glow:'#94a3b830', ground:'#080f28', decorations:['🏔️','🦅','❄️','⚡'],
  },
];

// ── Helper: get theme config by zone id ───────────────────────────────────────
export const getZoneConfig = (zoneId) =>
  ZONE_CONFIGS.find(z => z.id === zoneId) || ZONE_CONFIGS[0];

// ─────────────────────────────────────────────────────────────────────────────
// DATA STITCHING — import all batches and merge into one master array
//
// BATCH 1: src/data/campaignData.js            → exports ZONES (array of 3 zones)
// BATCH 2: src/data/campaignDataBatch2.js      → exports BATCH_2_ZONES (3 zones)
//
// Each batch zone has a `nodes` array where every node has:
//   nodeId   — unique string used for routing (e.g. "aa_01", "zone4-node1")
//   nodeNum  — 1-15 within the zone
//   nodeType — 'standard' | 'boss'
//   bossType — 'mid' | 'main' | null
//   problem  — { title, difficulty, description, ... }
//
// IMPORTANT: The `nodeId` in the data files must EXACTLY match what the
// backend returns from GET /api/campaign/node/:nodeId. If using the
// frontend-only mock data, the routing is entirely client-side.
// ─────────────────────────────────────────────────────────────────────────────

// Import all batch data
import { ZONES as ZONES_BATCH_1 } from '../../data/campaignData';
import ZONES_BATCH_2 from '../../data/campaignDataBatch2';

/**
 * ALL_ZONES — master array of all zones, sorted by their index.
 * Add new imports + spreads here when you add batches 3, 4, 5 etc.
 */
export const ALL_ZONES = [
  ...ZONES_BATCH_1,   // zones 1-3: Array Archipelago, String Shores, Loop Lagoon
  ...ZONES_BATCH_2,   // zones 4-6: Sliding Window, HashMap, Stack & Queue
  // ...ZONES_BATCH_3  ← add here when ready
  // ...ZONES_BATCH_4
  // ...ZONES_BATCH_5
];

/**
 * generateMockWorld — used when no backend API data is available.
 * Converts the ALL_ZONES flat data into the node-position format
 * that WorldMap, CampaignMapCanvas etc. expect.
 *
 * Each returned node has:
 *   nodeId, region (= zone.id), zoneIndex, nodeNum, localIndex,
 *   nodeType, bossType, localPos, problem, rewards, starThresholds
 *
 * The nodeId is used as the route param: navigate(`/campaign/${nodeId}`)
 */
export const generateMockWorld = () => {
  const nodes = [];

  ALL_ZONES.forEach((zone, zIdx) => {
    zone.nodes.forEach((node, nIdx) => {
      nodes.push({
        // Routing key — must match backend nodeId / DB field
        nodeId:     node.nodeId || node.id,
        // Zone membership
        region:     zone.id,
        zoneId:     zone.id,
        zoneIndex:  zIdx,
        // Position within zone (0-14)
        nodeNum:    node.nodeNum || nIdx + 1,
        localIndex: nIdx,
        // Type
        nodeType:   node.nodeType || (isBossNode(nIdx) ? 'boss' : 'standard'),
        bossType:   node.bossType || getBossType(nIdx),
        // Local SVG position for map rendering
        localPos:   node.localPos || getLocalNodePos(nIdx),
        // Problem data (for editor + node detail panel)
        problemId:  {
          title:       node.problem?.title      || node.title || `Challenge ${nIdx + 1}`,
          difficulty:  node.problem?.difficulty || node.difficulty || 'Easy',
          description: node.problem?.description || node.description || '',
          examples:    node.problem?.examples   || node.examples    || [],
          constraints: node.problem?.constraints || node.constraints || [],
          testCases:   node.problem?.testCases  || [],
          starterCode: node.problem?.starterCode || {},
        },
        // Economy
        rewards:        node.rewards        || { oneStarKP:10, twoStarKP:20, threeStarKP:35, lootPool:[] },
        starThresholds: node.starThresholds || { twoStarTimeMs:200, threeStarTimeMs:80 },
        // Prerequisites for progression
        prerequisites: nIdx === 0
          ? (zIdx === 0 ? [] : [`${ALL_ZONES[zIdx-1].id}_15`])
          : [`${zone.id}_${nIdx}`],
        isActive: true,
      });
    });
  });

  return nodes;
};

// ── ZONE_W/ZONE_H already exported at top — no re-export needed ──────────────
