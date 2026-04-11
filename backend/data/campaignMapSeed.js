// backend/data/campaignMapSeed.js
// ─────────────────────────────────────────────────────────────────────────────
// Seeds the CampaignMap collection — 6 zones × 15 nodes = 90 nodes total.
//
// Naming convention
//   aa = Array Archipelago  (zone 1)
//   ss = String Shores      (zone 2)
//   ll = Loop Lagoon        (zone 3)
//   sw = Sliding Window Sanctum   (zone 4)
//   hm = HashMap Highlands        (zone 5)
//   sq = Stack & Queue Quarry     (zone 6)
//
// Progression rule (enforced by prerequisites field)
//   • Node N  →  prerequisite: [node N-1]  (within same zone)
//   • Node 8  (Mid-Boss)  →  unlocks node 9 of the SAME zone only
//   • Node 15 (Zone Boss) →  its nodeId becomes the prerequisite of the next
//                             zone's node 1. Mid-Boss NEVER gates another zone.
//
// Map layout (snake pattern per zone)
//   Nodes 1–8  : y ≈ 300  (left → right)
//   Nodes 9–15 : y ≈ 150  (right → left, one row above)
//   Each zone occupies a 1400-unit wide horizontal band.
//   Zone N starts at x_offset = (N-1) * 1400
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────
// Returns the canonical mapPosition for a node given its zone offset.
const pos = (zoneOffset, nodeOrder) => {
  const lower = [100, 250, 400, 550, 700, 850, 1000, 1150]; // nodes 1-8 (y=300)
  const upper = [1150, 1000, 850, 700, 550, 400, 250];       // nodes 9-15 (y=150)
  if (nodeOrder <= 8) {
    return { x: zoneOffset + lower[nodeOrder - 1], y: 300 };
  }
  return { x: zoneOffset + upper[nodeOrder - 9], y: 150 };
};

// Zone x offsets
const Z = [0, 1400, 2800, 4200, 5600, 7000]; // index = zoneIndex (0-based)

