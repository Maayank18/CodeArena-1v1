// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Trophy } from 'lucide-react'; 
// import axios from 'axios';

// // 1. IMPORT THE ELO SYSTEM
// import { getLevelInfo } from '../utils/levelSystem';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');

//   // Loading & Navigation State
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // 2. FIXED: Use getLevelInfo directly (Removed old 'getRank' function)
//   // This ensures your Dashboard rank matches your ELO exactly.
//   const currentRank = getLevelInfo(user?.elo);

//   useEffect(() => {
//       const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
//       if (!storedUser) {
//           navigate('/login');
//       } else {
//           setUser(storedUser);
//       }
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   const handleJoinRoom = () => {
//     if (!roomIdInput) {
//         toast.error('Please enter a Room ID');
//         return;
//     }
    
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');

//     setTimeout(() => {
//         navigate(`/editor/${roomIdInput}`, {
//             state: { username: user.username }
//         });
//         setIsNavigating(false);
//     }, 3000);
//   };

//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');

//     try {
//         let newRoomId;
//         try {
//             const response = await axios.post('https://codearena-1v1.onrender.com/api/rooms');
//             newRoomId = response.data.roomId;
//         } catch (err) {
//             console.error("API Error, using offline ID");
//             newRoomId = uuidv4();
//         }

//         setTimeout(() => {
//             navigate(`/editor/${newRoomId}`, {
//                 state: { username: user.username }
//             });
//             setIsNavigating(false);
//         }, 3000);

//     } catch (error) {
//         console.error("Navigation Error:", error);
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       {/* RESPONSIVE LAYOUT WRAPPER */}
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         {/* MAIN SECTION */}
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
//           <div className="min-h-full flex flex-col">
            
//             {/* Dashboard Content */}
//             <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
//               {/* Responsive Heading */}
//               <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//                 Ready to Battle, {user.username}?
//               </h1>
//               <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
//                 Join a room or create a new one to challenge a friend.
//               </p>

//               {/* Grid stacks on mobile (grid-cols-1), side-by-side on desktop (md:grid-cols-2) */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                
//                 {/* Join/Create Section */}
//                 <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
//                   {/* Join Existing */}
//                   <div>
//                     <label className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
//                       Join Existing Room
//                     </label>
//                     <div className="flex gap-2 md:gap-3">
//                       <input 
//                         type="text" 
//                         value={roomIdInput}
//                         onChange={(e) => setRoomIdInput(e.target.value)}
//                         placeholder="Paste Room ID..."
//                         disabled={isNavigating}
//                         className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
//                       />
//                       <button 
//                         onClick={handleJoinRoom}
//                         disabled={isNavigating}
//                         className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
//                       >
//                         Join
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative flex items-center py-2">
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                     <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                   </div>

//                   {/* Create New */}
//                   <button 
//                     onClick={createRoom}
//                     disabled={isNavigating}
//                     className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
//                   >
//                     Create New Battle Room
//                   </button>
//                 </div>

//                 {/* Stats Section */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
//                       {user.stats?.matchesPlayed || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Matches</span>
//                   </div>

//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
//                       {user.stats?.wins || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Wins</span>
//                   </div>

//                   {/* Rank Card */}
//                   <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                    
//                     <div className="flex items-center gap-3 mb-1">
//                         <h3 className={`text-xl md:text-2xl font-bold ${currentRank.color} text-center`}>
//                         {currentRank.title}
//                         </h3>
                        
//                         <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
//                             <Trophy size={14} className="text-yellow-500" />
//                             <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
//                                 {user.elo || 1000}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <p className="text-[var(--text-secondary)] text-sm md:text-base">Current Rank</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <Footer />
            
//           </div>
//         </main>
//       </div>

//       {/* Loading Overlay */}
//       {isNavigating && (
//         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center">
//            <div className="scale-125 md:scale-150 mb-8">
//               <Logo />
//            </div>
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












// perfect one but without the changed elo rating updation 

// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Trophy } from 'lucide-react'; 
// import axios from 'axios';

// // 1. IMPORT THE ELO SYSTEM
// import { getLevelInfo } from '../utils/levelSystem';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');

//   // Loading & Navigation State
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // 2. FIXED: Use getLevelInfo directly
//   const currentRank = getLevelInfo(user?.elo);

//   useEffect(() => {
//       const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
//       if (!storedUser) {
//           navigate('/login');
//       } else {
//           setUser(storedUser);
//       }
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   const handleJoinRoom = () => {
//     if (!roomIdInput) {
//         toast.error('Please enter a Room ID');
//         return;
//     }
    
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');

//     // ***************************************************************
//     // ✅ OPTIMIZATION: Removed artificial 3-second delay
//     // ***************************************************************
//     navigate(`/editor/${roomIdInput}`, {
//         state: { username: user.username }
//     });
//     // Navigation is async, but we set false for cleanup if needed
//     setIsNavigating(false);
//   };

//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');

//     try {
//         let newRoomId;
//         try {
//             // Attempt to fetch from backend (wakes up the Render server)
//             const response = await axios.post('https://codearena-1v1.onrender.com/api/rooms');
//             newRoomId = response.data.roomId;
//         } catch (err) {
//             console.error("API Error, using offline ID");
//             newRoomId = uuidv4();
//         }

//         // ***************************************************************
//         // ✅ OPTIMIZATION: Removed hardcoded 3000ms delay. 
//         // We now navigate the microsecond we receive the roomId.
//         // ***************************************************************
//         navigate(`/editor/${newRoomId}`, {
//             state: { username: user.username }
//         });
        
//         setIsNavigating(false);

//     } catch (error) {
//         console.error("Navigation Error:", error);
//         toast.error("Failed to initialize. Check your connection.");
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       {/* RESPONSIVE LAYOUT WRAPPER */}
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         {/* MAIN SECTION */}
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
//           <div className="min-h-full flex flex-col">
            
//             {/* Dashboard Content */}
//             <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
//               {/* Responsive Heading */}
//               <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//                 Ready to Battle, {user.username}?
//               </h1>
//               <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
//                 Join a room or create a new one to challenge a friend.
//               </p>

//               {/* Grid stacks on mobile (grid-cols-1), side-by-side on desktop (md:grid-cols-2) */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                
//                 {/* Join/Create Section */}
//                 <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
//                   {/* Join Existing */}
//                   <div>
//                     <label className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
//                       Join Existing Room
//                     </label>
//                     <div className="flex gap-2 md:gap-3">
//                       <input 
//                         type="text" 
//                         value={roomIdInput}
//                         onChange={(e) => setRoomIdInput(e.target.value)}
//                         placeholder="Paste Room ID..."
//                         disabled={isNavigating}
//                         className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
//                       />
//                       <button 
//                         onClick={handleJoinRoom}
//                         disabled={isNavigating}
//                         className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
//                       >
//                         Join
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative flex items-center py-2">
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                     <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                   </div>

//                   {/* Create New */}
//                   <button 
//                     onClick={createRoom}
//                     disabled={isNavigating}
//                     className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
//                   >
//                     Create New Battle Room
//                   </button>
//                 </div>

//                 {/* Stats Section */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
//                       {user.stats?.matchesPlayed || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Matches</span>
//                   </div>

//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
//                       {user.stats?.wins || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Wins</span>
//                   </div>

//                   {/* Rank Card */}
//                   <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                    
//                     <div className="flex items-center gap-3 mb-1">
//                         <h3 className={`text-xl md:text-2xl font-bold ${currentRank.color} text-center`}>
//                         {currentRank.title}
//                         </h3>
                        
//                         <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
//                             <Trophy size={14} className="text-yellow-500" />
//                             <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
//                                 {user.elo || 1000}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <p className="text-[var(--text-secondary)] text-sm md:text-base">Current Rank</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <Footer />
            
//           </div>
//         </main>
//       </div>

//       {/* Loading Overlay */}
//       {isNavigating && (
//         <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center">
//            <div className="scale-125 md:scale-150 mb-8">
//               <Logo />
//            </div>
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






// perfect one with changed elo rating but not max updation

// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Trophy } from 'lucide-react'; 
// import axios from 'axios';
// // ✅ IMPORT API UTILITY (Ensures base URL and tokens are handled)
// import api from '../api.js'; 

// // 1. IMPORT THE ELO SYSTEM
// import { getLevelInfo } from '../utils/levelSystem';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');

//   // Loading & Navigation State
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // ✅ FIXED: Standardized field to use 'rating' to match backend model
//   const currentRank = getLevelInfo(user?.rating || 1000);

//   useEffect(() => {
//       const syncUserAndData = async () => {
//           const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
          
//           if (!storedUser) {
//               navigate('/login');
//               return;
//           }

//           // ✅ SENIOR FIX: Fetch fresh data from DB on every Dashboard load
//           // This solves the "Stuck at 1000" problem by updating localStorage
//           try {
//               const response = await api.get(`/users/profile/${storedUser.username}`);
//               const updatedUser = response.data;
              
//               // Merge fresh DB data with local token
//               const finalUser = { ...storedUser, ...updatedUser };
              
//               localStorage.setItem('codearena_user', JSON.stringify(finalUser));
//               setUser(finalUser);
//           } catch (err) {
//               console.error("Profile sync failed, using cached data", err);
//               setUser(storedUser);
//           }
//       };

//       syncUserAndData();
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   const handleJoinRoom = () => {
//     if (!roomIdInput) {
//         toast.error('Please enter a Room ID');
//         return;
//     }
    
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');

//     navigate(`/editor/${roomIdInput}`, {
//         state: { username: user.username }
//     });
//     setIsNavigating(false);
//   };

//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');

//     try {
//         let newRoomId;
//         try {
//             // Using api utility for consistency
//             const response = await api.post('/rooms');
//             newRoomId = response.data.roomId;
//         } catch (err) {
//             console.error("API Error, using offline ID");
//             newRoomId = uuidv4();
//         }

//         navigate(`/editor/${newRoomId}`, {
//             state: { username: user.username }
//         });
        
//         setIsNavigating(false);

//     } catch (error) {
//         console.error("Navigation Error:", error);
//         toast.error("Failed to initialize. Check your connection.");
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
//           <div className="min-h-full flex flex-col">
            
//             <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
//               <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//                 Ready to Battle, {user.username}?
//               </h1>
//               <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
//                 Join a room or create a new one to challenge a friend.
//               </p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                
//                 <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
//                   <div>
//                     <label className="text-xs md:sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
//                       Join Existing Room
//                     </label>
//                     <div className="flex gap-2 md:gap-3">
//                       <input 
//                         type="text" 
//                         value={roomIdInput}
//                         onChange={(e) => setRoomIdInput(e.target.value)}
//                         placeholder="Paste Room ID..."
//                         disabled={isNavigating}
//                         className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
//                       />
//                       <button 
//                         onClick={handleJoinRoom}
//                         disabled={isNavigating}
//                         className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
//                       >
//                         Join
//                       </button>
//                     </div>
//                   </div>

//                   <div className="relative flex items-center py-2">
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                     <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                     <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                   </div>

//                   <button 
//                     onClick={createRoom}
//                     disabled={isNavigating}
//                     className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
//                   >
//                     Create New Battle Room
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
//                       {user.stats?.matchesPlayed || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Matches</span>
//                   </div>

//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
//                     <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
//                       {user.stats?.wins || 0}
//                     </span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Wins</span>
//                   </div>

//                   <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                    
//                     <div className="flex items-center gap-3 mb-1">
//                         <h3 className={`text-xl md:text-2xl font-bold ${currentRank.color} text-center`}>
//                         {currentRank.title}
//                         </h3>
                        
//                         <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
//                             <Trophy size={14} className="text-yellow-500" />
//                             <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
//                                 {/* ✅ FIXED: Standardized to 'rating' */}
//                                 {user.rating || 1000}
//                             </span>
//                         </div>
//                     </div>
                    
//                     <p className="text-[var(--text-secondary)] text-sm md:text-base">Current Rank</p>
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
//            <div className="scale-125 md:scale-150 mb-8">
//               <Logo />
//            </div>
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







// // most optimal structure 
// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Trophy } from 'lucide-react'; 
// import axios from 'axios';
// import api from '../api.js'; 

// // 1. IMPORT THE UPDATED LEVEL SYSTEM
// import { getLevelInfo } from '../utils/levelSystem';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');

//   // Loading & Navigation State
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // ✅ DYNAMIC RANK CALCULATION
//   const rankInfo = getLevelInfo(user?.rating || 1000);

//   useEffect(() => {
//       const syncUserAndData = async () => {
//           const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
          
//           if (!storedUser) {
//               navigate('/login');
//               return;
//           }

//           try {
//               const response = await api.get(`/users/profile/${storedUser.username}`);
//               const updatedUser = response.data;
//               const finalUser = { ...storedUser, ...updatedUser };
//               localStorage.setItem('codearena_user', JSON.stringify(finalUser));
//               setUser(finalUser);
//           } catch (err) {
//               console.error("Profile sync failed, using cached data", err);
//               setUser(storedUser);
//           }
//       };

//       syncUserAndData();
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('codearena_user');
//     toast.success('Logged out successfully');
//     navigate('/');
//   };

//   const handleJoinRoom = () => {
//     if (!roomIdInput) {
//         toast.error('Please enter a Room ID');
//         return;
//     }
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');
//     navigate(`/editor/${roomIdInput}`, { state: { username: user.username } });
//     setIsNavigating(false);
//   };

//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');
//     try {
//         let newRoomId;
//         try {
//             const response = await api.post('/rooms');
//             newRoomId = response.data.roomId;
//         } catch (err) {
//             newRoomId = uuidv4();
//         }
//         navigate(`/editor/${newRoomId}`, { state: { username: user.username } });
//         setIsNavigating(false);
//     } catch (error) {
//         toast.error("Failed to initialize.");
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
//           <div className="min-h-full flex flex-col">
//             <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
//               <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//                 Ready to Battle, {user.username}?
//               </h1>
//               <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
//                 Join a room or create a new one to challenge a friend.
//               </p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
//                 <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
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
//                     <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">{user.stats?.matchesPlayed || 0}</span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
//                   </div>

//                   <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg">
//                     <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">{user.stats?.wins || 0}</span>
//                     <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
//                   </div>

//                   {/* ✅ ENHANCED RANK CARD WITH PROGRESS BAR */}
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

//                     {/* Progress Bar Container */}
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











import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; 
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { Loader2, Trophy } from 'lucide-react'; 
import axios from 'axios';
import api from '../api.js'; 

// 1. IMPORT THE UPDATED LEVEL SYSTEM
import { getLevelInfo } from '../utils/levelSystem';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');

  // Loading & Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // ✅ DYNAMIC RANK CALCULATION
  const rankInfo = getLevelInfo(user?.rating || 1000);

  useEffect(() => {
      const syncUserAndData = async () => {
          const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
          
          if (!storedUser) {
              navigate('/login');
              return;
          }

          // 1. Set Local Data First (So you see the old stats for a split second)
          // setUser(storedUser);

          try {
              // ✅ FIX: Added a small delay to ensure DB persistence completes
              // especially after a 'Delayed Justice' disqualification end.
              await new Promise(resolve => setTimeout(resolve, 1000));

              // const response = await api.get(`/users/profile/${storedUser.username}`);
              const response = await api.get(`/users/profile/${storedUser.username}?t=${new Date().getTime()}`);
              const updatedUser = response.data;

              // 🔍 DEBUGGING LOGS (Check your Console!)
              console.log("🔥 SERVER RESPONSE:", response.data);
              console.log("🔥 SERVER STATS:", response.data.stats);
              
              // ✅ FIX: Deep merge to ensure nested 'stats' are preserved correctly
              const finalUser = { 
                ...storedUser, 
                ...updatedUser,
                stats: { ...storedUser.stats, ...updatedUser.stats }
              };
              
              localStorage.setItem('codearena_user', JSON.stringify(finalUser));
              setUser(finalUser);
          } catch (err) {
              console.error("Profile sync failed, using cached data", err);
              setUser(storedUser);
          }
      };

      syncUserAndData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('codearena_user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleJoinRoom = () => {
    if (!roomIdInput) {
        toast.error('Please enter a Room ID');
        return;
    }
    setIsNavigating(true);
    setLoadingText('Entering the Arena...');
    navigate(`/editor/${roomIdInput}`, { state: { username: user.username } });
    setIsNavigating(false);
  };

  const createRoom = async () => {
    setIsNavigating(true);
    setLoadingText('Initializing Battleground...');
    try {
        let newRoomId;
        try {
            const response = await api.post('/rooms');
            newRoomId = response.data.roomId;
        } catch (err) {
            newRoomId = uuidv4();
        }
        navigate(`/editor/${newRoomId}`, { state: { username: user.username } });
        setIsNavigating(false);
    } catch (error) {
        toast.error("Failed to initialize.");
        setIsNavigating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
          <div className="min-h-full flex flex-col">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
              <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
                Join a room or create a new one to challenge a friend.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
                  <div>
                    <label className="text-xs md:sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Join Existing Room</label>
                    <div className="flex gap-2 md:gap-3">
                      <input 
                        type="text" 
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        placeholder="Paste Room ID..."
                        disabled={isNavigating}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
                      />
                      <button onClick={handleJoinRoom} disabled={isNavigating} className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">Join</button>
                    </div>
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                    <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-[var(--border-color)]"></div>
                  </div>

                  <button onClick={createRoom} disabled={isNavigating} className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">Create New Battle Room</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* ✅ FIX: Displaying stats directly from the synced 'user' state */}
                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Matches</span>
                  </div>

                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 shadow-lg">
                    <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm">Wins</span>
                  </div>

                  {/* ✅ ENHANCED RANK CARD WITH PROGRESS BAR */}
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h3 className={`text-2xl font-black ${rankInfo.color} uppercase tracking-tighter`}>
                                {rankInfo.title}
                            </h3>
                            <span className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Current Rank</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                            <Trophy size={18} className="text-yellow-500" />
                            <span className="text-xl font-mono font-black text-[var(--text-primary)]">
                                {user.rating || 1000}
                            </span>
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                            <span>Progress</span>
                            <span>{rankInfo.nextThreshold !== "MAX" ? `${rankInfo.nextThreshold - (user.rating || 1000)} Elo to next rank` : 'Max Rank Reached'}</span>
                        </div>
                        <div className="w-full bg-[var(--bg-primary)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
                            <div 
                                className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ 
                                    width: `${rankInfo.progressPercentage}%`, 
                                    backgroundColor: rankInfo.hex || '#4ade80'
                                }}
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

      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto px-4 text-center">
           <div className="scale-125 md:scale-150 mb-8"><Logo /></div>
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