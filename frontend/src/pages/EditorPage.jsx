// // import React, { useState, useRef, useEffect } from 'react';
// // import toast from 'react-hot-toast';
// // import Client from '../components/Client';
// // import CodeEditor from '../components/CodeEditor';
// // import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// // import { io } from 'socket.io-client';
// // import * as Y from 'yjs';
// // import { WebsocketProvider } from 'y-websocket';
// // import axios from 'axios';

// // const EditorPage = () => {
// //     const socketRef = useRef(null);
// //     const location = useLocation();
// //     const { roomId } = useParams();
// //     const navigate = useNavigate();
    
// //     // State
// //     const [clients, setClients] = useState([]);
// //     const [problem, setProblem] = useState(null);
// //     const [mySide, setMySide] = useState(null); 
// //     const [output, setOutput] = useState(null);
// //     const [isRunning, setIsRunning] = useState(false);
    
// //     // Language State (Default to C++ for competitive programming feel)
// //     const [language, setLanguage] = useState('cpp'); 

// //     // Yjs State
// //     const [ydoc] = useState(() => new Y.Doc());
// //     const [provider] = useState(() => {
// //         return new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
// //     });

// //     useEffect(() => {
// //         const init = async () => {
// //             socketRef.current = io('http://localhost:5000');
// //             socketRef.current.on('connect_error', (err) => handleErrors(err));
// //             socketRef.current.on('connect_failed', (err) => handleErrors(err));

// //             function handleErrors(e) {
// //                 console.log('socket error', e);
// //                 toast.error('Socket connection failed, try again later.');
// //                 navigate('/');
// //             }

// //             socketRef.current.emit('join_room', {
// //                 roomId,
// //                 username: location.state?.username,
// //             });

// //             socketRef.current.on('room_joined', ({ players, side, problem }) => {
// //                 setClients(players);
// //                 setMySide(side);
// //                 setProblem(problem);
                
// //                 provider.awareness.setLocalStateField('user', {
// //                     name: location.state?.username,
// //                     color: side === 'left' ? '#007acc' : '#ff0000',
// //                 });
                
// //                 toast.success(`Joined as Player ${side === 'left' ? 'A (Left)' : 'B (Right)'}`);
// //             });

// //             socketRef.current.on('player_joined', ({ username, side }) => {
// //                 toast.success(`${username} joined!`);
// //                 setClients((prev) => [...prev, { username, side }]);
// //             });

// //             socketRef.current.on('room_full', () => {
// //                 toast.error("Room is full!");
// //                 navigate('/');
// //             });
// //         };

// //         if(location.state?.username) {
// //             init();
// //         }

// //         return () => {
// //             if(socketRef.current) socketRef.current.disconnect();
// //             if(provider) provider.destroy();
// //             if(ydoc) ydoc.destroy();
// //         };
// //     }, []);

// //     const runCode = async () => {
// //         setIsRunning(true);
// //         const code = ydoc.getText(`code-${mySide}`).toString();
        
// //         if (!code) {
// //             toast.error("Please write some code first!");
// //             setIsRunning(false);
// //             return;
// //         }

// //         try {
// //             const response = await axios.post('/api/run', {
// //                 language: language, // <--- SEND SELECTED LANGUAGE, NOT HARDCODED JS
// //                 code: code,
// //                 stdin: problem?.testCases[0]?.input || "" 
// //             });

// //             if (response.data.success) {
// //                 setOutput(response.data);
// //                 toast.success("Code executed!");
// //             } else {
// //                 toast.error("Execution failed");
// //                 setOutput({ stdout: "", stderr: response.data.message || "Error" });
// //             }
// //         } catch (error) {
// //             console.error(error);
// //             toast.error("Failed to run code");
// //             setOutput({ stdout: "", stderr: "Server Error" });
// //         } finally {
// //             setIsRunning(false);
// //         }
// //     };

// //     // Basic Submit Logic (Runs code against server)
// //     const submitCode = () => {
// //         toast("Submit logic pending - running code for now!");
// //         runCode();
// //     };

