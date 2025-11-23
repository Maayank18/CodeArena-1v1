// import React, { useState, useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';

// const Dashboard = () => {
//     const navigate = useNavigate();
//     const [roomId, setRoomId] = useState('');
//     const [user, setUser] = useState(null);

//     useEffect(() => {
//         const storedUser = localStorage.getItem('codearena_user');
//         if (!storedUser) {
//             navigate('/login');
//         } else {
//             setUser(JSON.parse(storedUser));
//         }
//     }, []);

//     const createNewRoom = async () => {
//         // Show loading toast
//         const toastId = toast.loading('Creating Battle Room...');
//         try {
//             const response = await axios.post('/api/rooms');
//             const newRoomId = response.data.roomId;
            
//             toast.success('Room Ready!', { id: toastId });
//             // Auto-join the room as the creator
//             navigate(`/editor/${newRoomId}`, {
//                 state: { username: user.username } 
//             });
//         } catch (error) {
//             // Fix for "Offline Mode"
//             console.error("Backend Error:", error);
//             const offlineId = uuidv4();
//             toast.error("Server Busy. Starting Local Match.", { id: toastId });
//             navigate(`/editor/${offlineId}`, {
//                 state: { username: user.username }
//             });
//         }
//     };

//     const joinRoom = () => {
//         if (!roomId) {
//             toast.error('Enter a Room ID');
//             return;
//         }
//         // Automatically use the logged-in username
//         navigate(`/editor/${roomId}`, {
//             state: { username: user.username },
//         });
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('codearena_user');
//         navigate('/');
//     };

//     if (!user) return null; // Prevent flickering

//     return (
//         <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
//             <Sidebar />
//             <div className="flex-1 flex flex-col min-w-0">
//                 <Navbar user={user} onLogout={handleLogout} />
//                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center">
//                     <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
//                         <div>
//                             <h1 className="text-4xl font-bold mb-2">Ready to Battle, {user.username}?</h1>
//                             <p className="text-[var(--text-secondary)] mb-8">Join a room or create a new one.</p>
                            
//                             <div className="space-y-4">
//                                 <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
//                                     <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Join Existing Room</label>
//                                     <div className="flex gap-3">
//                                         <input type="text" className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-primary)] focus:outline-none focus:border-accent"
//                                             placeholder="Paste Room ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} />
//                                         <button onClick={joinRoom} className="bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold px-6 rounded-lg hover:opacity-90 transition-colors">Join</button>
//                                     </div>
//                                 </div>
//                                 <button onClick={createNewRoom} className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-emerald-600 text-black font-bold text-lg shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform">
//                                     Create New Battle Room
//                                 </button>
//                             </div>
//                         </div>
//                         <div className="hidden md:grid grid-cols-2 gap-4">
//                             {/* Use Real Stats if available, otherwise fallback */}
//                             <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center aspect-square">
//                                 <span className="text-4xl font-bold mb-1">{user.stats?.matchesPlayed || 0}</span>
//                                 <span className="text-sm text-[var(--text-secondary)]">Matches</span>
//                             </div>
//                             <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center aspect-square">
//                                 <span className="text-4xl font-bold text-accent mb-1">{user.stats?.wins || 0}</span>
//                                 <span className="text-sm text-[var(--text-secondary)]">Wins</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;



// almost corrected logic minor bug changes 
// import React, { useState, useEffect } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import toast from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';
// import api from '../api.js'
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// // --- NEW IMPORTS ---
// import { Logo } from '../components/Logo';
// import { Loader2 } from 'lucide-react'; 
// // -------------------

// const Dashboard = () => {
//     const navigate = useNavigate();
//     const [roomId, setRoomId] = useState('');
//     const [user, setUser] = useState(null);

//     // --- LOADING STATE ---
//     const [isNavigating, setIsNavigating] = useState(false);
//     const [loadingText, setLoadingText] = useState('');
//     // ---------------------

//     useEffect(() => {
//         const storedUser = localStorage.getItem('codearena_user');
//         if (!storedUser) {
//             navigate('/login');
//         } else {
//             setUser(JSON.parse(storedUser));
//         }
//     }, [navigate]); // Added navigate to dependency array

//     const createNewRoom = async () => {
//         // 1. Start Loading UI
//         setIsNavigating(true);
//         setLoadingText('Initializing Battleground...');

//         try {
//             // 2. Perform Async Operation (Backend Call)
//             const response = await api.post('/api/rooms');
//             const newRoomId = response.data.roomId;
            
//             // 3. Wait for 4 seconds for the effect
//             setTimeout(() => {
//                 navigate(`/editor/${newRoomId}`, {
//                     state: { username: user.username } 
//                 });
//                 setIsNavigating(false); // Cleanup state
//             }, 4000);

//         } catch (error) {
//             console.error("Backend Error:", error);
//             const offlineId = uuidv4();
//             toast.error("Server Busy. Starting Local Match.");
            
//             // Even on error, wait for the effect
//             setTimeout(() => {
//                 navigate(`/editor/${offlineId}`, {
//                     state: { username: user.username }
//                 });
//                 setIsNavigating(false); // Cleanup state
//             }, 4000);
//         }
//     };

