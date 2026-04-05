// ═══════════════════════════════════════════════════════════════════════════
// FIX 2A — src/context/ThemeContext.jsx
// Global dark/light theme provider with localStorage persistence.
// Adds `class="dark"` to <html> for Tailwind's `dark:` modifier strategy.
// ═══════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  theme:      'dark',
  toggleTheme: () => {},
  setTheme:    (_) => {},
  isDark:      true,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // 1. Respect explicit user choice stored in localStorage
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('ca_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    }

    // 2. Respect OS preference
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    // 3. Default to dark (coding platform default)
    return 'dark';
  });

  // Apply / remove "dark" class on <html> for Tailwind's class strategy
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ca_theme', theme);
    }
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (t === 'dark' || t === 'light') setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