// //     if (!location.state) return <Navigate to="/" />;

// //     return (
// //         <div className="grid grid-cols-3 h-screen overflow-hidden bg-dark text-gray-300">
            
// //             {/* LEFT PANE: Player A */}
// //             <div className="flex flex-col border-r border-[#3e3e42]">
// //                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
// //                     <span className="font-bold">Player A {mySide === 'left' && <span className="text-accent text-xs ml-2">(You)</span>}</span>
                    
// //                     {/* Language Selector (Only visible if you are Player A) */}
// //                     {mySide === 'left' && (
// //                         <select 
// //                             className="bg-[#3e3e42] text-xs text-white p-1 rounded outline-none"
// //                             value={language}
// //                             onChange={(e) => setLanguage(e.target.value)}
// //                         >
// //                             <option value="cpp">C++</option>
// //                             <option value="python">Python</option>
// //                             <option value="javascript">JavaScript</option>
// //                         </select>
// //                     )}
// //                 </div>
// //                 <div className="flex-1 overflow-hidden relative">
// //                     <CodeEditor 
// //                         roomId={roomId} 
// //                         side="left" 
// //                         isReadOnly={mySide !== 'left'} 
// //                         ydoc={ydoc} 
// //                         provider={provider}
// //                         language={language} // <--- Pass language prop
// //                     />
// //                 </div>
// //             </div>

// //             {/* CENTER PANE: Problem & Output */}
// //             <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full">
// //                 <div className="bg-[#2d2d2d] p-3 text-center font-bold border-b border-[#3e3e42]">
// //                     {problem ? problem.title : "Loading Problem..."}
// //                 </div>
                
// //                 {/* PROBLEM DESCRIPTION AREA - ADDED SCROLLBAR CLASS */}
// //                 <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed custom-scrollbar">
// //                     {problem ? (
// //                         <div className="space-y-6">
// //                             {/* Description */}
// //                             <div>
// //                                 <h3 className="text-accent font-bold mb-2">Description</h3>
// //                                 <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
// //                             </div>

// //                             {/* Constraints */}
// //                             {problem.constraints && problem.constraints.length > 0 && (
// //                                 <div>
// //                                     <h3 className="text-accent font-bold mb-2">Constraints</h3>
// //                                     <ul className="list-disc list-inside bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
// //                                         {problem.constraints.map((c, i) => (
// //                                             <li key={i} className="text-gray-400 font-mono text-xs">{c}</li>
// //                                         ))}
// //                                     </ul>
// //                                 </div>
// //                             )}

// //                             {/* Examples Loop */}
// //                             <div>
// //                                 <h3 className="text-accent font-bold mb-2">Examples</h3>
// //                                 {problem.testCases.slice(0, 2).map((testCase, index) => (
// //                                     <div key={index} className="mb-4 bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
// //                                         <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Example {index + 1}</h4>
// //                                         <div className="grid grid-cols-1 gap-2">
// //                                             <div>
// //                                                 <span className="text-xs text-gray-500">Input:</span>
// //                                                 <code className="block bg-[#2d2d2d] p-2 rounded mt-1 text-green-400 font-mono">
// //                                                     {testCase.input}
// //                                                 </code>
// //                                             </div>
// //                                             <div>
// //                                                 <span className="text-xs text-gray-500">Output:</span>
// //                                                 <code className="block bg-[#2d2d2d] p-2 rounded mt-1 text-green-400 font-mono">
// //                                                     {testCase.output}
// //                                                 </code>
// //                                             </div>
// //                                         </div>
// //                                     </div>
// //                                 ))}
// //                             </div>
// //                         </div>
// //                     ) : (
// //                         <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
// //                             Initializing Battle...
// //                         </div>
// //                     )}
// //                 </div>
                
