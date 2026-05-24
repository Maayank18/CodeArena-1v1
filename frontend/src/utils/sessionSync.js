import api from '../api.js';

export const DASHBOARD_CACHE_KEY = 'dashboard_profile_cache';
export const HISTORY_CACHE_KEY = 'history_cache';
export const LEADERBOARD_CACHE_KEY = 'leaderboard_cache';

const DEFAULT_STATS = {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
};

export const readStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('codearena_user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

export const mergeUserProfile = (storedUser, serverUser) => ({
    ...(storedUser || {}),
    ...(serverUser || {}),
    stats: serverUser?.stats || storedUser?.stats || { ...DEFAULT_STATS },
    customization: serverUser?.customization || storedUser?.customization || {},
});

export const clearDerivedUserCaches = () => {
    [DASHBOARD_CACHE_KEY, HISTORY_CACHE_KEY, LEADERBOARD_CACHE_KEY].forEach((key) => {
        localStorage.removeItem(key);
    });

    api.clearCache?.();
};

export const refreshCurrentUserProfile = async () => {
    const storedUser = readStoredUser();
    const username = typeof storedUser?.username === 'string' ? storedUser.username.trim() : '';

    if (!username) {
        return null;
    }

    const response = await api.get(`/users/profile/${encodeURIComponent(username)}`, {
        meta: { skipCache: true },
    });

    const mergedUser = mergeUserProfile(storedUser, response.data);
    localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
    window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
    return mergedUser;
};
