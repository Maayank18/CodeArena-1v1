import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Swords, History, Trophy, BookOpen, Globe, Zap, Eye, Map } from 'lucide-react';
import ConsistencyCalendar from './ConsistencyCalendar';
import { getStoredAuthToken, resolveBackendOrigin } from '../api.js';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { advancedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ live: 0, total: 0 });

  useEffect(() => {
    const socketUrl = resolveBackendOrigin();
    const token = getStoredAuthToken();

    const fetchStats = async () => {
      try {
        const response = await fetch(`${socketUrl.replace(/\/$/, '')}/api/stats`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data) {
          setStats((prev) => ({
            ...prev,
            live: data.live || 0,
            total: data.total || 0,
          }));
        }
      } catch (error) {
        console.error('Stats fetch failed', error);
      }
    };

    fetchStats();

    if (!token) {
      return undefined;
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5,
      auth: {
        token,
      },
    });

    socket.on('site_stats', (data) => {
      if (!data) {
        return;
      }

      setStats((prev) => ({
        live: typeof data.live === 'number' ? data.live : prev.live,
        total: typeof data.total === 'number' ? data.total : prev.total,
      }));
    });

    return () => {
      socket.off('site_stats');
      socket.disconnect();
    };
  }, []);

  const menu = [
    { name: 'Battle', mobileLabel: 'Battle', desktopLabel: 'Battle Arena', icon: Swords, path: '/dashboard' },
    { name: 'History', mobileLabel: 'History', desktopLabel: 'History', icon: History, path: '/history' },
    { name: 'Ranks', mobileLabel: 'Ranks', desktopLabel: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { name: 'Learn', mobileLabel: 'Learn', desktopLabel: 'Learn', icon: BookOpen, path: '/resources' },
    { name: 'Visualizer', mobileLabel: 'Visualize', desktopLabel: 'Visualizer', icon: Eye, path: '/visualizer' },
    { name: 'Campaign', mobileLabel: 'Campaign', desktopLabel: 'Campaign', icon: Map, path: '/campaign' },
  ];

  return (
    <>
      {/* Legacy Bright Theme Sidebar Surface (for quick reversal): bg-[var(--bg-secondary)] */}
      <aside className={`hidden h-full w-64 flex-col border-r border-[var(--border-color)] bg-[var(--surface-elevated)] py-6 lg:flex ${advancedTheme === 'frostbyte' ? 'snow-cap' : ''}`}>
        <div className="mb-6 px-4">
          <h3 className="px-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Main Menu</h3>
        </div>

        <div className="flex flex-grow flex-col gap-1 px-3">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent font-bold text-black shadow-lg shadow-green-900/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <item.icon size={18} />
                <span className="truncate">{item.desktopLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-grow flex flex-col justify-center py-4">
          <ConsistencyCalendar className="mx-3 hidden xl:block" />
        </div>

        <div className="mt-auto px-4 pb-8">
          <div className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] py-3 px-4 transition-all hover:bg-[var(--bg-tertiary)]/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Online Now</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-accent">{stats.live}</span>
                <div className="h-1 w-1 rounded-full bg-[var(--text-secondary)] opacity-30" />
                <span className="text-[9px] font-medium text-[var(--text-secondary)] uppercase">Live</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="mobile-sidebar-status fixed bottom-16 left-0 right-0 z-40 flex h-12 items-center justify-between border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 lg:hidden">
        <div className="flex items-center gap-1.5">
          <div className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
          </div>
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">Online Now: <span className="text-accent">{stats.live}</span></span>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="mobile-upgrade-button flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold text-yellow-600 transition-colors hover:bg-yellow-500/20"
        >
          <Zap size={12} className="fill-current" /> Upgrade
        </button>
      </div>

      {/* Legacy Bright Theme Mobile Nav Surface (for quick reversal): bg-[var(--bg-secondary)] */}
      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[var(--border-color)] bg-[var(--surface-elevated)] lg:hidden">
        {menu.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`mobile-nav-button flex min-w-0 flex-1 flex-col items-center gap-1 px-1 ${location.pathname === item.path ? 'text-accent' : 'text-[var(--text-secondary)]'}`}
          >
            <item.icon size={20} />
            <span className="mobile-nav-label max-w-full truncate text-[9px] font-medium sm:text-[10px]">{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