// //                 {/* CONTROLS AREA (Fixed at bottom of center pane) */}
// //                 <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42]">
// //                     {/* Output Console */}
// //                     {output && (
// //                         <div className="bg-[#252526] rounded-lg border border-[#3e3e42] mb-4 overflow-hidden max-h-40 overflow-y-auto">
// //                             <div className="bg-[#2d2d2d] px-3 py-1 text-xs font-bold text-gray-400 border-b border-[#3e3e42]">
// //                                 CONSOLE
// //                             </div>
// //                             <div className="p-3 font-mono text-xs">
// //                                 {output.stdout && (
// //                                     <div className="mb-2">
// //                                         <span className="text-green-500 block">Output:</span>
// //                                         <pre className="whitespace-pre-wrap text-white">{output.stdout}</pre>
// //                                     </div>
// //                                 )}
// //                                 {output.stderr && (
// //                                     <div className="text-red-400">
// //                                         <span className="text-red-500 block">Error:</span>
// //                                         <pre className="whitespace-pre-wrap">{output.stderr}</pre>
// //                                     </div>
// //                                 )}
// //                             </div>
// //                         </div>
// //                     )}

// //                     <div className="flex gap-4 mb-4">
// //                         <button 
// //                             onClick={runCode}
// //                             disabled={isRunning}
// //                             className={`flex-1 p-3 rounded font-bold transition-all ${
// //                                 isRunning ? 'bg-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'
// //                             }`}
// //                         >
// //                             {isRunning ? 'Running...' : '▶ Run Code'}
// //                         </button>
// //                         <button 
// //                             onClick={submitCode}
// //                             className="flex-1 p-3 rounded font-bold bg-accent text-black hover:bg-[#3bd175] transition-all"
// //                         >
// //                             Submit
// //                         </button>
// //                     </div>

// //                     <div className="flex flex-wrap gap-4 justify-center">
// //                         {clients.map((client) => (
// //                             <Client key={client.id || client.socketId} username={client.username} />
// //                         ))}
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* RIGHT PANE: Player B */}
// //             <div className="flex flex-col bg-dark">
// //                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
// //                     <span className="font-bold">Player B {mySide === 'right' && <span className="text-accent text-xs ml-2">(You)</span>}</span>
                    
// //                     {/* Language Selector (Only visible if you are Player B) */}
// //                     {mySide === 'right' && (
// //                         <select 
// //                             className="bg-[#3e3e42] text-xs text-white p-1 rounded outline-none"
// //                             value={language}
// //                             onChange={(e) => setLanguage(e.target.value)}
// //                         >
// //                             <option value="cpp">C++</option>
// //                             <option value="python">Python</option>
// //                             <option value="javascript">JavaScript</option>
// //                         </select>
// //                     )}
// //                 </div>
// //                 <div className="flex-1 overflow-hidden relative">
// //                     <CodeEditor 
// //                         roomId={roomId} 
// //                         side="right" 
// //                         isReadOnly={mySide !== 'right'} 
// //                         ydoc={ydoc} 
// //                         provider={provider}
// //                         language={language}
// //                     />
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default EditorPage;


// import React, { useState, useRef, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import Client from '../components/Client';
// import CodeEditor from '../components/CodeEditor';
// import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';
// import axios from 'axios';

// // Simple Timer Component
// const Timer = () => {
//     const [seconds, setSeconds] = useState(0);
//     useEffect(() => {
//         const interval = setInterval(() => setSeconds(s => s + 1), 1000);
//         return () => clearInterval(interval);
//     }, []);

//     const formatTime = (totalSeconds) => {
//         const min = Math.floor(totalSeconds / 60);
//         const sec = totalSeconds % 60;
//         return `${min}:${sec < 10 ? '0' : ''}${sec}`;
//     };

//     return <span className="font-mono text-xl font-bold text-accent">{formatTime(seconds)}</span>;
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
    
//     // Yjs State
//     const [ydoc] = useState(() => new Y.Doc());
//     const [provider] = useState(() => {
//         return new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
//     });

