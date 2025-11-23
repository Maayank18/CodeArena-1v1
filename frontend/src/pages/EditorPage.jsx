// corrected both the logic above 
// import React, { useState, useRef, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import Client from '../components/Client';
// import CodeEditor from '../components/CodeEditor';
// import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';
// import api from '../api.js'
// import { Copy, CheckCircle, XCircle, Play } from 'lucide-react';

// // --- TIMER COMPONENT ---
// const Timer = () => {
//     const [timeLeft, setTimeLeft] = useState(1800); 
//     useEffect(() => {
//         const interval = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
//         return () => clearInterval(interval);
//     }, []);
//     const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
//     return <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-accent'}`}>{formatTime(timeLeft)}</span>;
// };

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
//     const [output, setOutput] = useState(null); // Fallback for generic errors
//     const [isRunning, setIsRunning] = useState(false);
//     const [language, setLanguage] = useState('cpp'); 
    
//     // Game State
//     const [round, setRound] = useState(1);
//     const [totalRounds, setTotalRounds] = useState(5);
//     const [scores, setScores] = useState({}); 
//     const [gameOverData, setGameOverData] = useState(null);

//     // Yjs Logic (useRef ensures it survives re-renders)
//     const ydocRef = useRef(new Y.Doc());
//     const providerRef = useRef(null);

//     // 1. INITIALIZE CONNECTION
//     useEffect(() => {
//         // Create Provider if it doesn't exist
//         if (!providerRef.current) {
//             providerRef.current = new WebsocketProvider(import.meta.env.VITE_YJS_URL, roomId, ydocRef.current);
//         }

//         const init = async () => {
//             // Connect to Backend
//             socketRef.current = io(import.meta.env.VITE_API_URL);
            
//             socketRef.current.on('connect_error', (err) => {
//                 console.error(err);
//                 toast.error('Connection failed');
//                 navigate('/');
//             });

//             // Join Room
//             socketRef.current.emit('join_room', { roomId, username: location.state?.username });

//             // Listeners
//             socketRef.current.on('room_joined', (data) => {
//                 setClients(data.players);
//                 setMySide(data.side);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setTotalRounds(data.totalRounds);
//                 setScores(data.scores);
                
//                 // Set Awareness (Cursor Color)
//                 providerRef.current.awareness.setLocalStateField('user', {
//                     name: location.state?.username,
//                     color: data.side === 'left' ? '#007acc' : '#ff0000',
//                 });
//             });

//             socketRef.current.on('new_round', (data) => {
//                 toast.success(`Round ${data.round} Started!`);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setScores(data.scores);
//                 setRunResults(null); 
//                 setOutput(null);
//             });

//             socketRef.current.on('score_update', (newScores) => setScores(newScores));
            
//             // GAME OVER LOGIC (With History Saving)
//             socketRef.current.on('game_over', (data) => {
//                 setGameOverData(data);
                
//                 const myName = location.state?.username;
//                 const myScore = data.scores[myName] || 0;
//                 const allPlayers = Object.keys(data.scores);
//                 const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

//                 // 1. Save to History
//                 const matchData = {
//                     date: new Date().toISOString(),
//                     opponent: opponentName,
//                     winner: data.winner,
//                     score: myScore
//                 };
//                 const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
//                 history.unshift(matchData);
//                 localStorage.setItem('codearena_history', JSON.stringify(history));

//                 // 2. Update User Stats
//                 const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
//                 if (user.stats) {
//                     user.stats.matchesPlayed += 1;
//                     if (data.winner === myName) user.stats.wins += 1;
//                     localStorage.setItem('codearena_user', JSON.stringify(user));
//                 }
//             });

//             socketRef.current.on('player_joined', ({ username, side }) => {
//                 setClients((prev) => {
//                     if (prev.find(p => p.username === username)) return prev;
//                     return [...prev, { username, side }];
//                 });
//             });
//         };

