// src/data/campaignDataBatch2.js
// ─────────────────────────────────────────────────────────────────────────────
// Batch 2: Zones 4, 5, 6  (45 nodes total)
// Zone 4 — Sliding Window Sanctum    (The Glass Valley)
// Zone 5 — HashMap Highlands         (The Cartographer's Peak)
// Zone 6 — Stack & Queue Quarry      (The Forge of Order)
//
// Scaling per zone: Nodes 1–7 = Easy, Node 8 = Mid-Boss (Medium),
//                   Nodes 9–14 = Medium, Node 15 = Zone Boss (Hard)
// ─────────────────────────────────────────────────────────────────────────────

export const BATCH_2_ZONES = [

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 4 — Sliding Window Sanctum  "The Glass Valley"
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'sliding_window_sanctum',
    name:     'Sliding Window Sanctum',
    subtitle: 'The Glass Valley Awaits',
    icon:     '🔭',
    weather:  'mist',
    theme: {
      bgGrad:     ['#060e1a', '#0a1a30', '#0e2445'],
      accent:     '#818cf8',
      path:       '#6366f1',
      titleGrad:  ['#c7d2fe', '#818cf8'],
      border:     '#4f46e5',
      glow:       '#6366f140',
      ground:     '#080f22',
      decorations:['🔭','🌀','💠','✦'],
    },
    nodes: [
      {
        id: 'zone4-node1', title: 'The Portcullis Sum', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'The castle gate opens only when the sum of K consecutive stones equals a target. Given an array of N integers and a window size K, find the maximum sum of any K consecutive elements. The Glass Valley\'s first test of focus.',
      },
      {
        id: 'zone4-node2', title: 'Average of the Panes', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'The sanctum\'s stained glass panels display the average luminescence of every K-width segment. Given an array of brightness values and K, return an array of all K-window averages rounded to 2 decimal places.',
      },
      {
        id: 'zone4-node3', title: 'The Consistent Corridor', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'A corridor in the sanctum is considered "stable" if all elements within a window of size K are identical. Count the number of stable windows in the given array of N integers.',
      },
      {
        id: 'zone4-node4', title: 'The Treasure Streak', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'A relic hunter claims the longest unbroken chain of positive integers in a sequence is the true treasure. Find the length of the longest contiguous subarray where all elements are positive.',
      },
      {
        id: 'zone4-node5', title: 'The Minimum Pane', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'For each window of size K sliding across the Glass Valley\'s sensor grid, the Elder records only the minimum value. Given an integer array and K, output the minimum of each sliding window of size K.',
      },
      {
        id: 'zone4-node6', title: 'The Fixed-Width Oracle', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'The Oracle speaks only in fixed-width revelations. Given a binary array and window size K, count how many windows of size K contain exactly M ones. Return the total count.',
      },
      {
        id: 'zone4-node7', title: 'The Count of Blessings', difficulty: 'Easy',
        isBoss: false, topic: 'Sliding Window',
        description: 'A blessing is bestowed upon a window of size K only if its sum is greater than or equal to a sacred threshold T. Count the number of windows of size K in the array that are "blessed".',
      },
      {
        id: 'zone4-node8', title: 'The Glass Vault Guardian', difficulty: 'Medium',
        isBoss: true, topic: 'Sliding Window',
        description: 'The Mid-Boss of the Glass Valley: find the smallest contiguous subarray whose sum is ≥ S. The Guardian warps the valley — the window shrinks and grows dynamically. Return the minimum length, or 0 if none exists. Time complexity must be O(N).',
      },
      {
        id: 'zone4-node9', title: 'The Distinct Prism', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'Each prism in the sanctum displays exactly K distinct colours. Find the number of subarrays of length K that contain exactly K distinct characters. A challenge for the keen-eyed wanderer.',
      },
      {
        id: 'zone4-node10', title: 'The Long Mirage', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'In the Glass Valley\'s desert flank, a mirage stretches as far as it can without repeating the same symbol twice. Find the length of the longest substring without any repeating characters.',
      },
      {
        id: 'zone4-node11', title: 'The Permutation Lens', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'A lens reveals hidden patterns — specifically, whether any permutation of a pattern string P exists as a substring of string S. Return YES if found, NO otherwise. Your window must equal |P| in size.',
      },
      {
        id: 'zone4-node12', title: 'The Replacement Ritual', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'The sanctum\'s scribes can replace at most K characters in a string. Find the length of the longest substring containing only one distinct character that can be achieved after at most K replacements.',
      },
      {
        id: 'zone4-node13', title: 'The Fruit Picker\'s Path', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'A picker carries exactly 2 baskets — each basket holds only one fruit type. Walking along a row of fruit trees (represented as characters), find the longest contiguous segment containing at most 2 distinct fruit types.',
      },
      {
        id: 'zone4-node14', title: 'The Flip of the Lens', difficulty: 'Medium',
        isBoss: false, topic: 'Sliding Window',
        description: 'Given a binary array and integer K, you may flip at most K zeros to ones. Find the maximum number of consecutive ones achievable in the resulting array. The valley\'s penultimate trial.',
      },
      {
        id: 'zone4-node15', title: 'The Sanctum Sentinel', difficulty: 'Hard',
        isBoss: true, topic: 'Sliding Window',
        description: 'The Sanctum\'s supreme boss: find the minimum window substring of S that contains all characters of T (including duplicates). The Sentinel shifts forms — only the most optimal sliding approach survives. Return "" if impossible.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 5 — HashMap Highlands  "The Cartographer's Peak"
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'hashmap_highlands',
    name:     'HashMap Highlands',
    subtitle: 'Map the Unmappable',
    icon:     '🗺️',
    weather:  'mist',
    theme: {
      bgGrad:     ['#1a0e00', '#2d1a08', '#3d2510'],
      accent:     '#fb923c',
      path:       '#f97316',
      titleGrad:  ['#fed7aa', '#fb923c'],
      border:     '#ea580c',
      glow:       '#f9731640',
      ground:     '#2d1e0a',
      decorations:['⛰️','🦅','🪨','🗺️'],
    },
    nodes: [
      {
        id: 'zone5-node1', title: 'The Frequency Census', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'The Cartographer\'s first task: survey the highlands and count how often each element appears. Given an array of N integers, return a map of each element to its frequency of occurrence, printed in ascending key order.',
      },
      {
        id: 'zone5-node2', title: 'The Duplicate Beacon', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'Beacon fires across the peaks signal duplicate sightings. Given an array of integers, determine if any value appears more than once. Print YES if a duplicate exists, NO otherwise.',
      },
      {
        id: 'zone5-node3', title: 'The Anagram Codex', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'Scrolls in the Cartographer\'s archive are considered twins if they contain identical letter frequencies. Given two strings, print YES if they are anagrams of each other, NO otherwise. Use a frequency map.',
      },
      {
        id: 'zone5-node4', title: 'The Intersection Rift', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'Two rival guilds claim the same mountain pass. Find all elements that appear in both arrays (intersection). Return them sorted in ascending order, with each element appearing as many times as it appears in both.',
      },
      {
        id: 'zone5-node5', title: 'The First Unique Scout', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'Among all scouts dispatched to the peak, the Cartographer trusts only the first one with no duplicate report. Find and print the index (0-based) of the first non-repeating character in a string. Print -1 if none.',
      },
      {
        id: 'zone5-node6', title: 'The Ransom Map', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'A ransom note can be constructed only if all its letters can be sourced from a magazine. Given two strings (note and magazine), print YES if the note can be built from the magazine\'s characters, NO otherwise.',
      },
      {
        id: 'zone5-node7', title: 'The Ruin of Isomorphs', difficulty: 'Easy',
        isBoss: false, topic: 'HashMap',
        description: 'Two ancient ruins are said to be isomorphic if their glyph patterns map perfectly onto each other. Given two strings S and T, determine if they are isomorphic (one-to-one character mapping). Print YES or NO.',
      },
      {
        id: 'zone5-node8', title: 'The Summit Siege', difficulty: 'Medium',
        isBoss: true, topic: 'HashMap',
        description: 'The Mid-Boss of the Highlands: given an unsorted array of integers and a target K, find two numbers that add up to K and return their indices (1-indexed). The Siege demands O(N) time — a brute-force assault will fail. Print -1 if no solution exists.',
      },
      {
        id: 'zone5-node9', title: 'The Contiguous Ridgeline', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'A ridgeline of balance: find the length of the longest subarray whose elements sum to exactly K. Using a prefix-sum map is the highland-approved technique. Return 0 if no such subarray exists.',
      },
      {
        id: 'zone5-node10', title: 'The Group Expedition', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'The Cartographer groups explorers who share the same letter-set. Given a list of words, group all anagrams together and return each group as a sorted list of words. The order of groups does not matter.',
      },
      {
        id: 'zone5-node11', title: 'The Subarray Zero Rift', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'A subarray is said to "balance" if its sum equals zero — a mythical equilibrium in the highlands. Count the total number of such balanced subarrays in the given integer array.',
      },
      {
        id: 'zone5-node12', title: 'The Frequency Peak', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'The K highest-frequency lookouts are the most valuable to the Cartographer. Given an integer array and K, return the K most frequent elements sorted by frequency descending. Break ties by value ascending.',
      },
      {
        id: 'zone5-node13', title: 'The Longest Harmonic Trail', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'A trail is "harmonious" if it contains both the minimum and maximum values differing by at most 1. Find the length of the longest harmonious subsequence in the array where the max and min differ by exactly 1.',
      },
      {
        id: 'zone5-node14', title: 'The Pattern Patrol', difficulty: 'Medium',
        isBoss: false, topic: 'HashMap',
        description: 'A patrol pattern is valid if each word in a sentence maps uniquely to a letter in a pattern string, and vice versa. Given a pattern string and a sentence, print YES if the sentence follows the pattern, NO otherwise.',
      },
      {
        id: 'zone5-node15', title: 'The Cartographer King', difficulty: 'Hard',
        isBoss: true, topic: 'HashMap',
        description: 'The final reckoning on the peak: given an integer array, find the length of the longest consecutive sequence of integers (e.g., [100,4,200,1,3,2] → 4 from 1,2,3,4). The King demands O(N) time — sorting is forbidden by highland law.',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZONE 6 — Stack & Queue Quarry  "The Forge of Order"
  // ══════════════════════════════════════════════════════════════════════════
  {
    id:       'stack_queue_quarry',
    name:     'Stack & Queue Quarry',
    subtitle: 'From the Depths of the Forge',
    icon:     '⚒️',
    weather:  'sparks',
    theme: {
      bgGrad:     ['#160b00', '#2e1800', '#3d2200'],
      accent:     '#fbbf24',
      path:       '#f59e0b',
      titleGrad:  ['#fef08a', '#fbbf24'],
      border:     '#d97706',
      glow:       '#f59e0b40',
      ground:     '#2a1500',
      decorations:['⚙️','🔩','⚒️','💎'],
    },
    nodes: [
      {
        id: 'zone6-node1', title: 'The Forge\'s First Stack', difficulty: 'Easy',
        isBoss: false, topic: 'Stack',
        description: 'The Forge Keeper\'s first lesson: a stack of ingots follows Last-In-First-Out order. Implement a stack supporting push, pop, and peek using only an array. Process Q operations and print the result of each peek/pop.',
      },
      {
        id: 'zone6-node2', title: 'The Balanced Brackets of the Forge', difficulty: 'Easy',
        isBoss: false, topic: 'Stack',
        description: 'Every forge structure must have its brackets perfectly balanced — mismatched brackets collapse the entire assembly. Given a string of brackets (, ), {, }, [, ], determine if it is valid. Print YES or NO.',
      },
      {
        id: 'zone6-node3', title: 'The Ore Queue', difficulty: 'Easy',
        isBoss: false, topic: 'Queue',
        description: 'Ore arrives at the quarry gate and is processed in First-In-First-Out order. Implement a queue using two stacks. Support enqueue, dequeue, and isEmpty operations. Process Q operations and output all dequeue results.',
      },
      {
        id: 'zone6-node4', title: 'The Reversal Crucible', difficulty: 'Easy',
        isBoss: false, topic: 'Stack',
        description: 'A crucible in the forge reverses the order of all elements poured into it. Given a queue of N integers, reverse its order using only a stack. Print the resulting queue in order.',
      },
      {
        id: 'zone6-node5', title: 'The Cooling Conveyor', difficulty: 'Easy',
        isBoss: false, topic: 'Queue',
        description: 'Hot ingots cool on a circular conveyor belt. Simulate a circular queue of size K: process N enqueue and dequeue operations. Print the front element after each operation, or "Empty" if the queue is empty.',
      },
      {
        id: 'zone6-node6', title: 'The Postfix Rune', difficulty: 'Easy',
        isBoss: false, topic: 'Stack',
        description: 'Ancient Forge runes are written in postfix (Reverse Polish) notation. Evaluate a valid postfix expression string containing single-digit operands and operators (+, -, *, /). Return the integer result.',
      },
      {
        id: 'zone6-node7', title: 'The Minimum Anvil', difficulty: 'Easy',
        isBoss: false, topic: 'Stack',
        description: 'The Forge Keeper needs instant access to the lightest ingot at any moment. Implement a min-stack that supports push, pop, and getMin in O(1) time. Process Q operations and output the result of each getMin call.',
      },
      {
        id: 'zone6-node8', title: 'The Forge Sentinel', difficulty: 'Medium',
        isBoss: true, topic: 'Stack',
        description: 'The Mid-Boss of the Forge: for each element in the array, find the Next Greater Element to its right. The Sentinel blocks all O(N²) approaches — only a monotonic stack breaks through in O(N). Print -1 if no greater element exists.',
      },
      {
        id: 'zone6-node9', title: 'The Span of the Hammer', difficulty: 'Medium',
        isBoss: false, topic: 'Stack',
        description: 'The stock price span is the number of consecutive days leading up to today where the price was ≤ today\'s price. Given N daily stock prices, calculate the stock span for each day using a monotonic stack.',
      },
      {
        id: 'zone6-node10', title: 'The Lava Histogram', difficulty: 'Medium',
        isBoss: false, topic: 'Stack',
        description: 'Molten rock has pooled into a histogram of bars. Find the area of the largest rectangle that can be formed within the histogram. The Forge\'s hottest puzzle — a monotonic stack is the only tool that survives.',
      },
      {
        id: 'zone6-node11', title: 'The Trapped Coolant', difficulty: 'Medium',
        isBoss: false, topic: 'Stack',
        description: 'Water pools between the forge\'s cooling bars. Given an elevation map array, calculate the total units of water that can be trapped between the bars after rainfall. A classic quarry challenge reforged.',
      },
      {
        id: 'zone6-node12', title: 'The Deque of Flames', difficulty: 'Medium',
        isBoss: false, topic: 'Queue',
        description: 'A deque (double-ended queue) governs the flame intensity across K-wide windows of the forge. Find the maximum value in each sliding window of size K using a monotonic deque in O(N) total time.',
      },
      {
        id: 'zone6-node13', title: 'The Ore Processor\'s Rotation', difficulty: 'Medium',
        isBoss: false, topic: 'Queue',
        description: 'N workers stand in a queue. Every Kth worker is removed (Josephus problem). Simulate the process using a queue and return the position (1-indexed) of the last remaining worker.',
      },
      {
        id: 'zone6-node14', title: 'The Bracket Decoder', difficulty: 'Medium',
        isBoss: false, topic: 'Stack',
        description: 'Encoded blueprints follow the rule: K[encodedString] means repeat encodedString K times. Decode a given encoded string using a stack. For example, "3[a2[c]]" decodes to "accaccacc".',
      },
      {
        id: 'zone6-node15', title: 'The Grand Forge Master', difficulty: 'Hard',
        isBoss: true, topic: 'Stack',
        description: 'The ultimate reckoning: design an LRU (Least Recently Used) cache supporting get(key) and put(key, value) in O(1) time. The Grand Forge Master discards the least-used ingot when capacity is reached. Implement using a doubly linked list + HashMap.',
      },
    ],
  },
];

// ── Merge helper: append batch 2 zones to the main ZONES array ────────────────
// In your campaignData.js, add at the bottom:
//
// import { BATCH_2_ZONES } from './campaignDataBatch2';
// export const ALL_ZONES = [...ZONES, ...BATCH_2_ZONES];
//
// Then use ALL_ZONES wherever you previously used ZONES.

export default BATCH_2_ZONES;
// V 1.5

// Version-2.0