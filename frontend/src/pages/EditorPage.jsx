// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import toast from 'react-hot-toast';
// import Client from '../components/Client';
// import CodeEditor from '../components/CodeEditor';
// import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';
// import api from '../api.js';
// import { Copy, CheckCircle, XCircle, Play, FileText, Code2, Terminal } from 'lucide-react';
// import TestCaseResults from '../components/TestCaseResults';

// // --- TIMER COMPONENT (Memoized) ---
// const Timer = React.memo(({ initialTime }) => {
//     const [timeLeft, setTimeLeft] = useState(initialTime);

//     useEffect(() => {
//         setTimeLeft(initialTime);
//     }, [initialTime]);

//     useEffect(() => {
//         const interval = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
//         return () => clearInterval(interval);
//     }, []);

//     const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
    
//     return (
//         <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-accent'}`}>
//             {formatTime(timeLeft)}
//         </span>
//     );
// });

// const EditorPage = () => {
//     const socketRef = useRef(null);
//     const location = useLocation();
//     const { roomId } = useParams();
//     const navigate = useNavigate();
    
//     // UI State
//     const [clients, setClients] = useState([]);
//     const [problem, setProblem] = useState(null);
//     const [mySide, setMySide] = useState(null); 
//     const [runResults, setRunResults] = useState(null); 
//     const [isRunning, setIsRunning] = useState(false);
//     const [language, setLanguage] = useState('cpp'); 
    
//     // Game State
//     const [round, setRound] = useState(1);
//     const [totalRounds, setTotalRounds] = useState(3);
//     const [scores, setScores] = useState({}); 
//     const [gameOverData, setGameOverData] = useState(null);
//     const [timeLeft, setTimeLeft] = useState(1800); 

//     // Responsive State
//     const [activeTab, setActiveTab] = useState('problem'); 

//     // Yjs Logic
//     const ydocRef = useRef(new Y.Doc());
//     const providerRef = useRef(null);

//     // 1. INITIALIZE CONNECTION & ANTI-CHEAT
//     useEffect(() => {
//         if (!location.state?.username) return; 

//         if (!providerRef.current) {
//             providerRef.current = new WebsocketProvider(import.meta.env.VITE_YJS_URL, roomId, ydocRef.current);
//         }

//         const init = async () => {
//             if (socketRef.current) return;

//             socketRef.current = io(import.meta.env.VITE_API_URL);
            
//             const handleConnectError = (err) => {
//                 console.error(err);
//                 toast.error('Connection failed');
//                 navigate('/');
//             };

//             const handleRoomJoined = (data) => {
//                 setClients(data.players);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setTotalRounds(data.totalRounds);
//                 setScores(data.scores);
//                 if (data.remainingTime !== undefined) {
//                     setTimeLeft(data.remainingTime);
//                 }
                
//                 if (data.username === location.state?.username) {
//                     setMySide(data.side);
//                     if (window.innerWidth < 768) setActiveTab(data.side); 
//                 }
//             };

//             const handlePlayerJoined = ({ username, side }) => {
//                 setClients((prev) => {
//                     if (prev.find(p => p.username === username)) return prev;
//                     return [...prev, { username, side }];
//                 });
//                 toast.success(`${username} joined!`);
//             };

//             const handleNewRound = (data) => {
//                 toast.success(`Round ${data.round} Started!`);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setScores(data.scores);
//                 setRunResults(null); 
//             };

//             const handleScoreUpdate = (newScores) => setScores(newScores);
            
//             const handleGameOver = (data) => {
//                 setGameOverData(data);
//                 const myName = location.state?.username;
//                 const myScore = data.scores[myName] || 0;
//                 const allPlayers = Object.keys(data.scores);
//                 const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

//                 const matchData = {
//                     date: new Date().toISOString(),
//                     opponent: opponentName,
//                     winner: data.winner,
//                     score: myScore,
//                     isDisqualified: data.isDisqualified,
//                     disqualifiedPlayer: data.disqualifiedPlayer
//                 };
                
//                 try {
//                     const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
//                     history.unshift(matchData);
//                     localStorage.setItem('codearena_history', JSON.stringify(history));

//                     const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
//                     if (user.username) {
//                         if (!user.stats) user.stats = { matchesPlayed: 0, wins: 0, losses: 0 };
//                         user.stats.matchesPlayed += 1;
//                         if (data.winner === myName) user.stats.wins += 1;
//                         else user.stats.losses += 1;
                        
//                         if (data.eloChanges) {
//                             const myEloUpdate = Object.values(data.eloChanges).find(p => p.username === myName);
//                             if (myEloUpdate) user.rating = myEloUpdate.newRating;
//                         }
//                         localStorage.setItem('codearena_user', JSON.stringify(user));
//                     }
//                 } catch (e) {
//                     console.error("Failed to save game stats:", e);
//                 }
                
//                 toast.success("Tournament Ended!", { icon: '🏁' });
//             };

//             socketRef.current.on('connect_error', handleConnectError);
//             socketRef.current.on('room_joined', handleRoomJoined);
//             socketRef.current.on('player_joined', handlePlayerJoined);
//             socketRef.current.on('new_round', handleNewRound);
//             socketRef.current.on('score_update', handleScoreUpdate);
//             socketRef.current.on('game_over', handleGameOver);

//             socketRef.current.emit('join_room', { roomId, username: location.state?.username });
//         };

//         init();

//         const handleVisibilityChange = () => {
//             if (document.hidden && socketRef.current && !gameOverData) {
//                 socketRef.current.emit('cheating_detected', { 
//                     roomId, 
//                     username: location.state?.username,
//                     reason: "Window Switching" 
//                 });
//             }
//         };

//         const handlePaste = (e) => {
//             const pastedData = e.clipboardData.getData('text');
//             if (pastedData.length > 50) {
//                 e.preventDefault();
//                 if (socketRef.current && !gameOverData) {
//                     socketRef.current.emit('cheating_detected', { 
//                         roomId, 
//                         username: location.state?.username, 
//                         reason: "Massive Code Paste Detected" 
//                     });
//                 }
//                 toast.error("Anti-Cheat Warning: Large code pasting is not allowed!", {
//                     icon: '🚫',
//                     style: { borderRadius: '10px', background: '#333', color: '#fff' }
//                 });
//             }
//         };

//         document.addEventListener("visibilitychange", handleVisibilityChange);
//         window.addEventListener("paste", handlePaste);

