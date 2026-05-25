export const AUTH_STORAGE_KEY = 'codearena_user';
export const DASHBOARD_CACHE_KEY = 'dashboard_profile_cache';
export const HISTORY_CACHE_KEY = 'history_cache';
export const LEADERBOARD_CACHE_KEY = 'leaderboard_cache';

export const USER_UPDATED_EVENT = 'codearena:user-updated';
export const AUTH_CLEARED_EVENT = 'codearena:auth-cleared';

const DERIVED_CACHE_KEYS = [
  DASHBOARD_CACHE_KEY,
  HISTORY_CACHE_KEY,
  LEADERBOARD_CACHE_KEY,
];

export const safeParseJson = (value, fallback = null) => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return safeParseJson(window.localStorage.getItem(AUTH_STORAGE_KEY), null);
};

export const dispatchUserUpdated = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user || null }));
};

export const dispatchAuthCleared = (detail = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_CLEARED_EVENT, { detail }));
};

export const clearDerivedUserCacheEntries = () => {
  if (typeof window === 'undefined') {
    return;
  }

  DERIVED_CACHE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const setStoredUser = (user, { clearDerived = false, dispatch = true } = {}) => {
  if (typeof window === 'undefined') {
    return user || null;
  }

  if (!user || typeof user !== 'object') {
    return clearStoredUser({ clearDerived, dispatch });
  }

  if (clearDerived) {
    clearDerivedUserCacheEntries();
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

  if (dispatch) {
    dispatchUserUpdated(user);
  }

  return user;
};

export const mergeStoredUser = (nextUser, { clearDerived = false, dispatch = true } = {}) => {
  const storedUser = readStoredUser() || {};
  const mergedUser = {
    ...storedUser,
    ...(nextUser || {}),
  };

  return setStoredUser(mergedUser, { clearDerived, dispatch });
};

export const clearStoredUser = ({
  clearDerived = true,
  dispatch = true,
  eventDetail = {},
} = {}) => {
  if (typeof window === 'undefined') {
    return null;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);

  if (clearDerived) {
    clearDerivedUserCacheEntries();
  }

  if (dispatch) {
    dispatchAuthCleared(eventDetail);
  }

  return null;
};
