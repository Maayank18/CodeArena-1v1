// ═══════════════════════════════════════════════════════════════
// FILE: frontend/src/hooks/useTelemetry.js
// Emits user presence & route-based activity to the backend.
// Uses a custom debounce (no lodash dependency required).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

// ── Route → Activity mapping ──────────────────────────────────
const ROUTE_ACTIVITY_MAP = {
    '/dashboard':   'IDLE_LOBBY',
    '/history':     'IDLE_LOBBY',
    '/leaderboard': 'IDLE_LOBBY',
    '/resources':   'IDLE_LOBBY',
    '/pricing':     'IDLE_LOBBY',
    '/visualizer':  'ALGO_VISUALIZER',
    '/campaign':    'CAMPAIGN_MAP',
    '/admin':       'ADMIN_PANEL',
};

/**
 * Resolves the current activity string from a pathname.
 */
function resolveActivity(pathname) {
    // Exact match first
    if (ROUTE_ACTIVITY_MAP[pathname]) return ROUTE_ACTIVITY_MAP[pathname];

    // Dynamic routes
    if (pathname.startsWith('/editor/'))   return 'IN_MATCH';
    if (pathname.startsWith('/campaign/')) return 'CAMPAIGN_MAP';

    return 'IDLE_LOBBY';
}

/**
 * Custom debounce — avoids lodash as a project dependency.
 */
function debounce(fn, delay) {
    let timerId;
    const debounced = (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => fn(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timerId);
    return debounced;
}

/**
 * Hook: useTelemetry
 * 
 * Creates a dedicated socket connection for presence telemetry.
 * Emits `user_connected` once, then debounced `update_activity`
 * on every route change (400 ms debounce to prevent spam).
 *
 * Usage:
 *   import useTelemetry from '../hooks/useTelemetry';
 *   // Inside any layout/wrapper component:
 *   useTelemetry();
 */
export default function useTelemetry() {
    const location = useLocation();
    const socketRef = useRef(null);
    const debouncedRef = useRef(null);

    // ── 1. Connect once, announce user_connected ──────────
    useEffect(() => {
        const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem('codearena_user')); }
            catch { return null; }
        })();

        if (!storedUser?.username) return; // Not logged in — skip

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        socketRef.current = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('user_connected', {
                userId:   storedUser._id   || storedUser.id || null,
                username: storedUser.username,
                avatar:   storedUser.avatar || '',
                activity: resolveActivity(window.location.pathname),
            });
        });

        return () => {
            if (debouncedRef.current) debouncedRef.current.cancel();
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []); // Mount once

    // ── 2. Debounced activity updates on route change ─────
    useEffect(() => {
        if (!socketRef.current?.connected) return;

        if (!debouncedRef.current) {
            debouncedRef.current = debounce((activity) => {
                socketRef.current?.emit('update_activity', { activity });
            }, 400);
        }

        const activity = resolveActivity(location.pathname);
        debouncedRef.current(activity);
    }, [location.pathname]);
}
