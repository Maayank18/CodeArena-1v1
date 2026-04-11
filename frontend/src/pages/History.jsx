// FILE: frontend/src/pages/History.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';
import { History as HistoryIcon, Trophy, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const HISTORY_CACHE_KEY = 'history_cache';
const CACHE_DURATION = 60000; // 60 seconds

const History = () => {
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // ✅ OPTIMIZED: Memoized logout handler
    const handleLogout = useCallback(() => {
        localStorage.removeItem('codearena_user');
        localStorage.removeItem(HISTORY_CACHE_KEY);
        toast.success('Logged out successfully');
        navigate('/');
    }, [navigate]);

    // ✅ OPTIMIZED: Fetch history with caching
    useEffect(() => {
        const fetchData = async () => {
            const u = JSON.parse(localStorage.getItem('codearena_user'));
            if (!u) {
                navigate('/login');
                return;
            }
            
            setUser(u);

            // Check cache first
            const cache = localStorage.getItem(HISTORY_CACHE_KEY);
            
            if (cache) {
                try {
                    const { data, timestamp, username } = JSON.parse(cache);
                    const age = Date.now() - timestamp;
                    
                    // Use cached data if valid and for same user
                    if (age < CACHE_DURATION && username === u.username) {
                        setHistory(data);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("[CACHE] Parse error:", e);
                }
            }

            // Fetch fresh data
            try {
                const response = await api.get(`/matches/user/${u.username}`);
                const matchData = response.data;
                setHistory(matchData);
                
                // Update cache
                localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({
                    data: matchData,
                    timestamp: Date.now(),
                    username: u.username
                }));
            } catch (error) {
                console.error("[HISTORY] Fetch error:", error);
                toast.error("Failed to load battle logs");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [navigate]);

    // ✅ OPTIMIZED: Memoized match rendering
    const matchElements = useMemo(() => {
        if (!user) return null;

        return history.map((match, idx) => {
            // Case-insensitive username match
            const myData = match.players.find(p => 
                p.username.toLowerCase() === user.username.toLowerCase()
            );
            const opponentData = match.players.find(p => 
                p.username.toLowerCase() !== user.username.toLowerCase()
            );
            
            if (!myData) return null;

            const isWin = myData.isWinner;
            const eloChange = myData.newElo - myData.oldElo; 
            const opponentName = opponentData ? opponentData.username : "Unknown";

            // Status calculation
            const isDisqualified = myData.statusText === "Disqualified";
            const isDraw = myData.statusText === "Draw";

            let statusLetter, statusColor;

            if (isDisqualified) {
                statusLetter = "D";
                statusColor = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            } else if (isDraw) {
                statusLetter = "T";
                statusColor = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            } else if (isWin) {
                statusLetter = "W";
                statusColor = 'bg-green-500/10 text-green-500 border-green-500/20';
            } else {
                statusLetter = "L";
                statusColor = 'bg-red-500/10 text-red-500 border-red-500/20';
            }

            return (
                <div 
                    key={match._id || idx} 
                    className={`bg-[var(--bg-secondary)] p-4 rounded-xl border flex items-center justify-between hover:border-accent transition-all shadow-sm group ${
                        isDisqualified ? 'border-orange-500/30' : 'border-[var(--border-color)]'
                    }`}
                >
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center font-black text-lg md:text-xl border shrink-0 ${statusColor}`}>
                            {statusLetter}
                        </div>
                        
                        {/* Opponent Info */}
                        <div className="min-w-0">
                            <h4 className="font-bold text-base md:text-lg truncate flex items-center gap-2">
                                <span className="opacity-60 text-xs uppercase tracking-wider hidden md:inline-block">
                                    VS
                                </span>
                                {opponentName}
                            </h4>
                            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
                                {format(new Date(match.createdAt), 'MMM d, yyyy • h:mm a')}
                            </p>
                        </div>
                    </div>

                    {/* Score & ELO */}
                    <div className="text-right pl-4 flex flex-col items-end justify-center">
                        <div className="flex items-baseline gap-1">
                            <span className={`font-mono font-bold text-lg md:text-xl ${
                                isWin ? 'text-green-400' : 'text-[var(--text-primary)]'
                            }`}>
                                {myData.score}
                            </span>
                            <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                                pts
                            </span>
                        </div>

                        {eloChange !== 0 ? (
                            <div className={`text-xs font-bold flex items-center gap-1 ${
                                eloChange > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {eloChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {eloChange > 0 ? '+' : ''}{eloChange} ELO
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                No Change
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    }, [history, user]);

    return (
        <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar user={user} onLogout={handleLogout} />
                
                <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-20 md:pb-8">
                    <div className="max-w-4xl mx-auto">
                        
                        {/* Header */}
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-3">
                            <HistoryIcon className="text-accent" />
                            Match History
                        </h2>
                        
                        {/* Content */}
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
                                {matchElements}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History;
// V 1.5
