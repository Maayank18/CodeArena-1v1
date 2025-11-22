// this is the perfectly wokring code for EditorPage.jsx the another code below is for adding 
// additional features
// import React, { useState, useRef, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import Client from '../components/Client';
// import CodeEditor from '../components/CodeEditor';
// import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';
// import axios from 'axios';

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
    
//     const [clients, setClients] = useState([]);
//     const [problem, setProblem] = useState(null);
//     const [mySide, setMySide] = useState(null); 
//     const [output, setOutput] = useState(null);
//     const [isRunning, setIsRunning] = useState(false);
//     const [language, setLanguage] = useState('cpp'); 
    
//     const [round, setRound] = useState(1);
//     const [totalRounds, setTotalRounds] = useState(5);
//     const [scores, setScores] = useState({}); 

//     // FIX: Use Ref to persist Yjs instance across renders without resetting
//     const ydocRef = useRef(new Y.Doc());
//     const providerRef = useRef(null);

//     useEffect(() => {
//         // Initialize Provider only once
//         if (!providerRef.current) {
//             providerRef.current = new WebsocketProvider('ws://localhost:1234', roomId, ydocRef.current);
//         }

//         const init = async () => {
//             socketRef.current = io('http://localhost:5000');
            
//             socketRef.current.on('connect_error', (err) => {
//                 console.error(err);
//                 toast.error('Connection failed');
//                 navigate('/');
//             });

//             socketRef.current.emit('join_room', { roomId, username: location.state?.username });

//             socketRef.current.on('room_joined', (data) => {
//                 setClients(data.players);
//                 setMySide(data.side);
//                 setProblem(data.problem);
//                 setRound(data.round);
//                 setTotalRounds(data.totalRounds);
//                 setScores(data.scores);
                
//                 // Set Awareness
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
//                 setOutput(null); 
//             });

//             socketRef.current.on('score_update', (newScores) => setScores(newScores));
            
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
//             // Optional: Don't destroy provider immediately to prevent flickering on hot-reload
//             // providerRef.current.destroy(); 
//         };
//     }, []);

//     const runCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
//         if (!code) { toast.error("Code is empty!"); setIsRunning(false); return; }

//         try {
//             const response = await axios.post('/api/run', {
//                 language, code, stdin: problem?.testCases[0]?.input || "" 
//             });
//             setOutput(response.data.success ? response.data : { stdout: "", stderr: response.data.message });
//         } catch (error) { toast.error("Run Error"); } 
//         finally { setIsRunning(false); }
//     };

//     const submitCode = async () => {
//         setIsRunning(true);
//         const code = ydocRef.current.getText(`code-${mySide}`).toString();
        
//         try {
//             const response = await axios.post('/api/run/submit', {
//                 language, code, problemId: problem._id 
//             });

//             if (response.data.isCorrect) {
//                 toast.success("Correct! +10 Points.", { icon: '🏆' });
//                 socketRef.current.emit('level_completed', { roomId, username: location.state?.username });
//             } else {
//                 toast.error(`Wrong Answer.`);
//                 setOutput({ 
//                     stdout: "Test Failed",
//                     stderr: "Your output did not match the expected output."
//                 });
//             }
//         } catch (error) { toast.error("Submission Error"); } 
//         finally { setIsRunning(false); }
//     };

//     if (!location.state) return <Navigate to="/" />;
    
//     // Wait for side to be assigned before rendering editors
//     if (!mySide || !providerRef.current) {
//         return <div className="h-screen bg-dark text-white flex items-center justify-center">Connecting to Battle Arena...</div>;
//     }