//         if(location.state?.username) init();

//         return () => {
//             if(socketRef.current) socketRef.current.disconnect();
//         };
//     }, []);

//     // --- HELPER FUNCTIONS ---
//     const getPlayerName = (side) => {
//         const player = clients.find(c => c.side === side);
//         return player ? player.username : "Waiting...";
//     };

//     const copyRoomId = () => {
//         navigator.clipboard.writeText(roomId);
//         toast.success('Room ID copied');
//     };

//     // --- SEQUENTIAL RUN CODE (Fixes Timeouts) ---
//     const runCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
//         if (!code) { toast.error("Code is empty!"); setIsRunning(false); return; }

//         const publicCases = problem?.testCases.filter(tc => tc.isPublic) || [];
//         const newResults = [];

//         try {
//             // Loop through cases sequentially
//             for (const [index, tc] of publicCases.entries()) {
//                 try {
//                     const response = await api.post('/api/run', {
//                         language, code, stdin: tc.input
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
//                     newResults.push({
//                         type: 'error',
//                         id: index,
//                         input: tc.input,
//                         error: "API Limit Reached (Try again)",
//                         passed: false
//                     });
//                 }
//             }
//             setRunResults(newResults);
//             toast.success("Run Complete");
//         } catch (error) { 
//             toast.error("Execution Failed"); 
//         } finally { 
//             setIsRunning(false); 
//         }
//     };

//     // --- SUBMIT CODE ---
//     const submitCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         try {
//             const response = await api.post('/api/run/submit', {
//                 language, code, problemId: problem._id 
//             });

//             if (response.data.isCorrect) {
//                 toast.success("Correct! +10 Points.", { icon: '🏆' });
//                 socketRef.current.emit('level_completed', { roomId, username: location.state?.username });
//             } else {
//                 toast.error(`Wrong Answer.`);
//                 setRunResults(null);
//                 setOutput({ 
//                     stdout: "Test Failed",
//                     stderr: "Your output did not match the expected output for one or more test cases."
//                 });
//             }
//         } catch (error) { toast.error("Submission Error"); } 
//         finally { setIsRunning(false); }
//     };

//     if (!location.state) return <Navigate to="/" />;
    
//     // Loading Spinner
//     if (!mySide || !providerRef.current) {
//         return <div className="h-screen bg-dark text-white flex items-center justify-center">Connecting to Battle Arena...</div>;
//     }

//     return (
//         <div className="relative h-screen w-screen bg-dark text-gray-300 overflow-hidden font-sans">
            
//             {/* GAME OVER OVERLAY */}
//             {gameOverData && (
//                 <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
//                     <div className="bg-[#1e1e1e] p-10 rounded-2xl border border-accent shadow-2xl text-center">
//                         <h1 className="text-6xl mb-4">🏆</h1>
//                         <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
//                         <p className="text-2xl text-accent mb-6">Winner: {gameOverData.winner}</p>
//                         <div className="space-y-2 mb-8">
//                             {Object.entries(gameOverData.scores).map(([user, score]) => (
//                                 <div key={user} className="flex justify-between min-w-[200px] bg-[#2d2d2d] p-3 rounded">
//                                     <span className="font-bold text-white">{user}</span>
//                                     <span className="text-accent">{score} pts</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <button onClick={() => navigate('/dashboard')} className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all">Back to Home</button>
//                     </div>
//                 </div>
//             )}

//             {/* MAIN GRID */}
//             <div className="grid grid-cols-3 h-full w-full">
                
//                 {/* LEFT PANE (Player A) */}
//                 <div className="flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0">
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[120px]">{getPlayerName('left')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('left')] || 0} pts</span>
//                             {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'left' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option>
//                                 <option value="java">Java</option>
//                                 <option value="python">Python</option>
//                                 <option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
//                     </div>
//                 </div>

