// Centralized, source-of-truth badge asset loader for CodeArena 1v1

// Broaden glob map to catch common image formats safely and case-insensitively
const rawImages = import.meta.glob('../assets/badges/*.{png,PNG,jpg,JPG,jpeg,JPEG,svg,SVG}', { eager: true, import: 'default' });

// Create a case-insensitive dictionary mapping lowercased names to asset references
const badgeAssetDict = {};
Object.entries(rawImages).forEach(([path, val]) => {
    const filename = path.split(/[/\\]/).pop().toLowerCase();
    badgeAssetDict[filename] = val;
    
    // Also store a clean variant omitting the extension to provide robust lookups
    const baseName = filename.replace(/\.[^/.]+$/, "");
    badgeAssetDict[baseName] = val;
});

// Normalize badge keys uniformly across the system
export const normalizeBadgeKey = (key) => {
    if (typeof key !== 'string') return '';
    return key
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_');
};

// Deterministic matching map of keys to target filenames
const BADGE_ASSET_MAP = {
    archipelago_admiral: 'archipelago_admiral.png',
    arena_conqueror: 'arena_conqueror.png',
    arena_gladiator: 'arena_gladiator.png',
    array_ace: 'array_ace.png',
    backtracking_boss: 'backtracking_boss.png',
    binary_boss: 'binary_boss.png',
    bit_wizard: 'bit_wizard.png',
    blitzkrieg: 'blitzkrieg.png',
    boss_slayer: 'boss_slayer.png',
    centurion: 'centurion.png',
    centurion_streak: 'centurion.png',
    clutch_win: 'clutch_win.png',
    devoted_coder: 'devoted_coder.png',
    diamond_ranked: 'diamond_ranked.png',
    dominator: 'dominator.png',
    dp_dynamo: 'dp_dynamo.png',
    early_bird: 'early_bird.png',
    first_blood: 'first_blood.png',
    flash: 'flash.png',
    flawless_victory: 'flawless_victory.png',
    getting_started: 'getting_started.png',
    grand_conqueror: 'grand_conqueror.png',
    grandmaster_ranked: 'grandmaster_ranked.png',
    graph_guru: 'graph_guru.png',
    greedy_genius: 'greedy_genius.png',
    half_century: 'half_century.png',
    hash_master: 'hash_master.png',
    hat_trick: 'hat_trick.png',
    immortal_ranked: 'immortal_ranked.png',
    instant_kill: 'instant_kill.png',
    iron_will: 'iron_will.png',
    island_hopper: 'island_hopper.png',
    lagoon_legend: 'lagoon_legend.png',
    legendary_streak: 'legendary_streak.png',
    lightning_round: 'lightning_round.png',
    linked_list_legend: 'linked_list_legend.png',
    loot_raider: 'loot_raider.png',
    marathon_runner: 'marathon_runner.png',
    math_magician: 'math_magician.png',
    night_owl: 'night_owl.png',
    perfect_round: 'perfect_round.png',
    recursion_ranger: 'recursion_ranger.png',
    shore_walker: 'shore_walker.png',
    sirens_solver: 'sirens_solver.png',
    sort_king: 'sort_king.png',
    speed_demon: 'speed_demon.png',
    stack_surgeon: 'stack_surgeon.png',
    star_collector: 'star_collector.png',
    string_slicer: 'string_slicer.png',
    sub_minute: 'sub_minute.png',
    supersonic: 'supersonic.png',
    survivor: 'survivor.png',
    time_lord: 'time_lord.png',
    tree_hugger: 'tree_hugger.png',
    triple_crown: 'triple_crown.png',
    ultimate_guardian: 'ultimate_guardian.png',
    underdog: 'underdog.png',
    unstoppable: 'unstoppable.png',
    veteran: 'veteran.png',
    weekend_warrior: 'weekend_warrior.png'
};

/**
 * Resolves the final compiled asset path using clean fallback chains.
 * @param {string} badgeKey - Key used to look up the asset.
 * @returns {string|null} - Resolved asset path or null.
 */
export const getBadgeImage = (badgeKey) => {
    if (!badgeKey) return null;
    const normalized = normalizeBadgeKey(badgeKey);
    
    // Check asset map first
    let targetFile = BADGE_ASSET_MAP[normalized];
    if (targetFile) {
        const resolved = badgeAssetDict[targetFile.toLowerCase()] || badgeAssetDict[normalized];
        if (resolved) return resolved;
    }
    
    // Direct lookup fallback
    const directFallback = badgeAssetDict[normalized];
    if (directFallback) return directFallback;

    // Resilient fallbacks for shared or missing artwork assets
    const sharedFallbacks = {
        devoted_coder: 'marathon_runner.png',
        early_bird: 'getting_started.png',
        stack_surgeon: 'array_ace.png',
        centurion_streak: 'centurion.png'
    };
    const fallbackFile = sharedFallbacks[normalized];
    if (fallbackFile) {
        const fallbackResolved = badgeAssetDict[fallbackFile.toLowerCase()];
        if (fallbackResolved) return fallbackResolved;
    }

    console.warn(`[BADGE_ASSET_RESOLVER_WARN] Asset path completely missing for key footprint: ${badgeKey}`);
    return null;
};
