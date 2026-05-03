import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Swords, History, Trophy, BookOpen, Globe, Zap, Eye, Map } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ live: 0, total: 0 });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'https://codearena-1v1.onrender.com';

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

    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5,
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
    { name: 'Battle', icon: Swords, path: '/dashboard' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Ranks', icon: Trophy, path: '/leaderboard' },
    { name: 'Learn', icon: BookOpen, path: '/resources' },
    { name: 'Visualizer', icon: Eye, path: '/visualizer' },
    { name: 'Campaign', icon: Map, path: '/campaign' },
  ];

  return (
    <>
      {/* Legacy Bright Theme Sidebar Surface (for quick reversal): bg-[var(--bg-secondary)] */}
      <aside className="hidden h-auto w-64 flex-col border-r border-[var(--border-color)] bg-[var(--surface-elevated)] py-6 md:flex">
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
                {item.name === 'Battle' ? 'Battle Arena' : item.name === 'Ranks' ? 'Leaderboard' : item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-auto space-y-4 px-4">
          <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Globe size={14} className="text-blue-500" />
                <span className="text-xs font-bold">Total Users</span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{stats.total}</span>
            </div>
            <div className="h-px w-full bg-[var(--border-color)]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </div>
                <span className="text-xs font-bold">Online Now</span>
              </div>
              <span className="text-xs font-mono font-bold text-accent">{stats.live}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4">
            <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Zap size={16} className="fill-current text-yellow-500" /> Pro Plan
            </h4>
            {/* Legacy Bright Theme Upgrade Button (for quick reversal): bg-[var(--bg-secondary)] */}
            <button
              onClick={() => navigate('/pricing')}
              className="mt-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] py-2 text-xs font-bold text-[var(--text-primary)] transition-opacity hover:opacity-80"
            >
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed bottom-16 left-0 right-0 z-40 flex h-12 items-center justify-between border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 md:hidden">
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
            <span className="font-bold text-[var(--text-secondary)]">Live: <span className="text-accent">{stats.live}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe size={10} className="text-blue-500" />
            <span className="font-bold text-[var(--text-secondary)]">Total: <span className="text-[var(--text-primary)]">{stats.total}</span></span>
          </div>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold text-yellow-600 transition-colors hover:bg-yellow-500/20"
        >
          <Zap size={12} className="fill-current" /> Upgrade
        </button>
      </div>

      {/* Legacy Bright Theme Mobile Nav Surface (for quick reversal): bg-[var(--bg-secondary)] */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[var(--border-color)] bg-[var(--surface-elevated)] md:hidden">
        {menu.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-accent' : 'text-[var(--text-secondary)]'}`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
