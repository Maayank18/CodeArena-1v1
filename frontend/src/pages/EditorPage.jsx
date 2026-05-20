/* eslint-disable react-hooks/set-state-in-effect */
// FILE: frontend/src/pages/EditorPage.jsx
// ✅ FIXED VERSION - Timer receives data via props, not socket events

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import CodeEditor from '../components/CodeEditor';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import api from '../api.js';
import { Copy, Play, FileText, Code2, Terminal, Swords, Sun, Moon, Clock3, LogOut } from 'lucide-react';
import Avatar from '../components/Avatar';
import { getBadgeIconData } from '../utils/badgeHelper';
import { Trophy } from 'lucide-react';

import { getBadgeImage } from '../utils/badgeAssets';
import TestCaseResults from '../components/TestCaseResults';
import ProblemMarkdown from '../components/ProblemMarkdown';
import WinningModal from '../components/WinningModal.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import SpiralNotebookWidget from '../components/SpiralNotebookWidget.jsx';
import { resolveBackendOrigin } from '../api.js';
import { outputsMatch, sanitizeOutput } from '../utils/outputMatching.js';
import {
    clearDerivedUserCaches,
    refreshCurrentUserProfile,
} from '../utils/sessionSync.js';

const DEFAULT_BACKEND_URL = 'http://localhost:5000';
const isLocalhostLike = (value = '') => /localhost|127\.0\.0\.1/i.test(String(value));
const resolveBackendHttpUrl = () => {
    const explicitBackend = import.meta.env.VITE_BACKEND_URL;
    if (explicitBackend && !(import.meta.env.PROD && isLocalhostLike(explicitBackend))) return explicitBackend;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && !(import.meta.env.PROD && isLocalhostLike(apiUrl))) return apiUrl.replace(/\/api\/?$/, '');

    if (import.meta.env.PROD) {
        return resolveBackendOrigin();
    }

    return DEFAULT_BACKEND_URL;
};

