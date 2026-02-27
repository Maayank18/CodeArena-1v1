// FILE: frontend/src/components/Visualizer/renderers/useThemeColors.js
// Shared theme hook — all renderers import this for live, reactive color tokens.
// Watches data-theme attribute on <html> via MutationObserver so colors update
// instantly when the theme toggle is clicked — no page reload needed.

import { useState, useEffect } from 'react';

// ── Static token maps ─────────────────────────────────────────────────────────
const DARK = {
    bgPrimary:    '#0d1117',
    bgSecondary:  '#161b22',
    bgCard:       '#1c2128',
    bgHover:      '#1f2937',
    bgInput:      '#21262d',
    border:       '#30363d',
    borderStrong: '#484f58',
    textPrimary:  '#e6edf3',
    textSecondary:'#c9d1d9',
    textMuted:    '#8b949e',
    textFaint:    '#6e7681',
    // Semantic
    activeCell:   'rgba(245,158,11,0.14)',
    activeBorder: '#f59e0b',
    activeText:   '#fbbf24',
    errorCell:    'rgba(239,68,68,0.14)',
    errorBorder:  '#ef4444',
};

const LIGHT = {
    bgPrimary:    '#ffffff',
    bgSecondary:  '#f6f8fa',
    bgCard:       '#ffffff',
    bgHover:      '#eaeef2',
    bgInput:      '#f6f8fa',
    border:       '#d0d7de',
    borderStrong: '#afb8c1',
    textPrimary:  '#1f2328',
    textSecondary:'#24292f',
    textMuted:    '#57606a',
    textFaint:    '#6e7781',
    // Semantic (same across themes — amber/red are universal)
    activeCell:   'rgba(245,158,11,0.12)',
    activeBorder: '#f59e0b',
    activeText:   '#b45309',
    errorCell:    'rgba(239,68,68,0.10)',
    errorBorder:  '#ef4444',
};

// ── Helper ────────────────────────────────────────────────────────────────────
function getCurrentTheme() {
    if (typeof document === 'undefined') return 'dark';
    const attr = document.documentElement.getAttribute('data-theme');
    const cls  = document.documentElement.classList;
    if (attr === 'light' || cls.contains('light')) return 'light';
    return 'dark';
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useThemeColors() {
    const [theme, setTheme] = useState(getCurrentTheme);

    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(getCurrentTheme()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class'],
        });
        return () => observer.disconnect();
    }, []);

    return theme === 'light' ? LIGHT : DARK;
}

export { DARK, LIGHT };