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
import ChatWidget from '../components/ChatWIdget';
import { HISTORY_CACHE_KEY, readStoredUser } from '../utils/authSessionStorage.js';
import { useTheme } from '../context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
const CACHE_DURATION = 60000; // 60 seconds
const HISTORY_CACHE_MAX_CHARS = 2_000_000;

const isStorageQuotaError = (error) => (
    error?.name === 'QuotaExceededError'
    || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error?.code === 22
    || error?.code === 1014
);

const compactProblemForCache = (problem) => {
    if (!problem || typeof problem === 'string') return problem;

    return {
        _id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        topics: problem.topics,
        description: problem.description,
    };
};

const compactMatchForCache = (match) => ({
    ...match,
    problemIds: (match.problemIds || []).map(compactProblemForCache),
});

const writeHistoryCache = (data, username) => {
    try {
        const payload = JSON.stringify({
            data: data.map(compactMatchForCache),
            timestamp: Date.now(),
            username,
        });

        if (payload.length > HISTORY_CACHE_MAX_CHARS) {
            localStorage.removeItem(HISTORY_CACHE_KEY);
            console.warn("[HISTORY] Cache skipped because payload is too large.");
            return;
        }

        localStorage.setItem(HISTORY_CACHE_KEY, payload);
    } catch (cacheErr) {
        localStorage.removeItem(HISTORY_CACHE_KEY);
        localStorage.removeItem('codearena_history');

        if (isStorageQuotaError(cacheErr)) {
            console.warn("[HISTORY] Cache quota exceeded; continuing without local cache.", cacheErr);
            return;
        }

        console.warn("[HISTORY] Failed to write history cache; continuing without local cache.", cacheErr);
    }
};

