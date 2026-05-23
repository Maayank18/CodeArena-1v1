// FILE: frontend/src/pages/Leaderboard.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api.js'; 
import { Trophy, Medal, Flame, Search, AlertCircle, Loader2 } from 'lucide-react';
import { getLevelInfo } from '../utils/levelSystem';
import { getBadgeIconData } from '../utils/badgeHelper'; 
import BadgeArtwork from '../components/badges/BadgeArtwork.jsx';
import Avatar from '../components/Avatar'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LEADERBOARD_CACHE_KEY, readStoredUser } from '../utils/sessionSync.js';
import { useTheme } from '../context/ThemeContext';

const CACHE_DURATION = 60000; // 60 seconds

const STACK_COLORS = {
    javascript: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    typescript: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    python: 'text-green-400 bg-green-400/10 border-green-400/30',
    java: 'text-red-400 bg-red-400/10 border-red-400/30',
    cpp: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    go: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    rust: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    kotlin: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    swift: 'text-orange-300 bg-orange-300/10 border-orange-300/30',
    csharp: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
    ruby: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
    dart: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
};

const Leaderboard = () => {
  const { advancedTheme } = useTheme();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [user, setUser] = useState(() => readStoredUser() || {});
  
  const navigate = useNavigate();

  // ✅ OPTIMIZED: Memoized logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    localStorage.removeItem(LEADERBOARD_CACHE_KEY);
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate]);

  // ✅ OPTIMIZED: Fetch leaderboard with caching
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const cache = localStorage.getItem(LEADERBOARD_CACHE_KEY);
      
      if (cache) {
        try {
          const { data, timestamp } = JSON.parse(cache);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setPlayers(data);
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.warn('[Leaderboard] Cache parse failed:', cacheError);
        }
      }

      try {
        const { data } = await api.get('/users/leaderboard', {
          meta: { skipCache: true },
        });
        setPlayers(data);
        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (error) {
        console.error('[Leaderboard] Fetch failed:', error);
        toast.error("Could not load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredPlayers = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return Array.isArray(players)
      ? players.filter((player) => String(player?.username || '').toLowerCase().includes(lowerFilter))
      : [];
  }, [players, filter]);

  const getRankIcon = useCallback((rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
    if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
    return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
  }, []);

  const playerRows = useMemo(() => {
    const isFrostbyte = advancedTheme === 'frostbyte';
    
    return filteredPlayers.map((player, index) => {
      const rank = index + 1;
      const { title, color, hex } = getLevelInfo(player.rating || 1000);
      const isCurrentUser = player.username === user.username;

      const snowDecorations = "overflow-hidden after:pointer-events-none after:absolute after:-top-4 after:-right-4 after:w-16 after:h-16 after:bg-white/10 after:blur-xl after:rotate-45";
      
      const rowClasses = isFrostbyte
        ? `relative grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center group cursor-default rounded-xl bg-[#060B19]/40 backdrop-blur-xl border border-cyan-300/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.15),0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-cyan-900/30 hover:border-cyan-300/60 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] ${snowDecorations} ${isCurrentUser ? 'border-l-4 border-l-cyan-400' : ''}`
        : `grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[var(--bg-tertiary)] transition-colors group cursor-default ${isCurrentUser ? 'bg-accent/5 border-l-4 border-l-accent' : ''}`;

      return (
        <div key={player._id || index} className={rowClasses}>
          {isFrostbyte && rank === 1 && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/60 via-cyan-300/40 to-transparent z-10 rounded-t-xl" />
          )}
          <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
            {getRankIcon(rank)}
          </div>

          <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
            <Avatar 
              username={player.username} 
              src={player.avatar}
              avatarFrame={player.customization?.avatarFrame}
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-all" 
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm sm:text-base truncate text-[var(--text-primary)]`}>
                  {(() => {
                    const equippedBadgeId = player.customization?.equippedBadge;
                    if (!equippedBadgeId) return null;

                    const badgeData = getBadgeIconData(equippedBadgeId);
                    return (
                      <BadgeArtwork
                        badgeId={equippedBadgeId}
                        label={badgeData?.name || equippedBadgeId}
                        title={badgeData?.name || equippedBadgeId}
                        frameClassName="mr-1.5 inline-flex h-6 w-6 shrink-0 align-middle"
                        imageClassName="h-full w-full object-contain"
                        iconSize={10}
                      />
                    );
                  })()}{player.username}
                </span>
                {isCurrentUser && <span className="text-[9px] bg-accent text-black px-1.5 py-0.5 rounded font-black shrink-0">YOU</span>}
                <div className="hidden sm:flex items-center gap-1">
                  {(player.customization?.signatureStack || []).map(lang => (
                    <div key={lang} className={`w-2 h-2 rounded-full ${STACK_COLORS[lang]?.split(' ')[1] || 'bg-gray-600'}`} title={lang} />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] truncate italic opacity-80">
                {player.customization?.tagline || title}
              </span>
            </div>
          </div>

          <div className="col-span-2 hidden sm:flex justify-center">
            <span className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full border bg-[var(--bg-primary)]/80 ${color} uppercase tracking-tight`} style={{ borderColor: `${hex}33`, boxShadow: `0 0 12px ${hex}15` }}>
              {title}
            </span>
          </div>

          <div className="col-span-2 hidden md:block text-center text-[var(--text-secondary)] text-sm font-mono font-bold">
            {player.stats?.matchesPlayed || 0}
          </div>

          <div className="col-span-3 sm:col-span-2 text-right pr-2">
            <span className="font-mono font-black text-green-400 text-base sm:text-lg">{player.seasonScore || 0}</span>
            <span className="text-[10px] text-[var(--text-secondary)] block -mt-1 font-bold">PTS</span>
          </div>
        </div>
      );
    });
  }, [filteredPlayers, user.username, getRankIcon, advancedTheme]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0">
        <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 bg-[var(--bg-primary)]">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className={advancedTheme === 'frostbyte'
                  ? "text-2xl sm:text-4xl mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] font-bold tracking-wider"
                  : "text-2xl sm:text-4xl font-black tracking-tight uppercase flex items-center gap-3"
                }>
                  <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} /> Leaderboard
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">Top coding warriors of the current season.</p>
              </div>
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-green-400 transition-colors h-4 w-4" />
                <input 
                  type="text" placeholder="Find a player..." 
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                  value={filter} onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
            {/* The table/list container */}
            <div className={advancedTheme === 'frostbyte' ? 'snow-cap' : 'bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-[0_24px_48px_-28px_var(--shadow-color)]'}>
              <div className={advancedTheme === 'frostbyte' 
                ? "grid grid-cols-12 gap-2 sm:gap-4 p-4 text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider items-center mb-2" 
                : "grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider items-center"}>
                <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
                <div className="col-span-2 hidden sm:block text-center">Level</div>
                <div className="col-span-2 hidden md:block text-center">Matches</div>
                <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
              </div>
              <div className={advancedTheme === 'frostbyte' ? "space-y-3" : "divide-y divide-[var(--border-color)]/50"}>
                {loading ? <div className="py-20 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-accent mb-4" size={32} /><p className="text-[var(--text-secondary)] font-bold animate-pulse">Loading rankings...</p></div> : filteredPlayers.length > 0 ? playerRows : <div className="p-12 flex flex-col items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-primary)]/50 m-4"><AlertCircle size={48} className="mb-4 opacity-20" /><p className="font-bold uppercase tracking-widest text-xs">{filter ? 'No players found' : 'No data available'}</p></div>}
              </div>
            </div>
            <div className="text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] pt-4 pb-20 md:pb-0">Leaderboard refreshes every 60 seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
