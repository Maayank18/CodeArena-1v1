import api from '../api.js';
import {
    DASHBOARD_CACHE_KEY,
    HISTORY_CACHE_KEY,
    LEADERBOARD_CACHE_KEY,
    clearDerivedUserCacheEntries,
    mergeStoredUser,
    readStoredUser,
} from './authSessionStorage.js';

export {
    DASHBOARD_CACHE_KEY,
    HISTORY_CACHE_KEY,
    LEADERBOARD_CACHE_KEY,
    clearDerivedUserCacheEntries,
    mergeStoredUser,
    readStoredUser,
};

const DEFAULT_STATS = {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
};

export const mergeUserProfile = (storedUser, serverUser) => ({
    ...(storedUser || {}),
    ...(serverUser || {}),
    stats: serverUser?.stats || storedUser?.stats || { ...DEFAULT_STATS },
    customization: serverUser?.customization || storedUser?.customization || {},
});

export const clearDerivedUserCaches = () => {
    clearDerivedUserCacheEntries();
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

    if (JSON.stringify(storedUser) !== JSON.stringify(mergedUser)) {
        mergeStoredUser(mergedUser, {
            clearDerived: true,
            dispatch: true,
        });
    }

    return mergedUser;
};

// Version-2.0