//     useEffect(() => {
//         const init = async () => {
//             socketRef.current = io('http://localhost:5000');
//             socketRef.current.on('connect_error', (err) => handleErrors(err));
//             socketRef.current.on('connect_failed', (err) => handleErrors(err));

//             function handleErrors(e) {
//                 console.log('socket error', e);
//                 toast.error('Socket connection failed, try again later.');
//                 navigate('/');
//             }

//             socketRef.current.emit('join_room', {
//                 roomId,
//                 username: location.state?.username,
//             });

//             socketRef.current.on('room_joined', ({ players, side, problem }) => {
//                 setClients(players);
//                 setMySide(side);
//                 setProblem(problem);
                
//                 provider.awareness.setLocalStateField('user', {
//                     name: location.state?.username,
//                     color: side === 'left' ? '#007acc' : '#ff0000',
//                 });
                
//                 toast.success(`Joined as Player ${side === 'left' ? 'A (Left)' : 'B (Right)'}`);
//             });

//             socketRef.current.on('player_joined', ({ username, side }) => {
//                 toast.success(`${username} joined!`);
//                 setClients((prev) => [...prev, { username, side }]);
//             });

//             socketRef.current.on('room_full', () => {
//                 toast.error("Room is full!");
//                 navigate('/');
//             });
//         };

//         if(location.state?.username) {
//             init();
//         }

//         return () => {
//             if(socketRef.current) socketRef.current.disconnect();
//             if(provider) provider.destroy();
//             if(ydoc) ydoc.destroy();
//         };
//     }, []);

//     const runCode = async () => {
//         setIsRunning(true);
//         const code = ydoc.getText(`code-${mySide}`).toString();
        
//         if (!code) { toast.error("Write some code!"); setIsRunning(false); return; }

//         try {
//             const response = await axios.post('/api/run', {
//                 language, code, stdin: problem?.testCases[0]?.input || "" 
//             });
//             setOutput(response.data.success ? response.data : { stdout: "", stderr: response.data.message });
//         } catch (error) {
//             toast.error("Run Failed");
//         } finally { setIsRunning(false); }
//     };

//     // REAL SUBMIT LOGIC
//     const submitCode = async () => {
//         setIsRunning(true);
//         const code = ydoc.getText(`code-${mySide}`).toString();
        
//         try {
//             const response = await axios.post('/api/run/submit', {
//                 language, 
//                 code, 
//                 problemId: problem._id // Send Problem ID to verify against hidden cases
//             });

//             const { isCorrect, passedCount, totalTestCases, results } = response.data;

//             if (isCorrect) {
//                 toast.success(`Correct! All ${totalTestCases} cases passed. (+10 pts)`, { icon: '🏆' });
//                 // Here you would trigger "Next Round" logic
//             } else {
//                 toast.error(`Wrong Answer. Passed ${passedCount}/${totalTestCases}`);
//                 // Show the failed case in console
//                 const firstFail = results.find(r => !r.passed);
//                 setOutput({ 
//                     stdout: `Failed Case:\nInput: ${firstFail.input}\nExpected: ${firstFail.expected}\nActual: ${firstFail.actual}`,
//                     stderr: "Test Case Failed"
//                 });
//             }
//         } catch (error) {
//             toast.error("Submission Error");
//         } finally { setIsRunning(false); }
//     };

//     if (!location.state) return <Navigate to="/" />;

//     return (
//         <div className="grid grid-cols-3 h-screen overflow-hidden bg-dark text-gray-300">
            
//             {/* LEFT PANE */}
//             <div className="flex flex-col border-r border-[#3e3e42]">
//                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
//                     <span className="font-bold">Player A {mySide === 'left' && <span className="text-accent text-xs ml-2">(You)</span>}</span>
//                     {mySide === 'left' && (
//                         <select className="bg-[#3e3e42] text-xs text-white p-1 rounded" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                             <option value="cpp">C++</option>
//                             <option value="python">Python</option>
//                             <option value="javascript">JS</option>
//                         </select>
//                     )}
//                 </div>
//                 <div className="flex-1 overflow-hidden relative">
//                     <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydoc} provider={provider} language={language} />
//                 </div>
//             </div>

