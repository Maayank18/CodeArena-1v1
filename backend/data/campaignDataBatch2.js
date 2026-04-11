// src/data/campaignDataBatch2.js
// ─────────────────────────────────────────────────────────────────────────────
// Zone 4 — Sliding Window Sanctum   (sw_01 → sw_15)
// Zone 5 — HashMap Highlands        (hm_01 → hm_15)
// Zone 6 — Stack & Queue Quarry     (sq_01 → sq_15)
//
// Progression rule:
//   • Within a zone  : node N requires node N-1
//   • Node 8         : Mid-Boss  — unlocks node 9 of the SAME zone
//   • Node 15        : Zone Boss — unlocks node 1 of the NEXT zone ONLY
//   • sw_01 requires ll_15  (Zone 3 boss)
//   • hm_01 requires sw_15  (Zone 4 boss)
//   • sq_01 requires hm_15  (Zone 5 boss)
//
// Node IDs mirror the seed file:
//   sw = Sliding Window, hm = HashMap, sq = Stack & Queue
// ─────────────────────────────────────────────────────────────────────────────

export const BATCH_2_ZONES = [

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 4 — Sliding Window Sanctum   (unlocks after ll_15)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'sliding_window_sanctum',
    name:     'Sliding Window Sanctum',
    subtitle: 'The Glass Valley Awaits',
    icon:     '🔭',
    weather:  'mist',
    theme: {
      bgGrad:      ['#060e1a', '#0a1a30', '#0e2445'],
      accent:      '#818cf8',
      path:        '#6366f1',
      titleGrad:   ['#c7d2fe', '#818cf8'],
      border:      '#4f46e5',
      glow:        '#6366f140',
      ground:      '#080f22',
      decorations: ['🔭', '🌀', '💠', '✦'],
    },
    nodes: [

      // ── Nodes 1–7: Easy ───────────────────────────────────────────────────
      {
        nodeId: 'sw_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Max Window Sum', difficulty: 'Easy', slug: 'max-window-sum',
          description:
            'Given an array of N integers and a window size K, find the maximum sum of any K consecutive elements.',
          examples: [{ input: '7 3\n2 1 5 1 3 2 4', output: '9' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵', '−10⁴ ≤ arr[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sw_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Window Averages', difficulty: 'Easy', slug: 'window-averages',
          description:
            'Given an array and window size K, return all K-window averages rounded to 2 decimal places, space-separated.',
          examples: [{ input: '5 3\n1 3 2 6 4', output: '2.00 3.67 4.00' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁴', '0 ≤ arr[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sw_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'Stable Windows', difficulty: 'Easy', slug: 'stable-windows',
          description:
            'A window of size K is "stable" if all elements inside it are identical. Count the number of stable windows.',
          examples: [{ input: '6 3\n1 1 1 2 2 2', output: '2' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵', '0 ≤ arr[i] ≤ 10⁶'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sw_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Longest Positive Streak', difficulty: 'Easy', slug: 'longest-positive-streak',
          description:
            'Find the length of the longest contiguous subarray where all elements are strictly positive.',
          examples: [{ input: '8\n1 2 -1 3 4 5 -2 6', output: '3' }],
          constraints: ['1 ≤ N ≤ 10⁵', '−10⁴ ≤ arr[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sw_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'Sliding Window Minimum', difficulty: 'Easy', slug: 'sliding-window-minimum',
          description:
            'For each window of size K sliding across the array, output the minimum of each window, space-separated.',
          examples: [{ input: '5 3\n5 3 1 4 2', output: '1 1 1' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁴', '0 ≤ arr[i] ≤ 10⁶'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
      },
      {
        nodeId: 'sw_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Binary Window Ones', difficulty: 'Easy', slug: 'binary-window-ones',
          description:
            'Given a binary array, window size K, and target M, count windows of size K that contain exactly M ones.',
          examples: [{ input: '7 3 2\n1 0 1 0 1 1 0', output: '3' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵', '0 ≤ M ≤ K'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
      },
      {
        nodeId: 'sw_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Blessed Windows', difficulty: 'Easy', slug: 'blessed-windows',
          description:
            'Count the number of windows of size K whose sum is ≥ threshold T.',
          examples: [{ input: '6 3 10\n4 5 2 7 1 8', output: '3' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵', '1 ≤ T ≤ 10⁹'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 8: Mid-Boss ─────────────────────────────────────────────────
      {
        nodeId: 'sw_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Min Subarray Length', difficulty: 'Medium', slug: 'min-subarray-length',
          description:
            'Find the length of the smallest contiguous subarray whose sum is ≥ S. Return 0 if none exists. Must run in O(N).',
          examples: [{ input: '7\n2 3 1 2 4 3\n7', output: '2' }],
          constraints: ['1 ≤ N ≤ 10⁵', '1 ≤ S ≤ 10⁹', '0 < arr[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Nodes 9–14: Medium ───────────────────────────────────────────────
      {
        nodeId: 'sw_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Distinct Character Subarrays', difficulty: 'Medium',
          slug: 'distinct-subarrays',
          description:
            'Find the number of subarrays of length K that contain exactly K distinct characters.',
          examples: [{ input: '6 3\naabcdd', output: '3' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sw_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'Longest No-Repeat Substring', difficulty: 'Medium',
          slug: 'longest-no-repeat',
          description:
            'Find the length of the longest substring without any repeating characters.',
          examples: [{ input: 'abcabcbb', output: '3' }],
          constraints: ['0 ≤ |S| ≤ 5×10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sw_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Permutation in String', difficulty: 'Medium',
          slug: 'permutation-in-string',
          description:
            'Check if any permutation of pattern P exists as a substring of string S. Print YES or NO.',
          examples: [{ input: 'ab\noiabcd', output: 'YES' }],
          constraints: ['1 ≤ |P| ≤ |S| ≤ 5×10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sw_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Longest Char Replacement', difficulty: 'Medium',
          slug: 'longest-char-replacement',
          description:
            'Find the length of the longest substring containing only one distinct character achievable after at most K replacements.',
          examples: [{ input: 'AABABBA\n1', output: '4' }],
          constraints: ['1 ≤ |S| ≤ 10⁵', '0 ≤ K ≤ |S|'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sw_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Fruits in Baskets', difficulty: 'Medium', slug: 'fruits-in-baskets',
          description:
            'You have exactly 2 baskets, each holding one fruit type. Find the longest contiguous segment of trees containing at most 2 distinct fruit types.',
          examples: [{ input: '6\nA B C B B C', output: '5' }],
          constraints: ['1 ≤ N ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sw_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Max Consecutive Ones III', difficulty: 'Medium',
          slug: 'max-consecutive-ones',
          description:
            'Given a binary array and integer K, you may flip at most K zeros to ones. Find the maximum number of consecutive ones achievable.',
          examples: [{ input: '6 2\n1 1 0 0 1 1', output: '6' }],
          constraints: ['1 ≤ N ≤ 10⁵', '0 ≤ K ≤ N'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 15: Zone Boss ───────────────────────────────────────────────
      {
        nodeId: 'sw_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'Minimum Window Substring', difficulty: 'Hard',
          slug: 'min-window-substring',
          description:
            'Find the minimum window substring of S that contains all characters of T (including duplicates). Return "" if impossible.',
          examples: [{ input: 'ADOBECODEBANC\nABC', output: 'BANC' }],
          constraints: ['1 ≤ |S|, |T| ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
        lootPool: [
          { itemId: 'title_glasswarden', itemType: 'title',  dropChance: 0.4  },
          { itemId: 'border_prism',      itemType: 'border', dropChance: 0.25 },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 5 — HashMap Highlands   (unlocks after sw_15)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'hashmap_highlands',
    name:     'HashMap Highlands',
    subtitle: "Map the Unmappable",
    icon:     '🗺️',
    weather:  'mist',
    theme: {
      bgGrad:      ['#1a0e00', '#2d1a08', '#3d2510'],
      accent:      '#fb923c',
      path:        '#f97316',
      titleGrad:   ['#fed7aa', '#fb923c'],
      border:      '#ea580c',
      glow:        '#f9731640',
      ground:      '#2d1e0a',
      decorations: ['⛰️', '🦅', '🪨', '🗺️'],
    },
    nodes: [

      // ── Nodes 1–7: Easy ───────────────────────────────────────────────────
      {
        nodeId: 'hm_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Element Frequency', difficulty: 'Easy', slug: 'element-frequency',
          description:
            'Given an array of N integers, print each distinct element and its frequency in ascending key order.',
          examples: [{ input: '5\n3 1 3 2 1', output: '1 2\n2 1\n3 2' }],
          constraints: ['1 ≤ N ≤ 10⁵', '1 ≤ arr[i] ≤ 10⁶'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Contains Duplicate', difficulty: 'Easy', slug: 'contains-duplicate',
          description:
            'Given an array of integers, print YES if any value appears more than once, NO otherwise.',
          examples: [{ input: '4\n1 2 3 1', output: 'YES' }],
          constraints: ['1 ≤ N ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'Anagram Strings', difficulty: 'Easy', slug: 'anagram-strings',
          description:
            'Given two strings, print YES if they are anagrams of each other using a frequency map, NO otherwise.',
          examples: [{ input: 'listen\nsilent', output: 'YES' }],
          constraints: ['1 ≤ |S| ≤ 10⁵', 'Lowercase letters only'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Array Intersection', difficulty: 'Easy', slug: 'array-intersection',
          description:
            'Find all elements that appear in both arrays. Return them sorted in ascending order; each element appears as many times as it appears in both.',
          examples: [{ input: '4 5\n1 2 2 1\n2 2 3 4 5', output: '2 2' }],
          constraints: ['1 ≤ N, M ≤ 10⁴', '0 ≤ arr[i] ≤ 10⁶'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'First Unique Char', difficulty: 'Easy', slug: 'first-unique-char',
          description:
            'Find and print the 0-based index of the first non-repeating character in a string. Print -1 if none.',
          examples: [{ input: 'leetcode', output: '0' }],
          constraints: ['1 ≤ |S| ≤ 10⁵', 'Lowercase letters only'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Ransom Note', difficulty: 'Easy', slug: 'ransom-note',
          description:
            "Given a ransom note and a magazine string, print YES if the note can be built from the magazine's characters, NO otherwise.",
          examples: [{ input: 'aa\naab', output: 'YES' }],
          constraints: ['1 ≤ |note|, |magazine| ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'hm_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Isomorphic Strings', difficulty: 'Easy', slug: 'isomorphic-strings',
          description:
            'Given two strings S and T of equal length, determine if they are isomorphic (one-to-one character mapping). Print YES or NO.',
          examples: [{ input: 'egg\nadd', output: 'YES' }],
          constraints: ['1 ≤ |S| = |T| ≤ 5×10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 8: Mid-Boss ─────────────────────────────────────────────────
      {
        nodeId: 'hm_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Two Sum HashMap', difficulty: 'Medium', slug: 'two-sum-hashmap',
          description:
            'Given an unsorted array and target K, find two numbers that sum to K. Print their 1-indexed positions. Must run in O(N). Print -1 if no solution.',
          examples: [{ input: '4 9\n2 7 11 15', output: '1 2' }],
          constraints: ['2 ≤ N ≤ 10⁵', '−10⁹ ≤ K ≤ 10⁹'],
        },
        rewards:        { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Nodes 9–14: Medium ───────────────────────────────────────────────
      {
        nodeId: 'hm_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Longest Subarray Sum K', difficulty: 'Medium',
          slug: 'longest-subarray-k',
          description:
            'Find the length of the longest subarray whose elements sum to exactly K. Return 0 if none exists.',
          examples: [{ input: '6 3\n1 2 0 3 -1 4', output: '5' }],
          constraints: ['1 ≤ N ≤ 10⁵', '−10⁶ ≤ K ≤ 10⁶'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'hm_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'Group Anagrams', difficulty: 'Medium', slug: 'group-anagrams',
          description:
            'Given a list of words, group all anagrams together. Return each group as a sorted list. Order of groups does not matter.',
          examples: [{ input: '6\neat tea tan ate nat bat', output: 'ate eat tea\nbat\nnat tan' }],
          constraints: ['1 ≤ N ≤ 10⁴', '1 ≤ |word| ≤ 100'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'hm_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Subarray Sum Zero', difficulty: 'Medium', slug: 'subarray-sum-zero',
          description:
            'Count the total number of subarrays whose sum equals zero.',
          examples: [{ input: '5\n1 -1 2 -2 3', output: '2' }],
          constraints: ['1 ≤ N ≤ 10⁴', '−10⁴ ≤ arr[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'hm_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Top K Frequent', difficulty: 'Medium', slug: 'top-k-frequent',
          description:
            'Given an integer array and K, return the K most frequent elements sorted by frequency descending. Break ties by value ascending.',
          examples: [{ input: '6 2\n1 1 1 2 2 3', output: '1 2' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'hm_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Longest Harmonious Subsequence', difficulty: 'Medium',
          slug: 'longest-harmonious',
          description:
            'Find the length of the longest harmonious subsequence where max and min differ by exactly 1.',
          examples: [{ input: '8\n1 3 2 2 5 2 3 7', output: '5' }],
          constraints: ['1 ≤ N ≤ 2×10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'hm_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Word Pattern', difficulty: 'Medium', slug: 'word-pattern',
          description:
            'Given a pattern string and a sentence, print YES if the sentence follows the pattern (bijective word-to-character mapping), NO otherwise.',
          examples: [{ input: 'abba\ndog cat cat dog', output: 'YES' }],
          constraints: ['1 ≤ |pattern| ≤ 300', '1 ≤ words ≤ 300'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 15: Zone Boss ───────────────────────────────────────────────
      {
        nodeId: 'hm_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'Longest Consecutive Sequence', difficulty: 'Hard',
          slug: 'longest-consecutive',
          description:
            'Find the length of the longest consecutive sequence of integers. Must run in O(N); sorting is not allowed.',
          examples: [{ input: '6\n100 4 200 1 3 2', output: '4' }],
          constraints: ['0 ≤ N ≤ 10⁵', '−10⁹ ≤ arr[i] ≤ 10⁹'],
        },
        rewards:        { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
        lootPool: [
          { itemId: 'title_cartographer', itemType: 'title',  dropChance: 0.4  },
          { itemId: 'theme_cyberpunk',    itemType: 'theme',  dropChance: 0.2  },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 6 — Stack & Queue Quarry   (unlocks after hm_15)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'stack_queue_quarry',
    name:     'Stack & Queue Quarry',
    subtitle: 'From the Depths of the Forge',
    icon:     '⚒️',
    weather:  'sparks',
    theme: {
      bgGrad:      ['#160b00', '#2e1800', '#3d2200'],
      accent:      '#fbbf24',
      path:        '#f59e0b',
      titleGrad:   ['#fef08a', '#fbbf24'],
      border:      '#d97706',
      glow:        '#f59e0b40',
      ground:      '#2a1500',
      decorations: ['⚙️', '🔩', '⚒️', '💎'],
    },
    nodes: [

      // ── Nodes 1–7: Easy ───────────────────────────────────────────────────
      {
        nodeId: 'sq_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Implement Stack', difficulty: 'Easy', slug: 'implement-stack',
          description:
            'Implement a stack using an array supporting push, pop, and peek. Process Q operations and print the result of each peek/pop.',
          examples: [{ input: '3\npush 5\npush 3\npeek', output: '3' }],
          constraints: ['1 ≤ Q ≤ 10⁴', 'Values fit in 32-bit integer'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sq_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Valid Brackets Forge', difficulty: 'Easy', slug: 'valid-brackets-forge',
          description:
            'Given a string of brackets (, ), {, }, [, ], determine if it is valid. Print YES or NO.',
          examples: [{ input: '{[()]}', output: 'YES' }],
          constraints: ['1 ≤ |S| ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sq_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'Queue Using Stacks', difficulty: 'Easy', slug: 'queue-using-stacks',
          description:
            'Implement a queue using two stacks. Support enqueue, dequeue, and isEmpty. Process Q operations and output all dequeue results.',
          examples: [{ input: '4\nenqueue 1\nenqueue 2\ndequeue\ndequeue', output: '1\n2' }],
          constraints: ['1 ≤ Q ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sq_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Reverse a Queue', difficulty: 'Easy', slug: 'reverse-queue',
          description:
            'Given a queue of N integers, reverse its order using only a stack. Print the resulting queue front-to-back.',
          examples: [{ input: '4\n1 2 3 4', output: '4 3 2 1' }],
          constraints: ['1 ≤ N ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 100 },
      },
      {
        nodeId: 'sq_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'Circular Queue', difficulty: 'Easy', slug: 'circular-queue',
          description:
            'Simulate a circular queue of size K. Process N enqueue/dequeue operations. Print the front element after each, or "Empty" if the queue is empty.',
          examples: [{ input: '3 4\nenqueue 1\nenqueue 2\ndequeue\nenqueue 3', output: '1\n1\n2\n2' }],
          constraints: ['1 ≤ K ≤ 1000', '1 ≤ N ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
      },
      {
        nodeId: 'sq_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Postfix Evaluation', difficulty: 'Easy', slug: 'postfix-evaluation',
          description:
            'Evaluate a valid postfix (Reverse Polish Notation) expression with single-digit operands and operators +, −, *, /. Return the integer result.',
          examples: [{ input: '2 3 4 * +', output: '14' }],
          constraints: ['1 ≤ tokens ≤ 100', 'Result fits in 32-bit integer'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 250, threeStarTimeMs: 90 },
      },
      {
        nodeId: 'sq_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Min Stack', difficulty: 'Easy', slug: 'min-stack',
          description:
            'Implement a min-stack supporting push, pop, and getMin in O(1) time. Process Q operations and output the result of each getMin call.',
          examples: [{ input: '4\npush 5\npush 3\npush 7\ngetMin', output: '3' }],
          constraints: ['1 ≤ Q ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 10, twoStarKP: 20, threeStarKP: 35 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 8: Mid-Boss ─────────────────────────────────────────────────
      {
        nodeId: 'sq_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Next Greater Element', difficulty: 'Medium',
          slug: 'next-greater-element',
          description:
            'For each element in the array, find the next greater element to its right using a monotonic stack in O(N). Print -1 if none exists.',
          examples: [{ input: '4\n4 5 2 10', output: '5 10 10 -1' }],
          constraints: ['1 ≤ N ≤ 10⁵', '0 ≤ arr[i] ≤ 10⁹'],
        },
        rewards:        { oneStarKP: 30, twoStarKP: 50, threeStarKP: 80 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Nodes 9–14: Medium ───────────────────────────────────────────────
      {
        nodeId: 'sq_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Stock Span', difficulty: 'Medium', slug: 'stock-span',
          description:
            "Calculate the stock span for each day: the number of consecutive days up to today where the price was ≤ today's price.",
          examples: [{ input: '7\n100 80 60 70 60 75 85', output: '1 1 1 2 1 4 6' }],
          constraints: ['1 ≤ N ≤ 10⁵', '1 ≤ price[i] ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sq_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'Largest Rectangle in Histogram', difficulty: 'Medium',
          slug: 'largest-histogram-rect',
          description:
            'Find the area of the largest rectangle that can be formed within a histogram.',
          examples: [{ input: '6\n2 1 5 6 2 3', output: '10' }],
          constraints: ['1 ≤ N ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sq_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Trapping Water Stack', difficulty: 'Medium',
          slug: 'trapping-water-stack',
          description:
            'Calculate the total units of water trapped between elevation bars using a stack-based approach.',
          examples: [{ input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', output: '6' }],
          constraints: ['1 ≤ N ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sq_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Sliding Window Maximum', difficulty: 'Medium',
          slug: 'sliding-window-max-deque',
          description:
            'Find the maximum value in each sliding window of size K using a monotonic deque in O(N) total time.',
          examples: [{ input: '8 3\n1 3 -1 -3 5 3 6 7', output: '3 3 5 5 6 7' }],
          constraints: ['1 ≤ K ≤ N ≤ 10⁵'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sq_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Josephus Problem', difficulty: 'Medium', slug: 'josephus-problem',
          description:
            'N workers stand in a queue. Every Kth worker is removed. Simulate using a queue and return the 1-indexed position of the last remaining worker.',
          examples: [{ input: '7 3', output: '4' }],
          constraints: ['1 ≤ N ≤ 10⁴', '1 ≤ K ≤ N'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },
      {
        nodeId: 'sq_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Decode String', difficulty: 'Medium', slug: 'decode-string',
          description:
            'Decode an encoded string where K[s] means repeat s K times. E.g. "3[a2[c]]" → "accaccacc".',
          examples: [{ input: '3[a2[c]]', output: 'accaccacc' }],
          constraints: ['1 ≤ |S| ≤ 30', '1 ≤ K ≤ 300'],
        },
        rewards:        { oneStarKP: 15, twoStarKP: 25, threeStarKP: 45 },
        starThresholds: { twoStarTimeMs: 200, threeStarTimeMs: 80 },
      },

      // ── Node 15: Zone Boss ───────────────────────────────────────────────
      {
        nodeId: 'sq_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'LRU Cache', difficulty: 'Hard', slug: 'lru-cache',
          description:
            'Design an LRU (Least Recently Used) cache supporting get(key) and put(key, value) in O(1). Implement using a doubly linked list + HashMap.',
          examples: [
            {
              input:  '2\n4\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2',
              output: '1\n-1',
            },
          ],
          constraints: ['1 ≤ capacity ≤ 3000', '0 ≤ key, value ≤ 10⁴', '1 ≤ Q ≤ 2×10⁴'],
        },
        rewards:        { oneStarKP: 50, twoStarKP: 80, threeStarKP: 120 },
        starThresholds: { twoStarTimeMs: 300, threeStarTimeMs: 120 },
        lootPool: [
          { itemId: 'title_forgemaster', itemType: 'title',  dropChance: 0.4  },
          { itemId: 'border_neon',       itemType: 'border', dropChance: 0.25 },
        ],
      },
    ],
  },
];

// ── Merge helper ───────────────────────────────────────────────────────────────
// In campaignData.js add at the bottom:
//   import { BATCH_2_ZONES } from './campaignDataBatch2';
//   export const ALL_ZONES = [...ZONES, ...BATCH_2_ZONES];
//
// Then substitute ALL_ZONES for ZONES everywhere in the app.

// ── Lookup helpers (mirror campaignData.js) ───────────────────────────────────
export const getZoneById    = (id)     => BATCH_2_ZONES.find(z => z.id === id) ?? null;
export const getNodeById    = (nodeId) => BATCH_2_ZONES.flatMap(z => z.nodes).find(n => n.nodeId === nodeId) ?? null;
export const getZoneForNode = (nodeId) => BATCH_2_ZONES.find(z => z.nodes.some(n => n.nodeId === nodeId)) ?? null;
export const ALL_BATCH2_NODES = BATCH_2_ZONES.flatMap(z => z.nodes);

export default BATCH_2_ZONES;
// V 1.5
