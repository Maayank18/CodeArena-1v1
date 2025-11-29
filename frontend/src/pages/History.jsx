// import React, { useEffect, useState } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import { format } from 'date-fns';

// const History = () => {
//     const [history, setHistory] = useState([]);
//     const [user, setUser] = useState(null);

//     useEffect(() => {
//         const u = JSON.parse(localStorage.getItem('codearena_user'));
//         setUser(u);
        
//         const h = JSON.parse(localStorage.getItem('codearena_history') || '[]');
//         setHistory(h);
//     }, []);

//     return (
//         // FIX: Use dynamic background and text variables
//         <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
//             <Sidebar />
//             <div className="flex-1 flex flex-col min-w-0">
//                 <Navbar user={user} />
                
//                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
//                     <h2 className="text-3xl font-bold mb-8">Match History</h2>
                    
//                     {history.length === 0 ? (
//                         <div className="text-center py-20 text-[var(--text-secondary)]">
//                             <p>No matches played yet. Go battle!</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             {history.map((match, idx) => (
//                                 // FIX: Dynamic card background and border
//                                 <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-accent transition-colors">
//                                     <div className="flex items-center gap-6">
//                                         {/* Win/Loss Badge */}
//                                         <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl ${
//                                             match.winner === user.username 
//                                                 ? 'bg-green-500/20 text-green-500' 
//                                                 : 'bg-red-500/20 text-red-500'
//                                         }`}>
//                                             {match.winner === user.username ? 'W' : 'L'}
//                                         </div>
//                                         <div>
//                                             <h4 className="font-bold text-lg">
//                                                 {match.opponent ? `vs ${match.opponent}` : 'Solo Practice'}
//                                             </h4>
//                                             <p className="text-sm text-[var(--text-secondary)]">
//                                                 {format(new Date(match.date), 'PPP p')}
//                                             </p>
//                                         </div>
//                                     </div>
//                                     <div className="text-right">
//                                         <span className="block font-mono text-accent font-bold">{match.score} pts</span>
//                                         <span className="text-xs text-[var(--text-secondary)]">Total Score</span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default History;











// updated history 
// import React, { useEffect, useState } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import { format } from 'date-fns';
// import { History as HistoryIcon, Trophy, XCircle, CheckCircle } from 'lucide-react';

// const History = () => {
//     const [history, setHistory] = useState([]);
//     const [user, setUser] = useState(null);

//     useEffect(() => {
//         const u = JSON.parse(localStorage.getItem('codearena_user'));
//         setUser(u);
        
//         const h = JSON.parse(localStorage.getItem('codearena_history') || '[]');
//         setHistory(h);
//     }, []);

//     return (
//         <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
//             <Sidebar />
            
//             {/* Main Content Wrapper */}
//             <div className="flex-1 flex flex-col min-w-0 h-full relative">
//                 <Navbar user={user} />
                
//                 {/* Scrollable Area */}
//                 {/* Added pb-20 on mobile to avoid overlap with Bottom Nav */}
//                 <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-20 md:pb-8">
                    
//                     <div className="max-w-4xl mx-auto">
//                         <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-3">
//                             <HistoryIcon className="text-accent" />
//                             Match History
//                         </h2>
                        
//                         {history.length === 0 ? (
//                             <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]/50">
//                                 <Trophy size={48} className="mb-4 opacity-20" />
//                                 <p className="text-lg">No matches played yet.</p>
//                                 <p className="text-sm opacity-60">Join a battle to start your legacy!</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-3 md:space-y-4">
//                                 {history.map((match, idx) => {
//                                     const isWin = match.winner === user?.username;
//                                     return (
//                                         <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-accent transition-all shadow-sm group">
                                            
//                                             <div className="flex items-center gap-3 md:gap-6">
//                                                 {/* Win/Loss Badge - Compact on Mobile */}
//                                                 <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center font-bold text-lg md:text-xl shrink-0 ${
//                                                     isWin ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
//                                                 }`}>
//                                                     {isWin ? <CheckCircle size={20} /> : <XCircle size={20} />}
//                                                 </div>
                                                
