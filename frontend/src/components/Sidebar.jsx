import React, { useEffect, useState } from 'react';
import { Swords, History, Trophy, BookOpen, Globe, Zap, Eye, Map } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ live: 0, total: 0 });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'https://codearena-1v1.onrender.com';
    
    // 1. INITIAL FETCH (With Retry Logic for sleeping servers)
    const fetchStats = async () => {
        try {
            const res = await fetch(`${socketUrl.replace(/\/$/, '')}/api/stats`);
            if (res.ok) {
                const d = await res.json();
                if (d) setStats(prev => ({ ...prev, live: d.live || 0, total: d.total || 0 }));
            }
        } catch (e) { console.error("Stats fetch failed", e); }
    };
    fetchStats();

    // 2. SOCKET CONFIG
    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5
    });

    socket.on('site_stats', (data) => {
      if (data) {
        // ✅ FIXED: Use Functional Update 'prev' to avoid stale closure
        setStats(prev => ({
          live: typeof data.live === 'number' ? data.live : prev.live,
          total: typeof data.total === 'number' ? data.total : prev.total
        }));
      }
    });

    return () => {
      socket.off('site_stats');
      socket.disconnect();
    };
  }, []);

  // Menu Configuration
  const menu = [
    { name: 'Battle', icon: Swords, path: '/dashboard' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Ranks', icon: Trophy, path: '/leaderboard' },
    { name: 'Learn', icon: BookOpen, path: '/resources' },
    { name: 'Visualizer', icon: Eye, path: '/visualizer' },
    { name: 'Campaign', icon: Map, path: '/campaign' }
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex-col py-6 h-auto">
        <div className="px-4 mb-6">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Main Menu</h3>
        </div>
        
        <div className="flex flex-col gap-1 px-3 flex-grow">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-accent text-black shadow-lg shadow-green-900/20 font-bold' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <item.icon size={18} />
                {item.name === 'Battle' ? 'Battle Arena' : 
                 item.name === 'Ranks' ? 'Leaderboard' : 
                 item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-auto px-4 space-y-4">
          <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Globe size={14} className="text-blue-400" />
                      <span className="text-xs font-bold">Total Users</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{stats.total}</span>
              </div>
              <div className="h-px bg-[var(--border-color)] w-full"></div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </div>
                      <span className="text-xs font-bold">Online Now</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-accent">{stats.live}</span>
              </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
            <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1 flex items-center gap-2">
                <Zap size={16} className="text-yellow-400 fill-current" /> Pro Plan
            </h4>
            <button onClick={() => navigate('/pricing')} className="w-full py-2 mt-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">Upgrade</button>
          </div>
        </div>
      </aside>

      {/* MOBILE STATS STRIP */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 h-12 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </div>
                  <span className="text-[var(--text-secondary)] font-bold">Live: <span className="text-accent">{stats.live}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                  <Globe size={10} className="text-blue-400" />
                  <span className="text-[var(--text-secondary)] font-bold">Total: <span className="text-[var(--text-primary)]">{stats.total}</span></span>
              </div>
          </div>

          <button onClick={() => navigate('/pricing')} className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-[10px] font-bold hover:bg-yellow-500/20 transition-colors">
              <Zap size={12} className="fill-current" /> Upgrade
          </button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex justify-around items-center z-50">
         {menu.map((item) => (
           <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-accent' : 'text-[var(--text-secondary)]'}`}>
             <item.icon size={20} />
             <span className="text-[10px] font-medium">{item.name}</span>
           </button>
         ))}
      </nav>
    </>
  );
};

export default Sidebar;
// V 1.5