//         return () => {
//             if(socketRef.current) {
//                 socketRef.current.off('connect_error');
//                 socketRef.current.off('room_joined');
//                 socketRef.current.off('player_joined');
//                 socketRef.current.off('new_round');
//                 socketRef.current.off('score_update');
//                 socketRef.current.off('game_over');
//                 socketRef.current.disconnect();
//                 socketRef.current = null;
//             }
//             document.removeEventListener("visibilitychange", handleVisibilityChange);
//             window.removeEventListener("paste", handlePaste);
//         };
//     }, [roomId, navigate, location.state, gameOverData]);

//     // --- HELPER FUNCTIONS ---
//     const getPlayerName = useCallback((side) => {
//         const player = clients.find(c => c.side === side);
//         return player ? player.username : "Waiting...";
//     }, [clients]);

//     const copyRoomId = () => {
//         navigator.clipboard.writeText(roomId);
//         toast.success('Room ID copied');
//     };

//     const runCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         if (!code) { 
//             toast.error("Code is empty!"); 
//             setIsRunning(false); 
//             return; 
//         }

//         const publicCases = problem?.testCases.filter(tc => tc.isPublic) || [];
//         const newResults = [];
        
//         try {
//             for (const [index, tc] of publicCases.entries()) {
//                 try {
//                     const response = await api.post('/run', { language, code, stdin: tc.input });
                    
//                     const actualOutput = response.data.stdout ? response.data.stdout.trim() : "";
//                     const expectedOutput = tc.output.trim();
//                     const passed = actualOutput === expectedOutput;
                    
//                     newResults.push({ 
//                         type: 'success', 
//                         id: index, 
//                         input: tc.input, 
//                         expected: expectedOutput, 
//                         actual: actualOutput, 
//                         error: response.data.stderr, 
//                         passed 
//                     });
//                 } catch (err) {
//                     newResults.push({ 
//                         type: 'error', 
//                         id: index, 
//                         input: tc.input, 
//                         error: err.response?.data?.message || "Execution Error", 
//                         passed: false 
//                     });
//                 }
//             }
//             setRunResults(newResults);
//         } catch (error) { 
//             toast.error("Execution Failed"); 
//         } finally { 
//             setIsRunning(false); 
//         }
//     };

//     // ✅ CRITICAL FIX: submitCode function
//     const submitCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         // ✅ STEP 1: Track submission attempt IMMEDIATELY (BEFORE checking results)
//         // This is CRITICAL for the new season points system
//         // Without this, players who submit but fail will be treated as AFK
//         if (socketRef.current) {
//             socketRef.current.emit('code_submitted', { 
//                 roomId, 
//                 username: location.state?.username 
//             });
//             console.log('[FRONTEND] Code submission tracked for:', location.state?.username);
//         }
        
//         try {
//             // ✅ STEP 2: Run the code submission (existing logic)
//             const response = await api.post('/run/submit', { 
//                 language, 
//                 code, 
//                 problemId: problem._id 
//             });

//             // ✅ STEP 3: Set results from backend response
//             setRunResults(response.data.results);

//             // ✅ STEP 4: If correct, emit level_completed (existing logic)
//             if (response.data.isCorrect) {
//                 toast.success("Correct! +10 Points.", { icon: '🏆' });
//                 if (socketRef.current) {
//                     socketRef.current.emit('level_completed', { 
//                         roomId, 
//                         username: location.state?.username 
//                     });
//                 }
//             } else {
//                 // Even if incorrect, submission was already tracked in STEP 1
//                 // So player will get +10 season points (instead of 0) if they lose
//                 toast.error(`Solution Incorrect`);
//             }
//         } catch (error) { 
//             toast.error(error.response?.data?.message || "Submission Error"); 
//             // Even on error, submission was already tracked in STEP 1
//         } finally { 
//             setIsRunning(false); 
//         }
//     };

//     if (!location.state) return <Navigate to="/" />;

//     return (
//         <div className="relative h-screen w-screen bg-dark text-gray-300 overflow-hidden font-sans flex flex-col">
            
//             {/* GAME OVER OVERLAY */}
//             {gameOverData && (
//                 <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4">
//                     <div className="bg-[#1e1e1e] p-6 md:p-10 rounded-2xl border border-accent shadow-2xl text-center w-full max-w-lg">
//                         <h1 className="text-6xl mb-4">{gameOverData.isDisqualified ? "🚫" : "🏆"}</h1>
//                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
//                             {gameOverData.isDisqualified ? "Disqualified!" : "Game Over!"}
//                         </h2>
                        
//                         <p className="text-xl md:text-2xl text-accent mb-6">
//                             {gameOverData.isDisqualified ? (
//                                 gameOverData.disqualifiedPlayer === location.state?.username ? (
//                                     <span className="text-red-500">Lost because of unfair practice</span>
//                                 ) : (
//                                     <span className="text-green-400">Won by opponent disqualification</span>
//                                 )
//                             ) : (
//                                 `Winner: ${gameOverData.winner}`
//                             )}
//                         </p>

//                         <div className="space-y-2 mb-8">
//                             {Object.entries(gameOverData.scores).map(([user, score]) => (
//                                 <div key={user} className="flex justify-between bg-[#2d2d2d] p-3 rounded">
//                                     <span className="font-bold text-white">{user}</span>
//                                     <span className="text-accent">{score} pts</span>
//                                 </div>
//                             ))}
//                         </div>
                        
//                         {/* ✅ OPTIONAL: Display Season Points if available */}
//                         {gameOverData.eloChanges && (
//                             <div className="space-y-2 mb-8 bg-[#2d2d2d] p-4 rounded-lg">
//                                 <h3 className="text-sm font-bold text-gray-400 mb-3">Match Results</h3>
//                                 {Object.entries(gameOverData.eloChanges).map(([key, data]) => (
//                                     <div key={key} className="space-y-1">
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-300">{data.username}</span>
//                                             <div className="flex gap-4">
//                                                 <span className={data.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}>
//                                                     ELO: {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
//                                                 </span>
//                                                 <span className={data.seasonPoints >= 0 ? 'text-green-400' : 'text-red-400'}>
//                                                     Season: {data.seasonPoints >= 0 ? '+' : ''}{data.seasonPoints}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
                        
//                         <button onClick={() => navigate('/dashboard')} className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all w-full">Back to Home</button>
//                     </div>
//                 </div>
//             )}

//             {/* MAIN GRID */}
//             <div className="flex-1 flex flex-col md:grid md:grid-cols-3 min-h-0">
//                 {/* LEFT PANE */}
//                 <div className={`${activeTab === 'left' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0 order-2 md:order-1`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('left')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('left')] || 0} pts</span>
//                             {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'left' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
//                     </div>
//                 </div>

