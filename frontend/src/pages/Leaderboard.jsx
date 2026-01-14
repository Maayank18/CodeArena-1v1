// import React, { useEffect, useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
// import api from '../api.js'; 
// import { Trophy, Medal, Flame, Search, AlertCircle, Loader2 } from 'lucide-react';
// import { getLevelInfo } from '../utils/levelSystem'; 
// import Avatar from '../components/Avatar'; 
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';

// const Leaderboard = () => {
//   const [players, setPlayers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('');
  
//   const navigate = useNavigate();
//   const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   useEffect(() => {
//     const fetchLeaderboard = async () => {
//       try {
//         // ✅ The backend must use .select('stats rating seasonScore username avatar')
//         const { data } = await api.get('/users/leaderboard');
//         setPlayers(data);
//       } catch (error) {
//         console.error("Failed to load leaderboard", error);
//         toast.error("Could not sync leaderboard data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchLeaderboard();
//   }, []);

//   const filteredPlayers = players.filter(p => 
//     p.username.toLowerCase().includes(filter.toLowerCase())
//   );

//   const getRankIcon = (rank) => {
//     if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
//     if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
//     if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
//     return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
//   };

//   return (
//     <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
//       <Sidebar />

//       <div className="flex-1 flex flex-col relative min-w-0">
//         <Navbar user={user} onLogout={handleLogout} />

//         <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-[var(--bg-primary)]">
//             <div className="max-w-5xl mx-auto space-y-6">
                
//                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                     <div>
//                         <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
//                             <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} /> 
//                             Leaderboard
//                         </h1>
//                         <p className="text-gray-400 mt-2 text-sm sm:text-base">
//                             Top coding warriors of the current season.
//                         </p>
//                     </div>

//                     <div className="relative w-full md:w-72 group">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors h-4 w-4" />
//                         <input 
//                             type="text" 
//                             placeholder="Find a player..." 
//                             className="w-full bg-[#161b22] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
//                             value={filter}
//                             onChange={(e) => setFilter(e.target.value)}
//                         />
//                     </div>
//                 </div>

//                 <div className="bg-[#161b22] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl relative">
//                     <div className="grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-gray-700 bg-[#0d1117]/50 text-xs text-gray-400 font-bold uppercase tracking-wider items-center">
//                         <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
//                         <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
//                         <div className="col-span-2 hidden sm:block text-center">Level</div>
//                         <div className="col-span-2 hidden md:block text-center">Matches</div>
//                         <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
//                     </div>

//                     <div className="divide-y divide-gray-700/50">
//                         {loading ? (
//                             <div className="py-20 flex flex-col items-center justify-center">
//                                 <Loader2 className="animate-spin text-accent mb-4" size={32} />
//                                 <p className="text-gray-500 font-bold animate-pulse">Syncing Arena Rankings...</p>
//                             </div>
//                         ) : filteredPlayers.length > 0 ? (
//                             filteredPlayers.map((player, index) => {
//                                 const rank = index + 1;
//                                 // ✅ FIX: Use 1000 as fallback and extract 'hex' for consistent branding
//                                 const { title, color, hex } = getLevelInfo(player.rating || 1000);

//                                 return (
//                                     <div 
//                                         key={player._id || index} 
//                                         className={`grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[#1f2937] transition-colors group cursor-default ${player.username === user.username ? 'bg-accent/5 border-l-4 border-l-accent' : ''}`}
//                                     >
//                                         <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
//                                             {getRankIcon(rank)}
//                                         </div>

//                                         <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
//                                             <Avatar username={player.username} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-all" />
//                                             <div className="flex flex-col min-w-0">
//                                                 <span className={`font-bold text-sm sm:text-base truncate ${rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
//                                                     {player.username}
//                                                     {player.username === user.username && <span className="ml-2 text-[10px] bg-accent text-black px-1.5 py-0.5 rounded-md">YOU</span>}
//                                                 </span>
//                                                 <span className={`text-[10px] sm:hidden ${color} opacity-90 truncate font-black uppercase tracking-tighter`}>
//                                                     {title}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div className="col-span-2 hidden sm:flex justify-center">
//                                             {/* ✅ ENHANCED: Consistent Badge Style with Dashboard */}
//                                             <span 
//                                                 className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full border bg-gray-900/80 ${color} uppercase tracking-tight`}
//                                                 style={{ borderColor: `${hex}33`, boxShadow: `0 0 12px ${hex}15` }}
//                                             >
//                                                 {title}
//                                             </span>
//                                         </div>

//                                         <div className="col-span-2 hidden md:block text-center text-gray-500 text-sm font-mono font-bold">
//                                             {/* ✅ FIX: Accessing nested stats safely */}
//                                             {player.stats?.matchesPlayed || 0}
//                                         </div>

