// src/components/Campaign/campaignWorldData.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for zone configs, node layout math, and mock data.
// The map is a vertically-scrollable column of zone tiles.
// Each zone: 720px wide × 680px tall, 15 nodes in a 3-row snake pattern.
// ─────────────────────────────────────────────────────────────────────────────

export const ZONE_W        = 720;
export const ZONE_H        = 680;
export const ZONE_GAP      = 60;   // visual gap between zone tiles
export const NODE_RADIUS   = 28;   // standard node circle radius
export const BOSS_RADIUS   = 38;   // boss node radius
export const MID_BOSS_IDX  = 7;    // 0-indexed → node 8
export const MAIN_BOSS_IDX = 14;   // 0-indexed → node 15

// ── Snake-path node positions (local to zone tile, origin top-left) ──────────
// Row 0 (bottom of tile, y=560): nodes 0-4, left → right
// Row 1 (middle,         y=360): nodes 5-9, right → left
// Row 2 (top,            y=160): nodes 10-14, left → right
const ROW_Y  = [560, 360, 160];
const COL_XS = [80, 205, 330, 455, 580]; // 5 columns

export const getLocalNodePos = (idx) => {
  const row       = Math.floor(idx / 5);          // 0,1,2
  const posInRow  = idx % 5;                       // 0-4
  const reversed  = row % 2 === 1;                 // odd rows go R→L
  const col       = reversed ? 4 - posInRow : posInRow;
  return { x: COL_XS[col], y: ROW_Y[row] };
};