//             {/* CENTER PANE: Problem & Timer */}
//             <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full overflow-hidden">
//                 {/* HEADER with TIMER */}
//                 <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
//                     <span className="font-bold truncate max-w-[150px]">{problem ? problem.title : "Loading..."}</span>
//                     <Timer /> 
//                 </div>
                
//                 {/* PROBLEM DESCRIPTION - SCROLLABLE */}
//                 {/* The 'overflow-y-auto' here combined with parent 'overflow-hidden' fixes the scrollbar */}
//                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-sm leading-relaxed">
//                     {problem ? (
//                         <div className="space-y-6">
//                             <div>
//                                 <h3 className="text-accent font-bold mb-2">Description</h3>
//                                 <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
//                             </div>
//                             {problem.constraints && (
//                                 <div>
//                                     <h3 className="text-accent font-bold mb-2">Constraints</h3>
//                                     <ul className="list-disc list-inside bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
//                                         {problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}
//                                     </ul>
//                                 </div>
//                             )}
//                             <div>
//                                 <h3 className="text-accent font-bold mb-2">Examples</h3>
//                                 {problem.testCases.filter(tc => tc.isPublic).map((testCase, index) => (
//                                     <div key={index} className="mb-4 bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
//                                         <div className="grid grid-cols-1 gap-2">
//                                             <div><span className="text-xs text-gray-500">Input:</span> <code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono">{testCase.input}</code></div>
//                                             <div><span className="text-xs text-gray-500">Output:</span> <code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono">{testCase.output}</code></div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     ) : (
//                         <div className="text-center mt-10 animate-pulse">Loading Problem...</div>
//                     )}
//                 </div>
                
//                 {/* CONTROLS */}
//                 <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42]">
//                     {output && (
//                         <div className="bg-[#252526] rounded-lg border border-[#3e3e42] mb-4 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
//                             <div className="bg-[#2d2d2d] px-3 py-1 text-xs font-bold text-gray-400">CONSOLE</div>
//                             <div className="p-3 font-mono text-xs">
//                                 {output.stdout && <div><span className="text-green-500">Output:</span><pre className="text-white">{output.stdout}</pre></div>}
//                                 {output.stderr && <div><span className="text-red-500">Error:</span><pre className="text-red-300">{output.stderr}</pre></div>}
//                             </div>
//                         </div>
//                     )}
//                     <div className="flex gap-4 mb-4">
//                         <button onClick={runCode} disabled={isRunning} className="flex-1 p-3 rounded font-bold bg-white text-black hover:bg-gray-200">
//                             {isRunning ? 'Running...' : '▶ Run Code'}
//                         </button>
//                         <button onClick={submitCode} disabled={isRunning} className="flex-1 p-3 rounded font-bold bg-accent text-black hover:bg-[#3bd175]">
//                             Submit
//                         </button>
//                     </div>
//                     <div className="flex flex-wrap gap-4 justify-center">
//                         {clients.map((client) => <Client key={client.id} username={client.username} />)}
//                     </div>
//                 </div>
//             </div>

//             {/* RIGHT PANE */}
//             <div className="flex flex-col bg-dark">
//                  <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
//                     <span className="font-bold">Player B {mySide === 'right' && <span className="text-accent text-xs ml-2">(You)</span>}</span>
//                     {mySide === 'right' && (
//                         <select className="bg-[#3e3e42] text-xs text-white p-1 rounded" value={language} onChange={(e) => setLanguage(e.target.value)}>
//                             <option value="cpp">C++</option>
//                             <option value="python">Python</option>
//                             <option value="javascript">JS</option>
//                         </select>
//                     )}
//                 </div>
//                 <div className="flex-1 overflow-hidden relative">
//                     <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydoc} provider={provider} language={language} />
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
import axios from 'axios';