//                                         <div className="col-span-3 sm:col-span-2 text-right pr-2">
//                                             <span className="font-mono font-black text-green-400 text-base sm:text-lg">
//                                                 {player.seasonScore || 0}
//                                             </span>
//                                             <span className="text-[10px] text-gray-500 block -mt-1 font-bold">PTS</span>
//                                         </div>
//                                     </div>
//                                 );
//                             })
//                         ) : (
//                             <div className="p-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50 m-4">
//                                 <AlertCircle size={48} className="mb-4 opacity-20" />
//                                 <p className="font-bold uppercase tracking-widest text-xs">No coding warriors found</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
                
//                 <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] pt-4 pb-20 md:pb-0">
//                     Leaderboard refreshes automatically every session
//                 </div>

//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;




// CLAUDE BHAIYA KA UPDATE HAI NICHE WITH THODI OPTIMSATION 
import React, { useEffect, useState } from 'react';
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

  const handleLogout = () => {
    localStorage.removeItem('codearena_user');
    localStorage.removeItem(LEADERBOARD_CACHE_KEY); // Clear cache on logout
    toast.success('Logged out successfully');
    navigate('/');
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Check cache first
      const cache = localStorage.getItem(LEADERBOARD_CACHE_KEY);
      
      if (cache) {
        try {
          const { data, timestamp } = JSON.parse(cache);
          const age = Date.now() - timestamp;
          
          // Use cached data if less than 60 seconds old
          if (age < CACHE_DURATION) {
            setPlayers(data);
            setLoading(false);
            return; // Exit early with cached data
          }
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }

      // Fetch fresh data if cache is stale/missing
      try {
        const { data } = await api.get('/users/leaderboard');
        setPlayers(data);
        
        // Update cache with timestamp
        localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Failed to load leaderboard", error);
        toast.error("Could not sync leaderboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  const filteredPlayers = players.filter(p => 
    p.username.toLowerCase().includes(filter.toLowerCase())
  );

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
    if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
    return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-w-0">
        <Navbar user={user} onLogout={handleLogout} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-[var(--bg-primary)]">
            <div className="max-w-5xl mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
                            <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} /> 
                            Leaderboard
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm sm:text-base">
                            Top coding warriors of the current season.
                        </p>
                    </div>

                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Find a player..." 
                            className="w-full bg-[#161b22] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-[#161b22] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-gray-700 bg-[#0d1117]/50 text-xs text-gray-400 font-bold uppercase tracking-wider items-center">
                        <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                        <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
                        <div className="col-span-2 hidden sm:block text-center">Level</div>
                        <div className="col-span-2 hidden md:block text-center">Matches</div>
                        <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
                    </div>

                    <div className="divide-y divide-gray-700/50">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-accent mb-4" size={32} />
                                <p className="text-gray-500 font-bold animate-pulse">Syncing Arena Rankings...</p>
                            </div>
                        ) : filteredPlayers.length > 0 ? (
                            filteredPlayers.map((player, index) => {
                                const rank = index + 1;
                                const { title, color, hex } = getLevelInfo(player.rating || 1000);

                                return (
                                    <div 
                                        key={player._id || index} 
                                        className={`grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[#1f2937] transition-colors group cursor-default ${player.username === user.username ? 'bg-accent/5 border-l-4 border-l-accent' : ''}`}
                                    >
                                        <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
                                            {getRankIcon(rank)}
                                        </div>

                                        <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
                                            <Avatar username={player.username} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-accent transition-all" />
                                            <div className="flex flex-col min-w-0">
                                                <span className={`font-bold text-sm sm:text-base truncate ${rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
                                                    {player.username}
                                                    {player.username === user.username && <span className="ml-2 text-[10px] bg-accent text-black px-1.5 py-0.5 rounded-md">YOU</span>}
                                                </span>
                                                <span className={`text-[10px] sm:hidden ${color} opacity-90 truncate font-black uppercase tracking-tighter`}>
                                                    {title}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-span-2 hidden sm:flex justify-center">
                                            <span 
                                                className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full border bg-gray-900/80 ${color} uppercase tracking-tight`}
                                                style={{ borderColor: `${hex}33`, boxShadow: `0 0 12px ${hex}15` }}
                                            >
                                                {title}
                                            </span>
                                        </div>

                                        <div className="col-span-2 hidden md:block text-center text-gray-500 text-sm font-mono font-bold">
                                            {player.stats?.matchesPlayed || 0}
                                        </div>

                                        <div className="col-span-3 sm:col-span-2 text-right pr-2">
                                            <span className="font-mono font-black text-green-400 text-base sm:text-lg">
                                                {player.seasonScore || 0}
                                            </span>
                                            <span className="text-[10px] text-gray-500 block -mt-1 font-bold">PTS</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50 m-4">
                                <AlertCircle size={48} className="mb-4 opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-xs">No coding warriors found</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] pt-4 pb-20 md:pb-0">
                    Leaderboard refreshes every 60 seconds
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;