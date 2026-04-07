// FILE: frontend/src/pages/Leaderboard.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api.js'; 
import { Trophy, Medal, Flame, Search, AlertCircle, Loader2 } from 'lucide-react';
import { getLevelInfo } from '../utils/levelSystem'; 
import Avatar from '../components/Avatar'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LEADERBOARD_CACHE_KEY = 'leaderboard_cache';
const CACHE_DURATION = 60000; // 60 seconds

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

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
      // Check cache first
      const cache = localStorage.getItem(LEADERBOARD_CACHE_KEY);
      
      if (cache) {
        try {
          const { data, timestamp } = JSON.parse(cache);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            setPlayers(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("[CACHE] Parse error:", e);
        }
      }

      // Fetch fresh data
      try {
        const { data } = await api.get('/users/leaderboard');
        setPlayers(data);
        
        // Update cache
        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("[LEADERBOARD] Fetch error:", error);
        toast.error("Could not load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // ✅ OPTIMIZED: Memoized filtered players
  const filteredPlayers = useMemo(() => {
    if (!filter.trim()) return players;
    
    const lowerFilter = filter.toLowerCase();
    return players.filter(p => 
      p.username.toLowerCase().includes(lowerFilter)
    );
  }, [players, filter]);

  // ✅ OPTIMIZED: Memoized rank icon function
  const getRankIcon = useCallback((rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
    if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
    return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
  }, []);

  // ✅ OPTIMIZED: Memoized player rows
  const playerRows = useMemo(() => {
    return filteredPlayers.map((player, index) => {
      const rank = index + 1;
      const { title, color, hex } = getLevelInfo(player.rating || 1000);
      const isCurrentUser = player.username === user.username;

      return (
        <div 
          key={player._id || index} 
          className={`grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors group cursor-default ${
            isCurrentUser ? 'bg-accent/5 border-l-4 border-l-accent' : ''
          }`}
        >
          {/* Rank Icon */}
          <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
            {getRankIcon(rank)}
          </div>

          {/* Player Info */}
          <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
            <Avatar 
              username={player.username} 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-all" 
            />
            <div className="flex flex-col min-w-0">
              <span className={`font-bold text-sm sm:text-base truncate ${
                rank <= 3 ? 'text-white' : 'text-[var(--text-primary)]'
              }`}>
                {player.username}
                {isCurrentUser && (
                  <span className="ml-2 text-[10px] bg-accent text-black px-1.5 py-0.5 rounded-md">
                    YOU
                  </span>
                )}
              </span>
              <span className={`text-[10px] sm:hidden ${color} opacity-90 truncate font-black uppercase tracking-tighter`}>
                {title}
              </span>
            </div>
          </div>

          {/* Level Badge (Hidden on mobile) */}
          <div className="col-span-2 hidden sm:flex justify-center">
            <span 
              className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full border bg-[var(--bg-primary)]/80 ${color} uppercase tracking-tight`}
              style={{ 
                borderColor: `${hex}33`, 
                boxShadow: `0 0 12px ${hex}15` 
              }}
            >
              {title}
            </span>
          </div>

          {/* Matches (Hidden on mobile) */}
          <div className="col-span-2 hidden md:block text-center text-[var(--text-secondary)] text-sm font-mono font-bold">
            {player.stats?.matchesPlayed || 0}
          </div>

          {/* Season Score */}
          <div className="col-span-3 sm:col-span-2 text-right pr-2">
            <span className="font-mono font-black text-green-400 text-base sm:text-lg">
              {player.seasonScore || 0}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] block -mt-1 font-bold">
              PTS
            </span>
          </div>
        </div>
      );
    });
  }, [filteredPlayers, user.username, getRankIcon]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-w-0">
        <Navbar user={user} onLogout={handleLogout} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-[var(--bg-primary)]">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
                  <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} /> 
                  Leaderboard
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
                  Top coding warriors of the current season.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-green-400 transition-colors h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Find a player..." 
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Search players"
                />
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl relative">
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider items-center">
                <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
                <div className="col-span-2 hidden sm:block text-center">Level</div>
                <div className="col-span-2 hidden md:block text-center">Matches</div>
                <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[var(--border-color)]/50">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-accent mb-4" size={32} />
                    <p className="text-[var(--text-secondary)] font-bold animate-pulse">
                      Loading rankings...
                    </p>
                  </div>
                ) : filteredPlayers.length > 0 ? (
                  playerRows
                ) : (
                  <div className="p-12 flex flex-col items-center justify-center text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-primary)]/50 m-4">
                    <AlertCircle size={48} className="mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      {filter ? 'No players found' : 'No data available'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Note */}
            <div className="text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] pt-4 pb-20 md:pb-0">
              Leaderboard refreshes every 60 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;