//     return (
//         <div className="grid grid-cols-3 h-screen bg-dark text-gray-300 overflow-hidden">
//             {/* LEFT PANE */}
//             <div className="flex flex-col border-r border-[#3e3e42] h-full min-w-0">
//                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0">
//                     <div className="flex items-center gap-2">
//                         <span className="font-bold text-sm">Player A</span>
//                         <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono">
//                             {clients[0] ? (scores[clients[0].username] || 0) : 0} pts
//                         </span>
//                     </div>
//                     {mySide === 'left' && (
//                         <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                             <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JavaScript</option>
//                         </select>
//                     )}
//                 </div>
//                 <div className="flex-1 relative min-h-0">
//                     <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'left' ? language : 'cpp'} />
//                 </div>
//             </div>

//             {/* CENTER PANE (Same as before) */}
//             <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0">
//                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0">
//                     <span className="font-bold truncate text-sm max-w-[200px]">{problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}</span>
//                     <Timer /> 
//                 </div>
//                 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-sm leading-relaxed">
//                     {problem ? (
//                         <div className="space-y-6 pb-10">
//                             <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Description</h3><div className="text-gray-300" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} /></div>
//                             {problem.constraints && <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3><ul className="list-disc list-inside bg-[#1e1e1e] p-3 rounded border border-[#3e3e42] text-gray-400">{problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}</ul></div>}
//                             <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>{problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (<div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]"><div className="mb-2"><span className="text-xs text-gray-500 block mb-1">Input:</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs">{tc.input}</code></div><div><span className="text-xs text-gray-500 block mb-1">Output:</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs">{tc.output}</code></div></div>))}</div>
//                         </div>
//                     ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
//                 </div>
//                 <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0">
//                     {output && (
//                         <div className="bg-[#252526] rounded border border-[#3e3e42] mb-3 overflow-hidden max-h-32 overflow-y-auto custom-scrollbar">
//                             <div className="bg-[#2d2d2d] px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Console</div>
//                             <div className="p-3 font-mono text-xs">
//                                 {output.stdout && <div><span className="text-green-500">Output:</span><pre className="whitespace-pre-wrap text-gray-300">{output.stdout}</pre></div>}
//                                 {output.stderr && <div className="mt-1"><span className="text-red-500">Error:</span><pre className="whitespace-pre-wrap text-red-300">{output.stderr}</pre></div>}
//                             </div>
//                         </div>
//                     )}
//                     <div className="flex gap-3 mb-4">
//                         <button onClick={runCode} disabled={isRunning} className="flex-1 py-2 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors">{isRunning ? '...' : '▶ Run'}</button>
//                         <button onClick={submitCode} disabled={isRunning} className="flex-1 py-2 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors">Submit</button>
//                     </div>
//                     <div className="flex flex-wrap gap-4 justify-center">
//                         {clients.map((client) => <Client key={client.id || client.socketId} username={client.username} />)}
//                     </div>
//                 </div>
//             </div>

//             {/* RIGHT PANE */}
//             <div className="flex flex-col border-l border-[#3e3e42] h-full min-w-0">
//                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0">
//                     <div className="flex items-center gap-2">
//                         <span className="font-bold text-sm">Player B</span>
//                         <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono">
//                             {clients[1] ? (scores[clients[1].username] || 0) : 0} pts
//                         </span>
//                     </div>
//                     {mySide === 'right' && (
//                         <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                             <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JavaScript</option>
//                         </select>
//                     )}
//                 </div>
//                 <div className="flex-1 relative min-h-0">
//                     <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydocRef.current} provider={providerRef.current} language={mySide === 'right' ? language : 'cpp'} />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;







