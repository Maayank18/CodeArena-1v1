// // RESPONSIVE DASHBOARD CODE 
// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2 } from 'lucide-react'; 
// import axios from 'axios';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');

//   // Loading & Navigation State
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // --- FIXED RANKING LOGIC (Kept as is) ---
//   const getRank = (matchesPlayed) => {
//     if (matchesPlayed < 10) return { title: "Novice", color: "text-gray-400" };
//     if (matchesPlayed < 30) return { title: "Apprentice", color: "text-green-400" };
//     if (matchesPlayed < 50) return { title: "Specialist", color: "text-blue-400" };
//     if (matchesPlayed < 100) return { title: "Expert", color: "text-purple-400" };
//     if (matchesPlayed < 200) return { title: "Master", color: "text-orange-400" };
//     if (matchesPlayed < 500) return { title: "Grandmaster", color: "text-red-500" };
//     return { title: "Living Legend", color: "text-yellow-400 animate-pulse" }; // 500+
//   };

//   // Safe check for user stats
//   const currentRank = getRank(user?.stats?.matchesPlayed || 0);

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
      
//       {/* RESPONSIVE LAYOUT WRAPPER 
//           - Mobile: Height is calc(100vh - 64px navbar)
//           - Desktop: Height is calc(100vh - 72px navbar)
//       */}
//       <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
//         <Sidebar />
        
//         {/* MAIN SECTION */}
//         {/* Added pb-20 on mobile to prevent content being hidden behind the Bottom Nav */}
//         <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
//           {/* Wrapper to handle footer positioning */}
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
                    
//                     <h3 className={`text-xl md:text-2xl font-bold mb-1 ${currentRank.color} text-center`}>
//                       {currentRank.title}
//                     </h3>
                    
//                     <p className="text-[var(--text-secondary)] text-sm md:text-base">Current Rank</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Footer inside scrollable area */}
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

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');

  // Loading & Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // --- RANKING LOGIC ---
  const getRank = (matchesPlayed) => {
    if (matchesPlayed < 10) return { title: "Novice", color: "text-gray-400" };
    if (matchesPlayed < 30) return { title: "Apprentice", color: "text-green-400" };
    if (matchesPlayed < 50) return { title: "Specialist", color: "text-blue-400" };
    if (matchesPlayed < 100) return { title: "Expert", color: "text-purple-400" };
    if (matchesPlayed < 200) return { title: "Master", color: "text-orange-400" };
    if (matchesPlayed < 500) return { title: "Grandmaster", color: "text-red-500" };
    return { title: "Living Legend", color: "text-yellow-400 animate-pulse" }; // 500+
  };

  // Safe check for user stats
  const currentRank = getRank(user?.stats?.matchesPlayed || 0);

  useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
      if (!storedUser) {
          navigate('/login');
      } else {
          setUser(storedUser);
      }
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

    setTimeout(() => {
        navigate(`/editor/${roomIdInput}`, {
            state: { username: user.username }
        });
        setIsNavigating(false);
    }, 3000);
  };

  const createRoom = async () => {
    setIsNavigating(true);
    setLoadingText('Initializing Battleground...');

    try {
        let newRoomId;
        try {
            const response = await axios.post('https://codearena-1v1.onrender.com/api/rooms');
            newRoomId = response.data.roomId;
        } catch (err) {
            console.error("API Error, using offline ID");
            newRoomId = uuidv4();
        }

        setTimeout(() => {
            navigate(`/editor/${newRoomId}`, {
                state: { username: user.username }
            });
            setIsNavigating(false);
        }, 3000);

    } catch (error) {
        console.error("Navigation Error:", error);
        setIsNavigating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* RESPONSIVE LAYOUT WRAPPER */}
      <div className="flex flex-1 h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] overflow-hidden">
        <Sidebar />
        
        {/* MAIN SECTION */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-20 md:pb-0 w-full">
          <div className="min-h-full flex flex-col">
            
            {/* Dashboard Content */}
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex-1 w-full">
              {/* Responsive Heading */}
              <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-8 md:mb-12 text-sm md:text-lg">
                Join a room or create a new one to challenge a friend.
              </p>

              {/* Grid stacks on mobile (grid-cols-1), side-by-side on desktop (md:grid-cols-2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                
                {/* Join/Create Section */}
                <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-6 md:space-y-8">
                  {/* Join Existing */}
                  <div>
                    <label className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                      Join Existing Room
                    </label>
                    <div className="flex gap-2 md:gap-3">
                      <input 
                        type="text" 
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        placeholder="Paste Room ID..."
                        disabled={isNavigating}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50 min-w-0"
                      />
                      <button 
                        onClick={handleJoinRoom}
                        disabled={isNavigating}
                        className="px-4 md:px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
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

                  {/* Create New */}
                  <button 
                    onClick={createRoom}
                    disabled={isNavigating}
                    className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base md:text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    Create New Battle Room
                  </button>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Matches</span>
                  </div>

                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-8 md:py-10 shadow-lg shadow-black/5">
                    <span className="text-3xl md:text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium text-sm md:text-base">Wins</span>
                  </div>

                  {/* --- MODIFIED RANK CARD WITH ELO --- */}
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                    
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-xl md:text-2xl font-bold ${currentRank.color} text-center`}>
                        {currentRank.title}
                        </h3>
                        
                        {/* THE NEW ELO DISPLAY */}
                        <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
                                {user.elo || 1000}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-[var(--text-secondary)] text-sm md:text-base">Current Rank</p>
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
