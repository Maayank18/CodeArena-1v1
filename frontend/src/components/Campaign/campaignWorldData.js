// src/components/Campaign/campaignWorldData.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for every zone's identity, position, and theme.
// The helper at the bottom generates fully-structured mock node data that
// matches the DB schema so both mock and real API data work identically.
// ─────────────────────────────────────────────────────────────────────────────

// ── World canvas dimensions ───────────────────────────────────────────────────
export const WORLD_W = 2380;
export const WORLD_H = 2820;

// ── Zone tile dimensions ──────────────────────────────────────────────────────
export const ZONE_W = 760;
export const ZONE_H = 500;
const ZONE_COL_GAP = 30;
const ZONE_ROW_GAP = 80;
const COLS = 3;

// ── Node grid constants (within zone) ────────────────────────────────────────
const NODE_XS    = [80, 230, 380, 530, 680];   // 5 columns
const NODE_YS    = [175, 315, 445];             // 3 rows
const MID_BOSS   = 8;                            // position 8 in zone
const MAIN_BOSS  = 15;                           // position 15 in zone

// ── 15 Zone configs ───────────────────────────────────────────────────────────
export const ZONE_CONFIGS = [
  {
    id: 'array_archipelago',   region: 'Array_Archipelago',
    name: 'Array Archipelago', subtitle: 'Where Every Journey Begins',
    icon: '🏝️', theme: 'tropical',
    primary: '#06b6d4',  secondary: '#0891b2',
    bg1: '#041c2c',      bg2: '#072540',
    glow: '#06b6d440',   pathColor: '#22d3ee',
    weather: 'fireflies', titleGrad: ['#67e8f9','#06b6d4'],
  },
  {
    id: 'string_shores',      region: 'String_Shores',
    name: 'String Shores',    subtitle: 'Walk the Shore of Words',
    icon: '🌊', theme: 'ocean',
    primary: '#3b82f6',  secondary: '#2563eb',
    bg1: '#060d1f',      bg2: '#0a1830',
    glow: '#3b82f640',   pathColor: '#60a5fa',
    weather: 'waves',    titleGrad: ['#93c5fd','#3b82f6'],
  },
  {
    id: 'loop_lagoon',        region: 'Loop_Lagoon',
    name: 'Loop Lagoon',      subtitle: 'Where Patterns Repeat',
    icon: '🌿', theme: 'swamp',
    primary: '#10b981',  secondary: '#059669',
    bg1: '#021409',      bg2: '#041e10',
    glow: '#10b98140',   pathColor: '#34d399',
    weather: 'fog',      titleGrad: ['#6ee7b7','#10b981'],
  },
  {
    id: 'stack_quarry',       region: 'Stack_Queue_Quarry',
    name: 'Stack & Queue Quarry', subtitle: 'Dig Deep, Think LIFO',
    icon: '⛏️', theme: 'cave',
    primary: '#f59e0b',  secondary: '#d97706',
    bg1: '#160b00',      bg2: '#211000',
    glow: '#f59e0b40',   pathColor: '#fbbf24',
    weather: 'sparks',   titleGrad: ['#fde68a','#f59e0b'],
  },
  {
    id: 'hashmap_highlands',  region: 'HashMap_Highlands',
    name: 'HashMap Highlands', subtitle: 'Key-Value Kingdom',
    icon: '⛰️', theme: 'mountain',
    primary: '#f97316',  secondary: '#ea580c',
    bg1: '#170800',      bg2: '#231000',
    glow: '#f9731640',   pathColor: '#fb923c',
    weather: 'mist',     titleGrad: ['#fdba74','#f97316'],
  },
  {
    id: 'tree_tundra',        region: 'Tree_Territory',
    name: 'Tree Tundra',      subtitle: 'Branches in the Frost',
    icon: '🌲', theme: 'snow',
    primary: '#bae6fd',  secondary: '#7dd3fc',
    bg1: '#030c1a',      bg2: '#051525',
    glow: '#bae6fd30',   pathColor: '#e0f2fe',
    weather: 'snow',     titleGrad: ['#e0f2fe','#7dd3fc'],
  },
  {
    id: 'linked_labyrinth',   region: 'Linked_List_Labyrinth',
    name: 'Linked List Labyrinth', subtitle: 'Follow the Pointer',
    icon: '🌲', theme: 'forest',
    primary: '#22c55e',  secondary: '#16a34a',
    bg1: '#020e06',      bg2: '#041808',
    glow: '#22c55e40',   pathColor: '#4ade80',
    weather: 'fireflies', titleGrad: ['#86efac','#22c55e'],
  },
  {
    id: 'winter_carnival',    region: 'Winter_Carnival',
    name: 'Winter Carnival',  subtitle: 'Celebrate Complexity',
    icon: '❄️', theme: 'winter',
    primary: '#a855f7',  secondary: '#9333ea',
    bg1: '#0a0320',      bg2: '#12052e',
    glow: '#a855f740',   pathColor: '#c084fc',
    weather: 'snow',     titleGrad: ['#e9d5ff','#a855f7'],
  },
  {
    id: 'desert_dunes',       region: 'Desert_Dunes',
    name: 'Desert Dunes',     subtitle: 'Survive the Scorching Sort',
    icon: '🏜️', theme: 'desert',
    primary: '#ef4444',  secondary: '#dc2626',
    bg1: '#180400',      bg2: '#250600',
    glow: '#ef444440',   pathColor: '#f87171',
    weather: 'sand',     titleGrad: ['#fca5a5','#ef4444'],
  },
  {
    id: 'graph_mountains',    region: 'Graph_Gorge',
    name: 'Graph Mountains',  subtitle: 'Navigate the Node Network',
    icon: '🗻', theme: 'rocky',
    primary: '#78716c',  secondary: '#57534e',
    bg1: '#0a0908',      bg2: '#141210',
    glow: '#78716c40',   pathColor: '#a8a29e',
    weather: 'mist',     titleGrad: ['#d6d3d1','#78716c'],
  },
  {
    id: 'binary_badlands',    region: 'Binary_Badlands',
    name: 'Binary Badlands',  subtitle: 'Zero or One: Survive',
    icon: '💀', theme: 'wasteland',
    primary: '#ea580c',  secondary: '#c2410c',
    bg1: '#120400',      bg2: '#1c0500',
    glow: '#ea580c40',   pathColor: '#fb923c',
    weather: 'ember',    titleGrad: ['#fdba74','#ea580c'],
  },
  {
    id: 'dp_dungeon',         region: 'DP_Dungeon',
    name: 'DP Dungeon',       subtitle: 'Memoize or Perish',
    icon: '🏰', theme: 'dungeon',
    primary: '#7c3aed',  secondary: '#6d28d9',
    bg1: '#060118',      bg2: '#0c0228',
    glow: '#7c3aed40',   pathColor: '#8b5cf6',
    weather: 'ember',    titleGrad: ['#c4b5fd','#7c3aed'],
  },
  {
    id: 'recursion_ruins',    region: 'Recursion_Ruins',
    name: 'Recursion Ruins',  subtitle: 'The Function Calls Itself',
    icon: '🏛️', theme: 'ruins',
    primary: '#ca8a04',  secondary: '#a16207',
    bg1: '#0e0800',      bg2: '#181000',
    glow: '#ca8a0440',   pathColor: '#facc15',
    weather: 'dust',     titleGrad: ['#fde68a','#ca8a04'],
  },
  {
    id: 'rain_forest_regex',  region: 'Regex_Rainforest',
    name: 'Rain Forest of Regex', subtitle: 'Patterns in the Storm',
    icon: '🌧️', theme: 'rain',
    primary: '#0ea5e9',  secondary: '#0284c7',
    bg1: '#020b18',      bg2: '#041428',
    glow: '#0ea5e940',   pathColor: '#38bdf8',
    weather: 'rain',     titleGrad: ['#7dd3fc','#0ea5e9'],
  },
  {
    id: 'algorithm_alps',     region: 'Algorithm_Alps',
    name: 'Algorithm Alps',   subtitle: 'Peak Performance',
    icon: '🏔️', theme: 'blizzard',
    primary: '#cbd5e1',  secondary: '#94a3b8',
    bg1: '#030810',      bg2: '#05101c',
    glow: '#cbd5e130',   pathColor: '#e2e8f0',
    weather: 'blizzard', titleGrad: ['#f1f5f9','#94a3b8'],
  },
];

