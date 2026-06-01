// FILE: frontend/src/pages/Dashboard.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; 
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { Loader2, Trophy, Swords } from 'lucide-react';
import api from '../api.js';
import { getLevelInfo } from '../utils/levelSystem';
import { getBadgeIconData } from '../utils/badgeHelper';
import BadgeArtwork from '../components/badges/BadgeArtwork.jsx';
import ChatWidget from '../components/ChatWIdget.jsx';
import ConsistencyCalendar from '../components/ConsistencyCalendar';
import { useTheme } from '../context/ThemeContext';
import CustomMatchModal from '../components/CustomMatchModal';
import PremiumGate from '../components/PremiumGate.jsx';
import { useAuthSession } from '../context/AuthSessionContext.jsx';
import {
  mergeUserProfile,
  refreshCurrentUserProfile,
} from '../utils/sessionSync.js';
import {
  DASHBOARD_CACHE_KEY,
  readStoredUser,
} from '../utils/authSessionStorage.js';

const CACHE_DURATION = 60000; // 60 seconds
const buildCustomRoomAuthKey = (roomId) => `codearena_custom_room_auth_${roomId}`;

const Dashboard = () => {
  const { advancedTheme, clearAdvancedTheme } = useTheme();
  const { user, isHydrated, clearSession, updateSession, refreshSession } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const rankInfo = useMemo(() => {
    return getLevelInfo(user?.rating || 1000);
  }, [user?.rating]);
  const lastSyncKeyRef = React.useRef('');
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user?.username) {
      navigate('/login');
      return;
    }

    const syncKey = `${user.username}:${Boolean(location.state?.forceProfileRefresh)}`;
    if (lastSyncKeyRef.current === syncKey) {
      return;
    }
    lastSyncKeyRef.current = syncKey;

    let cancelled = false;

    const syncUserAndData = async () => {
      const shouldForceRefresh = Boolean(location.state?.forceProfileRefresh);
      const cache = shouldForceRefresh ? null : localStorage.getItem(DASHBOARD_CACHE_KEY);
      
      if (cache) {
        try {
          const { data, timestamp } = JSON.parse(cache);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            const cachedUser = mergeUserProfile(user, data);
            if (!cancelled && JSON.stringify(user) !== JSON.stringify(cachedUser)) {
              updateSession(cachedUser, {
                clearDerived: false,
                dispatch: true,
              });
            }
            return;
          }
        } catch (e) {
          console.error("[CACHE] Parse error:", e);
        }
      }

      try {
        const finalUser = await refreshSession();
        if (!finalUser || cancelled) {
          return;
        }

        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
          data: finalUser,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error("[PROFILE] Sync failed:", err);
      }
    };
    
    syncUserAndData();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, location.state, navigate, refreshSession, updateSession, user]);

  const handleLogout = useCallback(() => {
    clearAdvancedTheme();
    clearSession({
      clearDerived: true,
      eventDetail: { redirectTo: '/', replace: true },
    });
    toast.success('Logged out successfully');
  }, [clearAdvancedTheme, clearSession]);

  const username = user?.username;

  const handleJoinRoom = useCallback(() => {
    if (!roomIdInput.trim()) {
      toast.error('Please enter a Room ID');
      return;
    }
    const trimmedRoomId = roomIdInput.trim().toUpperCase();
    const goToRoom = (roomId, state = {}) => {
      setIsNavigating(true);
      setLoadingText('Entering the Arena...');
      navigate(`/editor/${roomId}`, { state: { username, ...state } });
    };

    if (!trimmedRoomId.startsWith('C-')) {
      goToRoom(trimmedRoomId);
      return;
    }

    setIsNavigating(true);
    setLoadingText('Authorizing Custom Arena...');

    api.post(`/rooms/custom/${trimmedRoomId}/join`)
      .then(({ data }) => {
        if (!data?.success || !data?.joinToken) {
          throw new Error(data?.message || 'Failed to authorize custom room');
        }

        localStorage.setItem(
          buildCustomRoomAuthKey(trimmedRoomId),
          JSON.stringify({ joinToken: data.joinToken, savedAt: Date.now() })
        );

        navigate(`/editor/${trimmedRoomId}`, {
          state: {
            username,
            joinToken: data.joinToken,
            customSettings: data.customSettings || null,
            isCustomRoom: true,
          }
        });
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || error.message || 'Failed to join custom room');
        setIsNavigating(false);
      });
  }, [roomIdInput, navigate, username]);

  const createRoom = useCallback(async () => {
    setIsNavigating(true);
    setLoadingText('Initializing Battleground...');
    try {
      const response = await api.post('/rooms');
      const newRoomId = response?.data?.roomId;

      if (!newRoomId || typeof newRoomId !== 'string') {
        throw new Error('Room creation did not return a valid room ID');
      }

      navigate(`/editor/${newRoomId}`, { state: { username } });
    } catch (error) {
      console.error("[ROOM] Creation failed:", error);
      toast.error(error?.response?.data?.message || "Failed to initialize room");
      setIsNavigating(false);
    }
  }, [navigate, username]);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  const isFrostbyte = advancedTheme === 'frostbyte';
  const isMatrix = advancedTheme === 'matrix';
  
  // Ice block styling formulas
  const snowDecorations = "snow-cap overflow-hidden after:pointer-events-none after:absolute after:-top-4 after:-right-4 after:w-16 after:h-16 after:bg-white/10 after:blur-xl after:rotate-45";
  const iceBlockBase = `relative bg-[#060B19]/40 backdrop-blur-xl border border-cyan-300/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.15),0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ${isFrostbyte ? snowDecorations : ''}`;
  const iceBlockHover = "hover:bg-cyan-900/30 hover:border-cyan-300/60 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] group";
  
  const getPanelClass = (interactive = false) => {
    if (isFrostbyte) return interactive ? `${iceBlockBase} ${iceBlockHover}` : iceBlockBase;
    if (isMatrix) return `matrix-panel ${interactive ? 'hover:-translate-y-1 transition-transform' : ''}`;
    return `bg-[var(--surface-elevated)] border border-[var(--border-color)] shadow-[0_24px_48px_-28px_var(--shadow-color)] ${interactive ? 'hover:border-accent/50 transition-all' : ''}`;
  };

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar user={user} onLogout={handleLogout} onUserUpdate={updateSession} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full relative">
          <div className="min-h-full flex flex-col">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
              
              <h1 className={isFrostbyte 
                ? "text-2xl md:text-4xl mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] font-bold tracking-wider" 
                : "text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight"
              }>
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
                Join a room or create a new one to challenge a friend.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* Main Action Card */}
                <div className={`${getPanelClass()} p-6 md:p-8 rounded-2xl space-y-6 md:space-y-8 h-full flex flex-col justify-center`}>
                  {isFrostbyte && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/60 via-cyan-300/40 to-transparent z-10 rounded-t-2xl pointer-events-none" />
                  )}
                  <div>
                    <label className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                      Join Existing Room
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row md:gap-3">
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
                        className="dashboard-join-cta px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap sm:self-auto"
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
                    className="dashboard-primary-cta w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create New Room"
                  >
                    Create New Battle Room
                  </button>

                  <PremiumGate requiredTier="plus" compact message="Upgrade to Plus to unlock custom matches">
                    <button
                      onClick={() => setShowCustomModal(true)}
                      disabled={isNavigating}
                      className="dashboard-secondary-cta w-full mt-3 py-2.5 rounded-xl bg-transparent border border-accent/30 text-accent font-bold text-sm hover:bg-accent/10 hover:border-accent/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      aria-label="Create Custom Battle Room"
                    >
                      <Swords size={16} />
                      Create custom battle room
                    </button>
                  </PremiumGate>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  <div className={`${getPanelClass(true)} p-6 rounded-2xl flex flex-col items-center justify-center py-8 transition-all`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border group-hover:scale-110 transition-transform ${isMatrix ? 'bg-green-900/30 border-green-500/50' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <Swords size={24} className={isFrostbyte ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : isMatrix ? "text-green-400 drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]" : "text-blue-500"} />
                    </div>
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
                  </div>

                  <div className={`${getPanelClass(true)} p-6 rounded-2xl flex flex-col items-center justify-center py-8 transition-all`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border group-hover:scale-110 transition-transform ${isMatrix ? 'bg-green-900/30 border-green-500/50' : 'bg-accent/10 border-accent/20'}`}>
                      <Trophy size={24} className={isFrostbyte ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : isMatrix ? "text-green-400 drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]" : "text-accent"} />
                    </div>
                    <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
                  </div>

                  <div className={`col-span-2 ${getPanelClass(true)} p-8 rounded-2xl flex flex-col transition-all`}>
                    <div className="mb-4 flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-3">
                          {(() => {
                            const equippedBadgeId = user?.customization?.equippedBadge;
                            if (!equippedBadgeId) return null;

                            const badgeData = getBadgeIconData(equippedBadgeId);
                            return (
                              <BadgeArtwork
                                badgeId={equippedBadgeId}
                                label={badgeData?.name || equippedBadgeId}
                                title={badgeData?.name || equippedBadgeId}
                                // Larger, responsive circular frame and prevent it from shrinking
                                frameClassName={`h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full overflow-hidden flex items-center justify-center ${isMatrix ? 'bg-black border border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'bg-transparent'}`}
                                // Fill the circular frame and scale slightly so any thin asset stroke/background is cropped
                                imageClassName={`h-full w-full object-cover transform scale-110 drop-shadow-none`}
                                // opt-out of the default rectangular rounding so we supply our own circular crop
                                noFrame
                              />
                            );
                          })()}
                          <div className="min-w-0">
                            <h3 className={`truncate text-2xl font-black uppercase tracking-tighter ${rankInfo.color}`}>
                              {rankInfo.title}
                            </h3>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                              Current Rank
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isMatrix ? 'bg-black border-[#00FF41] shadow-[inset_0_0_10px_rgba(0,255,65,0.2)]' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)]'}`}>
                        <Trophy size={18} className={isMatrix ? "text-[#00FF41]" : "text-yellow-500"} />
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
              <div className="mt-6 px-4 pb-8 lg:hidden">
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
      <CustomMatchModal 
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onRoomCreated={(roomData) => {
          setShowCustomModal(false);
          setIsNavigating(true);
          setLoadingText('Entering Custom Arena...');
          if (roomData?.roomId && roomData?.joinToken) {
            localStorage.setItem(
              buildCustomRoomAuthKey(roomData.roomId),
              JSON.stringify({ joinToken: roomData.joinToken, savedAt: Date.now() })
            );
          }
          navigate(`/editor/${roomData.roomId}`, {
            state: {
              username,
              joinToken: roomData?.joinToken,
              customSettings: roomData?.customSettings || null,
              isCustomRoom: true,
            }
          });
        }}
      />
    </div>
  );
};

export default Dashboard;
// V 1.5

// Version-2.0