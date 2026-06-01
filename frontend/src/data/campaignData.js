// src/data/campaignData.js
// Real playable campaign data: 3 zones × 15 nodes = 45 challenge nodes.
// Node 8  = Mid-Boss  (Medium difficulty, harder hidden tests)
// Node 15 = Zone Boss (Hard difficulty, drops loot, unlocks next zone)
// ─────────────────────────────────────────────────────────────────────────────

export const ZONES = [
  // ══════════════════════════════════════════════════════
  // ZONE 1 — Array Archipelago
  // ══════════════════════════════════════════════════════
  {
    id:       'array_archipelago',
    name:     'Array Archipelago',
    subtitle: 'Where Every Journey Begins',
    icon:     '🏝️',
    weather:  'fireflies',
    theme: {
      bgGrad:     ['#041c28', '#062e40', '#083a50'],
      accent:     '#22d3ee',
      path:       '#06b6d4',
      titleGrad:  ['#a5f3fc', '#22d3ee'],
      border:     '#0891b2',
      glow:       '#06b6d430',
      ground:     '#052030',
      decorations:['🌴','🦋','🌺','🐚'],
    },
    nodes: [
      // ── Nodes 1-7: Easy ─────────────────────────────
      {
        nodeId: 'aa_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Sum of Array', difficulty: 'Easy', slug: 'sum-of-array',
          description: 'Given an array of N integers, find and print the sum of all elements.',
          examples: [{ input:'5\n1 2 3 4 5', output:'15' }],
          constraints:['1 ≤ N ≤ 10⁵','0 ≤ arr[i] ≤ 10⁴'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'aa_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Find Maximum', difficulty: 'Easy', slug: 'find-maximum',
          description: 'Given an array, find and print the maximum element.',
          examples: [{ input:'5\n3 1 4 1 5', output:'5' }],
          constraints:['1 ≤ N ≤ 10⁵','−10⁴ ≤ arr[i] ≤ 10⁴'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'aa_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'Reverse Array', difficulty: 'Easy', slug: 'reverse-array',
          description: 'Print the given array in reverse order.',
          examples: [{ input:'4\n1 2 3 4', output:'4 3 2 1' }],
          constraints:['1 ≤ N ≤ 10⁵'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'aa_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Count Even & Odd', difficulty: 'Easy', slug: 'count-even-odd',
          description: 'Print the count of even and odd numbers in the array.',
          examples: [{ input:'5\n1 2 3 4 5', output:'2 3' }],
          constraints:['1 ≤ N ≤ 10⁵'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'aa_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'Left Rotation', difficulty: 'Easy', slug: 'array-left-rotation',
          description: 'Left rotate the array by K positions and print the result.',
          examples: [{ input:'5 2\n1 2 3 4 5', output:'3 4 5 1 2' }],
          constraints:['1 ≤ N ≤ 10⁵','0 ≤ K < N'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:250, threeStarTimeMs:90 },
      },
      {
        nodeId: 'aa_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Zigzag Array', difficulty: 'Easy', slug: 'zigzag-array',
          description: 'Rearrange the array so elements alternate: small, large, small, large.',
          examples: [{ input:'5\n4 3 7 8 6', output:'3 7 4 8 6' }],
          constraints:['1 ≤ N ≤ 10⁵','All elements distinct'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:250, threeStarTimeMs:90 },
      },
      {
        nodeId: 'aa_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Missing Number', difficulty: 'Easy', slug: 'missing-number',
          description: 'Given N-1 distinct integers in range [1,N], find the missing one.',
          examples: [{ input:'5\n1 2 4 5', output:'3' }],
          constraints:['2 ≤ N ≤ 10⁵'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // ── Node 8: MID-BOSS ─────────────────────────────
      {
        nodeId: 'aa_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Max Subarray Sum', difficulty: 'Medium', slug: 'max-subarray-sum',
          description: 'Find the maximum sum of any contiguous subarray (Kadane\'s Algorithm).',
          examples: [{ input:'9\n-2 1 -3 4 -1 2 1 -5 4', output:'6' }],
          constraints:['1 ≤ N ≤ 10⁵','−10⁴ ≤ arr[i] ≤ 10⁴'],
        },
        rewards: { oneStarKP:30, twoStarKP:50, threeStarKP:80 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // ── Nodes 9-14: Medium ───────────────────────────
      {
        nodeId: 'aa_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Count Pairs', difficulty: 'Medium', slug: 'count-pairs-sum',
          description: 'Count pairs (i,j) where i<j and arr[i]+arr[j]=K.',
          examples: [{ input:'5 6\n1 2 3 4 5', output:'2' }],
          constraints:['1 ≤ N ≤ 10⁴','−10⁴ ≤ K ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'aa_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'Majority Element', difficulty: 'Medium', slug: 'majority-element',
          description: 'Find element appearing more than N/2 times. Guarantee it exists.',
          examples: [{ input:'7\n2 2 1 1 1 2 2', output:'2' }],
          constraints:['1 ≤ N ≤ 10⁵'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'aa_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Merge Sorted Arrays', difficulty: 'Medium', slug: 'merge-sorted',
          description: 'Merge two sorted arrays into one sorted array.',
          examples: [{ input:'3 3\n1 3 5\n2 4 6', output:'1 2 3 4 5 6' }],
          constraints:['1 ≤ N,M ≤ 10⁵'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'aa_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Diagonal Sum', difficulty: 'Medium', slug: 'matrix-diagonal-sum',
          description: 'Sum of both diagonals of an N×N matrix (center counted once).',
          examples: [{ input:'3\n1 2 3\n4 5 6\n7 8 9', output:'25' }],
          constraints:['1 ≤ N ≤ 100'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'aa_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Trapping Rain Water', difficulty: 'Medium', slug: 'trapping-rain',
          description: 'Calculate total water trapped between elevation bars.',
          examples: [{ input:'6\n0 1 0 2 1 0', output:'3' }],
          constraints:['1 ≤ N ≤ 10⁵','0 ≤ height[i] ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'aa_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Next Permutation', difficulty: 'Medium', slug: 'next-permutation',
          description: 'Rearrange array to the lexicographically next permutation in-place.',
          examples: [{ input:'3\n1 2 3', output:'1 3 2' }],
          constraints:['1 ≤ N ≤ 100'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // ── Node 15: ZONE BOSS ───────────────────────────
      {
        nodeId: 'aa_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'Array King', difficulty: 'Hard', slug: 'array-king',
          description: 'Given N × M grid, find the minimum path sum from top-left to bottom-right moving only right or down.',
          examples: [{ input:'3 3\n1 3 1\n1 5 1\n4 2 1', output:'7' }],
          constraints:['1 ≤ N,M ≤ 200','0 ≤ grid[i][j] ≤ 100'],
        },
        rewards: { oneStarKP:50, twoStarKP:80, threeStarKP:120 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:120 },
        lootPool:[{ itemId:'title_arrayking', itemType:'title', dropChance:0.4 },{ itemId:'border_gold', itemType:'border', dropChance:0.25 }],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ZONE 2 — String Shores
  // ══════════════════════════════════════════════════════
  {
    id:       'string_shores',
    name:     'String Shores',
    subtitle: 'Walk the Shore of Words',
    icon:     '🌊',
    weather:  'waves',
    theme: {
      bgGrad:     ['#060d2a', '#0e1f50', '#122870'],
      accent:     '#60a5fa',
      path:       '#3b82f6',
      titleGrad:  ['#bfdbfe', '#60a5fa'],
      border:     '#2563eb',
      glow:       '#3b82f640',
      ground:     '#0c1a42',
      decorations:['🐚','⚓','🦀','🐠'],
    },
    nodes: [
      {
        nodeId: 'ss_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Reverse String', difficulty: 'Easy', slug: 'reverse-string',
          description: 'Print the reverse of the given string.',
          examples: [{ input:'hello', output:'olleh' }],
          constraints:['1 ≤ |S| ≤ 10⁵'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Palindrome Check', difficulty: 'Easy', slug: 'palindrome-string',
          description: 'Print YES if the string is a palindrome, NO otherwise.',
          examples: [{ input:'racecar', output:'YES' }],
          constraints:['1 ≤ |S| ≤ 10⁵'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'Pangram Check', difficulty: 'Easy', slug: 'pangram-check',
          description: 'Print YES if the sentence contains every letter of the alphabet.',
          examples: [{ input:'The quick brown fox jumps over the lazy dog', output:'YES' }],
          constraints:['1 ≤ |S| ≤ 1000'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Caesar Cipher', difficulty: 'Easy', slug: 'caesar-cipher',
          description: 'Encrypt a message by shifting each letter by K positions.',
          examples: [{ input:'3\nHello', output:'Khoor' }],
          constraints:['0 ≤ K ≤ 25','1 ≤ |S| ≤ 500'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'Anagram Check', difficulty: 'Easy', slug: 'anagram-check',
          description: 'Print YES if two strings are anagrams of each other.',
          examples: [{ input:'listen\nsilent', output:'YES' }],
          constraints:['1 ≤ |S| ≤ 500'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Run-Length Encoding', difficulty: 'Easy', slug: 'run-length-encoding',
          description: 'Compress a string using run-length encoding (e.g., "aaabbbcc" → "3a3b2c").',
          examples: [{ input:'aaabbbcc', output:'3a3b2c' }],
          constraints:['1 ≤ |S| ≤ 1000'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'ss_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Most Frequent Char', difficulty: 'Easy', slug: 'most-frequent-char',
          description: 'Find the character that appears most frequently. Break ties alphabetically.',
          examples: [{ input:'aabbbcc', output:'b' }],
          constraints:['1 ≤ |S| ≤ 1000','Lowercase only'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // Node 8: MID-BOSS
      {
        nodeId: 'ss_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Longest Unique Substring', difficulty: 'Medium', slug: 'longest-unique-substring',
          description: 'Find the length of the longest substring without repeating characters.',
          examples: [{ input:'abcabcbb', output:'3' }],
          constraints:['0 ≤ |S| ≤ 5×10⁴'],
        },
        rewards: { oneStarKP:30, twoStarKP:50, threeStarKP:80 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Valid Brackets', difficulty: 'Medium', slug: 'valid-brackets',
          description: 'Check if a string of brackets is valid (properly nested and closed).',
          examples: [{ input:'{[()]}', output:'YES' }],
          constraints:['1 ≤ |S| ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'String Compression', difficulty: 'Medium', slug: 'string-compression',
          description: 'Implement basic string compression. If compressed is not smaller, return original.',
          examples: [{ input:'aabcccccaaa', output:'a2b1c5a3' }],
          constraints:['1 ≤ |S| ≤ 1000'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Rotate String', difficulty: 'Medium', slug: 'rotate-string',
          description: 'Given S and goal, can S become goal after some rotations? YES or NO.',
          examples: [{ input:'abcde\ncdeab', output:'YES' }],
          constraints:['1 ≤ |S| ≤ 100'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Count & Say', difficulty: 'Medium', slug: 'count-and-say',
          description: 'Generate the Nth term of the Count and Say sequence.',
          examples: [{ input:'5', output:'111221' }],
          constraints:['1 ≤ N ≤ 30'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Wildcard Match', difficulty: 'Medium', slug: 'wildcard-match',
          description: 'Match pattern with string using \'?\' (any single char) and \'*\' (any sequence).',
          examples: [{ input:'ba\nb*', output:'YES' }],
          constraints:['0 ≤ |S|,|P| ≤ 2000'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'ss_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Decode Ways', difficulty: 'Medium', slug: 'decode-ways',
          description: 'Count ways to decode a digit string into letters (A=1…Z=26).',
          examples: [{ input:'226', output:'3' }],
          constraints:['1 ≤ |S| ≤ 100','S contains only digits'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // Node 15: ZONE BOSS
      {
        nodeId: 'ss_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'Minimum Edit Distance', difficulty: 'Hard', slug: 'edit-distance',
          description: 'Find the minimum number of insert, delete, or replace operations to convert word1 to word2.',
          examples: [{ input:'horse\nros', output:'3' }],
          constraints:['0 ≤ |word1|,|word2| ≤ 500'],
        },
        rewards: { oneStarKP:50, twoStarKP:80, threeStarKP:120 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:120 },
        lootPool:[{ itemId:'title_stringlord', itemType:'title', dropChance:0.4 },{ itemId:'border_neon', itemType:'border', dropChance:0.25 }],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // ZONE 3 — Loop Lagoon
  // ══════════════════════════════════════════════════════
  {
    id:       'loop_lagoon',
    name:     'Loop Lagoon',
    subtitle: 'Where Patterns Repeat',
    icon:     '🌿',
    weather:  'fireflies',
    theme: {
      bgGrad:     ['#021408', '#042018', '#063020'],
      accent:     '#4ade80',
      path:       '#22c55e',
      titleGrad:  ['#bbf7d0', '#4ade80'],
      border:     '#16a34a',
      glow:       '#22c55e40',
      ground:     '#041a0c',
      decorations:['🐸','🌱','🍃','🦎'],
    },
    nodes: [
      {
        nodeId: 'll_01', nodeNum: 1, nodeType: 'standard',
        problem: {
          title: 'Fibonacci Sequence', difficulty: 'Easy', slug: 'fibonacci-sequence',
          description: 'Print the first N Fibonacci numbers separated by spaces.',
          examples: [{ input:'7', output:'0 1 1 2 3 5 8' }],
          constraints:['1 ≤ N ≤ 50'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_02', nodeNum: 2, nodeType: 'standard',
        problem: {
          title: 'Prime Sieve', difficulty: 'Easy', slug: 'prime-sieve',
          description: 'Print all prime numbers up to N using the Sieve of Eratosthenes.',
          examples: [{ input:'20', output:'2 3 5 7 11 13 17 19' }],
          constraints:['2 ≤ N ≤ 10⁶'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_03', nodeNum: 3, nodeType: 'standard',
        problem: {
          title: 'GCD & LCM', difficulty: 'Easy', slug: 'gcd-lcm',
          description: 'Given two integers A and B, print their GCD and LCM.',
          examples: [{ input:'12 8', output:'4 24' }],
          constraints:['1 ≤ A,B ≤ 10⁹'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_04', nodeNum: 4, nodeType: 'standard',
        problem: {
          title: 'Power Function', difficulty: 'Easy', slug: 'fast-power',
          description: 'Compute A^B mod (10⁹+7) efficiently.',
          examples: [{ input:'2 10', output:'1024' }],
          constraints:['0 ≤ A,B ≤ 10¹⁸'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_05', nodeNum: 5, nodeType: 'standard',
        problem: {
          title: 'Pascal\'s Triangle', difficulty: 'Easy', slug: 'pascals-triangle',
          description: 'Print the first N rows of Pascal\'s Triangle.',
          examples: [{ input:'4', output:'1\n1 1\n1 2 1\n1 3 3 1' }],
          constraints:['1 ≤ N ≤ 30'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_06', nodeNum: 6, nodeType: 'standard',
        problem: {
          title: 'Digit Sum Recursion', difficulty: 'Easy', slug: 'digital-root',
          description: 'Find the digital root: repeatedly sum digits until a single digit remains.',
          examples: [{ input:'493', output:'7' }],
          constraints:['0 ≤ N ≤ 10⁹'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:100 },
      },
      {
        nodeId: 'll_07', nodeNum: 7, nodeType: 'standard',
        problem: {
          title: 'Number Patterns', difficulty: 'Easy', slug: 'number-patterns',
          description: 'Print a staircase pattern of N rows using right-aligned # symbols.',
          examples: [{ input:'4', output:'   #\n  ##\n ###\n####' }],
          constraints:['1 ≤ N ≤ 100'],
        },
        rewards: { oneStarKP:10, twoStarKP:20, threeStarKP:35 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // Node 8: MID-BOSS
      {
        nodeId: 'll_08', nodeNum: 8, nodeType: 'boss', bossType: 'mid',
        problem: {
          title: 'Collatz Conjecture', difficulty: 'Medium', slug: 'collatz',
          description: 'For N, apply: if even divide by 2, if odd multiply by 3 and add 1. Count steps until reaching 1.',
          examples: [{ input:'6', output:'8' }],
          constraints:['1 ≤ N ≤ 10⁶'],
        },
        rewards: { oneStarKP:30, twoStarKP:50, threeStarKP:80 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_09', nodeNum: 9, nodeType: 'standard',
        problem: {
          title: 'Binary Search', difficulty: 'Medium', slug: 'binary-search',
          description: 'Find the index of target K in sorted array. Print -1 if not found.',
          examples: [{ input:'5 3\n1 2 3 4 5', output:'2' }],
          constraints:['1 ≤ N ≤ 10⁵'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_10', nodeNum: 10, nodeType: 'standard',
        problem: {
          title: 'Bubble Sort', difficulty: 'Medium', slug: 'bubble-sort',
          description: 'Sort the array using bubble sort and count total swaps made.',
          examples: [{ input:'4\n4 3 2 1', output:'1 2 3 4\n6' }],
          constraints:['1 ≤ N ≤ 1000'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_11', nodeNum: 11, nodeType: 'standard',
        problem: {
          title: 'Two Sum', difficulty: 'Medium', slug: 'two-sum-indices',
          description: 'Return indices (1-indexed) of two numbers that sum to target.',
          examples: [{ input:'4 9\n2 7 11 15', output:'1 2' }],
          constraints:['2 ≤ N ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_12', nodeNum: 12, nodeType: 'standard',
        problem: {
          title: 'Detect Loop', difficulty: 'Medium', slug: 'detect-loop',
          description: 'Given a linked list represented as an array with a cycle at position P (-1 if none), detect and print the cycle start index.',
          examples: [{ input:'5 2\n1 2 3 4 5', output:'2' }],
          constraints:['1 ≤ N ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_13', nodeNum: 13, nodeType: 'standard',
        problem: {
          title: 'Flood Fill', difficulty: 'Medium', slug: 'flood-fill',
          description: 'Perform a flood fill on an image starting at (sr,sc) with newColor.',
          examples: [{ input:'3 3 1 1 2\n1 1 1\n1 1 0\n1 0 1', output:'2 2 2\n2 2 0\n2 0 1' }],
          constraints:['1 ≤ N,M ≤ 50'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      {
        nodeId: 'll_14', nodeNum: 14, nodeType: 'standard',
        problem: {
          title: 'Jump Game', difficulty: 'Medium', slug: 'jump-game',
          description: 'Given array of max jump lengths, determine if you can reach the last index. YES or NO.',
          examples: [{ input:'5\n2 3 1 1 4', output:'YES' }],
          constraints:['1 ≤ N ≤ 10⁴'],
        },
        rewards: { oneStarKP:15, twoStarKP:25, threeStarKP:45 },
        starThresholds: { twoStarTimeMs:200, threeStarTimeMs:80 },
      },
      // Node 15: ZONE BOSS
      {
        nodeId: 'll_15', nodeNum: 15, nodeType: 'boss', bossType: 'main',
        problem: {
          title: 'The Loop Lord', difficulty: 'Hard', slug: 'loop-lord',
          description: 'Find the number of distinct paths from top-left to bottom-right of an N×M grid (only moving right or down). Output result mod 10⁹+7.',
          examples: [{ input:'3 7', output:'28' }],
          constraints:['1 ≤ N,M ≤ 100'],
        },
        rewards: { oneStarKP:50, twoStarKP:80, threeStarKP:120 },
        starThresholds: { twoStarTimeMs:300, threeStarTimeMs:120 },
        lootPool:[{ itemId:'title_looplord', itemType:'title', dropChance:0.4 },{ itemId:'theme_matrix', itemType:'theme', dropChance:0.2 }],
      },
    ],
  },
];

// Lookup helpers
export const getZoneById    = (id) => ZONES.find(z => z.id === id) ?? null;
export const getNodeById    = (nodeId) => ZONES.flatMap(z => z.nodes).find(n => n.nodeId === nodeId) ?? null;
export const getZoneForNode = (nodeId) => ZONES.find(z => z.nodes.some(n => n.nodeId === nodeId)) ?? null;
export const ALL_NODES      = ZONES.flatMap(z => z.nodes);
// V 1.5

// Version-2.0