//                 {/* CENTER PANE */}
//                 <div className={`${activeTab === 'problem' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0 order-1 md:order-2`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <span className="font-bold truncate text-sm max-w-[200px] text-white">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
//                         <Timer initialTime={timeLeft} /> 
//                     </div>
//                     <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 text-sm leading-relaxed min-h-0">
//                         {problem ? (
//                             <div className="space-y-6 pb-6">
//                                 <div className="flex items-center gap-2 mb-2">
//                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
//                                         {problem.difficulty}
//                                     </span>
//                                 </div>
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Description</h3>
//                                     <div className="text-gray-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
//                                 </div>
//                                 {problem.constraints && (
//                                     <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
//                                         <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3>
//                                         <ul className="list-disc list-inside text-gray-400 space-y-1">
//                                             {problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}
//                                         </ul>
//                                     </div>
//                                 )}
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>
//                                     {problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (
//                                         <div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
//                                             <div className="mb-2"><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Input</span><code className="block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code></div>
//                                             <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Expected Output</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code></div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
//                     </div>
                    
//                     <div className="p-0 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0 flex flex-col max-h-[40%]">
//                         {runResults && (
//                             <div className="bg-[#252526] border-b border-[#3e3e42] p-4 overflow-y-auto custom-scrollbar">
//                                 <TestCaseResults results={runResults} />
//                             </div>
//                         )}
                        
//                         <div className="p-4 space-y-4">
//                             <div className="flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42]">
//                                 <div className="flex flex-col overflow-hidden"><span className="text-[10px] text-gray-500 font-bold uppercase">Room ID</span><span className="text-xs font-mono text-white select-all truncate">{roomId}</span></div>
//                                 <button onClick={copyRoomId} className="p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors"><Copy size={16} /></button>
//                             </div>
//                             <div className="flex gap-3">
//                                 <button onClick={runCode} disabled={isRunning} className="flex-1 py-3 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors flex items-center justify-center gap-2">
//                                     {isRunning ? 'Running...' : <><Play size={16}/> Run Code</>}
//                                 </button>
//                                 <button onClick={submitCode} disabled={isRunning} className="flex-1 py-3 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors">Submit</button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* RIGHT PANE */}
//                 <div className={`${activeTab === 'right' ? 'flex' : 'hidden'} md:flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0 order-3`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('right')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('right')] || 0} pts</span>
//                             {mySide === 'right' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'right' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
//                     </div>
//                 </div>
//             </div>

//             {/* MOBILE BOTTOM TABS */}
//             <div className="md:hidden flex border-t border-[#3e3e42] bg-[#1e1e1e] h-14 shrink-0">
//                 <button onClick={() => setActiveTab('left')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'left' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Code2 size={18} /><span className="text-[10px] font-bold">Left</span></button>
//                 <button onClick={() => setActiveTab('problem')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'problem' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><FileText size={18} /><span className="text-[10px] font-bold">Problem</span></button>
//                 <button onClick={() => setActiveTab('right')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'right' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Terminal size={18} /><span className="text-[10px] font-bold">Right</span></button>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;























// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import toast from 'react-hot-toast';
// import Client from '../components/Client';
// import CodeEditor from '../components/CodeEditor';
// import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';
// import api from '../api.js';
// import { Copy, CheckCircle, XCircle, Play, FileText, Code2, Terminal } from 'lucide-react';
// import TestCaseResults from '../components/TestCaseResults';

// // ✅ OPTIMIZED TIMER: Client-side countdown + Server sync
// const Timer = React.memo(({ socket, roomId }) => {
//     const [timeLeft, setTimeLeft] = useState(1800);
//     const intervalRef = useRef(null);
//     const lastSyncRef = useRef(Date.now());

//     // ✅ Client-side countdown (smooth, runs every second)
//     useEffect(() => {
//         intervalRef.current = setInterval(() => {
//             setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
//         }, 1000);

//         return () => {
//             if (intervalRef.current) clearInterval(intervalRef.current);
//         };
//     }, []);

//     // ✅ Server sync (accurate, every 60 seconds from backend)
//     useEffect(() => {
//         if (!socket) return;

//         const handleSyncTime = (serverTime) => {
//             const diff = Math.abs(serverTime - timeLeft);
            
//             // Only sync if difference > 2 seconds (prevents jitter)
//             if (diff > 2) {
//                 console.log(`[TIMER SYNC] Adjusting from ${timeLeft}s to ${serverTime}s`);
//                 setTimeLeft(serverTime);
//             }
            
//             lastSyncRef.current = Date.now();
//         };

//         socket.on('sync_time', handleSyncTime);

//         return () => {
//             socket.off('sync_time', handleSyncTime);
//         };
//     }, [socket, timeLeft]);

//     const formatTime = (s) => {
//         const mins = Math.floor(s / 60);
//         const secs = s % 60;
//         return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
//     };
    
//     return (
//         <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-accent'}`}>
//             {formatTime(timeLeft)}
//         </span>
//     );
// });

// const EditorPage = () => {
//     const socketRef = useRef(null);
//     const location = useLocation();
//     const { roomId } = useParams();
//     const navigate = useNavigate();
    
//     // UI State
//     const [clients, setClients] = useState([]);
//     const [problem, setProblem] = useState(null);
//     const [mySide, setMySide] = useState(null); 
//     const [runResults, setRunResults] = useState(null); 
//     const [isRunning, setIsRunning] = useState(false);
//     const [language, setLanguage] = useState('cpp'); 
//     const [executionStatus, setExecutionStatus] = useState('idle'); // idle, queued, running, success, error
    
//     // Game State
//     const [round, setRound] = useState(1);
//     const [totalRounds, setTotalRounds] = useState(3);
//     const [scores, setScores] = useState({}); 
//     const [gameOverData, setGameOverData] = useState(null);

//     // Connection State
//     const [isConnected, setIsConnected] = useState(false);
//     const [connectionStatus, setConnectionStatus] = useState('connecting');

//     // Responsive State
//     const [activeTab, setActiveTab] = useState('problem'); 

//     // Yjs Logic
//     const ydocRef = useRef(new Y.Doc());
//     const providerRef = useRef(null);

//     // Debounce helper
//     const debounceRef = useRef(null);

//     // 1. INITIALIZE CONNECTION & ANTI-CHEAT
//     useEffect(() => {
//         if (!location.state?.username) return; 

//         if (!providerRef.current) {
//             providerRef.current = new WebsocketProvider(
//                 import.meta.env.VITE_YJS_URL, 
//                 roomId, 
//                 ydocRef.current
//             );
//         }

//         const init = async () => {
//             if (socketRef.current) return;

