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
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; // <--- IMPORT HERE
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

  // Rank Logic
  const getRank = (matchesPlayed) => {
    if (matchesPlayed < 20) return "Novice";
    if (matchesPlayed < 50) return "Apprentice";
    return "Adept";
  };
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

                  <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{currentRank}</h3>
                   <p className="text-[var(--text-secondary)]">Current Rank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ADD FOOTER HERE INSIDE THE SCROLLABLE AREA */}
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