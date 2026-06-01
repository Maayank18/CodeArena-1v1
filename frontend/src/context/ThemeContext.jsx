import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_ADVANCED_THEME_IDS, getAdvancedThemeIdFromUser } from '../utils/advancedThemes';
import { readStoredUser, safeParseJson } from '../utils/authSessionStorage.js';

const STORAGE_KEY = 'ca_theme';
const ADVANCED_THEME_KEY = 'ca_advanced_theme';
const DEFAULT_THEME = 'dark';

const isSupportedAdvancedTheme = (themeId) => SUPPORTED_ADVANCED_THEME_IDS.includes(themeId);

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  advancedTheme: null,
  setAdvancedTheme: () => {},
  clearAdvancedTheme: () => {},
});

const getSystemTheme = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_THEME;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return getSystemTheme();
};

const getInitialAdvancedTheme = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = readStoredUser();
  const userTheme = getAdvancedThemeIdFromUser(storedUser);
  if (userTheme) {
    return userTheme;
  }

  const stored = window.localStorage.getItem(ADVANCED_THEME_KEY);
  return isSupportedAdvancedTheme(stored) ? stored : null;
};

const applyThemeToDocument = (theme, advancedTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  // When advanced theme is active, force dark mode
  const resolvedTheme = advancedTheme ? 'dark' : (theme === 'light' ? 'light' : 'dark');
  const isDark = resolvedTheme === 'dark';

  root.classList.toggle('dark', isDark);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  // Apply/remove advanced theme classes
  root.classList.toggle('theme-frostbyte', advancedTheme === 'frostbyte');
  root.classList.toggle('theme-matrix', advancedTheme === 'matrix');
  root.classList.toggle('theme-cyberpunk', advancedTheme === 'cyberpunk');
  root.classList.toggle('theme-inferno', advancedTheme === 'inferno');
  root.classList.toggle('theme-samurai', advancedTheme === 'samurai');

  if (body) {
    body.dataset.theme = resolvedTheme;
    body.style.colorScheme = resolvedTheme;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [advancedTheme, setAdvancedThemeState] = useState(getInitialAdvancedTheme);

  const syncAdvancedThemeFromStoredUser = useCallback((nextUser) => {
    if (typeof window === 'undefined') {
      return;
    }

    const resolveUser = () => {
      if (nextUser && typeof nextUser === 'object') {
        return nextUser;
      }

      return safeParseJson(window.localStorage.getItem('codearena_user'), null);
    };

    const resolvedTheme = getAdvancedThemeIdFromUser(resolveUser());
    setAdvancedThemeState((currentTheme) => {
      if (resolvedTheme === currentTheme) {
        return currentTheme;
      }

      if (resolvedTheme) {
        return resolvedTheme;
      }

      const fallbackStoredTheme = window.localStorage.getItem(ADVANCED_THEME_KEY);
      return isSupportedAdvancedTheme(fallbackStoredTheme) ? fallbackStoredTheme : null;
    });
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme, advancedTheme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
      if (advancedTheme) {
        window.localStorage.setItem(ADVANCED_THEME_KEY, advancedTheme);
      } else {
        window.localStorage.removeItem(ADVANCED_THEME_KEY);
      }
    }
  }, [theme, advancedTheme]);

  // Handle system theme changes separately, keeping advancedTheme as a dependency
  // but WITHOUT triggering syncAdvancedThemeFromStoredUser
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    const handleSystemThemeChange = (event) => {
      if (advancedTheme) return;

      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return;
      }

      setThemeState(event.matches ? 'dark' : 'light');
    };

    mediaQuery?.addEventListener?.('change', handleSystemThemeChange);

    return () => {
      mediaQuery?.removeEventListener?.('change', handleSystemThemeChange);
    };
  }, [advancedTheme]);

  // Handle storage and user updates. ONLY depends on syncAdvancedThemeFromStoredUser.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorageChange = (event) => {
      if (event.key === 'codearena_user') {
        syncAdvancedThemeFromStoredUser();
        return;
      }

      if (event.key === ADVANCED_THEME_KEY) {
        const nextAdvanced = isSupportedAdvancedTheme(event.newValue) ? event.newValue : null;
        setAdvancedThemeState(nextAdvanced);
        return;
      }

      if (event.key !== STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === 'light' ? 'light' : event.newValue === 'dark' ? 'dark' : getSystemTheme();
      setThemeState(nextTheme);
    };

    const handleUserUpdated = (event) => {
      syncAdvancedThemeFromStoredUser(event.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('codearena:user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('codearena:user-updated', handleUserUpdated);
    };
  }, [syncAdvancedThemeFromStoredUser]);

  const setTheme = useCallback((nextTheme) => {
    if (advancedTheme) return; // No-op when advanced theme is active
    if (nextTheme === 'dark' || nextTheme === 'light') {
      setThemeState(nextTheme);
    }
  }, [advancedTheme]);

  const toggleTheme = useCallback(() => {
    if (advancedTheme) return; // No-op when advanced theme is active
    setThemeState((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, [advancedTheme]);

  const setAdvancedTheme = useCallback((themeId) => {
    if (isSupportedAdvancedTheme(themeId)) {
      setAdvancedThemeState(themeId);
      // Force dark mode as the base for advanced themes
      setThemeState('dark');
    }
  }, []);

  const clearAdvancedTheme = useCallback(() => {
    setAdvancedThemeState(null);
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark' || Boolean(advancedTheme),
    toggleTheme,
    setTheme,
    advancedTheme,
    setAdvancedTheme,
    clearAdvancedTheme,
  }), [setTheme, theme, toggleTheme, advancedTheme, setAdvancedTheme, clearAdvancedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

// Version-2.0