//             // ✅ OPTIMIZED: Socket.IO with better config
//             socketRef.current = io(import.meta.env.VITE_API_URL, {
//                 transports: ['websocket', 'polling'],
//                 reconnection: true,
//                 reconnectionAttempts: 10,
//                 reconnectionDelay: 1000,
//                 reconnectionDelayMax: 5000,
//                 timeout: 20000
//             });
            
//             // ✅ Connection status tracking
//             socketRef.current.on('connect', () => {
//                 console.log('[SOCKET] Connected:', socketRef.current.id);
//                 setIsConnected(true);
//                 setConnectionStatus('connected');
                
//                 // Re-join room on reconnect
//                 if (mySide) {
//                     console.log('[SOCKET] Reconnected! Re-joining room...');
//                     socketRef.current.emit('join_room', { 
//                         roomId, 
//                         username: location.state?.username 
//                     });
//                 }
//             });

//             socketRef.current.on('disconnect', (reason) => {
//                 console.log('[SOCKET] Disconnected:', reason);
//                 setIsConnected(false);
//                 setConnectionStatus('disconnected');
//                 if (reason !== 'io client disconnect') {
//                     toast.error('Connection lost. Reconnecting...', { icon: '🔄' });
//                 }
//             });

//             socketRef.current.on('reconnect', (attemptNumber) => {
//                 console.log('[SOCKET] Reconnected after', attemptNumber, 'attempts');
//                 setConnectionStatus('connected');
//                 toast.success('Reconnected!', { icon: '✅' });
//             });

//             socketRef.current.on('connect_error', (err) => {
//                 console.error('[SOCKET] Connection error:', err);
//                 setConnectionStatus('error');
//             });

//             const handleRoomJoined = (data) => {
//                 setClients(data.players);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setTotalRounds(data.totalRounds);
//                 setScores(data.scores);
                
//                 if (data.username === location.state?.username) {
//                     setMySide(data.side);
//                     if (window.innerWidth < 768) setActiveTab(data.side); 
//                 }
//             };

//             const handlePlayerJoined = ({ username, side }) => {
//                 setClients((prev) => {
//                     if (prev.find(p => p.username === username)) return prev;
//                     return [...prev, { username, side }];
//                 });
//                 toast.success(`${username} joined!`);
//             };

//             const handleNewRound = (data) => {
//                 toast.success(`Round ${data.round} Started!`);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setScores(data.scores);
//                 setRunResults(null); 
//                 setExecutionStatus('idle');
//             };

//             const handleScoreUpdate = (newScores) => setScores(newScores);
            
//             const handleGameOver = (data) => {
//                 setGameOverData(data);
//                 const myName = location.state?.username;
//                 const myScore = data.scores[myName] || 0;
//                 const allPlayers = Object.keys(data.scores);
//                 const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

//                 const matchData = {
//                     date: new Date().toISOString(),
//                     opponent: opponentName,
//                     winner: data.winner,
//                     score: myScore,
//                     isDisqualified: data.isDisqualified,
//                     disqualifiedPlayer: data.disqualifiedPlayer
//                 };
                
//                 try {
//                     const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
//                     history.unshift(matchData);
//                     localStorage.setItem('codearena_history', JSON.stringify(history));

//                     const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
//                     if (user.username) {
//                         if (!user.stats) user.stats = { matchesPlayed: 0, wins: 0, losses: 0 };
//                         user.stats.matchesPlayed += 1;
//                         if (data.winner === myName) user.stats.wins += 1;
//                         else user.stats.losses += 1;
                        
//                         if (data.eloChanges) {
//                             const myEloUpdate = Object.values(data.eloChanges).find(p => p.username === myName);
//                             if (myEloUpdate) {
//                                 user.rating = myEloUpdate.newRating;
//                                 user.seasonScore = (user.seasonScore || 0) + (myEloUpdate.seasonPoints || 0);
//                             }
//                         }
//                         localStorage.setItem('codearena_user', JSON.stringify(user));
//                     }
//                 } catch (e) {
//                     console.error("Failed to save game stats:", e);
//                 }
                
//                 toast.success("Tournament Ended!", { icon: '🏁' });
//             };

//             socketRef.current.on('room_joined', handleRoomJoined);
//             socketRef.current.on('player_joined', handlePlayerJoined);
//             socketRef.current.on('new_round', handleNewRound);
//             socketRef.current.on('score_update', handleScoreUpdate);
//             socketRef.current.on('game_over', handleGameOver);

//             socketRef.current.emit('join_room', { 
//                 roomId, 
//                 username: location.state?.username 
//             });
//         };

//         init();

//         // Anti-cheat
//         const handleVisibilityChange = () => {
//             if (document.hidden && socketRef.current && !gameOverData) {
//                 socketRef.current.emit('cheating_detected', { 
//                     roomId, 
//                     username: location.state?.username,
//                     reason: "Window Switching" 
//                 });
//             }
//         };

//         const handlePaste = (e) => {
//             const pastedData = e.clipboardData.getData('text');
//             if (pastedData.length > 50) {
//                 e.preventDefault();
//                 if (socketRef.current && !gameOverData) {
//                     socketRef.current.emit('cheating_detected', { 
//                         roomId, 
//                         username: location.state?.username, 
//                         reason: "Massive Code Paste Detected" 
//                     });
//                 }
//                 toast.error("Anti-Cheat Warning: Large code pasting is not allowed!", {
//                     icon: '🚫',
//                     style: { borderRadius: '10px', background: '#333', color: '#fff' }
//                 });
//             }
//         };

//         document.addEventListener("visibilitychange", handleVisibilityChange);
//         window.addEventListener("paste", handlePaste);

//         return () => {
//             if(socketRef.current) {
//                 socketRef.current.off('connect');
//                 socketRef.current.off('disconnect');
//                 socketRef.current.off('reconnect');
//                 socketRef.current.off('connect_error');
//                 socketRef.current.off('room_joined');
//                 socketRef.current.off('player_joined');
//                 socketRef.current.off('new_round');
//                 socketRef.current.off('score_update');
//                 socketRef.current.off('game_over');
//                 socketRef.current.disconnect();
//                 socketRef.current = null;
//             }
//             document.removeEventListener("visibilitychange", handleVisibilityChange);
//             window.removeEventListener("paste", handlePaste);
//         };
//     }, [roomId, navigate, location.state, gameOverData, mySide]);

//     // --- HELPER FUNCTIONS ---
//     const getPlayerName = useCallback((side) => {
//         const player = clients.find(c => c.side === side);
//         return player ? player.username : "Waiting...";
//     }, [clients]);