// ─────────────────────────────────────────────────────────────────────────────
const campaignMapSeed = [

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 1 — Array Archipelago   (regionOrder: 1)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'aa_01', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 1,
    problemSlug: 'sum-of-array', nodeType: 'standard', prerequisites: [],
    mapPosition: pos(Z[0], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'aa_02', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 2,
    problemSlug: 'find-maximum', nodeType: 'standard', prerequisites: ['aa_01'],
    mapPosition: pos(Z[0], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'aa_03', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 3,
    problemSlug: 'reverse-array', nodeType: 'standard', prerequisites: ['aa_02'],
    mapPosition: pos(Z[0], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'aa_04', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 4,
    problemSlug: 'count-even-odd', nodeType: 'standard', prerequisites: ['aa_03'],
    mapPosition: pos(Z[0], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'aa_05', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 5,
    problemSlug: 'array-left-rotation', nodeType: 'standard', prerequisites: ['aa_04'],
    mapPosition: pos(Z[0], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'aa_06', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 6,
    problemSlug: 'zigzag-array', nodeType: 'standard', prerequisites: ['aa_05'],
    mapPosition: pos(Z[0], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'aa_07', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 7,
    problemSlug: 'missing-number', nodeType: 'standard', prerequisites: ['aa_06'],
    mapPosition: pos(Z[0], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'aa_08', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 8,
    problemSlug: 'max-subarray-sum', nodeType: 'boss', prerequisites: ['aa_07'],
    mapPosition: pos(Z[0], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Nodes 9-14 (above, right→left)
  {
    nodeId: 'aa_09', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 9,
    problemSlug: 'count-pairs-sum', nodeType: 'standard', prerequisites: ['aa_08'],
    mapPosition: pos(Z[0], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'aa_10', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 10,
    problemSlug: 'majority-element', nodeType: 'standard', prerequisites: ['aa_09'],
    mapPosition: pos(Z[0], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'aa_11', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 11,
    problemSlug: 'merge-sorted', nodeType: 'standard', prerequisites: ['aa_10'],
    mapPosition: pos(Z[0], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'aa_12', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 12,
    problemSlug: 'matrix-diagonal-sum', nodeType: 'standard', prerequisites: ['aa_11'],
    mapPosition: pos(Z[0], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'aa_13', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 13,
    problemSlug: 'trapping-rain', nodeType: 'standard', prerequisites: ['aa_12'],
    mapPosition: pos(Z[0], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'aa_14', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 14,
    problemSlug: 'next-permutation', nodeType: 'standard', prerequisites: ['aa_13'],
    mapPosition: pos(Z[0], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — gates Zone 2
  {
    nodeId: 'aa_15', region: 'Array_Archipelago', regionOrder: 1, nodeOrder: 15,
    problemSlug: 'array-king', nodeType: 'boss', prerequisites: ['aa_14'],
    mapPosition: pos(Z[0], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 2 — String Shores   (regionOrder: 2)
  // ss_01 requires aa_15 (Zone 1 boss) — NOT aa_08 (Mid-Boss)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'ss_01', region: 'String_Shores', regionOrder: 2, nodeOrder: 1,
    problemSlug: 'reverse-string', nodeType: 'standard',
    prerequisites: ['aa_15'], // ← Zone 1 Boss gates Zone 2
    mapPosition: pos(Z[1], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_02', region: 'String_Shores', regionOrder: 2, nodeOrder: 2,
    problemSlug: 'palindrome-string', nodeType: 'standard', prerequisites: ['ss_01'],
    mapPosition: pos(Z[1], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_03', region: 'String_Shores', regionOrder: 2, nodeOrder: 3,
    problemSlug: 'pangram-check', nodeType: 'standard', prerequisites: ['ss_02'],
    mapPosition: pos(Z[1], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_04', region: 'String_Shores', regionOrder: 2, nodeOrder: 4,
    problemSlug: 'caesar-cipher', nodeType: 'standard', prerequisites: ['ss_03'],
    mapPosition: pos(Z[1], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_05', region: 'String_Shores', regionOrder: 2, nodeOrder: 5,
    problemSlug: 'anagram-check', nodeType: 'standard', prerequisites: ['ss_04'],
    mapPosition: pos(Z[1], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_06', region: 'String_Shores', regionOrder: 2, nodeOrder: 6,
    problemSlug: 'run-length-encoding', nodeType: 'standard', prerequisites: ['ss_05'],
    mapPosition: pos(Z[1], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'ss_07', region: 'String_Shores', regionOrder: 2, nodeOrder: 7,
    problemSlug: 'most-frequent-char', nodeType: 'standard', prerequisites: ['ss_06'],
    mapPosition: pos(Z[1], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'ss_08', region: 'String_Shores', regionOrder: 2, nodeOrder: 8,
    problemSlug: 'longest-unique-substring', nodeType: 'boss', prerequisites: ['ss_07'],
    mapPosition: pos(Z[1], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_09', region: 'String_Shores', regionOrder: 2, nodeOrder: 9,
    problemSlug: 'valid-brackets', nodeType: 'standard', prerequisites: ['ss_08'],
    mapPosition: pos(Z[1], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_10', region: 'String_Shores', regionOrder: 2, nodeOrder: 10,
    problemSlug: 'string-compression', nodeType: 'standard', prerequisites: ['ss_09'],
    mapPosition: pos(Z[1], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_11', region: 'String_Shores', regionOrder: 2, nodeOrder: 11,
    problemSlug: 'rotate-string', nodeType: 'standard', prerequisites: ['ss_10'],
    mapPosition: pos(Z[1], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_12', region: 'String_Shores', regionOrder: 2, nodeOrder: 12,
    problemSlug: 'count-and-say', nodeType: 'standard', prerequisites: ['ss_11'],
    mapPosition: pos(Z[1], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_13', region: 'String_Shores', regionOrder: 2, nodeOrder: 13,
    problemSlug: 'wildcard-match', nodeType: 'standard', prerequisites: ['ss_12'],
    mapPosition: pos(Z[1], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'ss_14', region: 'String_Shores', regionOrder: 2, nodeOrder: 14,
    problemSlug: 'decode-ways', nodeType: 'standard', prerequisites: ['ss_13'],
    mapPosition: pos(Z[1], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — gates Zone 3
  {
    nodeId: 'ss_15', region: 'String_Shores', regionOrder: 2, nodeOrder: 15,
    problemSlug: 'edit-distance', nodeType: 'boss', prerequisites: ['ss_14'],
    mapPosition: pos(Z[1], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 3 — Loop Lagoon   (regionOrder: 3)
  // ll_01 requires ss_15 (Zone 2 boss)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'll_01', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 1,
    problemSlug: 'fibonacci-sequence', nodeType: 'standard',
    prerequisites: ['ss_15'], // ← Zone 2 Boss gates Zone 3
    mapPosition: pos(Z[2], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_02', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 2,
    problemSlug: 'prime-sieve', nodeType: 'standard', prerequisites: ['ll_01'],
    mapPosition: pos(Z[2], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_03', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 3,
    problemSlug: 'gcd-lcm', nodeType: 'standard', prerequisites: ['ll_02'],
    mapPosition: pos(Z[2], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_04', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 4,
    problemSlug: 'fast-power', nodeType: 'standard', prerequisites: ['ll_03'],
    mapPosition: pos(Z[2], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_05', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 5,
    problemSlug: 'pascals-triangle', nodeType: 'standard', prerequisites: ['ll_04'],
    mapPosition: pos(Z[2], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_06', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 6,
    problemSlug: 'digital-root', nodeType: 'standard', prerequisites: ['ll_05'],
    mapPosition: pos(Z[2], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'll_07', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 7,
    problemSlug: 'number-patterns', nodeType: 'standard', prerequisites: ['ll_06'],
    mapPosition: pos(Z[2], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'll_08', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 8,
    problemSlug: 'collatz', nodeType: 'boss', prerequisites: ['ll_07'],
    mapPosition: pos(Z[2], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_09', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 9,
    problemSlug: 'binary-search', nodeType: 'standard', prerequisites: ['ll_08'],
    mapPosition: pos(Z[2], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_10', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 10,
    problemSlug: 'bubble-sort', nodeType: 'standard', prerequisites: ['ll_09'],
    mapPosition: pos(Z[2], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_11', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 11,
    problemSlug: 'two-sum-indices', nodeType: 'standard', prerequisites: ['ll_10'],
    mapPosition: pos(Z[2], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_12', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 12,
    problemSlug: 'detect-loop', nodeType: 'standard', prerequisites: ['ll_11'],
    mapPosition: pos(Z[2], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_13', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 13,
    problemSlug: 'flood-fill', nodeType: 'standard', prerequisites: ['ll_12'],
    mapPosition: pos(Z[2], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'll_14', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 14,
    problemSlug: 'jump-game', nodeType: 'standard', prerequisites: ['ll_13'],
    mapPosition: pos(Z[2], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — gates Zone 4
  {
    nodeId: 'll_15', region: 'Loop_Lagoon', regionOrder: 3, nodeOrder: 15,
    problemSlug: 'loop-lord', nodeType: 'boss', prerequisites: ['ll_14'],
    mapPosition: pos(Z[2], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 4 — Sliding Window Sanctum   (regionOrder: 4)
  // sw_01 requires ll_15 (Zone 3 boss)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'sw_01', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 1,
    problemSlug: 'max-window-sum', nodeType: 'standard',
    prerequisites: ['ll_15'], // ← Zone 3 Boss gates Zone 4
    mapPosition: pos(Z[3], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sw_02', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 2,
    problemSlug: 'window-averages', nodeType: 'standard', prerequisites: ['sw_01'],
    mapPosition: pos(Z[3], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sw_03', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 3,
    problemSlug: 'stable-windows', nodeType: 'standard', prerequisites: ['sw_02'],
    mapPosition: pos(Z[3], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sw_04', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 4,
    problemSlug: 'longest-positive-streak', nodeType: 'standard', prerequisites: ['sw_03'],
    mapPosition: pos(Z[3], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sw_05', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 5,
    problemSlug: 'sliding-window-minimum', nodeType: 'standard', prerequisites: ['sw_04'],
    mapPosition: pos(Z[3], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'sw_06', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 6,
    problemSlug: 'binary-window-ones', nodeType: 'standard', prerequisites: ['sw_05'],
    mapPosition: pos(Z[3], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'sw_07', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 7,
    problemSlug: 'blessed-windows', nodeType: 'standard', prerequisites: ['sw_06'],
    mapPosition: pos(Z[3], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'sw_08', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 8,
    problemSlug: 'min-subarray-length', nodeType: 'boss', prerequisites: ['sw_07'],
    mapPosition: pos(Z[3], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_09', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 9,
    problemSlug: 'distinct-subarrays', nodeType: 'standard', prerequisites: ['sw_08'],
    mapPosition: pos(Z[3], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_10', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 10,
    problemSlug: 'longest-no-repeat', nodeType: 'standard', prerequisites: ['sw_09'],
    mapPosition: pos(Z[3], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_11', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 11,
    problemSlug: 'permutation-in-string', nodeType: 'standard', prerequisites: ['sw_10'],
    mapPosition: pos(Z[3], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_12', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 12,
    problemSlug: 'longest-char-replacement', nodeType: 'standard', prerequisites: ['sw_11'],
    mapPosition: pos(Z[3], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_13', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 13,
    problemSlug: 'fruits-in-baskets', nodeType: 'standard', prerequisites: ['sw_12'],
    mapPosition: pos(Z[3], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sw_14', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 14,
    problemSlug: 'max-consecutive-ones', nodeType: 'standard', prerequisites: ['sw_13'],
    mapPosition: pos(Z[3], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — gates Zone 5
  {
    nodeId: 'sw_15', region: 'Sliding_Window_Sanctum', regionOrder: 4, nodeOrder: 15,
    problemSlug: 'min-window-substring', nodeType: 'boss', prerequisites: ['sw_14'],
    mapPosition: pos(Z[3], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 5 — HashMap Highlands   (regionOrder: 5)
  // hm_01 requires sw_15 (Zone 4 boss)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'hm_01', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 1,
    problemSlug: 'element-frequency', nodeType: 'standard',
    prerequisites: ['sw_15'], // ← Zone 4 Boss gates Zone 5
    mapPosition: pos(Z[4], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_02', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 2,
    problemSlug: 'contains-duplicate', nodeType: 'standard', prerequisites: ['hm_01'],
    mapPosition: pos(Z[4], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_03', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 3,
    problemSlug: 'anagram-strings', nodeType: 'standard', prerequisites: ['hm_02'],
    mapPosition: pos(Z[4], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_04', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 4,
    problemSlug: 'array-intersection', nodeType: 'standard', prerequisites: ['hm_03'],
    mapPosition: pos(Z[4], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_05', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 5,
    problemSlug: 'first-unique-char', nodeType: 'standard', prerequisites: ['hm_04'],
    mapPosition: pos(Z[4], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_06', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 6,
    problemSlug: 'ransom-note', nodeType: 'standard', prerequisites: ['hm_05'],
    mapPosition: pos(Z[4], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'hm_07', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 7,
    problemSlug: 'isomorphic-strings', nodeType: 'standard', prerequisites: ['hm_06'],
    mapPosition: pos(Z[4], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'hm_08', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 8,
    problemSlug: 'two-sum-hashmap', nodeType: 'boss', prerequisites: ['hm_07'],
    mapPosition: pos(Z[4], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_09', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 9,
    problemSlug: 'longest-subarray-k', nodeType: 'standard', prerequisites: ['hm_08'],
    mapPosition: pos(Z[4], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_10', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 10,
    problemSlug: 'group-anagrams', nodeType: 'standard', prerequisites: ['hm_09'],
    mapPosition: pos(Z[4], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_11', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 11,
    problemSlug: 'subarray-sum-zero', nodeType: 'standard', prerequisites: ['hm_10'],
    mapPosition: pos(Z[4], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_12', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 12,
    problemSlug: 'top-k-frequent', nodeType: 'standard', prerequisites: ['hm_11'],
    mapPosition: pos(Z[4], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_13', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 13,
    problemSlug: 'longest-harmonious', nodeType: 'standard', prerequisites: ['hm_12'],
    mapPosition: pos(Z[4], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'hm_14', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 14,
    problemSlug: 'word-pattern', nodeType: 'standard', prerequisites: ['hm_13'],
    mapPosition: pos(Z[4], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — gates Zone 6
  {
    nodeId: 'hm_15', region: 'HashMap_Highlands', regionOrder: 5, nodeOrder: 15,
    problemSlug: 'longest-consecutive', nodeType: 'boss', prerequisites: ['hm_14'],
    mapPosition: pos(Z[4], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 6 — Stack & Queue Quarry   (regionOrder: 6)
  // sq_01 requires hm_15 (Zone 5 boss)
  // ══════════════════════════════════════════════════════════════════════════
  {
    nodeId: 'sq_01', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 1,
    problemSlug: 'implement-stack', nodeType: 'standard',
    prerequisites: ['hm_15'], // ← Zone 5 Boss gates Zone 6
    mapPosition: pos(Z[5], 1),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sq_02', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 2,
    problemSlug: 'valid-brackets-forge', nodeType: 'standard', prerequisites: ['sq_01'],
    mapPosition: pos(Z[5], 2),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sq_03', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 3,
    problemSlug: 'queue-using-stacks', nodeType: 'standard', prerequisites: ['sq_02'],
    mapPosition: pos(Z[5], 3),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sq_04', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 4,
    problemSlug: 'reverse-queue', nodeType: 'standard', prerequisites: ['sq_03'],
    mapPosition: pos(Z[5], 4),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
  },
  {
    nodeId: 'sq_05', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 5,
    problemSlug: 'circular-queue', nodeType: 'standard', prerequisites: ['sq_04'],
    mapPosition: pos(Z[5], 5),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'sq_06', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 6,
    problemSlug: 'postfix-evaluation', nodeType: 'standard', prerequisites: ['sq_05'],
    mapPosition: pos(Z[5], 6),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
  },
  {
    nodeId: 'sq_07', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 7,
    problemSlug: 'min-stack', nodeType: 'standard', prerequisites: ['sq_06'],
    mapPosition: pos(Z[5], 7),
    rewards: { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Mid-Boss
  {
    nodeId: 'sq_08', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 8,
    problemSlug: 'next-greater-element', nodeType: 'boss', prerequisites: ['sq_07'],
    mapPosition: pos(Z[5], 8),
    rewards: { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_09', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 9,
    problemSlug: 'stock-span', nodeType: 'standard', prerequisites: ['sq_08'],
    mapPosition: pos(Z[5], 9),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_10', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 10,
    problemSlug: 'largest-histogram-rect', nodeType: 'standard', prerequisites: ['sq_09'],
    mapPosition: pos(Z[5], 10),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_11', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 11,
    problemSlug: 'trapping-water-stack', nodeType: 'standard', prerequisites: ['sq_10'],
    mapPosition: pos(Z[5], 11),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_12', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 12,
    problemSlug: 'sliding-window-max-deque', nodeType: 'standard', prerequisites: ['sq_11'],
    mapPosition: pos(Z[5], 12),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_13', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 13,
    problemSlug: 'josephus-problem', nodeType: 'standard', prerequisites: ['sq_12'],
    mapPosition: pos(Z[5], 13),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  {
    nodeId: 'sq_14', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 14,
    problemSlug: 'decode-string', nodeType: 'standard', prerequisites: ['sq_13'],
    mapPosition: pos(Z[5], 14),
    rewards: { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
    starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
  },
  // Zone Boss — final node (no further zones)
  {
    nodeId: 'sq_15', region: 'Stack_Queue_Quarry', regionOrder: 6, nodeOrder: 15,
    problemSlug: 'lru-cache', nodeType: 'boss', prerequisites: ['sq_14'],
    mapPosition: pos(Z[5], 15),
    rewards: { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
    starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
  },
];

// ── Sanity check (runs at import time in development) ─────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const ids = campaignMapSeed.map(n => n.nodeId);
  const idSet = new Set(ids);

  // Duplicate nodeIds
  if (ids.length !== idSet.size) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    console.warn('[SEED] Duplicate nodeIds found:', dupes);
  }

  // Prerequisite references must exist
  campaignMapSeed.forEach(n => {
    n.prerequisites.forEach(prereq => {
      if (!idSet.has(prereq)) {
        console.warn(`[SEED] ${n.nodeId} references unknown prerequisite "${prereq}"`);
      }
    });
  });

  // Inter-zone gateway rule: node1 of any zone (regionOrder > 1) must reference
  // the zone boss (nodeOrder 15) of the previous zone — not the mid-boss (nodeOrder 8).
  campaignMapSeed
    .filter(n => n.nodeOrder === 1 && n.regionOrder > 1)
    .forEach(n => {
      n.prerequisites.forEach(prereq => {
        const prereqNode = campaignMapSeed.find(x => x.nodeId === prereq);
        if (prereqNode && prereqNode.nodeOrder !== 15) {
          console.warn(
            `[SEED] ${n.nodeId} (zone opener) references ${prereq} which is ` +
            `nodeOrder ${prereqNode.nodeOrder} — expected the Zone Boss (nodeOrder 15).`
          );
        }
      });
    });
}

export default campaignMapSeed;

// ── Note on CampaignMap.js model ─────────────────────────────────────────────
// Update the region enum to include all six zones:
//
// region: {
//   type: String,
//   required: true,
//   enum: [
//     'Array_Archipelago',
//     'String_Shores',
//     'Loop_Lagoon',
//     'Sliding_Window_Sanctum',
//     'HashMap_Highlands',
//     'Stack_Queue_Quarry',
//   ],
// },
// V 1.5
