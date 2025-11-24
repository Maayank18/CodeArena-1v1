// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
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

//   // Rank Logic
//   const getRank = (matchesPlayed) => {
//     if (matchesPlayed < 20) return "Novice";
//     if (matchesPlayed < 50) return "Apprentice";
//     return "Adept";
//   };
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

//   // --- 1. FIX: JOIN ROOM WITH STATE ---
//   const handleJoinRoom = () => {
//     if (!roomIdInput) {
//         toast.error('Please enter a Room ID');
//         return;
//     }
    
//     setIsNavigating(true);
//     setLoadingText('Entering the Arena...');

//     // Wait 3 seconds then navigate WITH STATE
//     setTimeout(() => {
//         navigate(`/editor/${roomIdInput}`, {
//             state: { username: user.username } // <--- CRITICAL FIX
//         });
//         setIsNavigating(false);
//     }, 3000);
//   };

//   // --- 2. FIX: CREATE ROOM WITH STATE ---
//   const createRoom = async () => {
//     setIsNavigating(true);
//     setLoadingText('Initializing Battleground...');

//     try {
//         let newRoomId;
//         try {
//             const response = await axios.post('https://codearena-1v1.onrender.com/api/rooms'); // Use full URL to be safe, or relative if proxy setup
//             newRoomId = response.data.roomId;
//         } catch (err) {
//             console.error("API Error, using offline ID");
//             newRoomId = uuidv4();
//         }

//         // Wait 3 seconds then navigate WITH STATE
//         setTimeout(() => {
//             navigate(`/editor/${newRoomId}`, {
//                 state: { username: user.username } // <--- CRITICAL FIX
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
//     <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
//       <Navbar user={user} onLogout={handleLogout} />
      
//       <div className="flex h-[calc(100vh-72px)]">
//         <Sidebar />
        
//         <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
//           <div className="max-w-4xl mx-auto">
//             <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
//               Ready to Battle, {user.username}?
//             </h1>
//             <p className="text-[var(--text-secondary)] mb-12 text-lg">Join a room or create a new one to challenge a friend.</p>

//             <div className="grid md:grid-cols-2 gap-8 items-start">
//               {/* Join/Create Section */}
//               <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-8">
                
//                 {/* Join Existing */}
//                 <div>
//                   <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
//                     Join Existing Room
//                   </label>
//                   <div className="flex gap-3">
//                     <input 
//                       type="text" 
//                       value={roomIdInput}
//                       onChange={(e) => setRoomIdInput(e.target.value)}
//                       placeholder="Paste Room ID..."
//                       disabled={isNavigating}
//                       className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50"
//                     />
//                     <button 
//                       onClick={handleJoinRoom}
//                       disabled={isNavigating}
//                       className="px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
//                     >
//                       Join
//                     </button>
//                   </div>
//                 </div>

//                 <div className="relative flex items-center py-2">
//                   <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                   <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                   <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                 </div>

//                 {/* Create New */}
//                 <button 
//                   onClick={createRoom}
//                   disabled={isNavigating}
//                   className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
//                 >
//                   Create New Battle Room
//                 </button>
//               </div>

//               {/* Stats Section */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
//                   <span className="text-4xl font-extrabold text-[var(--text-primary)] mb-2">
//                     {user.stats?.matchesPlayed || 0}
//                   </span>
//                   <span className="text-[var(--text-secondary)] font-medium">Matches</span>
//                 </div>

//                 <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
//                   <span className="text-4xl font-extrabold text-accent mb-2">
//                     {user.stats?.wins || 0}
//                   </span>
//                   <span className="text-[var(--text-secondary)] font-medium">Wins</span>
//                 </div>

//                 <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
//                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{currentRank}</h3>
//                  <p className="text-[var(--text-secondary)]">Current Rank</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Loading Overlay */}
//       {isNavigating && (
//         <div className="fixed inset-0 z-[100] bg-dark/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
//            <div className="scale-150 mb-8">
//               <Logo />
//            </div>
//            <div className="flex items-center gap-3 text-white text-xl font-bold">
//               <Loader2 className="animate-spin text-accent" size={24} />
//               {loadingText}
//            </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;