// COUNTDOWN TIMER (30 Mins)
const Timer = () => {
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Color changes to red when < 5 mins
    return (
        <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-accent'}`}>
            {formatTime(timeLeft)}
        </span>
    );
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
    
    // Game State
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(5);
    const [scores, setScores] = useState({}); 

    // Yjs State
    const [ydoc] = useState(() => new Y.Doc());
    const [provider] = useState(() => {
        return new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
    });

    useEffect(() => {
        const init = async () => {
            socketRef.current = io('http://localhost:5000');
            
            // ... (Error handling same as before) ...

            socketRef.current.emit('join_room', {
                roomId,
                username: location.state?.username,
            });

            // 1. Initial Room Join
            socketRef.current.on('room_joined', (data) => {
                setClients(data.players);
                setMySide(data.side);
                setProblem(data.problem);
                setRound(data.round);
                setTotalRounds(data.totalRounds);
                setScores(data.scores);
                
                provider.awareness.setLocalStateField('user', {
                    name: location.state?.username,
                    color: data.side === 'left' ? '#007acc' : '#ff0000',
                });
            });

            // 2. New Round Handler (Next Question)
            socketRef.current.on('new_round', (data) => {
                toast(`Round ${data.round} Started! (Triggered by ${data.triggerBy})`, { icon: '🚀' });
                setProblem(data.problem);
                setRound(data.round);
                setScores(data.scores);
                setOutput(null); // Clear console
            });

            // 3. Score Update
            socketRef.current.on('score_update', (newScores) => {
                setScores(newScores);
            });

            // 4. Game Over
            socketRef.current.on('game_over', (data) => {
                alert(`Game Over! Winner: ${data.winner}`);
                navigate('/');
            });

            socketRef.current.on('player_joined', ({ username, side }) => {
                setClients((prev) => [...prev, { username, side }]);
            });
        };

        if(location.state?.username) init();

        return () => {
            if(socketRef.current) socketRef.current.disconnect();
            provider.destroy();
            ydoc.destroy();
        };
    }, []);

    // ... (runCode function remains the same) ...
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

    // ... (submitCode function updated) ...
    const submitCode = async () => {
        setIsRunning(true);
        const code = ydoc.getText(`code-${mySide}`).toString();
        
        try {
            const response = await axios.post('/api/run/submit', {
                language, code, problemId: problem._id 
            });

            const { isCorrect, passedCount, totalTestCases, results } = response.data;

            if (isCorrect) {
                toast.success("Correct! +10 Points. Loading Next...", { icon: '🏆' });
                // NOTIFY SERVER WE WON THIS ROUND
                socketRef.current.emit('level_completed', { 
                    roomId, 
                    username: location.state?.username 
                });
            } else {
                toast.error(`Passed ${passedCount}/${totalTestCases} Cases`);
                const firstFail = results.find(r => !r.passed);
                setOutput({ 
                    stdout: `Failed Case:\nInput: ${firstFail.input}\nExpected: ${firstFail.expected}\nActual: ${firstFail.actual}`,
                    stderr: "Test Case Failed"
                });
            }
        } catch (error) { toast.error("Submission Error"); } 
        finally { setIsRunning(false); }
    };

    if (!location.state) return <Navigate to="/" />;

    return (
        <div className="grid grid-cols-3 h-screen overflow-hidden bg-dark text-gray-300">
            
            {/* LEFT PANE: Player A */}
            <div className="flex flex-col border-r border-[#3e3e42] relative">
                <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Player A</span>
                        {/* SCORE DISPLAY */}
                        <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono">
                            {clients[0] ? (scores[clients[0].username] || 0) : 0} pts
                        </span>
                    </div>
                    {mySide === 'left' && (
                        <select className="bg-[#3e3e42] text-xs text-white p-1 rounded outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="cpp">C++</option> <option value="python">Python</option> <option value="javascript">JS</option>
                        </select>
                    )}
                </div>
                {/* Editor with proper scrolling */}
                <div className="flex-1 h-full overflow-hidden">
                    <CodeEditor roomId={roomId} side="left" isReadOnly={mySide !== 'left'} ydoc={ydoc} provider={provider} language={language} />
                </div>
            </div>

            {/* CENTER PANE */}
            <div className="flex flex-col border-r border-[#3e3e42] bg-[#252526] h-full overflow-hidden">
                <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
                    <span className="font-bold truncate max-w-[150px]">
                        {problem ? `Q${round}/${totalRounds}: ${problem.title}` : "Loading..."}
                    </span>
                    <Timer /> 
                </div>
                
                {/* Scrollable Problem Area */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-sm leading-relaxed">
                    {problem ? (
                        <div className="space-y-6">
                            <div><h3 className="text-accent font-bold mb-2">Description</h3>
                            <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} /></div>
                            {problem.constraints && <div><h3 className="text-accent font-bold mb-2">Constraints</h3><ul className="list-disc list-inside bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">{problem.constraints.map((c, i) => <li key={i} className="font-mono text-xs">{c}</li>)}</ul></div>}
                            <div><h3 className="text-accent font-bold mb-2">Examples</h3>{problem.testCases.filter(tc => tc.isPublic).map((tc, i) => (<div key={i} className="mb-4 bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]"><div className="grid grid-cols-1 gap-2"><div><span className="text-xs text-gray-500">Input:</span> <code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono">{tc.input}</code></div><div><span className="text-xs text-gray-500">Output:</span> <code className="block bg-[#2d2d2d] p-2 rounded text-green-400 font-mono">{tc.output}</code></div></div></div>))}</div>
                        </div>
                    ) : (<div className="text-center mt-10 animate-pulse">Loading Battle...</div>)}
                </div>
                
                {/* Controls & Console */}
                <div className="p-4 bg-[#1e1e1e] border-t border-[#3e3e42]">
                    {output && (
                        <div className="bg-[#252526] rounded-lg border border-[#3e3e42] mb-4 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
                            <div className="bg-[#2d2d2d] px-3 py-1 text-xs font-bold text-gray-400 border-b border-[#3e3e42]">CONSOLE</div>
                            <div className="p-3 font-mono text-xs">
                                {output.stdout && <div><span className="text-green-500">Output:</span><pre className="whitespace-pre-wrap text-white">{output.stdout}</pre></div>}
                                {output.stderr && <div><span className="text-red-500">Error:</span><pre className="whitespace-pre-wrap text-red-300">{output.stderr}</pre></div>}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4 mb-4">
                        <button onClick={runCode} disabled={isRunning} className="flex-1 p-3 rounded font-bold bg-white text-black hover:bg-gray-200">{isRunning ? '...' : '▶ Run'}</button>
                        <button onClick={submitCode} disabled={isRunning} className="flex-1 p-3 rounded font-bold bg-accent text-black hover:bg-[#3bd175]">Submit</button>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {clients.map((client) => <Client key={client.id || client.socketId} username={client.username} />)}
                    </div>
                </div>
            </div>

            {/* RIGHT PANE: Player B */}
            <div className="flex flex-col bg-dark relative">
                <div className="bg-[#2d2d2d] p-3 flex justify-between items-center border-b border-[#3e3e42]">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Player B</span>
                        {/* SCORE DISPLAY */}
                        <span className="bg-black/50 px-2 py-0.5 rounded text-green-400 text-xs font-mono">
                            {clients[1] ? (scores[clients[1].username] || 0) : 0} pts
                        </span>
                    </div>
                    {mySide === 'right' && (
                        <select className="bg-[#3e3e42] text-xs text-white p-1 rounded outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="cpp">C++</option> <option value="python">Python</option> <option value="javascript">JS</option>
                        </select>
                    )}
                </div>
                <div className="flex-1 h-full overflow-hidden">
                    <CodeEditor roomId={roomId} side="right" isReadOnly={mySide !== 'right'} ydoc={ydoc} provider={provider} language={language} />
                </div>
            </div>
        </div>
    );
};

export default EditorPage;