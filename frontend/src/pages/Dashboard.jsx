// // UPAR WALA BADIA HAI LEKIN CLAUDE BHAIYA NE KUCH OPTIMISATION DI HAI 
// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Trophy } from 'lucide-react'; 
// import api from '../api.js'; 
// import { getLevelInfo } from '../utils/levelSystem';

// const CACHE_KEY = 'dashboard_profile_cache';
// const CACHE_DURATION = 60000; // 60 seconds

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   const rankInfo = getLevelInfo(user?.rating || 1000);

//   useEffect(() => {
//     const syncUserAndData = async () => {
//       const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
//       if (!storedUser) { 
//         navigate('/login'); 
//         return; 
//       }
      
//       // Immediately set user from localStorage for instant UI
//       setUser(storedUser);

//       // Check cache validity
//       const cache = localStorage.getItem(CACHE_KEY);
//       let shouldFetch = true;
      
//       if (cache) {
//         try {
//           const { data, timestamp } = JSON.parse(cache);
//           const age = Date.now() - timestamp;
          
//           // Use cached data if less than 60 seconds old
//           if (age < CACHE_DURATION) {
//             shouldFetch = false;
//             const cachedUser = { ...storedUser, ...data };
//             setUser(cachedUser);
//             localStorage.setItem('codearena_user', JSON.stringify(cachedUser));
//           }
//         } catch (e) {
//           console.error("Cache parse error", e);
//         }
//       }

//       // Only fetch if cache is stale/missing
//       if (!shouldFetch) return;

//       try {
//         const response = await api.get(`/users/profile/${storedUser.username}`);
//         const serverUser = response.data;

//         // Merge server data with local user (server is source of truth)
//         const finalUser = { 
//           ...storedUser,
//           ...serverUser,
//           stats: serverUser.stats || storedUser.stats || { matchesPlayed: 0 }
//         };
        
//         // Update state and storage
//         setUser(finalUser);
//         localStorage.setItem('codearena_user', JSON.stringify(finalUser));
        
//         // Update cache with timestamp
//         localStorage.setItem(CACHE_KEY, JSON.stringify({
//           data: serverUser,
//           timestamp: Date.now()
//         }));
//       } catch (err) {
//         console.error("Profile sync failed, using cached data", err);
//         // Keep using storedUser that was already set
//       }
//     };
    