// -> above dashboard is best but without footer
// in this dashboard the ranking scheem is little off
// -> this is dashboard with little off footer
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; 
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { Loader2 } from 'lucide-react'; 
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');

  // Loading & Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // --- FIXED RANKING LOGIC ---
  // Returns an OBJECT with { title, color } to enable coloring
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
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex h-[calc(100vh-72px)]">
        <Sidebar />
        
        {/* MODIFIED MAIN SECTION */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]">
          {/* Wrapper to handle footer positioning */}
          <div className="min-h-full flex flex-col">
            
            {/* Dashboard Content */}
            <div className="max-w-4xl mx-auto p-8 flex-1 w-full">
              <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                Ready to Battle, {user.username}?
              </h1>
              <p className="text-[var(--text-secondary)] mb-12 text-lg">Join a room or create a new one to challenge a friend.</p>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Join/Create Section */}
                <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-8">
                  {/* Join Existing */}
                  <div>
                    <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                      Join Existing Room
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        placeholder="Paste Room ID..."
                        disabled={isNavigating}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50"
                      />
                      <button 
                        onClick={handleJoinRoom}
                        disabled={isNavigating}
                        className="px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
                    className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-lg hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    Create New Battle Room
                  </button>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
                    <span className="text-4xl font-extrabold text-[var(--text-primary)] mb-2">
                      {user.stats?.matchesPlayed || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium">Matches</span>
                  </div>

                  <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
                    <span className="text-4xl font-extrabold text-accent mb-2">
                      {user.stats?.wins || 0}
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium">Wins</span>
                  </div>

                  {/* FIXED RANK CARD */}
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                   
                   {/* FIXED: We now access .color for the class and .title for the text. 
                      I removed 'text-[var(--text-primary)]' so the rank color shows up clearly.
                   */}
                   <h3 className={`text-2xl font-bold mb-1 ${currentRank.color}`}>
                     {currentRank.title}
                   </h3>
                   
                   <p className="text-[var(--text-secondary)]">Current Rank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer inside scrollable area */}
            <Footer />
            
          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-dark/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
           <div className="scale-150 mb-8">
              <Logo />
           </div>
           <div className="flex items-center gap-3 text-white text-xl font-bold">
              <Loader2 className="animate-spin text-accent" size={24} />
              {loadingText}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;








// // this dashboard has best ranking scheme adn best footer possible 
// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Swords, Trophy, Crown } from 'lucide-react'; // Added Icons
// import axios from 'axios';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // --- 1. RANK LOGIC (Advanced Version) ---
//   // Returns an OBJECT with Title AND Color
//   const getRank = (matchesPlayed) => {
//     if (matchesPlayed < 10) return { title: "Novice", color: "text-gray-400" };
//     if (matchesPlayed < 30) return { title: "Apprentice", color: "text-green-400" };
//     if (matchesPlayed < 50) return { title: "Specialist", color: "text-blue-400" };
//     if (matchesPlayed < 100) return { title: "Expert", color: "text-purple-400" };
//     if (matchesPlayed < 200) return { title: "Master", color: "text-orange-400" };
//     if (matchesPlayed < 500) return { title: "Grandmaster", color: "text-red-500" };
//     return { title: "Living Legend", color: "text-yellow-400 animate-pulse" }; 
//   };
  
//   // Safe check to prevent crash if user is null
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
//     }, 2000);
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
//         }, 2000);