//                                                 <div className="min-w-0">
//                                                     <h4 className="font-bold text-base md:text-lg truncate">
//                                                         {match.opponent && match.opponent !== 'Unknown' ? (
//                                                             <span className="flex items-center gap-2">
//                                                                 <span className="opacity-60 text-xs uppercase tracking-wider">VS</span>
//                                                                 {match.opponent}
//                                                             </span>
//                                                         ) : 'Solo Practice'}
//                                                     </h4>
//                                                     <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
//                                                         {format(new Date(match.date), 'MMM d, yyyy • h:mm a')}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="text-right pl-4">
//                                                 <span className={`block font-mono font-bold text-lg md:text-xl ${isWin ? 'text-green-400' : 'text-[var(--text-primary)]'}`}>
//                                                     {match.score}
//                                                 </span>
//                                                 <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wide">pts</span>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default History;










// import React, { useEffect, useState } from 'react';
// import Navbar from '../components/Navbar';
// import Sidebar from '../components/Sidebar';
// import { format } from 'date-fns';
// import { History as HistoryIcon, Trophy, XCircle, CheckCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
// import axios from 'axios';

// const History = () => {
//     const [history, setHistory] = useState([]);
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchData = async () => {
//             // 1. Get logged-in user from local storage (just to get username)
//             const u = JSON.parse(localStorage.getItem('codearena_user'));
//             if (u) {
//                 setUser(u);
//                 try {
//                     // 2. FETCH FROM MONGODB API
//                     // Use your backend URL. If running locally, it's usually http://localhost:5000
//                     // In production, use your Render URL: https://codearena-1v1.onrender.com
//                     const API_URL = 'https://codearena-1v1.onrender.com'; 
                    
//                     const response = await axios.get(`${API_URL}/api/matches/user/${u.username}`);
//                     setHistory(response.data);
//                 } catch (error) {
//                     console.error("Error fetching history:", error);
//                 } finally {
//                     setLoading(false);
//                 }
//             } else {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, []);

//     return (
//         <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
//             <Sidebar />
            
//             {/* Main Content Wrapper */}
//             <div className="flex-1 flex flex-col min-w-0 h-full relative">
//                 <Navbar user={user} />
                
//                 {/* Scrollable Area */}
//                 <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-20 md:pb-8">
                    
//                     <div className="max-w-4xl mx-auto">
//                         <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-3">
//                             <HistoryIcon className="text-accent" />
//                             Match History
//                         </h2>
                        
//                         {loading ? (
//                             <div className="flex flex-col items-center justify-center py-20">
//                                 <Loader2 className="animate-spin text-accent mb-4" size={40} />
//                                 <p className="text-[var(--text-secondary)]">Loading battle logs...</p>
//                             </div>
//                         ) : history.length === 0 ? (
//                             <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]/50">
//                                 <Trophy size={48} className="mb-4 opacity-20" />
//                                 <p className="text-lg">No matches played yet.</p>
//                                 <p className="text-sm opacity-60">Join a battle to start your legacy!</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-3 md:space-y-4">
//                                 {history.map((match, idx) => {
//                                     // LOGIC: Find "Me" and "Opponent" in the players array
//                                     const myData = match.players.find(p => p.username === user?.username);
//                                     const opponentData = match.players.find(p => p.username !== user?.username);
                                    
//                                     // Safety fallback if data is missing
//                                     if (!myData) return null;

//                                     const isWin = myData.isWinner;
//                                     const eloChange = myData.newElo - myData.oldElo; // e.g., +15 or -10
//                                     const opponentName = opponentData ? opponentData.username : "Unknown";

//                                     return (
//                                         <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-accent transition-all shadow-sm group">
                                            
//                                             <div className="flex items-center gap-3 md:gap-6">
//                                                 {/* Win/Loss Badge */}
//                                                 <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center font-bold text-lg md:text-xl shrink-0 ${
//                                                     isWin ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
//                                                 }`}>
//                                                     {isWin ? <CheckCircle size={20} /> : <XCircle size={20} />}
//                                                 </div>
                                                
//                                                 <div className="min-w-0">
//                                                     <h4 className="font-bold text-base md:text-lg truncate">
//                                                         <span className="flex items-center gap-2">
//                                                             <span className="opacity-60 text-xs uppercase tracking-wider hidden md:inline-block">VS</span>
//                                                             {opponentName}
//                                                         </span>
//                                                     </h4>
//                                                     <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
//                                                         {format(new Date(match.createdAt), 'MMM d, yyyy • h:mm a')}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="text-right pl-4 flex flex-col items-end">
//                                                 {/* Score */}
//                                                 <div className="flex items-baseline gap-1">
//                                                     <span className={`font-mono font-bold text-lg md:text-xl ${isWin ? 'text-green-400' : 'text-[var(--text-primary)]'}`}>
//                                                         {myData.score}
//                                                     </span>
//                                                     <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wide">pts</span>
//                                                 </div>

//                                                 {/* ELO Change Display (New Feature) */}
//                                                 {eloChange !== 0 && (
//                                                     <div className={`text-xs font-bold flex items-center gap-1 ${eloChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
//                                                         {eloChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
//                                                         {eloChange > 0 ? '+' : ''}{eloChange} ELO
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default History;




import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';
import { History as HistoryIcon, Trophy, XCircle, CheckCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

// 1. IMPORT NAVIGATION AND TOAST
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const History = () => {
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. INITIALIZE NAVIGATION
    const navigate = useNavigate();

    // 3. DEFINE LOGOUT FUNCTION
    const handleLogout = () => {
        localStorage.removeItem('codearena_user');
        toast.success('Logged out successfully');
        navigate('/');
    };

    useEffect(() => {
        const fetchData = async () => {
            // 1. Get logged-in user from local storage
            const u = JSON.parse(localStorage.getItem('codearena_user'));
            if (u) {
                setUser(u);
                try {
                    // 2. FETCH FROM MONGODB API
                    const API_URL = 'https://codearena-1v1.onrender.com'; 
                    
                    const response = await axios.get(`${API_URL}/api/matches/user/${u.username}`);
                    setHistory(response.data);
                } catch (error) {
                    console.error("Error fetching history:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                // Optional: Redirect if not logged in
                // navigate('/login'); 
            }
        };

        fetchData();
    }, [navigate]);

    return (
        <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
            <Sidebar />
            
            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                
                {/* 4. PASS LOGOUT FUNCTION TO NAVBAR */}
                <Navbar user={user} onLogout={handleLogout} />
                
                {/* Scrollable Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-20 md:pb-8">
                    
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-3">
                            <HistoryIcon className="text-accent" />
                            Match History
                        </h2>
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="animate-spin text-accent mb-4" size={40} />
                                <p className="text-[var(--text-secondary)]">Loading battle logs...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]/50">
                                <Trophy size={48} className="mb-4 opacity-20" />
                                <p className="text-lg">No matches played yet.</p>
                                <p className="text-sm opacity-60">Join a battle to start your legacy!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {history.map((match, idx) => {
                                    // LOGIC: Find "Me" and "Opponent" in the players array
                                    const myData = match.players.find(p => p.username === user?.username);
                                    const opponentData = match.players.find(p => p.username !== user?.username);
                                    
                                    // Safety fallback if data is missing
                                    if (!myData) return null;

                                    const isWin = myData.isWinner;
                                    const eloChange = myData.newElo - myData.oldElo; // e.g., +15 or -10
                                    const opponentName = opponentData ? opponentData.username : "Unknown";

                                    return (
                                        <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-accent transition-all shadow-sm group">
                                            
                                            <div className="flex items-center gap-3 md:gap-6">
                                                {/* Win/Loss Badge */}
                                                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center font-bold text-lg md:text-xl shrink-0 ${
                                                    isWin ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                    {isWin ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                </div>
                                                
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-base md:text-lg truncate">
                                                        <span className="flex items-center gap-2">
                                                            <span className="opacity-60 text-xs uppercase tracking-wider hidden md:inline-block">VS</span>
                                                            {opponentName}
                                                        </span>
                                                    </h4>
                                                    <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
                                                        {format(new Date(match.createdAt), 'MMM d, yyyy • h:mm a')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right pl-4 flex flex-col items-end">
                                                {/* Score */}
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`font-mono font-bold text-lg md:text-xl ${isWin ? 'text-green-400' : 'text-[var(--text-primary)]'}`}>
                                                        {myData.score}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wide">pts</span>
                                                </div>

                                                {/* ELO Change Display */}
                                                {eloChange !== 0 && (
                                                    <div className={`text-xs font-bold flex items-center gap-1 ${eloChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {eloChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {eloChange > 0 ? '+' : ''}{eloChange} ELO
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History;