// Build the SVG path string that snakes through all 15 nodes in a zone.
// Between consecutive nodes within the same row: smooth cubic bezier.
// Between rows (the U-turn): a vertical bezier that curves around the corner.
export const buildZonePath = () => {
  const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur  = pts[i];
    const sameRow = Math.floor((i - 1) / 5) === Math.floor(i / 5);

    if (sameRow) {
      // Horizontal curve within row — slight arch
      const mx = (prev.x + cur.x) / 2;
      const my = prev.y - 18;
      d += ` Q ${mx} ${my} ${cur.x} ${cur.y}`;
    } else {
      // Row transition — S-curve U-turn
      const cp1x = prev.x;
      const cp1y = prev.y + (cur.y - prev.y) * 0.45;
      const cp2x = cur.x;
      const cp2y = prev.y + (cur.y - prev.y) * 0.55;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cur.x} ${cur.y}`;
    }
  }
  return d;
};

// ── 15 zone biome configurations ─────────────────────────────────────────────
export const ZONE_CONFIGS = [
  {
    id: 'array_archipelago',
    name: 'Array Archipelago',
    subtitle: 'Where Journeys Begin',
    icon: '🏝️',
    weather: 'fireflies',
    // background layers
    bgGrad:   ['#0c3d2e', '#0a5c3e', '#0d7048'],
    groundColor: '#1a5c2e',
    accent:   '#22d3ee',
    path:     '#34d399',
    titleGrad: ['#6ee7b7','#34d399'],
    border:   '#059669',
    glow:     '#10b98140',
    decorations: ['🌴','🌿','🦋','🌺'],
  },
  {
    id: 'string_shores',
    name: 'String Shores',
    subtitle: 'Walk the Shore of Words',
    icon: '🌊',
    weather: 'waves',
    bgGrad:   ['#0c1a4a', '#1a3580', '#2547a8'],
    groundColor: '#1e4090',
    accent:   '#60a5fa',
    path:     '#93c5fd',
    titleGrad: ['#bfdbfe','#60a5fa'],
    border:   '#2563eb',
    glow:     '#3b82f640',
    decorations: ['🐚','⚓','🦀','🐠'],
  },
  {
    id: 'loop_lagoon',
    name: 'Loop Lagoon',
    subtitle: 'Where Patterns Repeat',
    icon: '🌿',
    weather: 'fog',
    bgGrad:   ['#052016','#0a3320','#0d4428'],
    groundColor: '#0d3d1f',
    accent:   '#4ade80',
    path:     '#86efac',
    titleGrad: ['#bbf7d0','#4ade80'],
    border:   '#16a34a',
    glow:     '#22c55e40',
    decorations: ['🐸','🌱','🍃','🦗'],
  },
  {
    id: 'stack_quarry',
    name: 'Stack & Queue Quarry',
    subtitle: 'Dig Deep, Think LIFO',
    icon: '⛏️',
    weather: 'sparks',
    bgGrad:   ['#1a0d00','#2e1800','#3d2200'],
    groundColor: '#2a1500',
    accent:   '#fbbf24',
    path:     '#fde68a',
    titleGrad: ['#fef08a','#fbbf24'],
    border:   '#d97706',
    glow:     '#f59e0b40',
    decorations: ['💎','🪨','⚙️','🔩'],
  },
  {
    id: 'hashmap_highlands',
    name: 'HashMap Highlands',
    subtitle: 'Key-Value Kingdom',
    icon: '⛰️',
    weather: 'mist',
    bgGrad:   ['#1a0e00','#2d1a08','#3d2510'],
    groundColor: '#2d1e0a',
    accent:   '#fb923c',
    path:     '#fdba74',
    titleGrad: ['#fed7aa','#fb923c'],
    border:   '#ea580c',
    glow:     '#f9731640',
    decorations: ['🏔️','🦅','🌄','🪨'],
  },
  {
    id: 'tree_tundra',
    name: 'Tree Tundra',
    subtitle: 'Branches in the Frost',
    icon: '🌲',
    weather: 'snow',
    bgGrad:   ['#0a1628','#0f2040','#162d56'],
    groundColor: '#1a2e50',
    accent:   '#bae6fd',
    path:     '#e0f2fe',
    titleGrad: ['#f0f9ff','#7dd3fc'],
    border:   '#0284c7',
    glow:     '#38bdf840',
    decorations: ['❄️','🌲','🦌','⛄'],
  },
  {
    id: 'linked_labyrinth',
    name: 'Linked List Labyrinth',
    subtitle: 'Follow the Pointer',
    icon: '🌳',
    weather: 'fireflies',
    bgGrad:   ['#061008','#0a1c0c','#0e2810'],
    groundColor: '#0c1e0e',
    accent:   '#a3e635',
    path:     '#bef264',
    titleGrad: ['#d9f99d','#a3e635'],
    border:   '#65a30d',
    glow:     '#84cc1640',
    decorations: ['🌿','🕷️','🦎','🍄'],
  },
  {
    id: 'winter_carnival',
    name: 'Winter Carnival',
    subtitle: 'Celebrate the Cold',
    icon: '❄️',
    weather: 'snow',
    bgGrad:   ['#100428','#1a0840','#22105a'],
    groundColor: '#1c0c48',
    accent:   '#c084fc',
    path:     '#e9d5ff',
    titleGrad: ['#f3e8ff','#c084fc'],
    border:   '#9333ea',
    glow:     '#a855f740',
    decorations: ['🎪','✨','🎡','🎠'],
  },
  {
    id: 'desert_dunes',
    name: 'Desert Dunes',
    subtitle: 'Survive the Scorching Sort',
    icon: '🏜️',
    weather: 'sand',
    bgGrad:   ['#2a0a00','#4a1500','#6b2000'],
    groundColor: '#4a1800',
    accent:   '#f87171',
    path:     '#fca5a5',
    titleGrad: ['#fecaca','#f87171'],
    border:   '#dc2626',
    glow:     '#ef444440',
    decorations: ['🦂','🌵','🐍','💀'],
  },
  {
    id: 'graph_gorge',
    name: 'Graph Gorge',
    subtitle: 'Navigate the Node Network',
    icon: '🗻',
    weather: 'mist',
    bgGrad:   ['#0e0c0a','#1a1714','#262220'],
    groundColor: '#1e1a16',
    accent:   '#a8a29e',
    path:     '#d6d3d1',
    titleGrad: ['#e7e5e4','#a8a29e'],
    border:   '#78716c',
    glow:     '#a8a29e40',
    decorations: ['🗻','🦊','🌫️','🪨'],
  },
  {
    id: 'binary_badlands',
    name: 'Binary Badlands',
    subtitle: 'Zero or One: Survive',
    icon: '🌋',
    weather: 'ember',
    bgGrad:   ['#200400','#380700','#500b00'],
    groundColor: '#3a0800',
    accent:   '#fb923c',
    path:     '#fed7aa',
    titleGrad: ['#ffedd5','#fb923c'],
    border:   '#c2410c',
    glow:     '#ea580c40',
    decorations: ['🌋','☠️','🔥','💥'],
  },
  {
    id: 'dp_dungeon',
    name: 'DP Dungeon',
    subtitle: 'Memoize or Perish',
    icon: '🏰',
    weather: 'ember',
    bgGrad:   ['#080018','#100030','#180048'],
    groundColor: '#100030',
    accent:   '#a78bfa',
    path:     '#c4b5fd',
    titleGrad: ['#ede9fe','#a78bfa'],
    border:   '#7c3aed',
    glow:     '#8b5cf640',
    decorations: ['🏰','⚗️','🕯️','🦇'],
  },
  {
    id: 'recursion_ruins',
    name: 'Recursion Ruins',
    subtitle: 'The Function Calls Itself',
    icon: '🏛️',
    weather: 'dust',
    bgGrad:   ['#160c00','#221200','#301a00'],
    groundColor: '#221400',
    accent:   '#facc15',
    path:     '#fde047',
    titleGrad: ['#fef9c3','#facc15'],
    border:   '#ca8a04',
    glow:     '#eab30840',
    decorations: ['🏛️','📜','🗿','⚱️'],
  },
  {
    id: 'regex_rainforest',
    name: 'Regex Rainforest',
    subtitle: 'Patterns in the Storm',
    icon: '🌧️',
    weather: 'rain',
    bgGrad:   ['#020e18','#041830','#062040'],
    groundColor: '#041428',
    accent:   '#38bdf8',
    path:     '#7dd3fc',
    titleGrad: ['#bae6fd','#38bdf8'],
    border:   '#0284c7',
    glow:     '#0ea5e940',
    decorations: ['🌧️','🍄','🌿','🐢'],
  },
  {
    id: 'algorithm_alps',
    name: 'Algorithm Alps',
    subtitle: 'Peak Performance',
    icon: '🏔️',
    weather: 'blizzard',
    bgGrad:   ['#04081a','#080e28','#0c1438'],
    groundColor: '#080f28',
    accent:   '#e2e8f0',
    path:     '#f8fafc',
    titleGrad: ['#f1f5f9','#94a3b8'],
    border:   '#64748b',
    glow:     '#94a3b830',
    decorations: ['🏔️','🦅','❄️','⚡'],
  },
];

// ── Zone progression: zone N's node 0 prereq = zone N-1's node 14 ────────────
export const generateMockWorld = () => {
  const world = [];

  ZONE_CONFIGS.forEach((zone, zIdx) => {
    Array.from({ length: 15 }, (_, i) => {
      const isMidBoss  = i === MID_BOSS_IDX;
      const isMainBoss = i === MAIN_BOSS_IDX;
      const nodeType   = (isMidBoss || isMainBoss) ? 'boss' : 'standard';
      const bossType   = isMidBoss ? 'mid' : isMainBoss ? 'main' : null;
      const nodeNum    = i + 1;
      const nodeId     = `${zone.id}_${nodeNum}`;
      const prereq     = i === 0
        ? (zIdx === 0 ? [] : [`${ZONE_CONFIGS[zIdx - 1].id}_15`])
        : [`${zone.id}_${i}`];

      world.push({
        nodeId,
        region:        zone.id,
        zoneIndex:     zIdx,
        nodeNum,
        localIndex:    i,
        nodeType,
        bossType,
        prerequisites: prereq,
        localPos:      getLocalNodePos(i),
        rewards: {
          oneStarKP:   isMidBoss || isMainBoss ? 30 : 10,
          twoStarKP:   isMidBoss || isMainBoss ? 50 : 20,
          threeStarKP: isMidBoss || isMainBoss ? 80 : 35,
        },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
        problemId: {
          title:      isMidBoss ? `${zone.name}: Mid-Boss` : isMainBoss ? `${zone.name}: Final Boss` : `Challenge ${nodeNum}`,
          difficulty: isMainBoss ? 'Hard' : isMidBoss ? 'Medium' : 'Easy',
        },
      });
    });
  });

  return world;
};

// World height for the scrollable canvas
export const WORLD_TOTAL_H = ZONE_CONFIGS.length * (ZONE_H + ZONE_GAP);