// Centralized, source-of-truth badge asset loader for CodeArena 1v1
// This binds keys directly against exact filenames to eliminate dynamic resolution issues.

const rawImages = import.meta.glob('../assets/badges/*.png', { eager: true, import: 'default' });

// Create dictionary of filename -> asset URL
const badgeAssetDict = Object.fromEntries(
    Object.entries(rawImages).map(([path, val]) => [path.split(/[/\\]/).pop(), val])
);

// Normalize badge keys: lowercase, trim, replace spaces and hyphens with underscores
export const normalizeBadgeKey = (key) => {
    if (typeof key !== 'string') return '';
    return key
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_');
};

// Explicit deterministic mapping of normalized keys to exact filenames
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
    devoted_coder: 'marathon_runner.png',
    diamond_ranked: 'diamond_ranked.png',
    dominator: 'dominator.png',
    dp_dynamo: 'dp_dynamo.png',
    early_bird: 'getting_started.png',
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
    stack_surgeon: 'array_ace.png',
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
 * Resolves the URL of a badge image based on the key.
 * @param {string} badgeKey - The raw badge key/ID/name.
 * @returns {string|null} - The resolved badge image asset URL, or null if missing.
 */
export const getBadgeImage = (badgeKey) => {
    if (!badgeKey) return null;
    const normalizedKey = normalizeBadgeKey(badgeKey);
    const filename = BADGE_ASSET_MAP[normalizedKey];

    if (!filename) {
        console.warn('[BADGE_ASSET_MISSING] No filename mapping found for key:', badgeKey, 'normalized:', normalizedKey);
        return null;
    }

    const asset = badgeAssetDict[filename];
    if (!asset) {
        console.warn('[BADGE_ASSET_MISSING] Asset file not found in glob map for filename:', filename, 'original key:', badgeKey);
        return null;
    }

    return asset;
};
