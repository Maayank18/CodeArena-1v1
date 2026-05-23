import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ca_theme';
const ADVANCED_THEME_KEY = 'ca_advanced_theme';
const DEFAULT_THEME = 'dark';

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
  const userStr = window.localStorage.getItem('codearena_user');
  if (!userStr) {
    return null;
  }
  const stored = window.localStorage.getItem(ADVANCED_THEME_KEY);
  if (stored === 'frostbyte') return 'frostbyte';
  if (stored === 'matrix') return 'matrix';
  if (stored === 'cyberpunk') return 'cyberpunk';
  if (stored === 'inferno') return 'inferno';
  return null;
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

  if (body) {
    body.dataset.theme = resolvedTheme;
    body.style.colorScheme = resolvedTheme;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [advancedTheme, setAdvancedThemeState] = useState(getInitialAdvancedTheme);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    const handleSystemThemeChange = (event) => {
      // Don't respond to system theme changes when advanced theme is active
      if (advancedTheme) return;

      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return;
      }

      setThemeState(event.matches ? 'dark' : 'light');
    };

    const handleStorageChange = (event) => {
      if (event.key === ADVANCED_THEME_KEY) {
        let nextAdvanced = null;
        if (event.newValue === 'frostbyte') nextAdvanced = 'frostbyte';
        if (event.newValue === 'matrix') nextAdvanced = 'matrix';
        if (event.newValue === 'cyberpunk') nextAdvanced = 'cyberpunk';
        if (event.newValue === 'inferno') nextAdvanced = 'inferno';
        setAdvancedThemeState(nextAdvanced);
        return;
      }

      if (event.key !== STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === 'light' ? 'light' : event.newValue === 'dark' ? 'dark' : getSystemTheme();
      setThemeState(nextTheme);
    };

    mediaQuery?.addEventListener?.('change', handleSystemThemeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery?.removeEventListener?.('change', handleSystemThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [advancedTheme]);

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
    if (themeId === 'frostbyte' || themeId === 'matrix' || themeId === 'cyberpunk' || themeId === 'inferno') {
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
