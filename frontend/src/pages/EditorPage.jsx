/* eslint-disable react-hooks/set-state-in-effect */
// FILE: frontend/src/pages/EditorPage.jsx
// ✅ FIXED VERSION - Timer receives data via props, not socket events

import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import api from '../api.js';
import { Copy, CheckCircle, XCircle, Play, FileText, Code2, Terminal } from 'lucide-react';
import TestCaseResults from '../components/TestCaseResults';
import { useTheme } from '../context/ThemeContext.jsx';

const DEFAULT_BACKEND_URL = 'http://localhost:5000';
const resolveBackendHttpUrl = () => {
    const explicitBackend = import.meta.env.VITE_BACKEND_URL;
    if (explicitBackend) return explicitBackend;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) return apiUrl.replace(/\/api\/?$/, '');

    return DEFAULT_BACKEND_URL;
};

const resolveYjsUrl = () => {
    if (import.meta.env.VITE_YJS_URL) return import.meta.env.VITE_YJS_URL;

    const backendUrl = resolveBackendHttpUrl();
    if (backendUrl.startsWith('https://')) return backendUrl.replace(/^https:\/\//, 'wss://');
    if (backendUrl.startsWith('http://')) return backendUrl.replace(/^http:\/\//, 'ws://');

    return 'ws://localhost:1234';
};

// ✅ FIXED TIMER: Receives initial time via props
// room id removed becasue it was not being used anywhere 
const Timer = React.memo(({ initialTime, socket }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime); // ✅ Initialize from prop
    // const [timeLeft, setTimeLeft] = useState(initialTime ?? 0);

    const intervalRef = useRef(null);

    // ✅ Update when initialTime prop changes (on reconnect)
    useEffect(() => {
        if (initialTime !== null && initialTime !== undefined) {
            console.log(`[TIMER] Setting from prop: ${initialTime}s`);
            setTimeLeft(initialTime);
        }
    }, [initialTime]);

    // ✅ Client-side countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft === undefined) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev === undefined || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [timeLeft]);

    // ✅ Server sync (every 60s)
    useEffect(() => {
        if (!socket) return;

        const handleSyncTime = (serverTime) => {
            const diff = Math.abs(serverTime - (timeLeft || 0));
            
            if (diff > 2) {
                console.log(`[TIMER] Server sync: ${timeLeft}s → ${serverTime}s`);
                setTimeLeft(serverTime);
            }
        };

        socket.on('sync_time', handleSyncTime);

        return () => {
            socket.off('sync_time', handleSyncTime);
        };
    }, [socket, timeLeft]);

    const formatTime = (s) => {
        if (s === null || s === undefined) return '--:--';
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    return (
        <span className={`font-mono text-xl font-bold transition-colors ${
            timeLeft === null || timeLeft === undefined
                ? 'text-gray-500' 
                : timeLeft < 300 
                    ? 'text-red-500 animate-pulse' 
                    : 'text-accent'
        }`}>
            {formatTime(timeLeft)}
        </span>
    );
});

Timer.displayName = 'Timer';

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const username = location.state?.username ?? '';
    const isValidRoomId = typeof roomId === 'string' && roomId.trim().length >= 3;
    
    // UI State
    const [clients, setClients] = useState([]);
    const [problem, setProblem] = useState(null);
    const [mySide, setMySide] = useState(null); 
    const [runResults, setRunResults] = useState(null); 
    const [isRunning, setIsRunning] = useState(false);
    const [language, setLanguage] = useState('cpp'); 
    const [executionStatus, setExecutionStatus] = useState('idle');
    const [arenaUnavailableMessage, setArenaUnavailableMessage] = useState('');
    const [roomLoadError, setRoomLoadError] = useState('');
    
    // Game State
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [scores, setScores] = useState({}); 
    const [gameOverData, setGameOverData] = useState(null);
    
    // ✅ NEW: Timer state (managed by parent)
    const [remainingTime, setRemainingTime] = useState(null);

    // Connection state
    // const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const hasConnectedOnce = useRef(false);
    const roomHydratedRef = useRef(false);

    // Responsive State
    const [activeTab, setActiveTab] = useState('problem'); 

    // Yjs
    const ydocRef = useRef(null);
    const providerRef = useRef(null);

    // Initialize Yjs once
    useEffect(() => {
        if (!ydocRef.current) {
            ydocRef.current = new Y.Doc();
        }
    }, []);

    const debounceTimerRef = useRef(null);

    // ✅ SOCKET CONNECTION
    useEffect(() => {
        if (!username || !isValidRoomId) {
            navigate('/login');
            return;
        }

        roomHydratedRef.current = false;
        setRoomLoadError('');
        setArenaUnavailableMessage('');

        // Initialize Yjs provider
        if (!providerRef.current && ydocRef.current) {
            const yjsUrl = resolveYjsUrl();
            providerRef.current = new WebsocketProvider(yjsUrl, roomId, ydocRef.current);
            
            providerRef.current.on('status', (event) => {
                console.log('[YJS] Status:', event.status);
            });
        }

        if (socketRef.current) return;

        const apiUrl = resolveBackendHttpUrl();
        socketRef.current = io(apiUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });
        
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('[SOCKET] ✅ Connected:', socket.id);
            setConnectionStatus('connected');
            hasConnectedOnce.current = true;

            console.log('[SOCKET] 🎯 Joining room');
            socket.emit('join_room', {
                roomId,
                username
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('[SOCKET] ❌ Disconnected:', reason);
            
            if (hasConnectedOnce.current) {
                setConnectionStatus('disconnected');
                if (reason !== 'io client disconnect') {
                    toast.error('Connection lost. Reconnecting...', { icon: '🔄', duration: 3000 });
                }
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('[SOCKET] ✅ Reconnected after', attemptNumber, 'attempts');
            setConnectionStatus('connected');
            toast.success('Reconnected!', { icon: '✅', duration: 2000 });
        });

        socket.on('connect_error', (err) => {
            console.error('[SOCKET] ⚠️ Connection error:', err.message);
            if (hasConnectedOnce.current) {
                setConnectionStatus('error');
            }
        });

        // ✅ CRITICAL FIX: room_joined handler sets remainingTime
        const handleRoomJoined = (data) => {
            console.log('[SOCKET] 📥 room_joined:', data);
            roomHydratedRef.current = true;
            setClients(data.players || []);
            setProblem(data?.problem ?? null);
            setArenaUnavailableMessage(data?.problem ? '' : 'Matchmaking failed: Problem data did not load for this room.');
            setRoomLoadError(data?.problem ? '' : 'Matchmaking failed: Problem data did not load for this room.');
            setRound(data.round || 1);
            setTotalRounds(data.totalRounds || 2);
            setScores(data.scores || {});
            
            // ✅ CRITICAL: Set timer from server
            if (data.remainingTime !== undefined && data.remainingTime !== null) {
                console.log(`[TIMER] Received from server: ${data.remainingTime}s (${Math.floor(data.remainingTime/60)}m ${data.remainingTime%60}s)`);
                setRemainingTime(data.remainingTime);
            } else {
                console.error('[TIMER] ⚠️ Server did not send remainingTime!');
                setRemainingTime(30 * 60); // Fallback
            }
            
            if (data.username === location.state?.username) {
                setMySide(data.side);
                if (window.innerWidth < 768) setActiveTab(data.side); 
            }
        };

        const handlePlayerJoined = ({ username, players, scores }) => {
            console.log('[SOCKET] 👤 player_joined:', username);
            setClients(players || []);
            setScores(scores || {});
            toast.success(`${username} joined!`, { duration: 2000 });
        };

        const handleNewRound = (data) => {
            console.log('[SOCKET] 🔄 new_round:', data.round);
            toast.success(`Round ${data.round} Started!`, { icon: '🎯' });
            roomHydratedRef.current = true;
            setProblem(data?.problem ?? null);
            setArenaUnavailableMessage(data?.problem ? '' : 'Matchmaking failed: Problem data did not load for this room.');
            setRoomLoadError(data?.problem ? '' : 'Matchmaking failed: Problem data did not load for this room.');
            setRound(data.round);
            setScores(data.scores || {});
            setRunResults(null); 
            setExecutionStatus('idle');
        };

        const handleScoreUpdate = (newScores) => {
            console.log('[SOCKET] 📊 score_update:', newScores);
            setScores(newScores);
        };
        
        const handleGameOver = (data) => {
            console.log('[SOCKET] 🏁 game_over:', data);
            setGameOverData(data);
            
            const myName = location.state?.username;
            const myScore = data.scores[myName] || 0;
            const allPlayers = Object.keys(data.scores);
            const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

            try {
                const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
                history.unshift({
                    date: new Date().toISOString(),
                    opponent: opponentName,
                    winner: data.winner,
                    score: myScore,
                    isDisqualified: data.isDisqualified || false,
                    disqualifiedPlayer: data.disqualifiedPlayer
                });
                
                if (history.length > 50) history.length = 50;
                localStorage.setItem('codearena_history', JSON.stringify(history));

                const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                if (user.username) {
                    if (!user.stats) user.stats = { matchesPlayed: 0, wins: 0, losses: 0 };
                    user.stats.matchesPlayed += 1;
                    
                    if (data.winner === myName) {
                        user.stats.wins += 1;
                    } else if (data.winner !== "Draw") {
                        user.stats.losses += 1;
                    }
                    
                    if (data.eloChanges) {
                        const myEloUpdate = Object.values(data.eloChanges).find(p => p.username === myName);
                        if (myEloUpdate) {
                            user.rating = myEloUpdate.newRating;
                            user.seasonScore = (user.seasonScore || 0) + (myEloUpdate.seasonPoints || 0);
                        }
                    }
                    localStorage.setItem('codearena_user', JSON.stringify(user));
                }
            } catch (e) {
                console.error("Failed to save game stats:", e);
            }
            
            toast.success("Match Ended!", { icon: '🏁' });
        };

        const handleRoomFull = () => {
            toast.error('This room is full!');
            setTimeout(() => navigate('/dashboard'), 2000);
        };

        const handleError = (data) => {
            console.error('[SOCKET] Error:', data.message);
            const message = data?.message || 'Failed to load match data.';
            if (
                message.toLowerCase().includes('no battle problems available') ||
                message.toLowerCase().includes('failed to load a valid battle arena problem') ||
                message.toLowerCase().includes('failed to load the next battle arena problem')
            ) {
                setArenaUnavailableMessage(message);
                setRoomLoadError(message);
            }
            toast.error(message);
        };

        const handleCheatWarning = ({ reason }) => {
            toast.error(`Anti-Cheat Warning: ${reason}`, {
                icon: '🚫',
                duration: 5000,
                style: { borderRadius: '10px', background: '#dc2626', color: '#fff' }
            });
        };

        // ✅ Register all listeners
        socket.on('room_joined', handleRoomJoined);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('new_round', handleNewRound);
        socket.on('score_update', handleScoreUpdate);
        socket.on('game_over', handleGameOver);
        socket.on('room_full', handleRoomFull);
        socket.on('error', handleError);
        socket.on('cheat_warning', handleCheatWarning);

        return () => {
            console.log('[CLEANUP] Cleaning up socket and Yjs');
            
            socket.off('connect');
            socket.off('disconnect');
            socket.off('reconnect');
            socket.off('connect_error');
            socket.off('room_joined');
            socket.off('player_joined');
            socket.off('new_round');
            socket.off('score_update');
            socket.off('game_over');
            socket.off('room_full');
            socket.off('error');
            socket.off('cheat_warning');
            
            socket.disconnect();
            socketRef.current = null;
            
            if (providerRef.current) {
                providerRef.current.destroy();
                providerRef.current = null;
            }
        };
    }, [roomId, navigate, username, isValidRoomId]);

    // ✅ ANTI-CHEAT
    useEffect(() => {
        if (!socketRef.current || gameOverData) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                socketRef.current.emit('cheating_detected', { 
                    roomId, 
                    username: location.state?.username,
                    reason: "Window Switching" 
                });
            }
        };

        const handlePaste = (e) => {
            const pastedData = e.clipboardData.getData('text');
            if (pastedData.length > 50) {
                e.preventDefault();
                socketRef.current.emit('cheating_detected', { 
                    roomId, 
                    username: location.state?.username, 
                    reason: "Massive Code Paste" 
                });
                toast.error("Large code pasting is not allowed!", {
                    icon: '🚫',
                    duration: 3000
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("paste", handlePaste);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("paste", handlePaste);
        };
    }, [roomId, location.state, gameOverData]);

    useEffect(() => {
        if (problem || arenaUnavailableMessage || roomLoadError || gameOverData) return undefined;

        const timeoutId = window.setTimeout(() => {
            if (!roomHydratedRef.current) {
                setRoomLoadError('Matchmaking failed: Room data never arrived from the realtime server. Please retry or restart the backend.');
            }
        }, 12000);

        return () => window.clearTimeout(timeoutId);
    }, [arenaUnavailableMessage, gameOverData, problem, roomLoadError]);

    // Helper functions
    const getPlayerName = useCallback((side) => {
        const player = clients.find(c => c.side === side);
        return player ? player.username : "Waiting...";
    }, [clients]);

    const copyRoomId = useCallback(() => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied!', { duration: 2000 });
    }, [roomId]);

    const runCode = useCallback(async () => {
        if (debounceTimerRef.current) {
            toast.error('Please wait before running again', { duration: 1500 });
            return;
        }

        if (!problem || !ydocRef.current) return;

        setIsRunning(true);
        setExecutionStatus('queued');
        
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
        if (!code.trim()) { 
            toast.error("Code is empty!"); 
            setIsRunning(false);
            setExecutionStatus('idle');
            return; 
        }

        const publicCases = problem.testCases.filter(tc => tc.isPublic) || [];
        const newResults = [];
        
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
        }, 2000);
        
        try {
            setExecutionStatus('running');
            
            for (const [index, tc] of publicCases.entries()) {
                try {
                    const response = await api.post('/run', { 
                        language, 
                        code, 
                        stdin: tc.input 
                    });
                    
                    const actualOutput = response.data.stdout ? response.data.stdout.trim() : "";
                    const expectedOutput = tc.output.trim();
                    const passed = actualOutput === expectedOutput;
                    
                    newResults.push({ 
                        type: 'success', 
                        id: index, 
                        input: tc.input, 
                        expected: expectedOutput, 
                        actual: actualOutput, 
                        error: response.data.stderr, 
                        passed 
                    });
                } catch (err) {
                    if (err.response?.status === 503) {
                        toast.error('Service busy. Please wait and try again.', {
                            duration: 5000
                        });
                    }
                    
                    newResults.push({ 
                        type: 'error', 
                        id: index, 
                        input: tc.input, 
                        error: err.response?.data?.message || "Execution Error", 
                        passed: false 
                    });
                }
            }
            
            setRunResults(newResults);
            setExecutionStatus('success');
        } catch (error) { 
            console.error('[RUN CODE] Error:', error);
            toast.error("Execution Failed");
            setExecutionStatus('error');
        } finally { 
            setIsRunning(false); 
        }
    }, [problem, language, mySide]);

    const submitCode = useCallback(async () => {
        if (debounceTimerRef.current) {
            toast.error('Please wait before submitting again', { duration: 1500 });
            return;
        }

        if (!problem || !ydocRef.current || !socketRef.current) return;

        setIsRunning(true);
        setExecutionStatus('queued');
        
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
        if (!code.trim()) {
            toast.error("Code is empty!");
            setIsRunning(false);
            setExecutionStatus('idle');
            return;
        }

        socketRef.current.emit('code_submitted', { 
            roomId, 
            username: location.state?.username 
        });
        
        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
        }, 3000);
        
        try {
            setExecutionStatus('running');
            
            const response = await api.post('/run/submit', { 
                language, 
                code, 
                problemId: problem._id 
            });

            setRunResults(response.data.results);

            if (response.data.isCorrect) {
                toast.success("✅ Correct! +10 Points", { icon: '🏆', duration: 3000 });
                setExecutionStatus('success');
                
                socketRef.current.emit('level_completed', { 
                    roomId, 
                    username: location.state?.username 
                });
            } else {
                toast.error(`❌ Incorrect Solution`);
                setExecutionStatus('error');
            }
        } catch (error) {
            console.error('[SUBMIT CODE] Error:', error);
            if (error.response?.status === 503) {
                toast.error('Service busy. Please wait and try again.', {
                    duration: 5000
                });
            } else {
                toast.error(error.response?.data?.message || "Submission Error");
            }
            setExecutionStatus('error');
        } finally { 
            setIsRunning(false); 
        }
    }, [problem, language, mySide, roomId, location.state]);

    if (!location.state) {
        return <Navigate to="/" replace />;
    }

    if (arenaUnavailableMessage || roomLoadError) {
        const fallbackMessage = roomLoadError || arenaUnavailableMessage;
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-[28px] border border-[var(--border-color)] bg-[var(--surface-elevated)] p-8 text-center shadow-[0_24px_60px_-28px_var(--shadow-color)]">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <FileText size={28} />
                    </div>
                    <h1 className="mb-3 text-2xl font-black">Matchmaking Unavailable</h1>
                    <p className="leading-relaxed text-[var(--text-secondary)]">
                        {fallbackMessage}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 rounded-xl bg-accent px-5 py-3 font-bold text-black transition-all hover:opacity-90"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="arena-shell relative h-screen w-screen overflow-hidden font-sans flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
            data-theme={theme}
        >
            <style>{`
                .arena-shell[data-theme="light"] .arena-pane,
                .arena-shell[data-theme="light"] .arena-problem-pane,
                .arena-shell[data-theme="light"] .arena-problem-footer,
                .arena-shell[data-theme="light"] .arena-mobile-tabs {
                    background: #fffdf8;
                    color: #1f2937;
                }

                .arena-shell[data-theme="light"] .arena-pane,
                .arena-shell[data-theme="light"] .arena-problem-pane {
                    border-color: #e5e7eb !important;
                }

                .arena-shell[data-theme="light"] .arena-pane-header {
                    background: #ffffff;
                    border-color: #e5e7eb !important;
                }

                .arena-shell[data-theme="light"] .arena-pane-title,
                .arena-shell[data-theme="light"] .arena-room-id {
                    color: #1f2937 !important;
                }

                .arena-shell[data-theme="light"] .arena-pane-muted,
                .arena-shell[data-theme="light"] .arena-problem-copy,
                .arena-shell[data-theme="light"] .arena-mobile-tab {
                    color: #64748b !important;
                }

                .arena-shell[data-theme="light"] .arena-score-pill {
                    background: #f5f5f4 !important;
                    color: #166534 !important;
                    border: 1px solid #d6d3d1;
                }

                .arena-shell[data-theme="light"] .arena-lang-select {
                    background: #f8fafc !important;
                    color: #1f2937 !important;
                    border-color: #d1d5db !important;
                }

                .arena-shell[data-theme="light"] .arena-problem-copy:hover,
                .arena-shell[data-theme="light"] .arena-lang-select:hover {
                    background: #f1f5f9 !important;
                }

                .arena-shell[data-theme="light"] .arena-problem-text,
                .arena-shell[data-theme="light"] .arena-problem-text * {
                    color: #334155 !important;
                }

                .arena-shell[data-theme="light"] .arena-problem-card,
                .arena-shell[data-theme="light"] .arena-results-panel,
                .arena-shell[data-theme="light"] .arena-room-box {
                    background: #ffffff !important;
                    border-color: #e5e7eb !important;
                    color: #1f2937 !important;
                }

                .arena-shell[data-theme="light"] .arena-code-preview {
                    background: #f8fafc !important;
                    color: #334155 !important;
                }

                .arena-shell[data-theme="light"] .arena-run-btn {
                    background: #f5f5f4 !important;
                    color: #1f2937 !important;
                    border: 1px solid #d6d3d1;
                }

                .arena-shell[data-theme="light"] .arena-run-btn:hover {
                    background: #e7e5e4 !important;
                }

                .arena-shell[data-theme="light"] .arena-mobile-tab.is-active {
                    background: #ffffff !important;
                    color: #2563eb !important;
                }

                .arena-shell[data-theme="light"] .arena-modal-card {
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    border-color: #e5e7eb !important;
                }

                .arena-shell[data-theme="light"] .arena-modal-strip {
                    background: #f5f5f4 !important;
                    color: #334155 !important;
                }
            `}</style>
            
            {hasConnectedOnce.current && (connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-bold z-50 animate-pulse">
                    🔄 Reconnecting to server...
                </div>
            )}

            {/* GAME OVER MODAL - Same as before */}
            {gameOverData && (
                <div
                    className="absolute inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4"
                    style={{ backgroundColor: 'var(--overlay-scrim)' }}
                >
                    <div className="arena-modal-card bg-[#1e1e1e] p-6 md:p-10 rounded-2xl border border-accent shadow-2xl text-center w-full max-w-lg">
                        <h1 className="text-6xl mb-4">
                            {gameOverData.isDisqualified ? "🚫" : "🏆"}
                        </h1>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {gameOverData.isDisqualified ? "Disqualified!" : "Match Complete!"}
                        </h2>
                        
                        <p className="text-xl md:text-2xl text-accent mb-6">
                            {gameOverData.isDisqualified ? (
                                gameOverData.disqualifiedPlayer === location.state?.username ? (
                                    <span className="text-red-500">Lost due to rule violation</span>
                                ) : (
                                    <span className="text-green-400">Won by opponent disqualification</span>
                                )
                            ) : (
                                `Winner: ${gameOverData.winner}`
                            )}
                        </p>

                        <div className="space-y-2 mb-8">
                            {Object.entries(gameOverData.scores).map(([user, score]) => (
                                <div key={user} className="arena-modal-strip flex justify-between bg-[#2d2d2d] p-3 rounded-lg">
                                    <span className="font-bold text-white arena-pane-title">{user}</span>
                                    <span className="text-accent font-mono">{score} pts</span>
                                </div>
                            ))}
                        </div>
                        
                        {gameOverData.eloChanges && (
                            <div className="arena-modal-strip space-y-2 mb-8 bg-[#2d2d2d] p-4 rounded-lg">
                                <h3 className="text-sm font-bold text-gray-400 mb-3">Rating Changes</h3>
                                {Object.entries(gameOverData.eloChanges).map(([key, data]) => (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-300 font-medium">{data.username}</span>
                                            <div className="flex gap-4">
                                                <span className={`font-mono ${data.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ELO: {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
                                                </span>
                                                <span className={`font-mono ${data.seasonPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    SP: {data.seasonPoints >= 0 ? '+' : ''}{data.seasonPoints}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all w-full"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 min-h-0">
                
                {/* LEFT PANE */}
                <div className={`${activeTab === 'left' ? 'flex' : 'hidden'} arena-pane md:flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0 order-2 md:order-1`}>
                    <div className="arena-pane-header bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="arena-pane-title font-bold text-sm truncate text-white max-w-[100px]">
                                {getPlayerName('left')}
                            </span>
                            <span className="arena-score-pill bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">
                                {scores[getPlayerName('left')] || 0} pts
                            </span>
                            {mySide === 'left' && (
                                <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">
                                    YOU
                                </span>
                            )}
                        </div>
                        {mySide === 'left' && (
                            <select 
                                className="arena-lang-select bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none cursor-pointer hover:bg-[#4e4e52] transition-colors" 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        {ydocRef.current && providerRef.current && (
                            <CodeEditor 
                                roomId={roomId} 
                                side="left" 
                                isReadOnly={mySide !== 'left'} 
                                ydoc={ydocRef.current} 
                                provider={providerRef.current} 
                                language={mySide === 'left' ? language : 'cpp'} 
                            />
                        )}
                    </div>
                </div>

                {/* CENTER PROBLEM PANE */}
                <div className={`${activeTab === 'problem' ? 'flex' : 'hidden'} arena-problem-pane md:flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0 order-1 md:order-2`}>
                    
                    {/* ✅ FIXED: Pass remainingTime as prop */}
                    <div className="arena-pane-header bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <span className="arena-pane-title font-bold truncate text-sm max-w-[200px] text-white">
                            {problem ? `Q${round}/${totalRounds}: ${problem?.title || 'Untitled Problem'}` : "Loading..."}
                        </span>
                        <Timer 
                            initialTime={remainingTime} 
                            socket={socketRef.current} 
                            roomId={roomId} 
                        />
                    </div>
                    
                    {/* Problem content - same as before... */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 text-sm leading-relaxed min-h-0">
                        {problem ? (
                            <div className="space-y-6 pb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        problem?.difficulty === 'Easy' 
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                            : problem?.difficulty === 'Medium'
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {problem?.difficulty || 'Unknown'}
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">
                                        Description
                                    </h3>
                                    <div 
                                        className="arena-problem-text text-gray-300 prose prose-invert prose-sm max-w-none" 
                                        dangerouslySetInnerHTML={{ __html: String(problem?.description || '').replace(/\n/g, '<br/>') }} 
                                    />
                                </div>
                                
                                {problem?.constraints?.length > 0 && (
                                    <div className="arena-problem-card bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                                        <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">
                                            Constraints
                                        </h3>
                                        <ul className="arena-pane-muted list-disc list-inside text-gray-400 space-y-1">
                                            {problem?.constraints?.map((c, i) => (
                                                <li key={i} className="font-mono text-xs">{c}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div>
                                    <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">
                                        Examples
                                    </h3>
                                    {(problem?.testCases?.filter((tc) => tc?.isPublic) ?? []).map((tc, i) => (
                                        <div key={i} className="arena-problem-card mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
                                            <div className="mb-2">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                                                    Input
                                                </span>
                                                <code className="arena-code-preview block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">
                                                    {tc.input}
                                                </code>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                                                    Expected Output
                                                </span>
                                                <code className="arena-code-preview block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">
                                                    {tc.output}
                                                </code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 animate-pulse">
                                Loading Problem...
                            </div>
                        )}
                    </div>
                    
                    {/* Test Results & Actions - same as before... */}
                    <div className="arena-problem-footer p-0 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0 flex flex-col max-h-[40%]">
                        
                        {executionStatus === 'queued' && (
                            <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-3 text-yellow-400 text-sm text-center font-bold">
                                ⏳ Request queued. Please wait...
                            </div>
                        )}
                        
                        {executionStatus === 'running' && (
                            <div className="bg-blue-500/10 border-b border-blue-500/30 p-3 text-blue-400 text-sm text-center font-bold">
                                ⚡ Executing your code...
                            </div>
                        )}
                        
                        {runResults && runResults.length > 0 && (
                            <div className="arena-results-panel bg-[#252526] border-b border-[#3e3e42] p-4 overflow-y-auto custom-scrollbar">
                                <TestCaseResults results={runResults} />
                            </div>
                        )}
                        
                        <div className="p-4 space-y-4">
                            <div className="arena-room-box flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42]">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="arena-pane-muted text-[10px] text-gray-500 font-bold uppercase">
                                        Room ID
                                    </span>
                                    <span className="arena-room-id text-xs font-mono text-white select-all truncate">
                                        {roomId}
                                    </span>
                                </div>
                                <button 
                                    onClick={copyRoomId} 
                                    className="arena-problem-copy p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors"
                                    aria-label="Copy Room ID"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={runCode} 
                                    disabled={isRunning || !problem} 
                                    className="arena-run-btn flex-1 py-3 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {executionStatus === 'queued' && '⏳ Queued'}
                                    {executionStatus === 'running' && '⚡ Running'}
                                    {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && (
                                        <>
                                            <Play size={16}/> Run Code
                                        </>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={submitCode} 
                                    disabled={isRunning || !problem} 
                                    className="flex-1 py-3 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {executionStatus === 'queued' && '⏳ Queued'}
                                    {executionStatus === 'running' && '⚡ Testing'}
                                    {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE - same as before... */}
                <div className={`${activeTab === 'right' ? 'flex' : 'hidden'} arena-pane md:flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0 order-3`}>
                    <div className="arena-pane-header bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="arena-pane-title font-bold text-sm truncate text-white max-w-[100px]">
                                {getPlayerName('right')}
                            </span>
                            <span className="arena-score-pill bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">
                                {scores[getPlayerName('right')] || 0} pts
                            </span>
                            {mySide === 'right' && (
                                <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">
                                    YOU
                                </span>
                            )}
                        </div>
                        {mySide === 'right' && (
                            <select 
                                className="arena-lang-select bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none cursor-pointer hover:bg-[#4e4e52] transition-colors" 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        {ydocRef.current && providerRef.current && (
                            <CodeEditor 
                                roomId={roomId} 
                                side="right" 
                                isReadOnly={mySide !== 'right'} 
                                ydoc={ydocRef.current} 
                                provider={providerRef.current} 
                                language={mySide === 'right' ? language : 'cpp'} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE TABS */}
            <div className="arena-mobile-tabs md:hidden flex border-t border-[#3e3e42] bg-[#1e1e1e] h-14 shrink-0">
                <button 
                    onClick={() => setActiveTab('left')} 
                    className={`arena-mobile-tab flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        activeTab === 'left' ? 'is-active text-accent bg-[#2d2d2d]' : 'text-gray-500'
                    }`}
                >
                    <Code2 size={18} />
                    <span className="text-[10px] font-bold">Left</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('problem')} 
                    className={`arena-mobile-tab flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        activeTab === 'problem' ? 'is-active text-accent bg-[#2d2d2d]' : 'text-gray-500'
                    }`}
                >
                    <FileText size={18} />
                    <span className="text-[10px] font-bold">Problem</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('right')} 
                    className={`arena-mobile-tab flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                        activeTab === 'right' ? 'is-active text-accent bg-[#2d2d2d]' : 'text-gray-500'
                    }`}
                >
                    <Terminal size={18} />
                    <span className="text-[10px] font-bold">Right</span>
                </button>
            </div>
        </div>
    );
};

export default EditorPage;
// V 1.5