// externla feature
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import axios from 'axios';

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
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [language, setLanguage] = useState('cpp'); 
    
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(5);
    const [scores, setScores] = useState({}); 
    
    // NEW: State for Game Over Overlay
    const [gameOverData, setGameOverData] = useState(null);

    const [ydoc] = useState(() => new Y.Doc());
    const [provider] = useState(() => new WebsocketProvider('ws://localhost:1234', roomId, ydoc));

    useEffect(() => {
        const init = async () => {
            socketRef.current = io('http://localhost:5000');
            
            socketRef.current.on('connect_error', (err) => {
                console.error(err);
                toast.error('Connection failed');
                navigate('/');
            });

            socketRef.current.emit('join_room', { roomId, username: location.state?.username });

            socketRef.current.on('room_joined', (data) => {
                setClients(data.players);
                setMySide(data.side);
                setProblem(data.problem);
                setRound(data.round);
                setTotalRounds(data.totalRounds);
                setScores(data.scores);
                
                // Update Awareness
                if(provider) {
                    provider.awareness.setLocalStateField('user', {
                        name: location.state?.username,
                        color: data.side === 'left' ? '#007acc' : '#ff0000',
                    });
                }
            });

            socketRef.current.on('new_round', (data) => {
                toast.success(`Round ${data.round} Started!`);
                setProblem(data.problem);
                setRound(data.round);
                setScores(data.scores);
                setOutput(null); 
            });

            socketRef.current.on('score_update', (newScores) => setScores(newScores));
            
            // NEW: Handle Game Over with Overlay
            socketRef.current.on('game_over', (data) => {
                setGameOverData(data); // This triggers the blur screen
            });

            socketRef.current.on('player_joined', ({ username, side }) => {
                setClients((prev) => {
                    if (prev.find(p => p.username === username)) return prev;
                    return [...prev, { username, side }];
                });
            });
        };

        if(location.state?.username) init();

        return () => {
            if(socketRef.current) socketRef.current.disconnect();
            // Do not destroy provider here to prevent StrictMode flickering
        };
    }, []);

    // Helper to find username by side
    const getPlayerName = (side) => {
        const player = clients.find(c => c.side === side);
        return player ? player.username : "Waiting...";
    };

    const runCode = async () => {
        setIsRunning(true);
        const code = ydoc.getText(`code-${mySide}`).toString();
        if (!code) { toast.error("Code is empty!"); setIsRunning(false); return; }

        try {
            const response = await axios.post('/api/run', {
                language, code, stdin: problem?.testCases[0]?.input || "" 
            });
            setOutput(response.data.success ? response.data : { stdout: "", stderr: response.data.message });
        } catch (error) { toast.error("Run Error"); } 
        finally { setIsRunning(false); }
    };

    const submitCode = async () => {
        setIsRunning(true);
        const code = ydoc.getText(`code-${mySide}`).toString();
        
        try {
            const response = await axios.post('/api/run/submit', {
                language, code, problemId: problem._id 
            });

            if (response.data.isCorrect) {
                toast.success("Correct! +10 Points.", { icon: '🏆' });
                socketRef.current.emit('level_completed', { roomId, username: location.state?.username });
            } else {
                toast.error(`Wrong Answer.`);
                setOutput({ 
                    stdout: "Test Failed",
                    stderr: "Your output did not match the expected output."
                });
            }
        } catch (error) { toast.error("Submission Error"); } 
        finally { setIsRunning(false); }
    };

    if (!location.state) return <Navigate to="/" />;
    
    if (!mySide) {
        return <div className="h-screen bg-dark text-white flex items-center justify-center">Connecting to Battle Arena...</div>;
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
                        
                        <div className="flex gap-8 justify-center mb-8 text-lg">
                            <div className="flex flex-col">
                                <span className="text-gray-400">Scores</span>
                            </div>
                        </div>
                        <div className="space-y-2 mb-8">
                            {Object.entries(gameOverData.scores).map(([user, score]) => (
                                <div key={user} className="flex justify-between min-w-[200px] bg-[#2d2d2d] p-3 rounded">
                                    <span className="font-bold text-white">{user}</span>
                                    <span className="text-accent">{score} pts</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => navigate('/')}
                            className="bg-accent text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-all"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN GRID LAYOUT */}
            <div className="grid grid-cols-3 h-full w-full">
                
                {/* LEFT PANE (Player A) */}
                <div className="flex flex-col border-r border-[#3e3e42] h-full min-w-0 min-h-0">
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {/* SHOW REAL USERNAME */}
                            <span className="font-bold text-sm truncate text-white max-w-[120px]">
                                {getPlayerName('left')}
                            </span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">
                                {scores[getPlayerName('left')] || 0} pts
                            </span>
                            {mySide === 'left' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
                        </div>
                        
                        {mySide === 'left' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JavaScript</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydoc} provider={provider} language={mySide === 'left' ? language : 'cpp'} />
                    </div>
                </div>

                {/* CENTER PANE */}
                <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full min-w-0 min-h-0">
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <span className="font-bold truncate text-sm max-w-[200px] text-white">
                            {problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}
                        </span>
                        <Timer /> 
                    </div>
                    
                    {/* PROBLEM DESCRIPTION - FIX: Added min-h-0 to allow scroll */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-sm leading-relaxed min-h-0">
                        {problem ? (
                            <div className="space-y-6 pb-6">
                                <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Description</h3><div className="text-gray-300" dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} /></div>
                                {problem.constraints && <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Constraints</h3><ul className="list-disc list-inside bg-[#1e1e1e] p-3 rounded border border-[#3e3e42] text-gray-400">{problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}</ul></div>}
                                <div><h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">Examples</h3>{problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (<div key={i} className="mb-4 bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]"><div className="mb-2"><span className="text-xs text-gray-500 block mb-1">Input:</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.input}</code></div><div><span className="text-xs text-gray-500 block mb-1">Output:</span><code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono text-xs break-words whitespace-pre-wrap">{tc.output}</code></div></div>))}</div>
                            </div>
                        ) : (<div className="flex h-full items-center justify-center text-gray-500 animate-pulse">Loading Problem...</div>)}
                    </div>
                    
                    {/* CONTROLS */}
                    <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42] shrink-0">
                        {output && (
                            <div className="bg-[#252526] rounded border border-[#3e3e42] mb-3 overflow-hidden max-h-32 overflow-y-auto custom-scrollbar">
                                <div className="bg-[#2d2d2d] px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Console</div>
                                <div className="p-3 font-mono text-xs">
                                    {output.stdout && <div><span className="text-green-500">Output:</span><pre className="whitespace-pre-wrap text-gray-300">{output.stdout}</pre></div>}
                                    {output.stderr && <div className="mt-1"><span className="text-red-500">Error:</span><pre className="whitespace-pre-wrap text-red-300">{output.stderr}</pre></div>}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 mb-4">
                            <button onClick={runCode} disabled={isRunning} className="flex-1 py-2 rounded bg-white text-black font-bold hover:bg-gray-200 text-sm transition-colors">{isRunning ? '...' : '▶ Run'}</button>
                            <button onClick={submitCode} disabled={isRunning} className="flex-1 py-2 rounded bg-accent text-black font-bold hover:bg-emerald-400 text-sm transition-colors">Submit</button>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {clients.map((client) => <Client key={client.id || client.socketId} username={client.username} />)}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE (Player B) */}
                <div className="flex flex-col border-l border-[#3e3e42] h-full min-w-0 min-h-0">
                    <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42] shrink-0 h-14">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {/* SHOW REAL USERNAME */}
                            <span className="font-bold text-sm truncate text-white max-w-[120px]">
                                {getPlayerName('right')}
                            </span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono shrink-0">
                                {scores[getPlayerName('right')] || 0} pts
                            </span>
                            {mySide === 'right' && <span className="text-accent text-[10px] font-bold bg-accent/10 px-1 rounded border border-accent/50">YOU</span>}
                        </div>
                        {mySide === 'right' && (
                            <select className="bg-[#3e3e42] text-xs text-white p-1 rounded border border-[#555] outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                <option value="cpp">C++</option><option value="python">Python</option><option value="javascript">JavaScript</option>
                            </select>
                        )}
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydoc} provider={provider} language={mySide === 'right' ? language : 'cpp'} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;