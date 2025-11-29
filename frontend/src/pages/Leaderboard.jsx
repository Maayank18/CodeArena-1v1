// import React from 'react';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar'; // Import the Navbar

// const Leaderboard = () => {
//   return (
//     <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
//       {/* Left Side - Navigation */}
//       <Sidebar />

//       {/* Right Side - Main Content Wrapper */}
//       <div className="flex-1 flex flex-col relative">
//         {/* Top Navigation Bar */}
//         <Navbar />

//         {/* Main Scrollable Area */}
//         <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-8">
            
//             {/* Coming Soon Centerpiece */}
//             <div className="text-center space-y-6">
//                 <div className="relative inline-block">
//                     {/* Glowing effect behind the text */}
//                     <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-green-600 to-green-400 opacity-60 blur-lg"></div>
//                     <h1 className="relative text-6xl font-black text-white tracking-tight uppercase">
//                         Leaderboard
//                     </h1>
//                 </div>
                
//                 <div className="space-y-3 mt-8">
//                     <h2 className="text-2xl font-bold text-green-400 tracking-wide">COMING SOON</h2>
//                     <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
//                         We are crunching the numbers! The global ranking system is currently under development.
//                     </p>
//                 </div>

//                 {/* Visual separator */}
//                 <div className="w-16 h-1.5 bg-green-500/30 rounded-full mx-auto mt-8"></div>
//             </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;







// import React, { useEffect, useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import Navbar from '../components/Navbar';
// import api from '../utils/api'; 
// import { Trophy, Medal, Flame, Search, AlertCircle } from 'lucide-react';
// import { getLevelInfo } from '../utils/levelSystem'; 
// import Avatar from '../components/Avatar'; 

// const Leaderboard = () => {
//   const [players, setPlayers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('');
  
//   // Since we are in a protected layout, we likely have user info in localStorage
//   // But for the Navbar prop, we might need to parse it or fetch it. 
//   // For now, we assume Navbar handles its own user state or we pass null if not strictly needed immediately.
//   const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

//   useEffect(() => {
//     const fetchLeaderboard = async () => {
//       try {
//         const { data } = await api.get('/users/leaderboard');
//         setPlayers(data);
//       } catch (error) {
//         console.error("Failed to load leaderboard", error);
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
//     if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-glow" />;
//     if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
//     if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
//     return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
//   };

//   return (
//     <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
//       {/* Left Side - Navigation */}
//       <Sidebar />

//       {/* Right Side - Main Content Wrapper */}
//       <div className="flex-1 flex flex-col relative min-w-0">
//         {/* Top Navigation Bar */}
//         <Navbar user={user} />

//         {/* Main Scrollable Area */}
//         <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            
//             <div className="max-w-5xl mx-auto space-y-6">
                
//                 {/* Page Header */}
//                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                     <div>
//                         <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase flex items-center gap-3">
//                             <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={32} /> 
//                             Leaderboard
//                         </h1>
//                         <p className="text-gray-400 mt-2 text-sm sm:text-base">
//                             Top coding warriors of the current season.
//                         </p>
//                     </div>

//                     {/* Search Bar */}
//                     <div className="relative w-full md:w-72 group">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors h-4 w-4" />
//                         <input 
//                             type="text" 
//                             placeholder="Find a player..." 
//                             className="w-full bg-[#161b22] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm placeholder:text-gray-600"
//                             value={filter}
//                             onChange={(e) => setFilter(e.target.value)}
//                         />
//                     </div>
//                 </div>

//                 {/* Leaderboard Table Container */}
//                 <div className="bg-[#161b22] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl relative">
                    
//                     {/* Table Header */}
//                     <div className="grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-gray-700 bg-[#0d1117]/50 text-xs text-gray-400 font-bold uppercase tracking-wider items-center">
//                         <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
//                         <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
//                         <div className="col-span-2 hidden sm:block text-center">Level</div>
//                         <div className="col-span-2 hidden md:block text-center">Matches</div>
//                         <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
//                     </div>

//                     {/* Table Body */}
//                     <div className="divide-y divide-gray-700/50">
//                         {loading ? (
//                             // Loading Skeleton
//                             [...Array(5)].map((_, i) => (
//                                 <div key={i} className="p-4 grid grid-cols-12 gap-4 animate-pulse">
//                                     <div className="col-span-1 bg-gray-700 h-6 rounded"></div>
//                                     <div className="col-span-5 bg-gray-700 h-6 rounded w-3/4"></div>
//                                     <div className="col-span-6 bg-gray-700 h-6 rounded"></div>
//                                 </div>
//                             ))
//                         ) : filteredPlayers.length > 0 ? (
//                             filteredPlayers.map((player, index) => {
//                                 const rank = index + 1;
//                                 // Handle case where rating might be undefined for legacy users
//                                 const { title, color } = getLevelInfo(player.rating || 1200);

//                                 return (
//                                     <div 
//                                         key={player._id || index} 
//                                         className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[#1f2937] transition-colors group cursor-default"
//                                     >
                                        
//                                         {/* Rank Icon */}
//                                         <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
//                                             {getRankIcon(rank)}
//                                         </div>

//                                         {/* User Profile */}
//                                         <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
//                                             <Avatar username={player.username} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-green-500 transition-all" />
//                                             <div className="flex flex-col min-w-0">
//                                                 <span className={`font-bold text-sm sm:text-base truncate ${rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
//                                                     {player.username}
//                                                 </span>
//                                                 {/* Mobile Badge */}
//                                                 <span className={`text-[10px] sm:hidden ${color} opacity-90 truncate`}>
//                                                     {title}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         {/* Desktop Level Badge */}
//                                         <div className="col-span-2 hidden sm:flex justify-center">
//                                             <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full border border-gray-700/50 bg-gray-800/50 ${color}`}>
//                                                 {title}
//                                             </span>
//                                         </div>