//     syncUserAndData();
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     localStorage.removeItem(CACHE_KEY); // Clear cache on logout
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   const handleJoinRoom = () => {
//     if (!roomIdInput.trim()) {
//       toast.error('Please enter a Room ID');
//       return;
//     }
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');
//     navigate(`/editor/${roomIdInput}`, { state: { username: user.username } });
//   };

//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');
//     try {
//       let newRoomId;
//       try {
//         const response = await api.post('/rooms');
//         newRoomId = response.data.roomId;
//       } catch (err) {
//         newRoomId = uuidv4();
//       }
//       navigate(`/editor/${newRoomId}`, { state: { username: user.username } });
//     } catch (error) {
//       toast.error("Failed to initialize.");
//       setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full">
//           <div className="min-h-full flex flex-col">
//             <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
//               <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//                 Ready to Battle, {user.username}?
//               </h1>
//               <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
//                 Join a room or create a new one to challenge a friend.
//               </p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                
//                 <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8 h-full flex flex-col justify-center">
//                   <div>
//                     <label className="text-xs md:sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Join Existing Room</label>
//                     <div className="flex gap-2 md:gap-3">
//                       <input 
//                         type="text" 
//                         value={roomIdInput}
//                         onChange={(e) => setRoomIdInput(e.target.value)}
//                         placeholder="Paste Room ID..."
//                         disabled={isNavigating}
//                         className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
//                       />
//                       <button onClick={handleJoinRoom} disabled={isNavigating} className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">Join</button>
//                     </div>
//                   </div>

//                   <div className="relative flex items-center py-2">
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                     <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                   </div>

//                   <button onClick={createRoom} disabled={isNavigating} className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">Create New Battle Room</button>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg">
//                     <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
//                       {user.stats?.matchesPlayed || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
//                   </div>

//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg">
//                     <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
//                       {user.stats?.wins || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
//                   </div>

//                   <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col shadow-lg">
//                     <div className="flex items-center justify-between mb-4">
//                         <div className="flex flex-col">
//                             <h3 className={`text-2xl font-black ${rankInfo.color} uppercase tracking-tighter`}>
//                                 {rankInfo.title}
//                             </h3>
//                             <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Current Rank</span>
//                         </div>
//                         <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
//                             <Trophy size={18} className="text-yellow-500" />
//                             <span className="text-xl font-mono font-black text-[var(--text-primary)]">
//                                 {user.rating || 1000}
//                             </span>
//                         </div>
//                     </div>

//                     <div className="w-full space-y-2">
//                         <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase">
//                             <span>Progress</span>
//                             <span>{rankInfo.nextThreshold !== "MAX" ? `${rankInfo.nextThreshold - (user.rating || 1000)} Elo to next rank` : 'Max Rank Reached'}</span>
//                         </div>
//                         <div className="w-full bg-[var(--bg-primary)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
//                             <div 
//                                 className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
//                                 style={{ 
//                                     width: `${rankInfo.progressPercentage}%`, 
//                                     backgroundColor: rankInfo.hex || '#4ade80'
//                                 }}
//                             />
//                         </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <Footer />
//           </div>
//         </main>
//       </div>

//       {isNavigating && (
//         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center">
//            <div className="scale-125 md:scale-150 mb-8"><Logo /></div>
//            <div className="flex flex-col md:flex-row items-center gap-3 text-white text-lg md:text-xl font-bold">
//               <Loader2 className="animate-spin text-accent" size={24} />
//               <span>{loadingText}</span>
//            </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;










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
      
      // Immediately set user from localStorage for instant UI
      setUser(storedUser);

      // Check cache validity
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

      // Fetch fresh data
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
        // Continue with cached data (already set)
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

  const handleJoinRoom = useCallback(() => {
    if (!roomIdInput.trim()) {
      toast.error('Please enter a Room ID');
      return;
    }
    setIsNavigating(true);
    setLoadingText('Entering the Arena...');
    navigate(`/editor/${roomIdInput}`, { state: { username: user.username } });
  }, [roomIdInput, navigate, user?.username]);

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
        newRoomId = uuidv4().split('-')[0]; // Shorter ID
      }
      navigate(`/editor/${newRoomId}`, { state: { username: user.username } });
    } catch (error) {
      console.error("[ROOM] Creation failed:", error);
      toast.error("Failed to initialize room");
      setIsNavigating(false);
    }
  }, [navigate, user?.username]);

  // ✅ Guard clause with loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full">
          <div className="min-h-full flex flex-col">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
              
              {/* Header */}
              <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
                Join a room or create a new one to challenge a friend.
              </p>

              {/* Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                
                {/* Left Panel - Join/Create Room */}
                <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8 h-full flex flex-col justify-center">
                  
                  {/* Join Room */}
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

                  {/* Divider */}
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                    <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                  </div>

                  {/* Create Room */}
                  <button 
                    onClick={createRoom} 
                    disabled={isNavigating} 
                    className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create New Room"
                  >
                    Create New Battle Room
                  </button>
                </div>

                {/* Right Panel - Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Matches Played */}
                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg hover:border-accent/50 transition-colors">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
                  </div>

                  {/* Wins */}
                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg hover:border-accent/50 transition-colors">
                    <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
                  </div>

                  {/* Rank Card */}
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col shadow-lg hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <h3 className={`text-2xl font-black ${rankInfo.color} uppercase tracking-tighter`}>
                          {rankInfo.title}
                        </h3>
                        <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">
                          Current Rank
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-xl font-mono font-black text-[var(--text-primary)]">
                          {user.rating || 1000}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
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
            </div>
            <Footer />
          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center">
           <div className="scale-125 md:scale-150 mb-8">
             <Logo />
           </div>
           <div className="flex flex-col md:flex-row items-center gap-3 text-white text-lg md:text-xl font-bold">
              <Loader2 className="animate-spin text-accent" size={24} />
              <span>{loadingText}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;