// ── Compute the world-space (x, y) of the top-left corner of each zone ────────
export const computeZonePositions = () => {
  return ZONE_CONFIGS.map((_, i) => {
    const row      = Math.floor(i / COLS);
    const posInRow = i % COLS;
    // Snake: even rows go L→R, odd rows go R→L
    const col = row % 2 === 0 ? posInRow : COLS - 1 - posInRow;
    return {
      x: col  * (ZONE_W + ZONE_COL_GAP),
      y: row  * (ZONE_H + ZONE_ROW_GAP),
    };
  });
};

// ── Local position of node N (1-15) inside a zone tile ────────────────────────
export const nodeLocalPos = (n) => {
  const idx  = n - 1;               // 0-indexed
  const row  = Math.floor(idx / 5); // which row (0,1,2)
  const posInRow = idx % 5;         // 0-4
  // Snake: row 0 L→R, row 1 R→L, row 2 L→R
  const col  = row % 2 === 0 ? posInRow : 4 - posInRow;
  return { x: NODE_XS[col], y: NODE_YS[row] };
};

// ── Determine if a node number is a boss ──────────────────────────────────────
export const isBossNode = (n) => n === MID_BOSS || n === MAIN_BOSS;
export const getBossType = (n) => n === MID_BOSS ? 'mid' : n === MAIN_BOSS ? 'main' : null;