//                 {/* CENTER PANE */}
//                 <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0">
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <span className="font-bold truncate text-sm max-w-[200px] text-white">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
//                         <Timer /> 
//                     </div>
                    
//                     {/* SCROLLABLE DESCRIPTION */}
//                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-sm leading-relaxed min-h-0">
//                         {problem ? (
//                             <div className="space-y-6 pb-6">
//                                 {/* Description & Metadata */}
//                                 <div className="flex items-center gap-2 mb-2">
//                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
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
//                                 {/* Examples */}
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>
//                                     {problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (
//                                         <div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
//                                             <div className="mb-2">
//                                                 <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Input</span>
//                                                 <code className="block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code>
//                                             </div>
//                                             <div>
//                                                 <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Expected Output</span>
//                                                 <code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
//                     </div>
                    
//                     {/* CONTROLS & CONSOLE */}
//                     <div className="p-0 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0 flex flex-col max-h-[40%]">
                        
//                         {/* RESULTS LIST */}
//                         {runResults && (
//                             <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#252526] border-b border-[#3e3e42]">
//                                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Execution Results</h4>
//                                 {runResults.map((res, idx) => (
//                                     <div key={idx} className={`p-3 rounded border ${res.passed ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'}`}>
//                                         <div className="flex items-center gap-2 mb-2">
//                                             {res.passed ? <CheckCircle size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>}
//                                             <span className={`text-xs font-bold ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
//                                                 {res.passed ? `Test Case ${idx + 1} Passed` : `Test Case ${idx + 1} Failed`}
//                                             </span>
//                                         </div>
//                                         <div className="grid grid-cols-2 gap-2 text-xs font-mono">
//                                             <div><span className="text-gray-500 block">Input:</span><span className="text-gray-300">{res.input}</span></div>
//                                             <div><span className="text-gray-500 block">Expected:</span><span className="text-gray-300">{res.expected}</span></div>
//                                             {!res.passed && (
//                                                 <div className="col-span-2 mt-1 bg-black/30 p-2 rounded">
//                                                     <span className="text-red-400 block mb-1">Your Output:</span>
//                                                     <span className="text-red-200 whitespace-pre-wrap">{res.actual || res.error}</span>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}

//                         {/* FALLBACK CONSOLE (For Submit Errors) */}
//                         {output && !runResults && (
//                             <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#252526] border-b border-[#3e3e42]">
//                                 <div className="p-3 font-mono text-xs">
//                                     {output.stdout && <div><span className="text-green-500">Output:</span><pre className="whitespace-pre-wrap text-gray-300">{output.stdout}</pre></div>}
//                                     {output.stderr && <div className="mt-1"><span className="text-red-500">Error:</span><pre className="whitespace-pre-wrap text-red-300">{output.stderr}</pre></div>}
//                                 </div>
//                             </div>
//                         )}

//                         {/* BUTTONS & ROOM ID */}
//                         <div className="p-4 space-y-4">
//                             <div className="flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42]">
//                                 <div className="flex flex-col">
//                                     <span className="text-[10px] text-gray-500 font-bold uppercase">Room ID</span>
//                                     <span className="text-xs font-mono text-white select-all">{roomId}</span>
//                                 </div>
//                                 <button onClick={copyRoomId} className="p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors" title="Copy Room ID">
//                                     <Copy size={16} />
//                                 </button>
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

//                 {/* RIGHT PANE (Player B) */}
//                 <div className="flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0">
//                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
//                         <div className="flex items-center gap-2 overflow-hidden">
//                             <span className="font-bold text-sm truncate text-white max-w-[120px]">{getPlayerName('right')}</span>
//                             <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('right')] || 0} pts</span>
//                             {mySide === 'right' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
//                         </div>
//                         {mySide === 'right' && (
//                             <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                                 <option value="cpp">C++</option>
//                                 <option value="java">Java</option>
//                                 <option value="python">Python</option>
//                                 <option value="javascript">JS</option>
//                             </select>
//                         )}
//                     </div>
//                     <div className="flex-1 relative min-h-0">
//                         <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;























