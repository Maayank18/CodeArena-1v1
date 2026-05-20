// FILE: frontend/src/utils/badgeAssets.js
// Centralized badge asset resolver for CodeArena 1v1
//
// How it works:
//   1. Vite's import.meta.glob eagerly imports every image in ../assets/badges/
//   2. We build a normalized lookup dict keyed by base filename (no extension, lowercase)
//   3. getBadgeImage() normalizes the incoming key the same way and does an O(1) lookup
//   4. Four badges share artwork with another badge; those aliases are handled as fallbacks

// Step 1: Glob all badge image files (eager = resolved at build time, import default = URL string)
const rawImages = import.meta.glob(
    '../assets/badges/*.{png,PNG,jpg,JPG,jpeg,JPEG,svg,SVG}',
    { eager: true }
);

// Step 2: Build normalized dictionary
//   '../assets/badges/arena_gladiator.png' → { 'arena_gladiator': '/assets/arena_gladiator-abc123.png' }
const badgeAssetDict = {};

const resolveAssetUrl = (assetModule) => {
    if (typeof assetModule === 'string') {
        return assetModule;
    }

    if (assetModule && typeof assetModule === 'object' && typeof assetModule.default === 'string') {
        return assetModule.default;
    }

    return null;
};

Object.entries(rawImages).forEach(([path, assetModule]) => {
    const resolvedUrl = resolveAssetUrl(assetModule);
    if (!resolvedUrl) {
        if (import.meta.env.DEV) {
            console.warn(`[BADGE_ASSET] Unsupported module shape for "${path}"`, assetModule);
        }
        return;
    }

    const filename = path.split('/').pop() || '';
    const baseName = filename
        .replace(/\.[^/.]+$/, '')  // strip extension
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_'); // spaces/hyphens → underscores

    badgeAssetDict[baseName] = resolvedUrl;
});

// Step 3: Aliases for badges that don't have their own artwork file
//   These 4 badge IDs in BADGE_DEFINITIONS reference files that don't exist on disk.
//   Instead of creating dummy files, we map them to visually similar existing badges.
const ARTWORK_ALIASES = {
    centurion_streak: 'centurion',
    devoted_coder: 'marathon_runner',
    early_bird: 'getting_started',
    stack_surgeon: 'array_ace',
};

/**
 * Normalize a badge key for dictionary lookup.
 * Handles any casing, spaces, or hyphens in the input.
 */
export const normalizeBadgeKey = (key) => {
    if (typeof key !== 'string') return '';
    return key
        .toLowerCase()
        .trim()
        .replace(/\.[^/.]+$/, '')
        .replace(/[\s-]+/g, '_');
};

/**
 * Resolve a badge ID/key to its compiled Vite asset URL.
 *
 * @param {string} badgeKey - The badge identifier (e.g. 'arena_gladiator', 'Flash', 'centurion-streak')
 * @returns {string|null} - The resolved asset URL, or null if no matching file exists
 */
export const getBadgeImage = (badgeKey) => {
    if (!badgeKey) return null;

    const normalized = normalizeBadgeKey(badgeKey);

    // Direct lookup — covers 52 of 56 badges that have their own file
    const direct = badgeAssetDict[normalized];
    if (direct) return direct;

    // Alias lookup — covers the 4 badges that share artwork
    const aliasTarget = ARTWORK_ALIASES[normalized];
    if (aliasTarget) {
        const aliased = badgeAssetDict[aliasTarget];
        if (aliased) return aliased;
    }

    // Nothing found — log for debugging, return null (consumer shows fallback icon)
    if (import.meta.env.DEV) {
        console.warn(`[BADGE_ASSET] No image found for key: "${badgeKey}" (normalized: "${normalized}")`);
    }
    return null;
};
