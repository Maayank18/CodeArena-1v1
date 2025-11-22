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
//         // Simple Auth Check
//         const storedUser = localStorage.getItem('codearena_user');
//         if (!storedUser) {
//             navigate('/login');
//         } else {
//             setUser(JSON.parse(storedUser));
//         }
//     }, []);

//     const createNewRoom = async () => {
//         try {
//             const response = await axios.post('/api/rooms');
//             setRoomId(response.data.roomId);
//             toast.success('Room Generated!');
//         } catch (error) {
//             setRoomId(uuidv4());
//             toast.error("Offline Mode: Local ID generated");
//         }
//     };

//     const joinRoom = () => {
//         if (!roomId) {
//             toast.error('Enter a Room ID');
//             return;
//         }
//         navigate(`/editor/${roomId}`, {
//             state: { username: user.username },
//         });
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('codearena_user');
//         navigate('/');
//     };

//     return (
//         <div className="flex h-screen bg-dark text-white overflow-hidden">
//             <Sidebar />
            
//             <div className="flex-1 flex flex-col min-w-0">
//                 <Navbar user={user} onLogout={handleLogout} />
                
//                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center">
//                     <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
                        
//                         {/* Left: Actions */}
//                         <div>
//                             <h1 className="text-4xl font-bold mb-2">Ready to Battle?</h1>
//                             <p className="text-gray-400 mb-8">Join a room or create a new one to challenge a friend.</p>
                            
//                             <div className="space-y-4">
//                                 <div className="bg-[#252526] p-6 rounded-xl border border-[#3e3e42]">
//                                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Join Existing Room</label>
//                                     <div className="flex gap-3">
//                                         <input 
//                                             type="text" 
//                                             className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg px-4 text-white focus:outline-none focus:border-accent"
//                                             placeholder="Paste Room ID..."
//                                             value={roomId}
//                                             onChange={(e) => setRoomId(e.target.value)}
//                                         />
//                                         <button onClick={joinRoom} className="bg-white text-black font-bold px-6 rounded-lg hover:bg-gray-200 transition-colors">
//                                             Join
//                                         </button>
//                                     </div>
//                                 </div>

//                                 <div className="flex items-center gap-4">
//                                     <div className="h-px flex-1 bg-[#3e3e42]"></div>
//                                     <span className="text-gray-500 text-sm">OR</span>
//                                     <div className="h-px flex-1 bg-[#3e3e42]"></div>
//                                 </div>

//                                 <button 
//                                     onClick={createNewRoom}
//                                     className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-emerald-600 text-black font-bold text-lg shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform"
//                                 >
//                                     Create New Battle Room
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Right: Dashboard Widgets */}
//                         <div className="hidden md:grid grid-cols-2 gap-4">
//                             <div className="bg-[#252526] p-6 rounded-2xl border border-[#3e3e42] flex flex-col items-center justify-center text-center aspect-square">
//                                 <span className="text-4xl font-bold text-white mb-1">12</span>
//                                 <span className="text-sm text-gray-400">Matches Won</span>
//                             </div>
//                             <div className="bg-[#252526] p-6 rounded-2xl border border-[#3e3e42] flex flex-col items-center justify-center text-center aspect-square">
//                                 <span className="text-4xl font-bold text-accent mb-1">85%</span>
//                                 <span className="text-sm text-gray-400">Win Rate</span>
//                             </div>
//                             <div className="bg-[#252526] p-6 rounded-2xl border border-[#3e3e42] flex flex-col items-center justify-center text-center col-span-2">
//                                 <span className="text-xl font-bold text-white mb-1">Grandmaster</span>
//                                 <span className="text-sm text-gray-400">Current Rank</span>
//                             </div>
//                         </div>

//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('codearena_user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const createNewRoom = async () => {
        // Show loading toast
        const toastId = toast.loading('Creating Battle Room...');
        try {
            const response = await axios.post('/api/rooms');
            const newRoomId = response.data.roomId;
            
            toast.success('Room Ready!', { id: toastId });
            // Auto-join the room as the creator
            navigate(`/editor/${newRoomId}`, {
                state: { username: user.username } 
            });
        } catch (error) {
            // Fix for "Offline Mode"
            console.error("Backend Error:", error);
            const offlineId = uuidv4();
            toast.error("Server Busy. Starting Local Match.", { id: toastId });
            navigate(`/editor/${offlineId}`, {
                state: { username: user.username }
            });
        }
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('Enter a Room ID');
            return;
        }
        // Automatically use the logged-in username
        navigate(`/editor/${roomId}`, {
            state: { username: user.username },
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('codearena_user');
        navigate('/');
    };

    if (!user) return null; // Prevent flickering

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar user={user} onLogout={handleLogout} />
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center">
                    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Ready to Battle, {user.username}?</h1>
                            <p className="text-[var(--text-secondary)] mb-8">Join a room or create a new one.</p>
                            
                            <div className="space-y-4">
                                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Join Existing Room</label>
                                    <div className="flex gap-3">
                                        <input type="text" className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 text-[var(--text-primary)] focus:outline-none focus:border-accent"
                                            placeholder="Paste Room ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                                        <button onClick={joinRoom} className="bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold px-6 rounded-lg hover:opacity-90 transition-colors">Join</button>
                                    </div>
                                </div>
                                <button onClick={createNewRoom} className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-emerald-600 text-black font-bold text-lg shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform">
                                    Create New Battle Room
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:grid grid-cols-2 gap-4">
                            {/* Use Real Stats if available, otherwise fallback */}
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center aspect-square">
                                <span className="text-4xl font-bold mb-1">{user.stats?.matchesPlayed || 0}</span>
                                <span className="text-sm text-[var(--text-secondary)]">Matches</span>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center aspect-square">
                                <span className="text-4xl font-bold text-accent mb-1">{user.stats?.wins || 0}</span>
                                <span className="text-sm text-[var(--text-secondary)]">Wins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;