import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import api from '../api.js';
import { Copy, CheckCircle, XCircle, Play } from 'lucide-react';

// Timer Component
const Timer = () => {
    const [timeLeft, setTimeLeft] = useState(1800); 
    useEffect(() => {
        const interval = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(interval);
    }, []);
    const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
    return <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-accent'}`}>{formatTime(timeLeft)}</span>;
};

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [clients, setClients] = useState([]);
    const [problem, setProblem] = useState(null);
    const [mySide, setMySide] = useState(null); 
    const [runResults, setRunResults] = useState(null); 
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    
    // Default language to cpp, but let user change it
    const [language, setLanguage] = useState('cpp'); 
    
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(5);
    const [scores, setScores] = useState({}); 
    const [gameOverData, setGameOverData] = useState(null);

    const ydocRef = useRef(new Y.Doc());
    const providerRef = useRef(null);

    useEffect(() => {
        if (!providerRef.current) {
            providerRef.current = new WebsocketProvider(import.meta.env.VITE_YJS_URL, roomId, ydocRef.current);
        }

        const init = async () => {
            socketRef.current = io(import.meta.env.VITE_API_URL);
            
            socketRef.current.on('connect_error', (err) => {
                console.error(err);
                toast.error('Connection failed');
                navigate('/');
            });

            socketRef.current.emit('join_room', { roomId, username: location.state?.username });

            // socketRef.current.on('room_joined', (data) => {
            //     setClients(data.players);
            //     setMySide(data.side);
            //     setProblem(data.problem);
            //     setRound(data.round);
            //     setTotalRounds(data.totalRounds);
            //     setScores(data.scores);
                
            //     providerRef.current.awareness.setLocalStateField('user', {
            //         name: location.state?.username,
            //         color: data.side === 'left' ? '#007acc' : '#ff0000',
            //     });
            // });/
            socketRef.current.on('room_joined', (data) => {
            console.log('room_joined received on', socketRef.current.id, 'payload:', data, 'localUsername:', location.state?.username);
            // Update shared state always
            setClients(data.players);
            setProblem(data.problem);
            setRound(data.round);
            setTotalRounds(data.totalRounds);
            setScores(data.scores);

            // Defensive: only set mySide if this join event was actually for THIS username
            const myUsername = location.state?.username || JSON.parse(localStorage.getItem('codearena_user') || '{}')?.username;
            if (myUsername && data.username === myUsername) {
                console.log('room_joined is for me; setting mySide ->', data.side);
                setMySide(data.side);

                // Set awareness color for collaborative editor
                try {
                providerRef.current?.awareness?.setLocalStateField('user', {
                    name: myUsername,
                    color: data.side === 'left' ? '#007acc' : '#ff0000',
                });
                } catch (e) {
                console.warn('awareness not available yet', e);
                }
            } else {
                console.log('room_joined NOT for me — ignoring side. joiner:', data.username);
            }
            });


            // 🔥 NEW: Update room state for other player (DO NOT set mySide here)
            socketRef.current.on('room_state', (data) => {
            console.log('room_state received', data);
            setClients(data.players);
            setProblem(data.problem);
            setRound(data.round);
            setTotalRounds(data.totalRounds);
            setScores(data.scores);
            });



            socketRef.current.on('new_round', (data) => {
                toast.success(`Round ${data.round} Started!`);
                setProblem(data.problem);
                setRound(data.round);
                setScores(data.scores);
                setRunResults(null); 
                setOutput(null);
            });

            socketRef.current.on('score_update', (newScores) => setScores(newScores));
            
            socketRef.current.on('game_over', (data) => {
                setGameOverData(data);
                const myName = location.state?.username;
                const myScore = data.scores[myName] || 0;
                const allPlayers = Object.keys(data.scores);
                const opponentName = allPlayers.find(name => name !== myName) || "Unknown";

                const matchData = {
                    date: new Date().toISOString(),
                    opponent: opponentName,
                    winner: data.winner,
                    score: myScore
                };
                const history = JSON.parse(localStorage.getItem('codearena_history') || '[]');
                history.unshift(matchData);
                localStorage.setItem('codearena_history', JSON.stringify(history));

                const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                if (user.stats) {
                    user.stats.matchesPlayed += 1;
                    if (data.winner === myName) user.stats.wins += 1;
                    localStorage.setItem('codearena_user', JSON.stringify(user));
                }
            });

            socketRef.current.on('player_joined', ({ username, side }) => {
                setClients((prev) => {
                    if (prev.find(p => p.username === username)) return prev;
                    return [...prev, { username, side }];
                });
            });
        };

        if(location.state?.username) {
            init();
        } else {
            // Fallback: If no state (e.g. direct link), redirect to login
            // In a real app, you might fetch user from localStorage
            const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
            if (storedUser) {
                 // If we have a user in storage, use it and re-run init
                 location.state = { username: storedUser.username };
                 init();
            } else {
                navigate('/login');
            }
        }

        return () => {
            if(socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const getPlayerName = (side) => {
        const player = clients.find(c => c.side === side);
        return player ? player.username : "Waiting...";
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied');
    };

    const runCode = async () => {
        setIsRunning(true);
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        if (!code) { toast.error("Code is empty!"); setIsRunning(false); return; }

        const publicCases = problem?.testCases.filter(tc => tc.isPublic) || [];
        const newResults = [];

        try {
            for (const [index, tc] of publicCases.entries()) {
                try {
                    const response = await api.post('/api/run', {
                        language: language, // <--- CRITICAL: Ensure language state is passed
                        code: code, 
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
                    newResults.push({
                        type: 'error',
                        id: index,
                        input: tc.input,
                        error: "API Limit Reached",
                        passed: false
                    });
                }
            }
            setRunResults(newResults);
            toast.success("Run Complete");
        } catch (error) { 
            toast.error("Execution Failed"); 
        } finally { 
            setIsRunning(false); 
        }
    };

    const submitCode = async () => {
        setIsRunning(true);
        const code = ydocRef.current.getText(`code-${mySide}`).toString();
        try {
            const response = await api.post('/api/run/submit', {
                language: language, // <--- CRITICAL: Ensure language state is passed
                code: code, 
                problemId: problem._id 
            });
            if (response.data.isCorrect) {
                toast.success("Correct! +10 Points.", { icon: '🏆' });
                socketRef.current.emit('level_completed', { roomId, username: location.state?.username });
            } else {
                toast.error(`Wrong Answer.`);
                setRunResults(null);
                setOutput({ stdout: "Test Failed", stderr: "Output mismatch." });
            }
        } catch (error) { toast.error("Submission Error"); } 
        finally { setIsRunning(false); }
    };


    if (!location.state && !localStorage.getItem('codearena_user')) return <Navigate to="/" />;
    
    // Loading Spinner
    // Only show if we are genuinely waiting for connection AND we have a username
    if ((!mySide || !problem) && location.state?.username) {
        return (
            <div className="h-screen bg-[#121212] text-white flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500 border-r-4 border-green-500/30"></div>
                <h2 className="text-xl font-bold animate-pulse">Battle Arena...</h2>
                <p className="text-gray-500 text-sm">Connecting to socket...</p>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-screen bg-dark text-gray-300 overflow-hidden font-sans">
            
            {/* GAME OVER OVERLAY */}
            {gameOverData && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                    <div className="bg-[#1e1e1e] p-10 rounded-2xl border border-accent shadow-2xl text-center">
                        <h1 className="text-6xl mb-4">🏆</h1>
                        <h2 className="text-4xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-2xl text-accent mb-6">Winner: {gameOverData.winner}</p>
                        <div className="space-y-2 mb-8">
                            {Object.entries(gameOverData.scores).map(([user, score]) => (
                                <div key={user} className="flex justify-between min-w-[200px] bg-[#2d2d2d] p-3 rounded">
                                    <span className="font-bold text-white">{user}</span>
                                    <span className="text-accent">{score} pts</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all">Back to Home</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 h-full w-full">
                {/* LEFT PANE */}
                <div className="flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0">
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-sm truncate text-white max-w-[120px]">{getPlayerName('left')}</span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('left')] || 0} pts</span>
                            {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
                        </div>
                        {mySide === 'left' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JS</option><option value="java">Java</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
                    </div>
                </div>
                
                {/* CENTER PANE */}
                <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0">
                     <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <span className="font-bold truncate text-sm max-w-[200px] text-white">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
                        <Timer /> 
                    </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-sm leading-relaxed min-h-0">
                        {problem ? (
                             <div className="space-y-6 pb-6">
                                 {/* ... Problem Description ... */}
                                 <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
                                 {/* ... Constraints ... */}
                                 {problem.constraints && (
                                    <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                                        <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3>
                                        <ul className="list-disc list-inside text-gray-400 space-y-1">
                                            {problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}
                                        </ul>
                                    </div>
                                )}
                                 {/* ... Examples ... */}
                                 {problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (
                                    <div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
                                        <div className="mb-2"><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Input</span><code className="block bg-[#2d2d2d] p-2 rounded text-gray-300 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code></div>
                                        <div><span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Expected Output</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code></div>
                                    </div>
                                 ))}
                             </div>
                        ) : <div>Loading...</div>}
                     </div>
                     {/* Controls */}
                     <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0">
                         {/* Console Area */}
                        {runResults && (
                            <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#252526] border-b border-[#3e3e42] max-h-32 mb-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Execution Results</h4>
                                {runResults.map((res, idx) => (
                                    <div key={idx} className={`p-3 rounded border ${res.passed ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {res.passed ? <CheckCircle size={14} className="text-green-500"/> : <XCircle size={14} className="text-red-500"/>}
                                            <span className={`text-xs font-bold ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                {res.passed ? `Test Case ${idx + 1} Passed` : `Test Case ${idx + 1} Failed`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {output && !runResults && (
                            <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#252526] border-b border-[#3e3e42] max-h-32 mb-4">
                                <div className="p-3 font-mono text-xs">
                                    {output.stdout && <div><span className="text-green-500">Output:</span><pre className="whitespace-pre-wrap text-gray-300">{output.stdout}</pre></div>}
                                    {output.stderr && <div className="mt-1"><span className="text-red-500">Error:</span><pre className="whitespace-pre-wrap text-red-300">{output.stderr}</pre></div>}
                                </div>
                            </div>
                        )}

                        {/* Room ID & Buttons */}
                        <div className="flex items-center justify-between bg-[#252526] p-2 rounded border border-[#3e3e42] mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Room ID</span>
                                    <span className="text-xs font-mono text-white select-all">{roomId}</span>
                                </div>
                                <button onClick={copyRoomId} className="p-2 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors" title="Copy Room ID">
                                    <Copy size={16} />
                                </button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={runCode} disabled={isRunning} className="flex-1 py-3 rounded bg-white text-black font-bold">Run</button>
                            <button onClick={submitCode} disabled={isRunning} className="flex-1 py-3 rounded bg-accent text-black font-bold">Submit</button>
                        </div>
                     </div>
                </div>

                {/* RIGHT PANE */}
                <div className="flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0">
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-sm truncate text-white max-w-[120px]">{getPlayerName('right')}</span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">{scores[getPlayerName('right')] || 0} pts</span>
                        </div>
                        {mySide === 'right' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JS</option><option value="java">Java</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;