//     const copyRoomId = () => {
//         navigator.clipboard.writeText(roomId);
//         toast.success('Room ID copied');
//     };

//     // ✅ OPTIMIZED: Debounced code execution
//     const runCode = async () => {
//         // Prevent spam clicks
//         if (debounceRef.current) {
//             toast.error('Please wait before running again', { duration: 1000 });
//             return;
//         }

//         setIsRunning(true);
//         setExecutionStatus('queued');
        
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         if (!code) { 
//             toast.error("Code is empty!"); 
//             setIsRunning(false);
//             setExecutionStatus('idle');
//             return; 
//         }

//         const publicCases = problem?.testCases.filter(tc => tc.isPublic) || [];
//         const newResults = [];
        
//         // Set debounce
//         debounceRef.current = setTimeout(() => {
//             debounceRef.current = null;
//         }, 2000); // 2 second debounce
        
//         try {
//             setExecutionStatus('running');
            
//             for (const [index, tc] of publicCases.entries()) {
//                 try {
//                     const response = await api.post('/run', { 
//                         language, 
//                         code, 
//                         stdin: tc.input 
//                     });
                    
//                     const actualOutput = response.data.stdout ? response.data.stdout.trim() : "";
//                     const expectedOutput = tc.output.trim();
//                     const passed = actualOutput === expectedOutput;
                    
//                     newResults.push({ 
//                         type: 'success', 
//                         id: index, 
//                         input: tc.input, 
//                         expected: expectedOutput, 
//                         actual: actualOutput, 
//                         error: response.data.stderr, 
//                         passed 
//                     });
//                 } catch (err) {
//                     // Handle queue/busy errors
//                     if (err.response?.status === 503 || err.message.includes('temporarily unavailable')) {
//                         toast.error('Service busy. Please wait 30 seconds and try again.', {
//                             duration: 5000
//                         });
//                     }
                    
//                     newResults.push({ 
//                         type: 'error', 
//                         id: index, 
//                         input: tc.input, 
//                         error: err.response?.data?.message || "Execution Error", 
//                         passed: false 
//                     });
//                 }
//             }
//             setRunResults(newResults);
//             setExecutionStatus('success');
//         } catch (error) { 
//             toast.error("Execution Failed");
//             setExecutionStatus('error');
//         } finally { 
//             setIsRunning(false); 
//         }
//     };

//     // ✅ OPTIMIZED: submitCode with better error handling
//     const submitCode = async () => {
//         if (debounceRef.current) {
//             toast.error('Please wait before submitting again', { duration: 1000 });
//             return;
//         }

//         setIsRunning(true);
//         setExecutionStatus('queued');
        
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         // ✅ CRITICAL: Track submission attempt IMMEDIATELY
//         if (socketRef.current) {
//             socketRef.current.emit('code_submitted', { 
//                 roomId, 
//                 username: location.state?.username 
//             });
//             console.log('[FRONTEND] Code submission tracked for:', location.state?.username);
//         }
        
//         // Set debounce
//         debounceRef.current = setTimeout(() => {
//             debounceRef.current = null;
//         }, 3000); // 3 second debounce
        
//         try {
//             setExecutionStatus('running');
            
//             const response = await api.post('/run/submit', { 
//                 language, 
//                 code, 
//                 problemId: problem._id 
//             });

//             setRunResults(response.data.results);

//             if (response.data.isCorrect) {
//                 toast.success("Correct! +10 Points.", { icon: '🏆' });
//                 setExecutionStatus('success');
                
//                 if (socketRef.current) {
//                     socketRef.current.emit('level_completed', { 
//                         roomId, 
//                         username: location.state?.username 
//                     });
//                 }
//             } else {
//                 toast.error(`Solution Incorrect`);
//                 setExecutionStatus('error');
//             }
//         } catch (error) {
//             // Handle queue/busy errors
//             if (error.response?.status === 503 || error.message.includes('temporarily unavailable')) {
//                 toast.error('Submission service busy. Please wait and try again.', {
//                     duration: 5000
//                 });
//             } else {
//                 toast.error(error.response?.data?.message || "Submission Error");
//             }
//             setExecutionStatus('error');
//         } finally { 
//             setIsRunning(false); 
//         }
//     };

//     if (!location.state) return <Navigate to="/" />;

//     return (
//         <div className="relative h-screen w-screen bg-dark text-gray-300 overflow-hidden font-sans flex flex-col">
            
//             {/* ✅ CONNECTION STATUS INDICATOR */}
//             {!isConnected && (
//                 <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-bold z-50">
//                     {connectionStatus === 'reconnecting' ? '🔄 Reconnecting...' : '⚠️ Connection Lost'}
//                 </div>
//             )}

//             {/* GAME OVER OVERLAY */}
//             {gameOverData && (
//                 <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4">
//                     <div className="bg-[#1e1e1e] p-6 md:p-10 rounded-2xl border border-accent shadow-2xl text-center w-full max-w-lg">
//                         <h1 className="text-6xl mb-4">{gameOverData.isDisqualified ? "🚫" : "🏆"}</h1>
//                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
//                             {gameOverData.isDisqualified ? "Disqualified!" : "Game Over!"}
//                         </h2>
                        
//                         <p className="text-xl md:text-2xl text-accent mb-6">
//                             {gameOverData.isDisqualified ? (
//                                 gameOverData.disqualifiedPlayer === location.state?.username ? (
//                                     <span className="text-red-500">Lost because of unfair practice</span>
//                                 ) : (
//                                     <span className="text-green-400">Won by opponent disqualification</span>
//                                 )
//                             ) : (
//                                 `Winner: ${gameOverData.winner}`
//                             )}
//                         </p>

//                         <div className="space-y-2 mb-8">
//                             {Object.entries(gameOverData.scores).map(([user, score]) => (
//                                 <div key={user} className="flex justify-between bg-[#2d2d2d] p-3 rounded">
//                                     <span className="font-bold text-white">{user}</span>
//                                     <span className="text-accent">{score} pts</span>
//                                 </div>
//                             ))}
//                         </div>
                        
//                         {gameOverData.eloChanges && (
//                             <div className="space-y-2 mb-8 bg-[#2d2d2d] p-4 rounded-lg">
//                                 <h3 className="text-sm font-bold text-gray-400 mb-3">Match Results</h3>
//                                 {Object.entries(gameOverData.eloChanges).map(([key, data]) => (
//                                     <div key={key} className="space-y-1">
//                                         <div className="flex justify-between text-sm">
//                                             <span className="text-gray-300">{data.username}</span>
//                                             <div className="flex gap-4">
//                                                 <span className={data.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}>
//                                                     ELO: {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
//                                                 </span>
//                                                 <span className={data.seasonPoints >= 0 ? 'text-green-400' : 'text-red-400'}>
//                                                     Season: {data.seasonPoints >= 0 ? '+' : ''}{data.seasonPoints}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
                        
//                         <button onClick={() => navigate('/dashboard')} className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all w-full">Back to Home</button>
//                     </div>
//                 </div>
//             )}

//             {/* MAIN GRID */}
//             <div className="flex-1 flex flex-col md:grid md:grid-cols-3 min-h-0">
//                 {/* LEFT PANE */}
//                 <div className={`${activeTab === 'left' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0 order-2 md:order-1`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('left')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('left')] || 0} pts</span>
//                             {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'left' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
//                     </div>
//                 </div>

//                 {/* CENTER PANE */}
//                 <div className={`${activeTab === 'problem' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0 order-1 md:order-2`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <span className="font-bold truncate text-sm max-w-[200px] text-white">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
//                         {/* ✅ OPTIMIZED TIMER with socket */}
//                         <Timer socket={socketRef.current} roomId={roomId} />
//                     </div>
//                     <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 text-sm leading-relaxed min-h-0">
//                         {problem ? (
//                             <div className="space-y-6 pb-6">
//                                 <div className="flex items-center gap-2 mb-2">
//                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
//                                         {problem.difficulty}
//                                     </span>
//                                 </div>
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Description</h3>
//                                     <div className="text-gray-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
//                                 </div>
//                                 {problem.constraints && (
//                                     <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
//                                         <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3>
//                                         <ul className="list-disc list-inside text-gray-400 space-y-1">
//                                             {problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}
//                                         </ul>
//                                     </div>
//                                 )}
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>
//                                     {problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (
//                                         <div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
//                                             <div className="mb-2"><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Input</span><code className="block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code></div>
//                                             <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Expected Output</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code></div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
//                     </div>
                    
//                     <div className="p-0 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0 flex flex-col max-h-[40%]">
//                         {/* ✅ QUEUE STATUS */}
//                         {executionStatus === 'queued' && (
//                             <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-3 text-yellow-400 text-sm text-center font-bold">
//                                 ⏳ Request queued. Please wait...
//                             </div>
//                         )}
                        
//                         {executionStatus === 'running' && (
//                             <div className="bg-blue-500/10 border-b border-blue-500/30 p-3 text-blue-400 text-sm text-center font-bold">
//                                 ⚡ Executing your code...
//                             </div>
//                         )}
                        
//                         {runResults && (
//                             <div className="bg-[#252526] border-b border-[#3e3e42] p-4 overflow-y-auto custom-scrollbar">
//                                 <TestCaseResults results={runResults} />
//                             </div>
//                         )}
                        
//                         <div className="p-4 space-y-4">
//                             <div className="flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42]">
//                                 <div className="flex flex-col overflow-hidden"><span className="text-[10px] text-gray-500 font-bold uppercase">Room ID</span><span className="text-xs font-mono text-white select-all truncate">{roomId}</span></div>
//                                 <button onClick={copyRoomId} className="p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors"><Copy size={16} /></button>
//                             </div>
//                             <div className="flex gap-3">
//                                 <button 
//                                     onClick={runCode} 
//                                     disabled={isRunning} 
//                                     className="flex-1 py-3 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                     {executionStatus === 'queued' && '⏳ Queued...'}
//                                     {executionStatus === 'running' && '⚡ Running...'}
//                                     {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && (
//                                         <><Play size={16}/> Run Code</>
//                                     )}
//                                 </button>
//                                 <button 
//                                     onClick={submitCode} 
//                                     disabled={isRunning} 
//                                     className="flex-1 py-3 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                     {executionStatus === 'queued' && '⏳ Queued...'}
//                                     {executionStatus === 'running' && '⚡ Testing...'}
//                                     {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && 'Submit'}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* RIGHT PANE */}
//                 <div className={`${activeTab === 'right' ? 'flex' : 'hidden'} md:flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0 order-3`}>
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('right')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('right')] || 0} pts</span>
//                             {mySide === 'right' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'right' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
//                     </div>
//                 </div>
//             </div>