//                                         {/* Matches Played (Desktop only) */}
//                                         <div className="col-span-2 hidden md:block text-center text-gray-500 text-sm font-mono">
//                                             {player.stats?.matchesPlayed || 0}
//                                         </div>

//                                         {/* Score Points */}
//                                         <div className="col-span-3 sm:col-span-2 text-right pr-2">
//                                             <span className="font-mono font-bold text-green-400 text-base sm:text-lg">
//                                                 {player.seasonScore}
//                                             </span>
//                                             <span className="text-[10px] text-gray-500 block -mt-1">pts</span>
//                                         </div>
//                                     </div>
//                                 );
//                             })
//                         ) : (
//                             // Empty State
//                             <div className="p-12 flex flex-col items-center justify-center text-gray-500">
//                                 <AlertCircle size={48} className="mb-4 opacity-20" />
//                                 <p>No players found.</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
                
//                 <div className="text-center text-xs text-gray-600 pt-4">
//                     Season ends automatically on the 1st of every month.
//                 </div>

//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;





// RESPONSIVE FIX FOR LEADERBOARD
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../utils/api'; 
import { Trophy, Medal, Flame, Search, AlertCircle } from 'lucide-react';
import { getLevelInfo } from '../utils/levelSystem'; 
import Avatar from '../components/Avatar'; 

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/users/leaderboard');
        setPlayers(data);
      } catch (error) {
        console.error("Failed to load leaderboard", error);
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
    if (rank === 1) return <Trophy className="text-yellow-400 h-6 w-6 sm:h-7 sm:w-7 drop-shadow-glow" />;
    if (rank === 2) return <Medal className="text-gray-300 h-6 w-6 sm:h-7 sm:w-7" />;
    if (rank === 3) return <Medal className="text-amber-600 h-6 w-6 sm:h-7 sm:w-7" />;
    return <span className="font-mono font-bold text-gray-500 text-lg">#{rank}</span>;
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
      <Sidebar />

      {/* Right Side - Main Content Wrapper */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <Navbar user={user} />

        {/* Main Scrollable Area */}
        {/* Responsive Height & Padding Logic */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-[var(--bg-primary)]">
            
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Page Header */}
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

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors h-4 w-4" />
                        <input 
                            type="text" 
                            placeholder="Find a player..." 
                            className="w-full bg-[#161b22] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm placeholder:text-gray-600"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Leaderboard Table Container */}
                <div className="bg-[#161b22] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl relative">
                    
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-gray-700 bg-[#0d1117]/50 text-xs text-gray-400 font-bold uppercase tracking-wider items-center">
                        <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                        <div className="col-span-7 sm:col-span-5 pl-2">Player</div>
                        <div className="col-span-2 hidden sm:block text-center">Level</div>
                        <div className="col-span-2 hidden md:block text-center">Matches</div>
                        <div className="col-span-3 sm:col-span-2 text-right pr-2">Score</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-700/50">
                        {loading ? (
                            // Loading Skeleton
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="p-4 grid grid-cols-12 gap-4 animate-pulse">
                                    <div className="col-span-1 bg-gray-700 h-6 rounded"></div>
                                    <div className="col-span-5 bg-gray-700 h-6 rounded w-3/4"></div>
                                    <div className="col-span-6 bg-gray-700 h-6 rounded"></div>
                                </div>
                            ))
                        ) : filteredPlayers.length > 0 ? (
                            filteredPlayers.map((player, index) => {
                                const rank = index + 1;
                                const { title, color } = getLevelInfo(player.rating || 1200);

                                return (
                                    <div 
                                        key={player._id || index} 
                                        className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-[#1f2937] transition-colors group cursor-default"
                                    >
                                        
                                        {/* Rank Icon */}
                                        <div className="col-span-2 sm:col-span-1 flex justify-center items-center">
                                            {getRankIcon(rank)}
                                        </div>

                                        {/* User Profile */}
                                        <div className="col-span-7 sm:col-span-5 flex items-center gap-3 pl-2 overflow-hidden">
                                            <Avatar username={player.username} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 border-2 border-transparent group-hover:border-green-500 transition-all" />
                                            <div className="flex flex-col min-w-0">
                                                <span className={`font-bold text-sm sm:text-base truncate ${rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
                                                    {player.username}
                                                </span>
                                                {/* Mobile Badge */}
                                                <span className={`text-[10px] sm:hidden ${color} opacity-90 truncate`}>
                                                    {title}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Desktop Level Badge */}
                                        <div className="col-span-2 hidden sm:flex justify-center">
                                            <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full border border-gray-700/50 bg-gray-800/50 ${color}`}>
                                                {title}
                                            </span>
                                        </div>

                                        {/* Matches Played (Desktop only) */}
                                        <div className="col-span-2 hidden md:block text-center text-gray-500 text-sm font-mono">
                                            {player.stats?.matchesPlayed || 0}
                                        </div>

                                        {/* Score Points */}
                                        <div className="col-span-3 sm:col-span-2 text-right pr-2">
                                            <span className="font-mono font-bold text-green-400 text-base sm:text-lg">
                                                {player.seasonScore}
                                            </span>
                                            <span className="text-[10px] text-gray-500 block -mt-1">pts</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            // Empty State
                            <div className="p-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                                <AlertCircle size={48} className="mb-4 opacity-20" />
                                <p>No players found.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-center text-xs text-gray-600 pt-4 pb-20 md:pb-0">
                    Season ends automatically on the 1st of every month.
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;