// FILE: backend/config/badgesCatalog.js
// Centralized, source-of-truth catalog for the 60 achievement badges.

export const BADGE_TYPES = {
    TIME_BASED_WIN: 'TIME_BASED_WIN',
    TIME_BASED_SOLVE: 'TIME_BASED_SOLVE',
    COUNT_TOTAL_MATCHES: 'COUNT_TOTAL_MATCHES',
    COUNT_TOTAL_WINS: 'COUNT_TOTAL_WINS',
    COUNT_TAG: 'COUNT_TAG',
    WIN_STREAK: 'WIN_STREAK',
    ACTIVITY_STREAK: 'ACTIVITY_STREAK',
    ELO_THRESHOLD: 'ELO_THRESHOLD',
    MATCH_FINISH_CONDITION: 'MATCH_FINISH_CONDITION',
    CAMPAIGN_NODE_PROGRESS: 'CAMPAIGN_NODE_PROGRESS',
    CAMPAIGN_BOSS_CONDITION: 'CAMPAIGN_BOSS_CONDITION',
    LOOT_DROP: 'LOOT_DROP',
    SECRET_META: 'SECRET_META'
};

export const BADGES_CATALOG = [
    // ----------------------------------------------------
    // A) SPEED
    // ----------------------------------------------------
    {
        key: 'flash',
        displayName: 'Flash',
        category: 'Speed',
        rarity: 'Epic',
        description: 'Win a complete 1v1 battle in under 5 minutes.',
        assetName: 'flash.png',
        unlockType: BADGE_TYPES.TIME_BASED_WIN,
        requiredValue: 1, // 1 match
        metadata: { maxDurationSeconds: 300 },
        aliases: []
    },
    {
        key: 'sub_minute',
        displayName: 'Sub-Minute',
        category: 'Speed',
        rarity: 'Legendary',
        description: 'Solve any problem in under 60 seconds.',
        assetName: 'sub_minute.png',
        unlockType: BADGE_TYPES.TIME_BASED_SOLVE,
        requiredValue: 1, // 1 problem
        metadata: { maxSolveTimeSeconds: 60 },
        aliases: []
    },
    {
        key: 'lightning_round',
        displayName: 'Lightning Round',
        category: 'Speed',
        rarity: 'Rare',
        description: 'Complete 5 matches completely under 10 minutes and win.',
        assetName: 'lightning_round.png',
        unlockType: BADGE_TYPES.TIME_BASED_WIN,
        requiredValue: 5,
        metadata: { maxDurationSeconds: 600 },
        aliases: []
    },
    {
        key: 'speed_demon',
        displayName: 'Speed Demon',
        category: 'Speed',
        rarity: 'Epic',
        description: 'Win and complete 10 matches completely under 10 minutes.',
        assetName: 'speed_demon.png',
        unlockType: BADGE_TYPES.TIME_BASED_WIN,
        requiredValue: 10,
        metadata: { maxDurationSeconds: 600 },
        aliases: []
    },
    {
        key: 'time_lord',
        displayName: 'Time Lord',
        category: 'Speed',
        rarity: 'Legendary',
        description: 'Win 10 matches with 15+ minutes remaining on the clock.',
        assetName: 'time_lord.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 10,
        metadata: { minTimeRemainingSeconds: 900 },
        aliases: []
    },
    {
        key: 'instant_kill',
        displayName: 'Instant Kill',
        category: 'Speed',
        rarity: 'Epic',
        description: 'Solve the first problem of 10 matches before the opponent presses run/submit.',
        assetName: 'instant_kill.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 10,
        metadata: { condition: 'solved_before_opponent_submit' },
        aliases: []
    },
    {
        key: 'supersonic',
        displayName: 'Supersonic',
        category: 'Speed',
        rarity: 'Legendary',
        description: 'Win 5 matches under 5 minutes.',
        assetName: 'supersonic.png',
        unlockType: BADGE_TYPES.TIME_BASED_WIN,
        requiredValue: 5,
        metadata: { maxDurationSeconds: 300 },
        aliases: []
    },
    {
        key: 'blitzkrieg',
        displayName: 'Blitzkrieg',
        category: 'Speed',
        rarity: 'Legendary',
        description: 'Solve 5 problems under 30 seconds.',
        assetName: 'blitzkrieg.png',
        unlockType: BADGE_TYPES.TIME_BASED_SOLVE,
        requiredValue: 5,
        metadata: { maxSolveTimeSeconds: 30 },
        aliases: ['BlitzKreign'] // alias support
    },
    {
        key: 'clutch_win',
        displayName: 'Clutch Win',
        category: 'Speed',
        rarity: 'Epic',
        description: 'Win 5 matches with less than 10 seconds remaining on the clock.',
        assetName: 'clutch_win.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 5,
        metadata: { maxTimeRemainingSeconds: 10 },
        aliases: ['Clutch-Win']
    },

    // ----------------------------------------------------
    // B) CONSISTENCY
    // ----------------------------------------------------
    {
        key: 'getting_started',
        displayName: 'Getting Started',
        category: 'Consistency',
        rarity: 'Common',
        description: 'Maintain a 7-day activity streak on the calendar.',
        assetName: 'getting_started.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 7,
        aliases: ['streak_7']
    },
    {
        key: 'unstoppable',
        displayName: 'Unstoppable',
        category: 'Consistency',
        rarity: 'Uncommon',
        description: 'Maintain a 14-day activity streak on the calendar.',
        assetName: 'unstoppable.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 14,
        aliases: ['streak_14']
    },
    {
        key: 'iron_will',
        displayName: 'Iron Will',
        category: 'Consistency',
        rarity: 'Rare',
        description: 'Maintain a 25-day activity streak on the calendar.',
        assetName: 'iron_will.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 25,
        aliases: ['streak_25']
    },
    {
        key: 'marathon_runner',
        displayName: 'Marathon Runner',
        category: 'Consistency',
        rarity: 'Epic',
        description: 'Maintain a 40-day activity streak on the calendar.',
        assetName: 'marathon_runner.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 40,
        aliases: ['streak_30', 'streak_40']
    },
    {
        key: 'weekend_warrior',
        displayName: 'Weekend Warrior',
        category: 'Consistency',
        rarity: 'Rare',
        description: 'Play matches on 5 consecutive weekends.',
        assetName: 'weekend_warrior.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 5,
        metadata: { condition: 'consecutive_weekends' },
        aliases: []
    },
    {
        key: 'night_owl',
        displayName: 'Night Owl',
        category: 'Consistency',
        rarity: 'Epic',
        description: 'Win 10 matches played after midnight (00:00–05:00).',
        assetName: 'night_owl.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 10,
        metadata: { condition: 'time_window', startHour: 0, endHour: 5 },
        aliases: []
    },
    {
        key: 'half_century',
        displayName: 'Half-Century',
        category: 'Consistency',
        rarity: 'Legendary',
        description: 'Maintain a 50-day consistency streak on the calendar.',
        assetName: 'half_century.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 50,
        aliases: ['Half Century']
    },
    {
        key: 'centurion_streak',
        displayName: 'Centurion Streak',
        category: 'Consistency',
        rarity: 'Legendary',
        description: 'Maintain a 100-day consistency streak on the calendar.',
        assetName: 'centurion_streak.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK,
        requiredValue: 100,
        aliases: []
    },
    {
        key: 'early_bird',
        displayName: 'Early Bird',
        category: 'Consistency',
        rarity: 'Rare',
        description: 'Win 10 matches played in the morning (05:00–08:00).',
        assetName: 'early_bird.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 10,
        metadata: { condition: 'time_window', startHour: 5, endHour: 8 },
        aliases: []
    },
    {
        key: 'devoted_coder',
        displayName: 'Devoted Coder',
        category: 'Consistency',
        rarity: 'Epic',
        description: 'Solve at least 1 problem every day for a full calendar month (30 days).',
        assetName: 'devoted_coder.png',
        unlockType: BADGE_TYPES.ACTIVITY_STREAK, // We treat this as a 30 day solve streak
        requiredValue: 30,
        metadata: { condition: 'solve_streak' },
        aliases: []
    },

    // ----------------------------------------------------
    // C) COMBAT
    // ----------------------------------------------------
    {
        key: 'first_blood',
        displayName: 'First Blood',
        category: 'Combat',
        rarity: 'Common',
        description: 'Win your first perfect battle against a real opponent only.',
        assetName: 'first_blood.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 1,
        metadata: { condition: 'all_problems_solved' },
        aliases: []
    },
    {
        key: 'hat_trick',
        displayName: 'Hat Trick',
        category: 'Combat',
        rarity: 'Uncommon',
        description: 'Win 3 matches in a row against a real opponent.',
        assetName: 'hat_trick.png',
        unlockType: BADGE_TYPES.WIN_STREAK,
        requiredValue: 3,
        aliases: []
    },
    {
        key: 'arena_gladiator',
        displayName: 'Arena Gladiator',
        category: 'Combat',
        rarity: 'Rare',
        description: 'Win 25 battles in the Arena.',
        assetName: 'arena_gladiator.png',
        unlockType: BADGE_TYPES.COUNT_TOTAL_WINS,
        requiredValue: 25,
        aliases: []
    },
    {
        key: 'centurion',
        displayName: 'Centurion',
        category: 'Combat',
        rarity: 'Rare',
        description: 'Play 100 matches in total.',
        assetName: 'centurion.png',
        unlockType: BADGE_TYPES.COUNT_TOTAL_MATCHES,
        requiredValue: 100,
        aliases: []
    },
    {
        key: 'perfect_round',
        displayName: 'Perfect Round',
        category: 'Combat',
        rarity: 'Epic',
        description: 'Solve all problems correctly in a single match.',
        assetName: 'perfect_round.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 1, // Only need 1 match like this
        metadata: { condition: 'all_problems_solved' },
        aliases: []
    },
    {
        key: 'flawless_victory',
        displayName: 'Flawless Victory',
        category: 'Combat',
        rarity: 'Legendary',
        description: 'Win three custom games with a 3–0 score.',
        assetName: 'flawless_victory.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 3,
        metadata: { condition: 'win_3_0_custom' },
        aliases: ['Flawless-Victoy']
    },
    {
        key: 'dominator',
        displayName: 'Dominator',
        category: 'Combat',
        rarity: 'Epic',
        description: 'Achieve a 10-match win streak.',
        assetName: 'dominator.png',
        unlockType: BADGE_TYPES.WIN_STREAK,
        requiredValue: 10,
        aliases: []
    },
    {
        key: 'underdog',
        displayName: 'Underdog',
        category: 'Combat',
        rarity: 'Epic',
        description: 'Beat an opponent rated 200+ ELO above your current rating.',
        assetName: 'underdog.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 1,
        metadata: { eloDiffRequired: 200 },
        aliases: []
    },
    {
        key: 'survivor',
        displayName: 'Survivor',
        category: 'Combat',
        rarity: 'Epic',
        description: 'Win a match with less than 1 minute remaining.',
        assetName: 'survivor.png',
        unlockType: BADGE_TYPES.MATCH_FINISH_CONDITION,
        requiredValue: 1,
        metadata: { maxTimeRemainingSeconds: 60 },
        aliases: []
    },
    {
        key: 'legendary_streak',
        displayName: 'Legendary Streak',
        category: 'Combat',
        rarity: 'Legendary',
        description: 'Achieve a 15-match win streak.',
        assetName: 'legendary_streak.png',
        unlockType: BADGE_TYPES.WIN_STREAK,
        requiredValue: 15,
        aliases: []
    },
    {
        key: 'arena_conqueror',
        displayName: 'Arena Conqueror',
        category: 'Combat',
        rarity: 'Legendary',
        description: 'Win 100 battles in the Arena.',
        assetName: 'arena_conqueror.png',
        unlockType: BADGE_TYPES.COUNT_TOTAL_WINS,
        requiredValue: 100,
        aliases: []
    },
    {
        key: 'veteran',
        displayName: 'Veteran',
        category: 'Combat',
        rarity: 'Legendary',
        description: 'Play 500 matches in total.',
        assetName: 'veteran.png',
        unlockType: BADGE_TYPES.COUNT_TOTAL_MATCHES,
        requiredValue: 500,
        aliases: []
    },

    // ----------------------------------------------------
    // D) MASTERY
    // ----------------------------------------------------
    { key: 'array_ace', displayName: 'Array Ace', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Array-tagged problems.', assetName: 'array_ace.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['array', 'arrays'] }, aliases: [] },
    { key: 'string_slicer', displayName: 'String Slicer', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 String-tagged problems.', assetName: 'string_slicer.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['string', 'strings'] }, aliases: [] },
    { key: 'tree_hugger', displayName: 'Tree Hugger', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Tree-tagged problems.', assetName: 'tree_hugger.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['tree', 'trees'] }, aliases: [] },
    { key: 'graph_guru', displayName: 'Graph Guru', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Graph-tagged problems.', assetName: 'graph_guru.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['graph', 'graphs'] }, aliases: [] },
    { key: 'dp_dynamo', displayName: 'DP Dynamo', category: 'Mastery', rarity: 'Legendary', description: 'Solve 30 Dynamic Programming-tagged problems.', assetName: 'dp_dynamo.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['dp', 'dynamic programming'] }, aliases: [] },
    { key: 'sort_king', displayName: 'Sort King', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Sorting-tagged problems.', assetName: 'sort_king.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['sort', 'sorting'] }, aliases: [] },
    { key: 'binary_boss', displayName: 'Binary Boss', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Binary Search-tagged problems.', assetName: 'binary_boss.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['binary search'] }, aliases: [] },
    { key: 'hash_master', displayName: 'Hash Master', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Hash Table / Hashing-tagged problems.', assetName: 'hash_master.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['hash table', 'hashing'] }, aliases: [] },
    { key: 'diamond_ranked', displayName: 'Diamond Ranked', category: 'Mastery', rarity: 'Epic', description: 'Reach a rating of 1500 ELO or higher.', assetName: 'diamond_ranked.png', unlockType: BADGE_TYPES.ELO_THRESHOLD, requiredValue: 1500, aliases: [] },
    { key: 'linked_list_legend', displayName: 'Linked List Legend', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Linked List-tagged problems.', assetName: 'linked_list_legend.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['linked list', 'linked lists', 'linkedlist'] }, aliases: [] },
    { key: 'greedy_genius', displayName: 'Greedy Genius', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Greedy-tagged problems.', assetName: 'greedy_genius.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['greedy'] }, aliases: [] },
    { key: 'stack_surgeon', displayName: 'Stack Surgeon', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Stack / Queue-tagged problems.', assetName: 'stack_surgeon.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['stack', 'queue', 'stacks', 'queues'] }, aliases: [] },
    { key: 'math_magician', displayName: 'Math Magician', category: 'Mastery', rarity: 'Rare', description: 'Solve 30 Math / Number Theory-tagged problems.', assetName: 'math_magician.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['math', 'mathematics', 'number theory'] }, aliases: [] },
    { key: 'bit_wizard', displayName: 'Bit Wizard', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Bit Manipulation-tagged problems.', assetName: 'bit_wizard.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['bit', 'bits', 'bit manipulation'] }, aliases: [] },
    { key: 'backtracking_boss', displayName: 'Backtracking Boss', category: 'Mastery', rarity: 'Legendary', description: 'Solve 30 Backtracking-tagged problems.', assetName: 'backtracking_boss.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['backtracking'] }, aliases: [] },
    { key: 'recursion_ranger', displayName: 'Recursion Ranger', category: 'Mastery', rarity: 'Epic', description: 'Solve 30 Recursion / DFS-tagged problems.', assetName: 'recursion_ranger.png', unlockType: BADGE_TYPES.COUNT_TAG, requiredValue: 30, metadata: { tags: ['recursion', 'dfs'] }, aliases: [] },
    { key: 'grandmaster_ranked', displayName: 'Grandmaster Ranked', category: 'Mastery', rarity: 'Legendary', description: 'Reach a rating of 2000 ELO or higher.', assetName: 'grandmaster_ranked.png', unlockType: BADGE_TYPES.ELO_THRESHOLD, requiredValue: 2000, aliases: ['Grandmaster Rank'] },
    { key: 'immortal_ranked', displayName: 'Immortal Ranked', category: 'Mastery', rarity: 'Legendary', description: 'Reach a rating of 2500 ELO or higher.', assetName: 'immortal_ranked.png', unlockType: BADGE_TYPES.ELO_THRESHOLD, requiredValue: 2500, aliases: ['Immortal Rank'] },

    // ----------------------------------------------------
    // E) CAMPAIGN / REGION
    // ----------------------------------------------------
    { key: 'island_hopper', displayName: 'Island Hopper', category: 'Campaign', rarity: 'Common', description: 'Complete the first 10 nodes of Array Archipelago (Zone 1).', assetName: 'island_hopper.png', unlockType: BADGE_TYPES.CAMPAIGN_NODE_PROGRESS, requiredValue: 10, metadata: { zoneId: 'array_archipelago' }, aliases: [] },
    { key: 'archipelago_admiral', displayName: 'Archipelago Admiral', category: 'Campaign', rarity: 'Epic', description: 'Defeat the Zone 1 boss (Array King at Node 15) with a 3-star rating.', assetName: 'archipelago_admiral.png', unlockType: BADGE_TYPES.CAMPAIGN_BOSS_CONDITION, requiredValue: 1, metadata: { nodeId: 'aa_15', minStars: 3 }, aliases: [] },
    { key: 'shore_walker', displayName: 'Shore Walker', category: 'Campaign', rarity: 'Rare', description: 'Complete all standard nodes in String Shores (Zone 2).', assetName: 'shore_walker.png', unlockType: BADGE_TYPES.CAMPAIGN_NODE_PROGRESS, requiredValue: 13, metadata: { zoneId: 'string_shores', standardOnly: true }, aliases: [] },
    { key: 'sirens_solver', displayName: 'Siren’s Solver', category: 'Campaign', rarity: 'Epic', description: 'Solve the String Shores boss (Longest Unique Substring at Node 8) in under 3 minutes.', assetName: 'sirens_solver.png', unlockType: BADGE_TYPES.CAMPAIGN_BOSS_CONDITION, requiredValue: 1, metadata: { nodeId: 'ss_08', maxTimeMs: 180000 }, aliases: ["Siren's Solver"] },
    { key: 'lagoon_legend', displayName: 'Lagoon Legend', category: 'Campaign', rarity: 'Legendary', description: 'Defeat the Zone 3 boss (The Loop Lord at Node 15) with a 3-star rating.', assetName: 'lagoon_legend.png', unlockType: BADGE_TYPES.CAMPAIGN_BOSS_CONDITION, requiredValue: 1, metadata: { nodeId: 'll_15', minStars: 3 }, aliases: [] },
    { key: 'triple_crown', displayName: 'Triple Crown', category: 'Campaign', rarity: 'Legendary', description: 'Earn a 3-star rating on all 15 nodes in Array Archipelago.', assetName: 'triple_crown.png', unlockType: BADGE_TYPES.CAMPAIGN_NODE_PROGRESS, requiredValue: 15, metadata: { zoneId: 'array_archipelago', minStars: 3 }, aliases: [] },
    { key: 'star_collector', displayName: 'Star Collector', category: 'Campaign', rarity: 'Epic', description: 'Accumulate a total of 100 stars across all campaign zones.', assetName: 'star_collector.png', unlockType: BADGE_TYPES.CAMPAIGN_NODE_PROGRESS, requiredValue: 100, metadata: { countType: 'stars' }, aliases: [] },
    { key: 'boss_slayer', displayName: 'Boss Slayer', category: 'Campaign', rarity: 'Epic', description: 'Defeat any Mid-Boss or Zone Boss (Node 8 or 15) on the first submission attempt.', assetName: 'boss_slayer.png', unlockType: BADGE_TYPES.CAMPAIGN_BOSS_CONDITION, requiredValue: 1, metadata: { firstSubmission: true }, aliases: [] },
    { key: 'loot_raider', displayName: 'Loot Raider', category: 'Campaign', rarity: 'Epic', description: 'Obtain a rare title or theme drop from a Zone Boss loot pool.', assetName: 'loot_raider.png', unlockType: BADGE_TYPES.LOOT_DROP, requiredValue: 1, metadata: { rarity: 'rare' }, aliases: [] },
    { key: 'grand_conqueror', displayName: 'Grand Conqueror', category: 'Campaign', rarity: 'Legendary', description: 'Complete all 45 nodes across all three campaign zones.', assetName: 'grand_conqueror.png', unlockType: BADGE_TYPES.CAMPAIGN_NODE_PROGRESS, requiredValue: 45, metadata: { countType: 'nodes' }, aliases: [] },
    { key: 'ultimate_guardian', displayName: 'Ultimate Guardian', category: 'Campaign', rarity: 'Legendary', description: 'Secret badge; unlock only when all campaign regions and all nodes are completed.', assetName: 'ultimate_guardian.png', unlockType: BADGE_TYPES.SECRET_META, requiredValue: 45, metadata: { isSecret: true }, aliases: [] }
];

export const getBadgeConfig = (keyOrAlias) => {
    return BADGES_CATALOG.find(b => 
        b.key === keyOrAlias || 
        (b.aliases && b.aliases.includes(keyOrAlias))
    );
};

// Version-2.0