// ── Generate fully-structured mock world (used until real DB data is available) ──
export const generateMockWorld = () => {
  const positions = computeZonePositions();

  return ZONE_CONFIGS.flatMap((zone, zIdx) => {
    const { x: zx, y: zy } = positions[zIdx];

    return Array.from({ length: 15 }, (_, i) => {
      const nodeNum  = i + 1;
      const local    = nodeLocalPos(nodeNum);
      const boss     = isBossNode(nodeNum);
      const bossType = getBossType(nodeNum);
      const prereq   = nodeNum === 1
        ? (zIdx === 0 ? [] : [`${ZONE_CONFIGS[zIdx - 1].id}_15`]) // first node unlocks after prev zone boss
        : [`${zone.id}_${nodeNum - 1}`];

      return {
        nodeId:       `${zone.id}_${nodeNum}`,
        region:        zone.region,
        zoneId:        zone.id,
        zoneIndex:     zIdx,
        nodeNum,
        nodeType:      boss ? 'boss' : 'standard',
        bossType,
        prerequisites: prereq,
        mapPosition:   { x: zx + local.x, y: zy + local.y },
        localPosition: local,
        rewards: {
          oneStarKP:   boss ? 30 : 10,
          twoStarKP:   boss ? 50 : 20,
          threeStarKP: boss ? 80 : 35,
          lootPool:    boss ? [{ itemId: 'border_gold', itemType: 'border', dropChance: 0.3 }] : [],
        },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
        problemId: {
          title:      boss ? `${zone.name} ${bossType === 'mid' ? 'Mid-' : ''}Boss` : `Challenge ${nodeNum}`,
          difficulty: boss ? (bossType === 'main' ? 'Hard' : 'Medium') : 'Easy',
        },
        isActive: true,
      };
    });
  });
};

// ── Map real DB nodes to their zone config ────────────────────────────────────
export const getZoneConfig = (regionOrZoneId) => {
  return (
    ZONE_CONFIGS.find(z => z.region === regionOrZoneId || z.id === regionOrZoneId)
    ?? ZONE_CONFIGS[0]
  );
};