const History = () => {
    const { advancedTheme } = useTheme();
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeRound, setActiveRound] = useState(1);
    
    // Self-healing problem loaders for production fallback
    const [fetchedProblems, setFetchedProblems] = useState({});
    const [loadingProblems, setLoadingProblems] = useState(false);

    const navigate = useNavigate();

    const openAnalysisModal = useCallback((match) => {
        setSelectedMatch(match);
        setActiveRound(1);
        setIsModalOpen(true);
    }, []);

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
            const u = readStoredUser();
            if (!u) {
                navigate('/login');
                return;
            }
            
            setUser(u);

            // Check cache first
            try {
                const cache = localStorage.getItem(HISTORY_CACHE_KEY);

                if (cache) {
                    const { data, timestamp, username } = JSON.parse(cache);
                    const age = Date.now() - timestamp;
                    
                    // Use cached data if valid and for same user
                    if (age < CACHE_DURATION && username === u.username) {
                        setHistory(data);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn("[CACHE] Failed to read history cache:", e);
                localStorage.removeItem(HISTORY_CACHE_KEY);
            }

            try {
                const response = await api.get(`/matches/user/${u.username}`, {
                    meta: { skipCache: true },
                });
                const matchData = response.data;
                setHistory(matchData);
                writeHistoryCache(matchData, u.username);
            } catch (error) {
                console.error("[HISTORY] Fetch error:", error);
                toast.error("Failed to load battle logs");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [navigate]);

    // ✅ SELF-HEALING: Fetch unpopulated problem details dynamically in production
    useEffect(() => {
        if (!selectedMatch) return;
        
        const unpopulatedIds = (selectedMatch.problemIds || []).filter(
            id => typeof id === 'string' && !fetchedProblems[id]
        );
        
        if (unpopulatedIds.length === 0) return;
        
        console.log(`[HISTORY] Unpopulated string IDs detected inside selected match:`, unpopulatedIds);
        
        const fetchUnpopulatedProblems = async () => {
            setLoadingProblems(true);
            const newFetched = { ...fetchedProblems };
            let hasNew = false;
            
            try {
                await Promise.all(
                    unpopulatedIds.map(async (id) => {
                        try {
                            console.log(`[HISTORY] Initiating dynamic problem fetch for ID: "${id}"`);
                            const { data } = await api.get(`/problems/${id}`);
                            newFetched[id] = data;
                            hasNew = true;
                            console.log(`[HISTORY] Dynamic problem fetch successful for "${id}":`, data.title);
                        } catch (err) {
                            console.error(`[HISTORY] Failed to fetch problem details for ${id}:`, err);
                        }
                    })
                );
                if (hasNew) {
                    setFetchedProblems(newFetched);
                }
            } catch (err) {
                console.error("[HISTORY] Error batch fetching problems:", err);
            } finally {
                setLoadingProblems(false);
            }
        };
        
        fetchUnpopulatedProblems();
    }, [selectedMatch]);

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
            const opponentName = opponentData?.username || (match.isCustom ? "Practice (Solo)" : "Unknown (Solo)");

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

            const isFrostbyte = advancedTheme === 'frostbyte';

            const snowDecorations = "overflow-hidden after:pointer-events-none after:absolute after:-top-4 after:-right-4 after:w-16 after:h-16 after:bg-white/10 after:blur-xl after:rotate-45";

            const containerClasses = isFrostbyte
                ? `relative bg-[#060B19]/40 backdrop-blur-xl border border-cyan-300/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.15),0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-cyan-900/30 hover:border-cyan-300/60 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-between p-4 rounded-xl group ${snowDecorations} ${isDisqualified ? '!border-orange-500/50' : ''}`
                : `bg-[var(--bg-secondary)] p-4 rounded-xl border flex items-center justify-between hover:border-accent transition-all shadow-sm group ${
                    isDisqualified ? 'border-orange-500/30' : 'border-[var(--border-color)]'
                }`;

            return (
                <div 
                    key={match._id || idx} 
                    className={containerClasses}
                >
                    {isFrostbyte && idx === 0 && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/60 via-cyan-300/40 to-transparent z-10 rounded-t-xl" />
                    )}
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

                    {/* Score, ELO & Analyse */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openAnalysisModal(match)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[10px] md:text-xs font-bold text-[var(--text-secondary)] hover:text-accent hover:border-accent hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                            Analyse
                        </button>

                        <div className="text-right pl-2 flex flex-col items-end justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className={`font-mono font-bold text-lg md:text-xl ${
                                    myData.seasonPointsGained > 0 ? 'text-green-400' : (myData.seasonPointsGained < 0 ? 'text-red-500' : 'text-[var(--text-primary)]')
                                }`}>
                                    {myData.seasonPointsGained > 0 ? '+' : ''}{myData.seasonPointsGained}
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
                </div>
            );
        });
    }, [history, user, advancedTheme, openAnalysisModal]);

    return (
        <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />
                
                <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-20 md:pb-8">
                    <div className="max-w-4xl mx-auto">
                        
                        {/* Header */}
                        <h2 className={advancedTheme === 'frostbyte'
                            ? "text-2xl md:text-3xl mb-6 md:mb-8 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] font-bold tracking-wider"
                            : "text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-3"
                        }>
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
                            <div className={`space-y-3 md:space-y-4 ${advancedTheme === 'frostbyte' ? 'snow-cap' : ''}`}>
                                {matchElements}
                            </div>
                        )}
                    </div>
            </div>

            {/* Analysis Modal */}
            <AnimatePresence>
                {isModalOpen && selectedMatch && (() => {
                    const myData = selectedMatch.players.find(p => 
                        p.username.toLowerCase() === user.username.toLowerCase()
                    );
                    const opponentData = selectedMatch.players.find(p => 
                        p.username.toLowerCase() !== user.username.toLowerCase()
                    );
                    
                    const totalRounds = selectedMatch.problemIds?.length || 1;
                    const rawProblem = selectedMatch.problemIds?.[activeRound - 1];
                    const problem = typeof rawProblem === 'string'
                        ? (fetchedProblems[rawProblem] || { title: `Problem ${activeRound}` })
                        : (rawProblem || { title: `Problem ${activeRound}` });
                    const mySolveTimeMs = selectedMatch.fastestSolveMsByUser?.[user.username];
                    
                    let timeStr = "N/A";
                    if (mySolveTimeMs) {
                        const minutes = Math.floor(mySolveTimeMs / 60000);
                        const seconds = Math.round((mySolveTimeMs % 60000) / 1000);
                        timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                    } else if (myData?.hasSubmitted) {
                        timeStr = "Attempted (Not Solved)";
                    } else {
                        timeStr = "No Attempt";
                    }

                    // Dynamically extract code and language for the active round (with backward compatibility fallbacks)
                    // Check both string and numeric keys since MongoDB/Mongoose may serialize differently
                    const roundKey = String(activeRound);
                    const rc = myData?.roundCodes;
                    const rl = myData?.roundLanguages;
                    const submissionCode = rc?.[roundKey] || rc?.[activeRound] || myData?.code || "// No submission code recorded for this round.";
                    const submissionLanguage = rl?.[roundKey] || rl?.[activeRound] || myData?.language || "N/A";
                    
                    console.log(`[HISTORY MODAL] Active Round: ${activeRound}`, {
                        roundCodes: myData?.roundCodes,
                        code: myData?.code,
                        extractedCode: submissionCode?.substring(0, 80),
                        language: submissionLanguage
                    });

                    return (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            
                            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] flex flex-col h-[580px] max-h-[90dvh]">
                                {/* Header */}
                                <div className="flex items-start justify-between border-b border-[var(--border-color)] px-6 py-5 text-left">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Match Analysis</p>
                                        <h3 className="mt-1 text-xl font-black text-[var(--text-primary)]">
                                            {problem?.title || "Problem Unavailable"}
                                        </h3>
                                        {problem?.difficulty && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                                    problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                    {problem.difficulty}
                                                </span>
                                                {(problem.topics || []).map((topic, idx) => (
                                                    <span key={idx} className="inline-flex items-center rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-color)] hover:text-[var(--text-primary)]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
                                    {/* Round Selector Tabs (Visible when more than 1 round) */}
                                    {totalRounds > 1 && (
                                        <div className="flex gap-2 pb-3 overflow-x-auto custom-scrollbar border-b border-[var(--border-color)]">
                                            {selectedMatch.problemIds.map((p, idx) => {
                                                const roundNum = idx + 1;
                                                const isActive = activeRound === roundNum;
                                                const tabTitle = p?.title || fetchedProblems[typeof p === 'string' ? p : p?._id]?.title || `Round ${roundNum}`;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveRound(roundNum)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                                            isActive 
                                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                                                                : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                                                        }`}
                                                    >
                                                        {tabTitle}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Your Solve Time</p>
                                            <p className="mt-1.5 text-lg font-black text-emerald-400">{timeStr}</p>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Language Used</p>
                                            <p className="mt-1.5 text-lg font-black text-blue-400">{submissionLanguage.toUpperCase()}</p>
                                        </div>
                                    </div>

                                    {/* Problem Description */}
                                    {/* Problem Description */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Problem Description</h4>
                                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 p-4 text-xs leading-relaxed text-[var(--text-secondary)] max-h-[120px] overflow-y-auto custom-scrollbar">
                                            {problem?.description || (loadingProblems ? "Fetching description..." : "No problem details available.")}
                                        </div>
                                    </div>

                                    {/* Submission Code */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Your Solution Code</h4>
                                        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)]">
                                            <CodeMirror
                                                value={submissionCode}
                                                height="auto"
                                                maxHeight="300px"
                                                theme={vscodeDark}
                                                extensions={[
                                                    submissionLanguage?.toLowerCase() === 'javascript' ? javascript() :
                                                    submissionLanguage?.toLowerCase() === 'python' ? python() :
                                                    submissionLanguage?.toLowerCase() === 'java' ? java() :
                                                    cpp()
                                                ]}
                                                editable={false}
                                                readOnly={true}
                                                basicSetup={{
                                                    lineNumbers: true,
                                                    foldGutter: false,
                                                    highlightActiveLine: false,
                                                }}
                                                className="text-[11px] sm:text-xs text-left"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </AnimatePresence>
            <ChatWidget user={user} />
        </div>
    </div>
    );
};

export default History;
// V 1.5