//             {/* MOBILE BOTTOM TABS */}
//             <div className="md:hidden flex border-t border-[#3e3e42] bg-[#1e1e1e] h-14 shrink-0">
//                 <button onClick={() => setActiveTab('left')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'left' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Code2 size={18} /><span className="text-[10px] font-bold">Left</span></button>
//                 <button onClick={() => setActiveTab('problem')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'problem' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><FileText size={18} /><span className="text-[10px] font-bold">Problem</span></button>
//                 <button onClick={() => setActiveTab('right')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'right' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Terminal size={18} /><span className="text-[10px] font-bold">Right</span></button>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;
























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

// ✅ OPTIMIZED TIMER: Client-side countdown + Server sync
const Timer = React.memo(({ socket, roomId }) => {
    const [timeLeft, setTimeLeft] = useState(1800);
    const intervalRef = useRef(null);
    const lastSyncRef = useRef(Date.now());

    // ✅ Client-side countdown (smooth, runs every second)
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // ✅ Server sync (accurate, every 60 seconds from backend)
    useEffect(() => {
        if (!socket) return;

        const handleSyncTime = (serverTime) => {
            const diff = Math.abs(serverTime - timeLeft);
            
            // Only sync if difference > 2 seconds (prevents jitter)
            if (diff > 2) {
                console.log(`[TIMER SYNC] Adjusting from ${timeLeft}s to ${serverTime}s`);
                setTimeLeft(serverTime);
            }
            
            lastSyncRef.current = Date.now();
        };

        socket.on('sync_time', handleSyncTime);

        return () => {
            socket.off('sync_time', handleSyncTime);
        };
    }, [socket, timeLeft]);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    return (
        <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-accent'}`}>
            {formatTime(timeLeft)}
        </span>
    );
});

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    // UI State
    const [clients, setClients] = useState([]);
    const [problem, setProblem] = useState(null);
    const [mySide, setMySide] = useState(null); 
    const [runResults, setRunResults] = useState(null); 
    const [isRunning, setIsRunning] = useState(false);
    const [language, setLanguage] = useState('cpp'); 
    const [executionStatus, setExecutionStatus] = useState('idle');
    
    // Game State
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [scores, setScores] = useState({}); 
    const [gameOverData, setGameOverData] = useState(null);

    // ✅ FIX: Track connection state properly
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const hasConnectedOnce = useRef(false); // Track if we've ever connected

    // Responsive State
    const [activeTab, setActiveTab] = useState('problem'); 

    // Yjs Logic
    const ydocRef = useRef(new Y.Doc());
    const providerRef = useRef(null);

    // Debounce helper
    const debounceRef = useRef(null);

    // 1. INITIALIZE CONNECTION & ANTI-CHEAT
    useEffect(() => {
        if (!location.state?.username) return; 

        if (!providerRef.current) {
            providerRef.current = new WebsocketProvider(
                import.meta.env.VITE_YJS_URL, 
                roomId, 
                ydocRef.current
            );
        }

        const init = async () => {
            if (socketRef.current) return;

            socketRef.current = io(import.meta.env.VITE_API_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });
            
            // ✅ FIX: Proper connection tracking
            socketRef.current.on('connect', () => {
                console.log('[SOCKET] Connected:', socketRef.current.id);
                setIsConnected(true);
                setConnectionStatus('connected');
                hasConnectedOnce.current = true; // Mark that we've connected
                
                // Re-join room on reconnect
                if (mySide) {
                    console.log('[SOCKET] Reconnected! Re-joining room...');
                    socketRef.current.emit('join_room', { 
                        roomId, 
                        username: location.state?.username 
                    });
                }
            });

            socketRef.current.on('disconnect', (reason) => {
                console.log('[SOCKET] Disconnected:', reason);
                setIsConnected(false);
                
                // ✅ FIX: Only set to 'disconnected' if we've connected before
                if (hasConnectedOnce.current) {
                    setConnectionStatus('disconnected');
                    if (reason !== 'io client disconnect') {
                        toast.error('Connection lost. Reconnecting...', { icon: '🔄' });
                    }
                }
            });

            socketRef.current.on('reconnect', (attemptNumber) => {
                console.log('[SOCKET] Reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
                setConnectionStatus('connected');
                toast.success('Reconnected!', { icon: '✅' });
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('[SOCKET] Connection error:', err);
                // ✅ FIX: Only show error if we've connected before
                if (hasConnectedOnce.current) {
                    setConnectionStatus('error');
                }
            });

            const handleRoomJoined = (data) => {
                setClients(data.players);
                setProblem(data.problem);
                setRound(data.round);
                setTotalRounds(data.totalRounds);
                setScores(data.scores);
                
                if (data.username === location.state?.username) {
                    setMySide(data.side);
                    if (window.innerWidth < 768) setActiveTab(data.side); 
                }
            };

            const handlePlayerJoined = ({ username, side }) => {
                setClients((prev) => {
                    if (prev.find(p => p.username === username)) return prev;
                    return [...prev, { username, side }];
                });
                toast.success(`${username} joined!`);
            };

            const handleNewRound = (data) => {
                toast.success(`Round ${data.round} Started!`);
                setProblem(data.problem);
                setRound(data.round);
                setScores(data.scores);
                setRunResults(null); 
                setExecutionStatus('idle');
            };

            const handleScoreUpdate = (newScores) => setScores(newScores);
            
            const handleGameOver = (data) => {
                setGameOverData(data);
                const myName = location.state?.username;
                const myScore = data.scores[myName] || 0;
                const allPlayers = Object.keys(data.scores);
                const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

                const matchData = {
                    date: new Date().toISOString(),
                    opponent: opponentName,
                    winner: data.winner,
                    score: myScore,
                    isDisqualified: data.isDisqualified,
                    disqualifiedPlayer: data.disqualifiedPlayer
                };
                
                try {
                    const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
                    history.unshift(matchData);
                    localStorage.setItem('codearena_history', JSON.stringify(history));

                    const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                    if (user.username) {
                        if (!user.stats) user.stats = { matchesPlayed: 0, wins: 0, losses: 0 };
                        user.stats.matchesPlayed += 1;
                        if (data.winner === myName) user.stats.wins += 1;
                        else user.stats.losses += 1;
                        
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
                
                toast.success("Tournament Ended!", { icon: '🏁' });
            };

            socketRef.current.on('room_joined', handleRoomJoined);
            socketRef.current.on('player_joined', handlePlayerJoined);
            socketRef.current.on('new_round', handleNewRound);
            socketRef.current.on('score_update', handleScoreUpdate);
            socketRef.current.on('game_over', handleGameOver);

            socketRef.current.emit('join_room', { 
                roomId, 
                username: location.state?.username 
            });
        };

        init();

        // Anti-cheat
        const handleVisibilityChange = () => {
            if (document.hidden && socketRef.current && !gameOverData) {
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
                if (socketRef.current && !gameOverData) {
                    socketRef.current.emit('cheating_detected', { 
                        roomId, 
                        username: location.state?.username, 
                        reason: "Massive Code Paste Detected" 
                    });
                }
                toast.error("Anti-Cheat Warning: Large code pasting is not allowed!", {
                    icon: '🚫',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("paste", handlePaste);

        return () => {
            if(socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('reconnect');
                socketRef.current.off('connect_error');
                socketRef.current.off('room_joined');
                socketRef.current.off('player_joined');
                socketRef.current.off('new_round');
                socketRef.current.off('score_update');
                socketRef.current.off('game_over');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("paste", handlePaste);
        };
    }, [roomId, navigate, location.state, gameOverData, mySide]);

    // --- HELPER FUNCTIONS ---
    const getPlayerName = useCallback((side) => {
        const player = clients.find(c => c.side === side);
        return player ? player.username : "Waiting...";
    }, [clients]);

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied');
    };

    const runCode = async () => {
        if (debounceRef.current) {
            toast.error('Please wait before running again', { duration: 1000 });
            return;
        }

        setIsRunning(true);
        setExecutionStatus('queued');
        
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
        if (!code) { 
            toast.error("Code is empty!"); 
            setIsRunning(false);
            setExecutionStatus('idle');
            return; 
        }

        const publicCases = problem?.testCases.filter(tc => tc.isPublic) || [];
        const newResults = [];
        
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
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
                    if (err.response?.status === 503 || err.message.includes('temporarily unavailable')) {
                        toast.error('Service busy. Please wait 30 seconds and try again.', {
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
            toast.error("Execution Failed");
            setExecutionStatus('error');
        } finally { 
            setIsRunning(false); 
        }
    };

    const submitCode = async () => {
        if (debounceRef.current) {
            toast.error('Please wait before submitting again', { duration: 1000 });
            return;
        }

        setIsRunning(true);
        setExecutionStatus('queued');
        
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
        if (socketRef.current) {
            socketRef.current.emit('code_submitted', { 
                roomId, 
                username: location.state?.username 
            });
            console.log('[FRONTEND] Code submission tracked for:', location.state?.username);
        }
        
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
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
                toast.success("Correct! +10 Points.", { icon: '🏆' });
                setExecutionStatus('success');
                
                if (socketRef.current) {
                    socketRef.current.emit('level_completed', { 
                        roomId, 
                        username: location.state?.username 
                    });
                }
            } else {
                toast.error(`Solution Incorrect`);
                setExecutionStatus('error');
            }
        } catch (error) {
            if (error.response?.status === 503 || error.message.includes('temporarily unavailable')) {
                toast.error('Submission service busy. Please wait and try again.', {
                    duration: 5000
                });
            } else {
                toast.error(error.response?.data?.message || "Submission Error");
            }
            setExecutionStatus('error');
        } finally { 
            setIsRunning(false); 
        }
    };

    if (!location.state) return <Navigate to="/" />;

    return (
        <div className="relative h-screen w-screen bg-dark text-gray-300 overflow-hidden font-sans flex flex-col">
            
            {/* ✅ FIX: Only show banner if we've connected before and lost connection */}
            {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-bold z-50">
                    🔄 Reconnecting...
                </div>
            )}

            {/* GAME OVER OVERLAY */}
            {gameOverData && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4">
                    <div className="bg-[#1e1e1e] p-6 md:p-10 rounded-2xl border border-accent shadow-2xl text-center w-full max-w-lg">
                        <h1 className="text-6xl mb-4">{gameOverData.isDisqualified ? "🚫" : "🏆"}</h1>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {gameOverData.isDisqualified ? "Disqualified!" : "Game Over!"}
                        </h2>
                        
                        <p className="text-xl md:text-2xl text-accent mb-6">
                            {gameOverData.isDisqualified ? (
                                gameOverData.disqualifiedPlayer === location.state?.username ? (
                                    <span className="text-red-500">Lost because of unfair practice</span>
                                ) : (
                                    <span className="text-green-400">Won by opponent disqualification</span>
                                )
                            ) : (
                                `Winner: ${gameOverData.winner}`
                            )}
                        </p>

                        <div className="space-y-2 mb-8">
                            {Object.entries(gameOverData.scores).map(([user, score]) => (
                                <div key={user} className="flex justify-between bg-[#2d2d2d] p-3 rounded">
                                    <span className="font-bold text-white">{user}</span>
                                    <span className="text-accent">{score} pts</span>
                                </div>
                            ))}
                        </div>
                        
                        {gameOverData.eloChanges && (
                            <div className="space-y-2 mb-8 bg-[#2d2d2d] p-4 rounded-lg">
                                <h3 className="text-sm font-bold text-gray-400 mb-3">Match Results</h3>
                                {Object.entries(gameOverData.eloChanges).map(([key, data]) => (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-300">{data.username}</span>
                                            <div className="flex gap-4">
                                                <span className={data.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    ELO: {data.eloChange >= 0 ? '+' : ''}{data.eloChange}
                                                </span>
                                                <span className={data.seasonPoints >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    Season: {data.seasonPoints >= 0 ? '+' : ''}{data.seasonPoints}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button onClick={() => navigate('/dashboard')} className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all w-full">Back to Home</button>
                    </div>
                </div>
            )}

            {/* MAIN GRID */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 min-h-0">
                {/* LEFT PANE */}
                <div className={`${activeTab === 'left' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0 order-2 md:order-1`}>
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('left')}</span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('left')] || 0} pts</span>
                            {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
                        </div>
                        {mySide === 'left' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
                    </div>
                </div>

                {/* CENTER PANE */}
                <div className={`${activeTab === 'problem' ? 'flex' : 'hidden'} md:flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0 order-1 md:order-2`}>
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <span className="font-bold truncate text-sm max-w-[200px] text-white">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
                        <Timer socket={socketRef.current} roomId={roomId} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 text-sm leading-relaxed min-h-0">
                        {problem ? (
                            <div className="space-y-6 pb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {problem.difficulty}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Description</h3>
                                    <div className="text-gray-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
                                </div>
                                {problem.constraints && (
                                    <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                                        <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3>
                                        <ul className="list-disc list-inside text-gray-400 space-y-1">
                                            {problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>
                                    {problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (
                                        <div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
                                            <div className="mb-2"><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Input</span><code className="block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code></div>
                                            <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Expected Output</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
                    </div>
                    
                    <div className="p-0 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0 flex flex-col max-h-[40%]">
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
                        
                        {runResults && (
                            <div className="bg-[#252526] border-b border-[#3e3e42] p-4 overflow-y-auto custom-scrollbar">
                                <TestCaseResults results={runResults} />
                            </div>
                        )}
                        
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42]">
                                <div className="flex flex-col overflow-hidden"><span className="text-[10px] text-gray-500 font-bold uppercase">Room ID</span><span className="text-xs font-mono text-white select-all truncate">{roomId}</span></div>
                                <button onClick={copyRoomId} className="p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors"><Copy size={16} /></button>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={runCode} 
                                    disabled={isRunning} 
                                    className="flex-1 py-3 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {executionStatus === 'queued' && '⏳ Queued...'}
                                    {executionStatus === 'running' && '⚡ Running...'}
                                    {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && (
                                        <><Play size={16}/> Run Code</>
                                    )}
                                </button>
                                <button 
                                    onClick={submitCode} 
                                    disabled={isRunning} 
                                    className="flex-1 py-3 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {executionStatus === 'queued' && '⏳ Queued...'}
                                    {executionStatus === 'running' && '⚡ Testing...'}
                                    {(executionStatus === 'idle' || executionStatus === 'success' || executionStatus === 'error') && 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE */}
                <div className={`${activeTab === 'right' ? 'flex' : 'hidden'} md:flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0 order-3`}>
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-sm truncate text-white max-w-[100px]">{getPlayerName('right')}</span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('right')] || 0} pts</span>
                            {mySide === 'right' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
                        </div>
                        {mySide === 'right' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JS</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM TABS */}
            <div className="md:hidden flex border-t border-[#3e3e42] bg-[#1e1e1e] h-14 shrink-0">
                <button onClick={() => setActiveTab('left')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'left' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Code2 size={18} /><span className="text-[10px] font-bold">Left</span></button>
                <button onClick={() => setActiveTab('problem')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'problem' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><FileText size={18} /><span className="text-[10px] font-bold">Problem</span></button>
                <button onClick={() => setActiveTab('right')} className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'right' ? 'text-accent bg-[#2d2d2d]' : 'text-gray-500'}`}><Terminal size={18} /><span className="text-[10px] font-bold">Right</span></button>
            </div>
        </div>
    );
};

export default EditorPage;