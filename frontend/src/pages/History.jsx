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
//         <div className="flex h-screen bg-dark text-white overflow-hidden">
//             <Sidebar />
//             <div className="flex-1 flex flex-col min-w-0">
//                 <Navbar user={user} />
                
//                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
//                     <h2 className="text-3xl font-bold mb-8">Match History</h2>
                    
//                     {history.length === 0 ? (
//                         <div className="text-center py-20 text-gray-500">
//                             <p>No matches played yet. Go battle!</p>
//                         </div>
//                     ) : (
//                         <div className="space-y-4">
//                             {history.map((match, idx) => (
//                                 <div key={idx} className="bg-[#252526] p-4 rounded-xl border border-[#3e3e42] flex items-center justify-between hover:border-accent transition-colors">
//                                     <div className="flex items-center gap-6">
//                                         <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl ${match.winner === user.username ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
//                                             {match.winner === user.username ? 'W' : 'L'}
//                                         </div>
//                                         <div>
//                                             <h4 className="font-bold text-lg">{match.opponent ? `vs ${match.opponent}` : 'Solo Practice'}</h4>
//                                             <p className="text-sm text-gray-400">{format(new Date(match.date), 'PPP p')}</p>
//                                         </div>
//                                     </div>
//                                     <div className="text-right">
//                                         <span className="block font-mono text-accent font-bold">{match.score} pts</span>
//                                         <span className="text-xs text-gray-500">Total Score</span>
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


import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

const History = () => {
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('codearena_user'));
        setUser(u);
        
        const h = JSON.parse(localStorage.getItem('codearena_history') || '[]');
        setHistory(h);
    }, []);

    return (
        // FIX: Use dynamic background and text variables
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar user={user} />
                
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-bold mb-8">Match History</h2>
                    
                    {history.length === 0 ? (
                        <div className="text-center py-20 text-[var(--text-secondary)]">
                            <p>No matches played yet. Go battle!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((match, idx) => (
                                // FIX: Dynamic card background and border
                                <div key={idx} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between hover:border-accent transition-colors">
                                    <div className="flex items-center gap-6">
                                        {/* Win/Loss Badge */}
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl ${
                                            match.winner === user.username 
                                                ? 'bg-green-500/20 text-green-500' 
                                                : 'bg-red-500/20 text-red-500'
                                        }`}>
                                            {match.winner === user.username ? 'W' : 'L'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">
                                                {match.opponent ? `vs ${match.opponent}` : 'Solo Practice'}
                                            </h4>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {format(new Date(match.date), 'PPP p')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-mono text-accent font-bold">{match.score} pts</span>
                                        <span className="text-xs text-[var(--text-secondary)]">Total Score</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;