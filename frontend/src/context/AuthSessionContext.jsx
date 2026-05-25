import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AUTH_CLEARED_EVENT,
  AUTH_STORAGE_KEY,
  USER_UPDATED_EVENT,
  clearStoredUser,
  mergeStoredUser,
  readStoredUser,
  setStoredUser,
} from '../utils/authSessionStorage.js';
import { refreshCurrentUserProfile } from '../utils/sessionSync.js';

const PUBLIC_AUTH_PATHS = new Set(['/', '/login', '/signup']);

const AuthSessionContext = createContext({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  refreshSession: async () => null,
  updateSession: () => null,
  replaceSession: () => null,
  clearSession: () => null,
});

export const AuthSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => readStoredUser());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key && event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      setUser(readStoredUser());
    };

    const handleUserUpdated = (event) => {
      if (event.detail && typeof event.detail === 'object') {
        setUser(event.detail);
        return;
      }

      setUser(readStoredUser());
    };

    const handleAuthCleared = (event) => {
      setUser(readStoredUser());

      const redirectTo = event.detail?.redirectTo || '/login';
      const shouldRedirect = !PUBLIC_AUTH_PATHS.has(location.pathname) || redirectTo !== '/login';

      if (shouldRedirect) {
        navigate(redirectTo, {
          replace: event.detail?.replace ?? true,
          state: event.detail?.state,
        });
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    window.addEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
      window.removeEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
    };
  }, [location.pathname, navigate]);

  const refreshSession = useCallback(async () => {
    const freshUser = await refreshCurrentUserProfile();
    setUser(freshUser);
    return freshUser;
  }, []);

  const updateSession = useCallback((nextUser, options = {}) => {
    const updatedUser = mergeStoredUser(nextUser, options);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const replaceSession = useCallback((nextUser, options = {}) => {
    const updatedUser = setStoredUser(nextUser, options);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const clearSession = useCallback((options = {}) => {
    const clearedUser = clearStoredUser(options);
    setUser(clearedUser);
    return clearedUser;
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user?.token),
    isHydrated,
    refreshSession,
    updateSession,
    replaceSession,
    clearSession,
  }), [clearSession, isHydrated, refreshSession, replaceSession, updateSession, user]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = () => useContext(AuthSessionContext);
