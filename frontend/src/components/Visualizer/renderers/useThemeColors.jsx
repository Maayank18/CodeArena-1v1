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
    // Legacy Bright Theme Renderer Tokens (for quick reversal)
    // bgPrimary:    '#ffffff',
    // bgSecondary:  '#f6f8fa',
    bgPrimary:    '#fafaf9',
    bgSecondary:  '#ffffff',
    bgCard:       '#ffffff',
    bgHover:      '#f1f5f9',
    bgInput:      '#f5f5f4',
    border:       '#e5e7eb',
    borderStrong: '#cbd5e1',
    textPrimary:  '#1f2937',
    textSecondary:'#334155',
    textMuted:    '#64748b',
    textFaint:    '#94a3b8',
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
    if (attr === 'light') return 'light';
    if (attr === 'dark') return 'dark';
    if (cls.contains('dark')) return 'dark';
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
// V 1.5

// Version-2.0