//     const joinRoom = () => {
//         if (!roomId) {
//             toast.error('Enter a Room ID');
//             return;
//         }

//         // 1. Start Loading UI
//         setIsNavigating(true);
//         setLoadingText('Entering the Arena...');

//         // 2. Wait for 4 seconds for the effect before navigating
//         setTimeout(() => {
//             navigate(`/editor/${roomId}`, {
//                 state: { username: user.username },
//             });
//             setIsNavigating(false); // Cleanup state
//         }, 4000);
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('codearena_user');
//         toast.success('Logged out successfully');
//         navigate('/');
//     };

//     if (!user) return null;

//     return (
//         // Used the new base classes for consistency
//         <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative">
//             <div className="flex h-screen">
//                 <Sidebar />
//                 <div className="flex-1 flex flex-col min-w-0">
//                     <Navbar user={user} onLogout={handleLogout} />
                    
//                     {/* Main Content Area with updated padding and layout */}
//                     <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
//                         <div className="max-w-4xl mx-auto">
//                             <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Ready to Battle, {user.username}?</h1>
//                             <p className="text-[var(--text-secondary)] mb-12 text-lg">Join a room or create a new one to challenge a friend.</p>
                            
//                             <div className="grid md:grid-cols-2 gap-8 items-start">
//                                 {/* Join/Create Card with updated UI */}
//                                 <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] shadow-xl shadow-black/5 space-y-8">
//                                     <div>
//                                         <label className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Join Existing Room</label>
//                                         <div className="flex gap-3">
//                                             <input 
//                                                 type="text" 
//                                                 className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-accent transition-colors font-mono text-sm disabled:opacity-50"
//                                                 placeholder="Paste Room ID..." 
//                                                 value={roomId} 
//                                                 onChange={(e) => setRoomId(e.target.value)} 
//                                                 disabled={isNavigating}
//                                             />
//                                             <button 
//                                                 onClick={joinRoom} 
//                                                 disabled={isNavigating}
//                                                 className="bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
//                                             >
//                                                 Join
//                                             </button>
//                                         </div>
//                                     </div>
                                    
//                                     <div className="relative flex items-center py-2">
//                                         <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                                         <span className="flex-shrink mx-4 text-[var(--text-secondary)] text-sm font-medium">OR</span>
//                                         <div className="flex-grow border-t border-[var(--border-color)]"></div>
//                                     </div>

//                                     <button 
//                                         onClick={createNewRoom} 
//                                         disabled={isNavigating}
//                                         className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
//                                     >
//                                         Create New Battle Room
//                                     </button>
//                                 </div>

//                                 {/* Stats Section with updated UI */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
//                                         <span className="text-4xl font-extrabold mb-2">{user.stats?.matchesPlayed || 0}</span>
//                                         <span className="text-[var(--text-secondary)] font-medium">Matches</span>
//                                     </div>
//                                     <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center py-10 shadow-lg shadow-black/5">
//                                         <span className="text-4xl font-extrabold text-accent mb-2">{user.stats?.wins || 0}</span>
//                                         <span className="text-[var(--text-secondary)] font-medium">Wins</span>
//                                     </div>
//                                      <div className="col-span-2 bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center shadow-lg shadow-black/5">
//                                         <h3 className="text-2xl font-bold mb-1">Novice</h3>
//                                         <p className="text-[var(--text-secondary)]">Current Rank</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* --- LOADING OVERLAY --- */}
//             {isNavigating && (
//                 <div className="fixed inset-0 z-[100] bg-dark/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
//                 <div className="scale-150 mb-8">
//                     <Logo />
//                 </div>
//                 <div className="flex items-center gap-3 text-white text-xl font-bold">
//                     <Loader2 className="animate-spin text-accent" size={24} />
//                     {loadingText}
//                 </div>
//                 </div>
//             )}
//             {/* ----------------------- */}
//         </div>
//     );
// };

// export default Dashboard;




import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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

  // --- 1. FIX: JOIN ROOM WITH STATE ---
  const handleJoinRoom = () => {
    if (!roomIdInput) {
        toast.error('Please enter a Room ID');
        return;
    }
    
    setIsNavigating(true);
    setLoadingText('Entering the Arena...');

    // Wait 3 seconds then navigate WITH STATE
    setTimeout(() => {
        navigate(`/editor/${roomIdInput}`, {
            state: { username: user.username } // <--- CRITICAL FIX
        });
        setIsNavigating(false);
    }, 3000);
  };

  // --- 2. FIX: CREATE ROOM WITH STATE ---
  const createRoom = async () => {
    setIsNavigating(true);
    setLoadingText('Initializing Battleground...');

    try {
        let newRoomId;
        try {
            const response = await axios.post('https://codearena-1v1.onrender.com/api/rooms'); // Use full URL to be safe, or relative if proxy setup
            newRoomId = response.data.roomId;
        } catch (err) {
            console.error("API Error, using offline ID");
            newRoomId = uuidv4();
        }

        // Wait 3 seconds then navigate WITH STATE
        setTimeout(() => {
            navigate(`/editor/${newRoomId}`, {
                state: { username: user.username } // <--- CRITICAL FIX
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
        
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto">
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