//     } catch (error) {
//         console.error("Navigation Error:", error);
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[#0d1117] text-white flex flex-col relative overflow-hidden">
//       {/* Background Decor to fix "Boring" look */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
//           <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
//       </div>

//       <div className="z-10">
//         <Navbar user={user} onLogout={handleLogout} />
//       </div>
      
//       <div className="flex flex-1 z-10 overflow-hidden">
//         <Sidebar />
        
//         <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
//           <div className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full flex flex-col justify-center">
            
//             <div className="mb-10 text-center md:text-left">
//                 <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
//                 Ready to Battle, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{user.username}?</span>
//                 </h1>
//                 <p className="text-gray-400 text-lg">Your arena awaits. Choose your path to glory.</p>
//             </div>

//             <div className="grid lg:grid-cols-3 gap-8">
                
//                 {/* 1. Join/Create Card */}
//                 <div className="lg:col-span-2 bg-[#161b22] p-8 rounded-3xl border border-gray-800 shadow-2xl hover:border-gray-700 transition-all group">
//                     <div className="flex items-center gap-3 mb-6">
//                         <Swords className="text-green-500 w-8 h-8" />
//                         <h2 className="text-2xl font-bold">Start a Match</h2>
//                     </div>

//                     <div className="mb-8">
//                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
//                             Join Friend's Room
//                         </label>
//                         <div className="flex gap-3 h-14">
//                             <input 
//                             type="text" 
//                             value={roomIdInput}
//                             onChange={(e) => setRoomIdInput(e.target.value)}
//                             placeholder="Enter Room ID..."
//                             className="flex-1 bg-[#0d1117] border border-gray-700 text-white rounded-xl px-5 focus:outline-none focus:border-green-500 transition-colors font-mono"
//                             />
//                             <button 
//                             onClick={handleJoinRoom}
//                             className="px-8 font-bold rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all"
//                             >
//                             Join
//                             </button>
//                         </div>
//                     </div>

//                     <div className="relative flex items-center py-4">
//                         <div className="flex-grow border-t border-gray-700"></div>
//                         <span className="flex-shrink mx-4 text-gray-500 text-sm font-medium">OR</span>
//                         <div className="flex-grow border-t border-gray-700"></div>
//                     </div>

//                     <button 
//                         onClick={createRoom}
//                         className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-lg hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all"
//                     >
//                         Create New Battle Room
//                     </button>
//                 </div>

//                 {/* 2. Stats Column */}
//                 <div className="space-y-6">
//                     {/* --- 2. RANK CARD FIX --- */}
//                     <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between">
//                         <div>
//                             <p className="text-gray-500 text-sm font-medium mb-1">Current Rank</p>
//                             {/* NOTICE: We use .title and .color here */}
//                             <h3 className={`text-2xl font-black tracking-wide ${currentRank.color}`}>
//                                 {currentRank.title}
//                             </h3>
//                         </div>
//                         <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
//                             <Crown className={currentRank.color} size={24} />
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                         <div className="bg-[#161b22] p-5 rounded-3xl border border-gray-800 text-center">
//                             <p className="text-3xl font-black text-white mb-1">{user.stats?.matchesPlayed || 0}</p>
//                             <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Matches</p>
//                         </div>
//                         <div className="bg-[#161b22] p-5 rounded-3xl border border-gray-800 text-center">
//                             <p className="text-3xl font-black text-green-400 mb-1">{user.stats?.wins || 0}</p>
//                             <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Wins</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//           </div>

//           <Footer />
//         </main>
//       </div>

//       {isNavigating && (
//         <div className="fixed inset-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm flex flex-col items-center justify-center">
//            <div className="scale-125 mb-6"><Logo /></div>
//            <div className="flex items-center gap-3 text-white text-xl font-bold">
//               <Loader2 className="animate-spin text-green-500" size={24} />
//               {loadingText}
//            </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;










// this dashboard is with updated footer 
// import React, { useState, useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import Footer from '../components/Footer'; 
// import { useNavigate } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { Logo } from '../components/Logo';
// import { Loader2, Swords, Trophy, Crown } from 'lucide-react'; // Added icons to spice up UI
// import axios from 'axios';

// const Dashboard = () => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const [roomIdInput, setRoomIdInput] = useState('');
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [loadingText, setLoadingText] = useState('');

//   // Rank Logic
//   const getRank = (matchesPlayed) => {
//     if (matchesPlayed < 20) return "Novice";
//     if (matchesPlayed < 50) return "Apprentice";
//     return "Adept";
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
//         navigate(`/editor/${roomIdInput}`, { state: { username: user.username } });
//         setIsNavigating(false);
//     }, 2000);
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
//             newRoomId = uuidv4();
//         }
//         setTimeout(() => {
//             navigate(`/editor/${newRoomId}`, { state: { username: user.username } });
//             setIsNavigating(false);
//         }, 2000);
//     } catch (error) {
//         setIsNavigating(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-[#0d1117] text-white flex flex-col relative overflow-hidden">
//       {/* Background Decor - Fixes "Boring" look */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
//           <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
//       </div>

//       {/* Navbar stays on top */}
//       <div className="z-10">
//         <Navbar user={user} onLogout={handleLogout} />
//       </div>
      
//       <div className="flex flex-1 z-10 overflow-hidden">
//         <Sidebar />
        
//         <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
          
//           <div className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full flex flex-col justify-center">
            
//             {/* Header Section */}
//             <div className="mb-10 text-center md:text-left">
//                 <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
//                 Ready to Battle, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{user.username}?</span>
//                 </h1>
//                 <p className="text-gray-400 text-lg">Your arena awaits. Choose your path to glory.</p>
//             </div>

//             <div className="grid lg:grid-cols-3 gap-8">
                
//                 {/* 1. Join/Create Card (Main Action) - Spans 2 cols */}
//                 <div className="lg:col-span-2 bg-[#161b22] p-8 rounded-3xl border border-gray-800 shadow-2xl hover:border-gray-700 transition-all group">
                    
//                     <div className="flex items-center gap-3 mb-6">
//                         <Swords className="text-green-500 w-8 h-8" />
//                         <h2 className="text-2xl font-bold">Start a Match</h2>
//                     </div>

//                     {/* Join Input */}
//                     <div className="mb-8">
//                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
//                             Join Friend's Room
//                         </label>
//                         <div className="flex gap-3 h-14">
//                             <input 
//                             type="text" 
//                             value={roomIdInput}
//                             onChange={(e) => setRoomIdInput(e.target.value)}
//                             placeholder="Enter Room ID..."
//                             className="flex-1 bg-[#0d1117] border border-gray-700 text-white rounded-xl px-5 focus:outline-none focus:border-green-500 transition-colors font-mono"
//                             />
//                             <button 
//                             onClick={handleJoinRoom}
//                             className="px-8 font-bold rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all"
//                             >
//                             Join
//                             </button>
//                         </div>
//                     </div>

//                     {/* Create Button */}
//                     <button 
//                         onClick={createRoom}
//                         className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-lg hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all"
//                     >
//                         Create New Battle Room
//                     </button>
//                 </div>

//                 {/* 2. Stats Column (Right Side) */}
//                 <div className="space-y-6">
//                     {/* Rank Card */}
//                     <div className="bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl flex items-center justify-between">
//                         <div>
//                             <p className="text-gray-500 text-sm font-medium mb-1">Current Rank</p>
//                             <h3 className="text-2xl font-bold text-white">{currentRank}</h3>
//                         </div>
//                         <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
//                             <Crown className="text-yellow-500 w-6 h-6" />
//                         </div>
//                     </div>

//                     {/* Stats Grid */}
//                     <div className="grid grid-cols-2 gap-4">
//                         <div className="bg-[#161b22] p-5 rounded-3xl border border-gray-800 text-center">
//                             <p className="text-3xl font-black text-white mb-1">{user.stats?.matchesPlayed || 0}</p>
//                             <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Matches</p>
//                         </div>
//                         <div className="bg-[#161b22] p-5 rounded-3xl border border-gray-800 text-center">
//                             <p className="text-3xl font-black text-green-400 mb-1">{user.stats?.wins || 0}</p>
//                             <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Wins</p>
//                         </div>
//                     </div>
                    
//                     {/* Mini Motivational Text */}
//                     <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-900/30 text-center">
//                         <p className="text-blue-200 text-sm">"Code implies order."</p>
//                     </div>
//                 </div>
//             </div>
//           </div>

//           <Footer />
//         </main>
//       </div>

//       {/* Loading Overlay */}
//       {isNavigating && (
//         <div className="fixed inset-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm flex flex-col items-center justify-center">
//            <div className="scale-125 mb-6"><Logo /></div>
//            <div className="flex items-center gap-3 text-white text-xl font-bold">
//               <Loader2 className="animate-spin text-green-500" size={24} />
//               {loadingText}
//            </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;