const resolveYjsUrl = () => {
    if (import.meta.env.VITE_YJS_URL && !(import.meta.env.PROD && isLocalhostLike(import.meta.env.VITE_YJS_URL))) {
        return import.meta.env.VITE_YJS_URL;
    }

    const backendUrl = resolveBackendHttpUrl();
    if (backendUrl.startsWith('https://')) return backendUrl.replace(/^https:\/\//, 'wss://');
    if (backendUrl.startsWith('http://')) return backendUrl.replace(/^http:\/\//, 'ws://');

    return 'ws://localhost:1234';
};

const buildCustomRoomAuthKey = (roomId) => `codearena_custom_room_auth_${roomId}`;
const CUSTOMIZATION_ACCESS_TIERS = new Set(['pro', 'premium']);
const SUPPORTED_EDITOR_LANGUAGES = ['javascript', 'cpp', 'java', 'python'];
const DEFAULT_EDITOR_LANGUAGE = 'cpp';
const DEFAULT_EDITOR_BOILERPLATES = {
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();

    // CodeArena uses Standard I/O mode.
    // Write the full program from scratch: input parsing, helper functions, and output.
}

solve();`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // CodeArena uses Standard I/O mode.
    // Write the full program from scratch: input parsing, helper functions, and output.

    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // CodeArena uses Standard I/O mode.
        // Write the full program from scratch: input parsing, helper methods, and output.
    }
}`,
    python: `import sys

def solve():
    data = sys.stdin.read().split()

    # CodeArena uses Standard I/O mode.
    # Write the full program from scratch: input parsing, helper functions, and output.

if __name__ == "__main__":
    solve()`,
};

const getArenaLanguageStorageKey = ({ roomId, problemId, side }) =>
    `codearena_arena_language_${roomId}_${problemId}_${side}`;

const getArenaDraftStorageKey = ({ roomId, problemId, side, language }) =>
    `codearena_arena_draft_${roomId}_${problemId}_${side}_${language}`;

const normalizeEditorBoilerplates = (problem) => {
    const source = problem?.boilerplates || problem?.starterCode || {};

    return {
        javascript: source.javascript || DEFAULT_EDITOR_BOILERPLATES.javascript,
        cpp: source.cpp || DEFAULT_EDITOR_BOILERPLATES.cpp,
        java: source.java || DEFAULT_EDITOR_BOILERPLATES.java,
        python: source.python || DEFAULT_EDITOR_BOILERPLATES.python,
    };
};

const replaceYTextContent = (ytext, nextValue = '') => {
    const currentValue = ytext.toString();
    if (currentValue === nextValue) return;

    ytext.doc?.transact(() => {
        if (ytext.length > 0) {
            ytext.delete(0, ytext.length);
        }
        if (nextValue) {
            ytext.insert(0, nextValue);
        }
    });
};

const normalizeGameOverPayload = (data, currentUsername) => {
    const scores = data?.scores && typeof data.scores === 'object' ? data.scores : {};
    const playerResults = data?.playerResults && typeof data.playerResults === 'object' ? data.playerResults : {};
    const inferredWinnerName =
        data?.winnerName ||
        data?.winner ||
        Object.entries(playerResults).find(([, value]) => value?.isWinner)?.[0] ||
        (Object.keys(scores).length === 1 ? Object.keys(scores)[0] : '');
    const currentPlayerResult =
        playerResults[currentUsername] ||
        Object.entries(playerResults).find(([k]) => k.toLowerCase() === String(currentUsername).toLowerCase())?.[1] ||
        (Object.keys(playerResults).length === 1 ? Object.values(playerResults)[0] : null);

    return {
        winner: inferredWinnerName || (data?.message ? '' : 'Draw'),
        winnerName: inferredWinnerName || (currentUsername ? currentUsername : 'Player'),
        winnerId: data?.winnerId || null,
        isDisqualified: Boolean(data?.isDisqualified),
        disqualifiedPlayer: data?.disqualifiedPlayer || null,
        scores,
        eloChanges: data?.eloChanges && typeof data.eloChanges === 'object' ? data.eloChanges : {},
        playerResults,
        pointsEarned: Number(currentPlayerResult?.seasonPoints ?? data?.pointsEarned ?? 0) || 0,
        newElo: currentPlayerResult?.newElo ?? data?.newElo ?? null,
        message: data?.message || '',
    };
};

// ✅ FIXED TIMER: Receives initial time via props
const Timer = React.memo(({ initialTime, socket }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (initialTime !== null && initialTime !== undefined) {
            setTimeLeft(initialTime);
        }
    }, [initialTime]);

    useEffect(() => {
        if (timeLeft === null || timeLeft === undefined) return;
        if (intervalRef.current) clearInterval(intervalRef.current);

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

    useEffect(() => {
        if (!socket) return;
        const handleSyncTime = (serverTime) => {
            const diff = Math.abs(serverTime - (timeLeft || 0));
            if (diff > 2) setTimeLeft(serverTime);
        };
        socket.on('sync_time', handleSyncTime);
        return () => socket.off('sync_time', handleSyncTime);
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

const TimerBadge = React.memo(({ initialTime, socket, compact = false }) => {
    if (compact) {
        return (
            <div
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent animate-pulse"
                title="Match timer is running"
                aria-label="Match timer is running"
            >
                <Clock3 size={15} />
            </div>
        );
    }

    return <Timer initialTime={initialTime} socket={socket} />;
});

TimerBadge.displayName = 'TimerBadge';

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const navigate = useNavigate();

    const { theme, toggleTheme } = useTheme();
    
    const storedUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('codearena_user') || '{}');
        } catch {
            return {};
        }
    })();

    const storedCustomJoin = (() => {
        try {
            return JSON.parse(localStorage.getItem(buildCustomRoomAuthKey(roomId)) || '{}');
        } catch {
            return {};
        }
    })();
    const username = location.state?.username ?? storedUser?.username ?? '';
    const joinToken = location.state?.joinToken ?? storedCustomJoin?.joinToken ?? '';
    const isValidRoomId = typeof roomId === 'string' && roomId.trim().length >= 3;
    const userRole = storedUser?.role?.toLowerCase() || 'user';
    const userPlan = storedUser?.subscriptionPlan?.toLowerCase() || 'free';
    const hasCustomizationAccess = userRole === 'admin' || CUSTOMIZATION_ACCESS_TIERS.has(userPlan);
    const isDark = theme === 'dark';

    // UI State
    const [clients, setClients] = useState([]);
    const [problem, setProblem] = useState(null);
    const [mySide, setMySide] = useState(null); 
    const [runResults, setRunResults] = useState(null); 
    const [isRunning, setIsRunning] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [language, setLanguage] = useState(DEFAULT_EDITOR_LANGUAGE); 
    const [arenaUnavailableMessage, setArenaUnavailableMessage] = useState('');
    const [roomLoadError, setRoomLoadError] = useState('');
    
    // Game State
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [scores, setScores] = useState({}); 
    const [gameOverData, setGameOverData] = useState(null);
    const [remainingTime, setRemainingTime] = useState(null);
    const [showEntrance, setShowEntrance] = useState(false);
    const [entranceData, setEntranceData] = useState(null);
    const [aiHelpsUsed, setAiHelpsUsed] = useState(0);
    const [sessionNoteTitle, setSessionNoteTitle] = useState("Arena Battle Match");

    const ENTRANCE_BANNERS = {
        'default-dark': 'from-gray-900 to-black',
        'aurora-borealis': 'from-emerald-600 via-cyan-700 to-blue-800',
        'cyber-grid': 'from-violet-700 via-purple-800 to-indigo-900',
        'gradient-sunset': 'from-orange-600 via-rose-700 to-pink-800',
        'deep-ocean': 'from-blue-800 via-sky-900 to-teal-900',
        'neon-tokyo': 'from-pink-600 via-fuchsia-800 to-violet-900',
    };

    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const hasConnectedOnce = useRef(false);
    const roomHydratedRef = useRef(false);
    const [activeTab, setActiveTab] = useState('problem'); 

    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const activeEditorContextRef = useRef(null);
    const problemContainerRef = useRef(null);
    const problemLabel = problem ? `Q${round}/${totalRounds}: ${problem.title}` : (roomId?.startsWith('C-') && clients.length < 2 ? 'Waiting for Challenger...' : 'Loading...');
    const shouldCompactTimer = problemLabel.length > 30;
    const notebookSide = mySide === 'left' ? 'right' : 'left';
    const boilerplates = useMemo(() => normalizeEditorBoilerplates(problem), [problem]);

    // ✅ Robust Entrance Animation Control
    useEffect(() => {
        if (showEntrance) {
            const timer = setTimeout(() => {
                setShowEntrance(false);
            }, 5000); // Extended to 5s for better effect
            return () => clearTimeout(timer);
        }
    }, [showEntrance]);

    useEffect(() => {
        if (runResults && problemContainerRef.current) {
            const timer = setTimeout(() => {
                if (problemContainerRef.current) {
                    problemContainerRef.current.scrollTo({
                        top: problemContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [runResults]);

    useEffect(() => {
        // Sync profile to ensure subscription plan is up-to-date
        api.get('/settings/profile').then(({ data }) => {
            if (data?.user) {
                const existing = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                const merged = { ...existing, ...data.user };
                localStorage.setItem('codearena_user', JSON.stringify(merged));
                window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: merged }));
            }
        }).catch(() => {});

        if (!ydocRef.current) {
            ydocRef.current = new Y.Doc();
        }
    }, []);

    const debounceTimerRef = useRef(null);

    const persistArenaDraft = useCallback((problemId, side, draftLanguage, code) => {
        if (!problemId || !side || !draftLanguage) return;

        try {
            localStorage.setItem(
                getArenaDraftStorageKey({ roomId, problemId, side, language: draftLanguage }),
                code
            );
        } catch (error) {
            console.warn('[Editor] Failed to persist arena draft:', error);
        }
    }, [roomId]);

    const readArenaDraft = useCallback((problemId, side, draftLanguage) => {
        if (!problemId || !side || !draftLanguage) return null;

        try {
            return localStorage.getItem(
                getArenaDraftStorageKey({ roomId, problemId, side, language: draftLanguage })
            );
        } catch (error) {
            console.warn('[Editor] Failed to read arena draft:', error);
            return null;
        }
    }, [roomId]);

    useEffect(() => {
        if (!problem?._id || !mySide) return;

        const languageStorageKey = getArenaLanguageStorageKey({
            roomId,
            problemId: problem._id,
            side: mySide,
        });

        let preferredLanguage = DEFAULT_EDITOR_LANGUAGE;

        try {
            const storedLanguage = localStorage.getItem(languageStorageKey);
            if (storedLanguage && SUPPORTED_EDITOR_LANGUAGES.includes(storedLanguage)) {
                preferredLanguage = storedLanguage;
            }
        } catch (error) {
            console.warn('[Editor] Failed to read preferred language:', error);
        }

        setLanguage((currentLanguage) => currentLanguage === preferredLanguage ? currentLanguage : preferredLanguage);
    }, [mySide, problem?._id, roomId]);

    useEffect(() => {
        if (!problem?._id || !mySide || !ydocRef.current || !SUPPORTED_EDITOR_LANGUAGES.includes(language)) {
            return;
        }

        const sideText = ydocRef.current.getText(`code-${mySide}`);
        const previousContext = activeEditorContextRef.current;

        if (
            previousContext?.problemId &&
            previousContext?.side === mySide &&
            previousContext?.language
        ) {
            persistArenaDraft(
                previousContext.problemId,
                mySide,
                previousContext.language,
                sideText.toString()
            );
        }

        const draft = readArenaDraft(problem._id, mySide, language);
        const nextCode = draft !== null ? draft : boilerplates[language];
        replaceYTextContent(sideText, nextCode);

        activeEditorContextRef.current = {
            problemId: problem._id,
            side: mySide,
            language,
        };

        setRunResults(null);

        try {
            localStorage.setItem(
                getArenaLanguageStorageKey({ roomId, problemId: problem._id, side: mySide }),
                language
            );
        } catch (error) {
            console.warn('[Editor] Failed to persist preferred language:', error);
        }
    }, [boilerplates, language, mySide, persistArenaDraft, problem?._id, readArenaDraft, roomId]);

    useEffect(() => {
        if (!problem?._id || !mySide || !ydocRef.current || !SUPPORTED_EDITOR_LANGUAGES.includes(language)) {
            return undefined;
        }

        const sideText = ydocRef.current.getText(`code-${mySide}`);
        const persistCurrentDraft = () => {
            persistArenaDraft(problem._id, mySide, language, sideText.toString());
        };

        sideText.observe(persistCurrentDraft);
        return () => {
            persistCurrentDraft();
            sideText.unobserve(persistCurrentDraft);
        };
    }, [language, mySide, persistArenaDraft, problem?._id]);

    useEffect(() => {
        if (!username || !isValidRoomId) {
            navigate('/login');
            return;
        }

        roomHydratedRef.current = false;
        setRoomLoadError('');
        setArenaUnavailableMessage('');

        if (!providerRef.current && ydocRef.current) {
            const yjsUrl = resolveYjsUrl();
            providerRef.current = new WebsocketProvider(yjsUrl, roomId, ydocRef.current);
        }

        if (socketRef.current) return;

        const apiUrl = resolveBackendHttpUrl();
        socketRef.current = io(apiUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            auth: {
                token: storedUser?.token || ''
            }
        });
        
        const socket = socketRef.current;

        socket.on('connect', () => {
            setConnectionStatus('connected');
            hasConnectedOnce.current = true;
            socket.emit('join_room', { roomId, username, joinToken });
        });

        socket.on('disconnect', (reason) => {
            if (hasConnectedOnce.current) {
                setConnectionStatus('disconnected');
                if (reason !== 'io client disconnect') {
                    toast.error('Connection lost. Reconnecting...', { icon: '🔄', duration: 3000 });
                }
            }
        });

        socket.on('reconnect', () => {
            setConnectionStatus('connected');
            toast.success('Reconnected!', { icon: '✅', duration: 2000 });
        });

        socket.on('connect_error', () => {
            if (hasConnectedOnce.current) setConnectionStatus('error');
        });

        const handleRoomJoined = (data) => {
            if (data?.gameOverData) {
                const safeGameOverData = normalizeGameOverPayload(data.gameOverData, username);
                setGameOverData(safeGameOverData);
                return;
            }
            roomHydratedRef.current = true;
            setClients(data.players || []);
            setProblem(data?.problem ?? null);
            setArenaUnavailableMessage(
                data?.waitingForOpponent
                    ? ''
                    : (data?.problem ? '' : 'Matchmaking failed: Problem data did not load for this room.')
            );
            
            if (data.remainingTime !== undefined && data.remainingTime !== null) {
                setRemainingTime(data.remainingTime);
            }
            if (data.totalRounds !== undefined && data.totalRounds !== null) {
                setTotalRounds(data.totalRounds);
            }
            // TRIGGER ENTRANCE BANNER (Only on initial join, not refresh if possible)
            if (data.players && hasCustomizationAccess && !sessionStorage.getItem(`codearena_entrance_shown_${roomId}`)) {
                const me = data.players.find(p => p.username.toLowerCase() === username.toLowerCase());
                const hasCustomEntrance =
                    me?.customization?.entranceBanner &&
                    (
                        me.customization.entranceBanner !== 'default-dark' ||
                        (typeof me.customization.tagline === 'string' &&
                            me.customization.tagline.trim() &&
                            me.customization.tagline.trim().toLowerCase() !== 'novice')
                    );

                if (hasCustomEntrance) {
                    console.log('[ARENA] ✨ Triggering Entrance Banner:', me.customization.entranceBanner);
                    setEntranceData(me.customization);
                    setShowEntrance(true);
                    sessionStorage.setItem(`codearena_entrance_shown_${roomId}`, 'true');
                } else {
                    console.warn('[ARENA] ⚠️ No entrance banner customization found for user');
                }
            }

            if (data.aiHelpsUsed) {
                const myHelps = data.aiHelpsUsed[storedUser?._id] || data.aiHelpsUsed[username] || 0;
                setAiHelpsUsed(myHelps);
            }
            
            if (data.username === username) {
                setMySide(data.side);
                if (window.innerWidth < 768) setActiveTab(data.side); 
            }
        };

        const handlePlayerJoined = ({ username, players, scores }) => {
            setClients(players || []);
            setScores(scores || {});
            toast.success(`${username} joined!`, { duration: 2000 });
        };

        const handleNewRound = (data) => {
            toast.success(`Round ${data.round} Started!`, { icon: '🎯' });
            roomHydratedRef.current = true;
            setProblem(data?.problem ?? null);
            setRound(data.round);
            if (data.totalRounds !== undefined && data.totalRounds !== null) {
                setTotalRounds(data.totalRounds);
            }
            if (data.remainingTime !== undefined && data.remainingTime !== null) {
                setRemainingTime(data.remainingTime);
            }
            setScores(data.scores || {});
            setRunResults(null); 
        };

        const handleScoreUpdate = (newScores) => setScores(newScores);
        
        const handleGameOver = (data) => {
            const safeGameOverData = normalizeGameOverPayload(data, username);
            setGameOverData(safeGameOverData);
            const myName = username;
            const myScore = safeGameOverData.scores?.[myName] || 0;
            const allPlayers = Object.keys(safeGameOverData.scores || {});
            const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

            try {
                const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
                history.unshift({
                    date: new Date().toISOString(),
                    opponent: opponentName,
                    winner: safeGameOverData.winner,
                    score: myScore,
                    isDisqualified: safeGameOverData.isDisqualified,
                    disqualifiedPlayer: safeGameOverData.disqualifiedPlayer
                });
                if (history.length > 50) history.length = 50;
                localStorage.setItem('codearena_history', JSON.stringify(history));

                const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                if (storedUser.username) {
                    if (!storedUser.stats) storedUser.stats = { matchesPlayed: 0, wins: 0, losses: 0 };
                    storedUser.stats.matchesPlayed += 1;
                    if (safeGameOverData.winner === myName) storedUser.stats.wins += 1;
                    else if (safeGameOverData.winner !== "Draw") storedUser.stats.losses += 1;
                    
                    if (safeGameOverData.eloChanges) {
                        const myEloUpdate = Object.values(safeGameOverData.eloChanges).find(p => p.username === myName);
                        if (myEloUpdate) {
                            storedUser.rating = myEloUpdate.newRating;
                            storedUser.seasonScore = (storedUser.seasonScore || 0) + (myEloUpdate.seasonPoints || 0);
                        }
                    }
                    localStorage.setItem('codearena_user', JSON.stringify(storedUser));
                }
                clearDerivedUserCaches();
            } catch (e) { console.error("Failed to save game stats:", e); }
            toast.success("Match Ended!", { icon: '🏁' });
        };

        const handleRoomFull = () => {
            toast.error('This room is full!');
            setTimeout(() => navigate('/dashboard'), 2000);
        };

        const handleError = (data) => {
            const message = data?.message || 'Failed to load match data.';
            if (message.toLowerCase().includes('problem')) {
                setArenaUnavailableMessage(message);
                setRoomLoadError(message);
            }
            toast.error(message);
        };

        const handleCheatWarning = ({ reason }) => {
            toast.error(`Anti-Cheat Warning: ${reason}`, {
                icon: '🚫', duration: 5000, style: { borderRadius: '10px', background: '#dc2626', color: '#fff' }
            });
        };

        socket.on('room_joined', handleRoomJoined);
        socket.on('player_joined', handlePlayerJoined);
        socket.on('new_round', handleNewRound);
        socket.on('score_update', handleScoreUpdate);
        socket.on('game_over', handleGameOver);
        socket.on('room_full', handleRoomFull);
        socket.on('error', handleError);
        socket.on('cheat_warning', handleCheatWarning);

        return () => {
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
            try {
                localStorage.removeItem(buildCustomRoomAuthKey(roomId));
            } catch (e) {}
            clearDerivedUserCaches();
        };
    }, [roomId, navigate, username, isValidRoomId, joinToken, storedUser?._id, storedUser?.token, hasCustomizationAccess]);

    // ✅ ANTI-CHEAT
    useEffect(() => {
        if (!socketRef.current || gameOverData) return;
        const handleVisibilityChange = () => {
            if (document.hidden) {
                socketRef.current.emit('cheating_detected', { roomId, username: location.state?.username, reason: "Window Switching" });
            }
        };
        const handlePaste = (e) => {
            const pastedData = e.clipboardData.getData('text');
            if (pastedData.length > 50) {
                e.preventDefault();
                socketRef.current.emit('cheating_detected', { roomId, username: location.state?.username, reason: "Massive Code Paste" });
                toast.error("Large code pasting is not allowed!", { icon: '🚫', duration: 3000 });
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
                setRoomLoadError('Matchmaking failed: Room data never arrived.');
            }
        }, 12000);
        return () => window.clearTimeout(timeoutId);
    }, [arenaUnavailableMessage, gameOverData, problem, roomLoadError]);

    const copyRoomId = useCallback(() => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied!', { duration: 2000 });
    }, [roomId]);

    const handleReturnToDashboard = useCallback(() => {
        try {
            localStorage.removeItem(buildCustomRoomAuthKey(roomId));
        } catch (error) {
            console.warn('[Editor] Failed to clear room auth cache:', error);
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (providerRef.current) {
            providerRef.current.destroy();
            providerRef.current = null;
        }

        clearDerivedUserCaches();

        return refreshCurrentUserProfile()
            .catch((error) => {
                console.error('[Editor] Failed to refresh profile after match:', error);
            })
            .finally(() => {
                navigate('/dashboard', {
                    replace: true,
                    state: { forceProfileRefresh: true },
                });
            });
    }, [navigate, roomId]);

    const handleLeaveRoom = useCallback(() => {
        const confirmLeave = window.confirm("Are you sure you want to leave the room? If a match is active, leaving will result in a forfeit and loss of ELO/points.");
        if (confirmLeave) {
            handleReturnToDashboard();
        }
    }, [handleReturnToDashboard]);

    const runCode = useCallback(async () => {
        if (debounceTimerRef.current || !problem || !ydocRef.current) return;
        setIsRunning(true);
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        if (!code.trim()) { 
            toast.error("Code is empty!"); setIsRunning(false); return; 
        }
        const publicCases = problem.testCases.filter(tc => tc.isPublic) || [];
        const newResults = [];
        debounceTimerRef.current = setTimeout(() => { debounceTimerRef.current = null; }, 2000);
        try {
            for (const [index, tc] of publicCases.entries()) {
                try {
                    const response = await api.post('/run', { language, code, stdin: tc.input, isArena: true });
                    const actual = sanitizeOutput(response.data.stdout || '');
                    const expected = sanitizeOutput(tc.output || '');
                    const stderr = sanitizeOutput(response.data.stderr || response.data.error || '');
                    const verdict = response.data.verdict || (stderr ? 'runtime_error' : 'accepted');
                    const passed = verdict === 'accepted' && outputsMatch(actual, expected);
                    newResults.push({
                        type: 'success',
                        id: index,
                        input: tc.input,
                        expected,
                        actual,
                        stderr,
                        error: verdict === 'wrong_answer' ? 'Wrong Answer' : (stderr || 'Wrong Answer'),
                        verdict,
                        passed
                    });
                } catch (err) {
                    const errorMessage = err.response?.data?.message || "Execution Error";
                    newResults.push({
                        type: 'error',
                        id: index,
                        input: tc.input,
                        expected: sanitizeOutput(tc.output || ''),
                        actual: '',
                        stderr: errorMessage,
                        error: errorMessage,
                        verdict: 'internal_error',
                        passed: false
                    });
                }
            }
            setRunResults(newResults);
        } catch {
            toast.error("Execution Failed");
        } finally { setIsRunning(false); }
    }, [problem, language, mySide]);

    const submitCode = useCallback(async () => {
        if (debounceTimerRef.current || !problem || !ydocRef.current || !socketRef.current) return;
        setIsRunning(true);
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        if (!code.trim()) {
            toast.error("Code is empty!"); setIsRunning(false); return;
        }
        socketRef.current.emit('code_submitted', { roomId, username: location.state?.username });
        debounceTimerRef.current = setTimeout(() => { debounceTimerRef.current = null; }, 3000);
        try {
            const response = await api.post('/run/submit', { language, code, problemId: problem._id, isArena: true });
            setRunResults(response.data.results || []);
            if (response.data.allPassed) {
                toast.success("✅ Correct! +10 Points", { icon: '🏆' });
                socketRef.current.emit('level_completed', { roomId, username: location.state?.username });
            } else {
                toast.error(`❌ Incorrect Solution`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission Error");
        } finally { setIsRunning(false); }
    }, [problem, language, mySide, roomId, location.state]);

    useEffect(() => {
        if (problem && sessionNoteTitle === "Arena Battle Match") {
            setSessionNoteTitle(`Battle Arena - ${problem.title}`);
        }
    }, [problem, sessionNoteTitle]);

    if (!location.state) return <Navigate to="/" replace />;

    if (arenaUnavailableMessage || roomLoadError) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center px-4">
                <div className="w-full max-w-xl rounded-[28px] border border-[var(--border-color)] bg-[var(--surface-elevated)] p-8 text-center shadow-[0_24px_60px_-28px_var(--shadow-color)]">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent"><FileText size={28} /></div>
                    <h1 className="mb-3 text-2xl font-black">Matchmaking Unavailable</h1>
                    <p className="leading-relaxed text-[var(--text-secondary)]">{roomLoadError || arenaUnavailableMessage}</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-6 rounded-xl bg-accent px-5 py-3 font-bold text-black transition-all hover:opacity-90">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const PaneHeader = ({ side }) => {
        const p = clients.find(c => c.side === side);
        return (
            <div className={`arena-pane-header p-3 flex justify-between items-center border-b shrink-0 h-16 ${
                isDark ? 'bg-[#2d2d2d] border-[#3e3e42]' : 'bg-stone-100 border-stone-300'
            }`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar username={p?.username} src={p?.avatar} avatarFrame={p?.customization?.avatarFrame} className="h-8 w-8 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            {(() => {
                                const equippedBadgeId = p?.customization?.equippedBadge;
                                if (!equippedBadgeId) return null;

                                const badgeData = getBadgeIconData(equippedBadgeId);
                                const badgeImageSrc = getBadgeImage(equippedBadgeId);

                                if (!badgeData && !badgeImageSrc) return null;

                                return (
                                    <span className="w-5 h-5 rounded flex items-center justify-center bg-black/20 shrink-0 mr-1 inline-flex align-middle p-0.5 border border-[var(--border-color)] overflow-hidden" title={badgeData?.name || equippedBadgeId}>
                                        {badgeImageSrc ? (
                                            <img src={badgeImageSrc} alt={badgeData?.name || equippedBadgeId} className="w-full h-full object-contain" />
                                        ) : (
                                            <Trophy size={10} className="text-accent" />
                                        )}
                                    </span>
                                );
                            })()}
                            <span className={`arena-pane-title font-bold text-sm truncate max-w-[100px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{p?.username || 'Waiting...'}</span>
                            <span className={`arena-score-pill px-2 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                isDark ? 'bg-black/50 text-green-400' : 'bg-white text-emerald-600 border border-emerald-200'
                            }`}>{scores[p?.username] || 0} pts</span>
                        </div>
                        <span className={`text-[9px] truncate italic ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{p?.customization?.tagline || 'Coding...'}</span>
                    </div>
                    {mySide === side && <span className="text-accent text-[9px] font-black bg-accent/10 px-1 rounded border border-accent/40">YOU</span>}
                </div>
                {mySide === side && (
                    <div className="flex items-center gap-2">
                        <select 
                            className={`arena-lang-select text-xs p-1 rounded border outline-none cursor-pointer ${
                                isDark
                                    ? 'bg-[#3e3e42] text-white border-[#555]'
                                    : 'bg-white text-slate-800 border-stone-300'
                            }`} 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                        </select>
                        <button 
                            onClick={handleLeaveRoom}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-md transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1 cursor-pointer border border-red-500/20 bg-red-500/5 h-7"
                            title="Leave Arena Room"
                        >
                            <LogOut size={11} />
                            <span>Leave</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="arena-shell relative h-screen w-screen overflow-hidden font-sans flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]" data-theme={theme}>
            
            {/* ✅ PREMIUM MATCH ENTRANCE BANNER (Framer Motion) */}
            <AnimatePresence>
                {showEntrance && entranceData && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`absolute inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br ${ENTRANCE_BANNERS[entranceData.entranceBanner] || 'from-gray-900 to-black'}`}
                    >
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
                            className="text-center space-y-6"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Swords size={80} className="text-white mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                                </motion.div>
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.8, type: "spring" }}
                                    className="absolute -top-4 -right-4 bg-accent text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg"
                                >
                                    VS
                                </motion.div>
                            </div>

                            <div className="space-y-2">
                                <motion.h2 
                                    initial={{ letterSpacing: "0.1em" }}
                                    animate={{ letterSpacing: "0.3em" }}
                                    className="text-7xl font-black text-white uppercase drop-shadow-2xl"
                                >
                                    {entranceData.tagline || 'GLHF'}
                                </motion.h2>
                                <p className="text-white/40 font-mono tracking-[0.5em] text-xs uppercase">Initializing Combat Environment</p>
                            </div>

                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: 200 }}
                                transition={{ delay: 1, duration: 1 }}
                                className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto opacity-50" 
                            />
                        </motion.div>

                        {/* Particle/Grid effect overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
            {hasConnectedOnce.current && (connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-bold z-50 animate-pulse">🔄 Reconnecting...</div>
            )}

            {gameOverData && (
                <WinningModal
                    result={gameOverData}
                    currentUsername={username}
                    onHomeClick={handleReturnToDashboard}
                />
            )}

            {gameOverData ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-[var(--bg-primary)]">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <Swords size={36} className="text-emerald-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold tracking-tight">Match Ended</h2>
                        <p className={`text-sm max-w-md ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                            This arena match has already concluded. All ratings, dynamic ELO changes, and season points have been successfully updated.
                        </p>
                    </div>
                    <button
                        onClick={handleReturnToDashboard}
                        className="px-6 py-3 rounded-xl bg-accent hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                    >
                        Return to Dashboard
                    </button>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:grid md:grid-cols-3">
                <div className={`${activeTab === 'left' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0 overflow-hidden h-full order-2 md:order-1 ${isDark ? 'border-r border-[#3e3e42]' : 'border-r border-stone-300'}`}>
                    <PaneHeader side="left" />
                    <div className="relative flex-1 min-h-0 overflow-hidden">
                        {ydocRef.current && providerRef.current && <CodeEditor side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />}
                    </div>
                </div>

                <div className={`${activeTab === 'problem' ? 'flex' : 'hidden'} md:flex flex-col h-full min-h-0 overflow-hidden order-1 md:order-2 ${
                    isDark ? 'border-r border-[#3e3e42] bg-[#252526]' : 'border-r border-stone-300 bg-stone-50'
                }`}>
                    <div className={`arena-pane-header p-3 flex justify-between items-center border-b shrink-0 h-14 ${
                        isDark ? 'bg-[#2d2d2d] border-[#3e3e42]' : 'bg-stone-100 border-stone-300'
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className="flex p-1 bg-black/20 rounded-lg mr-2">
                                <button 
                                    onClick={() => {
                                        setIsNotesOpen(true);
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isNotesOpen ? 'bg-accent text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Notes
                                </button>
                            </div>
                            <span className={`font-bold truncate text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} title={problemLabel}>
                                {problemLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                                    isDark
                                        ? 'border-[#4a4a4f] bg-[#252526] text-amber-300 hover:bg-[#333438]'
                                        : 'border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                                }`}
                                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                                title={isDark ? 'Switch to bright mode' : 'Switch to dark mode'}
                            >
                                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                            <TimerBadge initialTime={remainingTime} socket={socketRef.current} compact={shouldCompactTimer} />
                        </div>
                    </div>
                    <div ref={problemContainerRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 text-sm leading-relaxed">
                        {!problem && roomId?.startsWith('C-') && clients.length < 2 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Waiting for Challenger...</h3>
                                <p className={`text-sm max-w-sm mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                    Share the Room ID <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded select-all">{roomId}</span> with your opponent.
                                </p>
                                <div className={`max-w-xs border text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 ${
                                    isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-500/30 text-amber-800'
                                }`}>
                                    <span className="text-sm">🔒</span>
                                    <span className="text-left font-semibold">The problem will be revealed the moment they join.</span>
                                </div>
                            </div>
                        ) : !problem ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <span>Loading arena data...</span>
                            </div>
                        ) : (
                            <div className="pb-6">
                                <ProblemMarkdown
                                    problem={problem}
                                    titlePrefix={round}
                                    isDark={isDark}
                                    roomId={roomId}
                                    currentCode={ydocRef.current?.getText(`code-${mySide}`)?.toString() || ''}
                                    userTier={userPlan === 'free' ? 0 : userPlan === 'plus' ? 1 : userPlan === 'pro' ? 2 : 3}
                                    initialHelpsUsed={aiHelpsUsed}
                                />
                                {runResults && <div className={`mt-6 pt-4 border-t ${isDark ? 'border-[#3e3e42]' : 'border-stone-300'}`}><TestCaseResults results={runResults} /></div>}
                            </div>
                        )}
                    </div>
                    <div className={`arena-problem-footer shrink-0 p-4 space-y-4 border-t ${
                        isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-stone-100 border-stone-300'
                    }`}>
                        <div className={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
                            isDark
                                ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100'
                                : 'border-cyan-200 bg-cyan-50 text-cyan-900'
                        }`}>
                            CodeArena runs in Standard I/O mode. Write the full program from scratch, including driver code, input parsing, helper functions, and final output.
                        </div>
                        <div className={`flex items-center justify-between p-2 rounded border ${
                            isDark ? 'bg-[#252526] border-[#3e3e42]' : 'bg-white border-stone-300'
                        }`}><span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>ROOM: {roomId}</span><button onClick={copyRoomId} className={isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}><Copy size={16} /></button></div>
                        <div className="flex gap-3">
                            <button onClick={runCode} disabled={isRunning} className={`flex-1 py-3 rounded font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                                isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}><Play size={16}/> Run</button>
                            <button onClick={submitCode} disabled={isRunning} className="flex-1 py-3 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm disabled:opacity-50">Submit</button>
                        </div>
                    </div>
                </div>

                <div className={`${activeTab === 'right' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0 overflow-hidden h-full order-3 ${isDark ? 'border-l border-[#3e3e42]' : 'border-l border-stone-300'}`}>
                    <PaneHeader side="right" />
                    <div className="relative flex-1 min-h-0 overflow-hidden">
                        {ydocRef.current && providerRef.current && <CodeEditor side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />}
                    </div>
                </div>
            </div>
            )}

            <div className={`md:hidden flex h-14 border-t ${isDark ? 'border-[#3e3e42] bg-[#1e1e1e]' : 'border-stone-300 bg-stone-100'}`}>
                <button onClick={() => setActiveTab('left')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'left' ? (isDark ? 'text-accent bg-[#2d2d2d]' : 'text-accent bg-white') : (isDark ? 'text-gray-500' : 'text-slate-500')}`}><Code2 size={18} /><span className="text-[10px] font-bold">Left</span></button>
                <button onClick={() => setActiveTab('problem')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'problem' ? (isDark ? 'text-accent bg-[#2d2d2d]' : 'text-accent bg-white') : (isDark ? 'text-gray-500' : 'text-slate-500')}`}><FileText size={18} /><span className="text-[10px] font-bold">Problem</span></button>
                <button onClick={() => setActiveTab('right')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'right' ? (isDark ? 'text-accent bg-[#2d2d2d]' : 'text-accent bg-white') : (isDark ? 'text-gray-500' : 'text-slate-500')}`}><Terminal size={18} /><span className="text-[10px] font-bold">Right</span></button>
            </div>

            <SpiralNotebookWidget 
                isOpen={isNotesOpen} 
                onClose={() => setIsNotesOpen(false)} 
                type="battle_arena" 
                contextKey={roomId}
                contextTitle={sessionNoteTitle}
                desktopSide={notebookSide}
            />
        </div>
    );

};

export default EditorPage;
