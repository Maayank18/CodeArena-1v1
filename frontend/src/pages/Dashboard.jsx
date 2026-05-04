// FILE: frontend/src/pages/Dashboard.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; 
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { Loader2, Trophy } from 'lucide-react'; 
import api from '../api.js'; 
import { getLevelInfo } from '../utils/levelSystem';
import ChatWidget from '../components/ChatWIdget.jsx';
import ConsistencyCalendar from '../components/ConsistencyCalendar';

const CACHE_KEY = 'dashboard_profile_cache';
const CACHE_DURATION = 60000; // 60 seconds

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // ✅ OPTIMIZED: Memoize rank calculation
  const rankInfo = useMemo(() => {
    return getLevelInfo(user?.rating || 1000);
  }, [user?.rating]);

  // ✅ OPTIMIZED: Fetch user data with proper error handling
  useEffect(() => {
    const syncUserAndData = async () => {
      const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
      if (!storedUser) { 
        navigate('/login'); 
        return; 
      }
      
      setUser(storedUser);

      const cache = localStorage.getItem(CACHE_KEY);
      let shouldFetch = true;
      
      if (cache) {
        try {
          const { data, timestamp } = JSON.parse(cache);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            shouldFetch = false;
            const cachedUser = { ...storedUser, ...data };
            setUser(cachedUser);
            localStorage.setItem('codearena_user', JSON.stringify(cachedUser));
          }
        } catch (e) {
          console.error("[CACHE] Parse error:", e);
        }
      }

      if (!shouldFetch) return;

      try {
        const response = await api.get(`/users/profile/${storedUser.username}`);
        const serverUser = response.data;

        const finalUser = { 
          ...storedUser,
          ...serverUser,
          stats: serverUser.stats || storedUser.stats || { 
            matchesPlayed: 0, 
            wins: 0, 
            losses: 0 
          }
        };
        
        setUser(finalUser);
        localStorage.setItem('codearena_user', JSON.stringify(finalUser));
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: serverUser,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error("[PROFILE] Sync failed:", err);
      }
    };
    
    syncUserAndData();
  }, [navigate]);

  // ✅ OPTIMIZED: Memoized handlers
  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    localStorage.removeItem(CACHE_KEY);
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate]);

  // ✅ FIXED: Using the specific property extracted from user to match inferred dependencies
  const username = user?.username;

  const handleJoinRoom = useCallback(() => {
    if (!roomIdInput.trim()) {
      toast.error('Please enter a Room ID');
      return;
    }
    setIsNavigating(true);
    setLoadingText('Entering the Arena...');
    // We use the 'username' variable here which is stable 
    navigate(`/editor/${roomIdInput}`, { state: { username } });
  }, [roomIdInput, navigate, username]);

  const createRoom = useCallback(async () => {
    setIsNavigating(true);
    setLoadingText('Initializing Battleground...');
    try {
      let newRoomId;
      try {
        const response = await api.post('/rooms');
        newRoomId = response.data.roomId;
      } catch (err) {
        console.warn("[ROOM] API failed, using local UUID:", err.message);
        newRoomId = uuidv4().split('-'); 
      }
      navigate(`/editor/${newRoomId}`, { state: { username } });
    } catch (error) {
      console.error("[ROOM] Creation failed:", error);
      toast.error("Failed to initialize room");
      setIsNavigating(false);
    }
  }, [navigate, username]);

  // ✅ Guard clause with loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full relative">
          <div className="min-h-full flex flex-col">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
              
              <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
                Join a room or create a new one to challenge a friend.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                
                {/* Legacy Bright Theme Hero Card Surface (for quick reversal): bg-[var(--bg-secondary)] */}
                <div className="bg-[var(--surface-elevated)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-[0_24px_48px_-28px_var(--shadow-color)] space-y-6 md:space-y-8 h-full flex flex-col justify-center">
                  
                  <div>
                    <label className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                      Join Existing Room
                    </label>
                    <div className="flex gap-2 md:gap-3">
                      <input 
                        type="text" 
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                        placeholder="Paste Room ID..."
                        disabled={isNavigating}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                        aria-label="Room ID"
                      />
                      <button 
                        onClick={handleJoinRoom} 
                        disabled={isNavigating || !roomIdInput.trim()} 
                        className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        aria-label="Join Room"
                      >
                        Join
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                    <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                  </div>

                  <button 
                    onClick={createRoom} 
                    disabled={isNavigating} 
                    className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create New Room"
                  >
                    Create New Battle Room
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--surface-elevated)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-[0_20px_40px_-28px_var(--shadow-color)] hover:border-accent/50 transition-colors">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
                  </div>

                  <div className="bg-[var(--surface-elevated)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-[0_20px_40px_-28px_var(--shadow-color)] hover:border-accent/50 transition-colors">
                    <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
                  </div>

                  <div className="col-span-2 bg-[var(--surface-elevated)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col shadow-[0_20px_40px_-28px_var(--shadow-color)] hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <h3 className={`text-2xl font-black ${rankInfo.color} uppercase tracking-tighter`}>
                          {rankInfo.title}
                        </h3>
                        <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">
                          Current Rank
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-4 py-2 rounded-xl border border-[var(--border-color)]">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-xl font-mono font-black text-[var(--text-primary)]">
                          {user.rating || 1000}
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                        <span>Progress</span>
                        <span>
                          {rankInfo.nextThreshold !== "MAX" 
                            ? `${rankInfo.nextThreshold - (user.rating || 1000)} ELO to next rank` 
                            : 'Max Rank Reached'}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-primary)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
                        <div 
                          className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                          style={{ 
                            width: `${rankInfo.progressPercentage}%`, 
                            backgroundColor: rankInfo.hex || '#4ade80'
                          }}
                          role="progressbar"
                          aria-valuenow={rankInfo.progressPercentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Consistency Calendar - Visible only on small screens */}
              <div className="px-4 pb-8 lg:hidden">
                <ConsistencyCalendar className="w-full" />
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </div>

      {isNavigating && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center bg-black/80 backdrop-blur-sm"
        >
           <div className="scale-125 md:scale-150 mb-8">
             <Logo />
           </div>
           <div className="flex flex-col md:flex-row items-center gap-3 text-[var(--text-primary)] text-lg md:text-xl font-bold">
              <Loader2 className="animate-spin text-accent" size={24} />
              <span>{loadingText}</span>
           </div>
        </div>
      )}
      <ChatWidget user={user} />
    </div>
  );
};

export default Dashboard;
// V 1.5
