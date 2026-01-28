// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Loader2, Code2, Eye, Layout, Play } from 'lucide-react';

// import Navbar from '../components/Navbar'; 
// import CodePanel from '../components/Visualizer/CodePanel';
// import VizCanvas from '../components/Visualizer/VizCanvas';
// import ControlBar from '../components/Visualizer/ControlBar';
// import api from '../api.js';
// import toast from 'react-hot-toast';

// // --- EXAMPLE ALGORITHMS ---
// const EXAMPLES = {
//     bubbleSort: `// Bubble Sort Visualization
// let arr = [64, 34, 25, 12, 22, 11, 90];
// for(let i = 0; i < arr.length; i++) {
//   for(let j = 0; j < arr.length - i - 1; j++) {
//     if(arr[j] > arr[j+1]) {
//       let temp = arr[j];
//       arr[j] = arr[j+1];
//       arr[j+1] = temp;
//     }
//   }
// }`,
//     binaryTree: `// Binary Search Tree
// class Node {
//   constructor(val) {
//     this.val = val;
//     this.left = null;
//     this.right = null;
//   }
// }
// let root = new Node(50);
// root.left = new Node(30);
// root.right = new Node(70);
// root.left.left = new Node(20);
// root.left.right = new Node(40);`,
//     linkedList: `// Linked List
// class Node {
//   constructor(val) {
//     this.val = val;
//     this.next = null;
//   }
// }
// let head = new Node(1);
// head.next = new Node(2);
// head.next.next = new Node(3);
// head.next.next.next = new Node(4);`,
//     matrix: `// 2D Matrix
// let matrix = [
//   [1, 2, 3],
//   [4, 5, 6],
//   [7, 8, 9]
// ];
// let i = 0, j = 0;
// // Matrix traversal
// for(i = 0; i < matrix.length; i++) {
//   for(j = 0; j < matrix[i].length; j++) {
//     matrix[i][j] *= 2;
//   }
// }`,
//     stack: `// Stack Data Structure (LIFO)
// // We use an array 'myStack' and a 'top' pointer
// let myStack = [];
// let top = -1; 

// // 1. PUSH Operation
// function push(val) {
//     top++;
//     myStack[top] = val;
// }

// // 2. POP Operation
// function pop() {
//     if (top >= 0) {
//         myStack.pop();
//         top--;
//     }
// }

// // --- Execution ---
// push(10);
// push(20);
// push(30);
// pop();     // Removes 30
// push(40);`,

//     queue: `// Queue Data Structure (FIFO)
// // We use a standard array to simulate a Queue
// let myQueue = [];

// // 1. ENQUEUE (Add to Rear)
// function enqueue(val) {
//     // Pushing to the end of array
//     myQueue.push(val);
// }

// // 2. DEQUEUE (Remove from Front)
// function dequeue() {
//     // Shifting from the start of array
//     if (myQueue.length > 0) {
//         myQueue.shift();
//     }
// }

// // --- Execution ---
// enqueue(10); // Queue: [10]
// enqueue(20); // Queue: [10, 20]
// enqueue(30); // Queue: [10, 20, 30]

// dequeue();   // Removes 10. Queue: [20, 30]
// dequeue();   // Removes 20. Queue: [30]

// enqueue(40); // Queue: [30, 40]
// enqueue(50); // Queue: [30, 40, 50]`,

// };

// const Visualizer = () => {
//     const navigate = useNavigate();
    
//     const [code, setCode] = useState(EXAMPLES.bubbleSort);
//     const [trace, setTrace] = useState([]);
//     const [currentStep, setCurrentStep] = useState(0);
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [showExamples, setShowExamples] = useState(false);
    
//     // Mobile Tab State
//     const [mobileTab, setMobileTab] = useState('editor'); 
    
//     const playbackSpeed = useRef(800);

//     // Auto-play game loop
//     useEffect(() => {
//         let interval;
//         if (isPlaying && currentStep < trace.length - 1) {
//             interval = setInterval(() => {
//                 setCurrentStep(prev => {
//                     if (prev >= trace.length - 1) {
//                         setIsPlaying(false);
//                         return prev;
//                     }
//                     return prev + 1;
//                 });
//             }, playbackSpeed.current);
//         } else if (currentStep >= trace.length - 1) {
//             setIsPlaying(false);
//         }
//         return () => clearInterval(interval);
//     }, [isPlaying, currentStep, trace.length]);

//     const handleRun = async () => {
//         if (!code.trim()) {
//             toast.error('Please write some code first!');
//             return;
//         }

//         setLoading(true);
//         setIsPlaying(false);
//         setCurrentStep(0);
        
//         // Mobile: Auto switch
//         setMobileTab('visualizer');

//         try {
//             const { data } = await api.post('/visualize/run', { 
//                 code, 
//                 language: 'javascript' 
//             });
            
//             if (data.success && data.trace && data.trace.length > 0) {
//                 setTrace(data.trace);
//                 toast.success(`Traced ${data.trace.length} execution steps!`);
//             } else {
//                 toast.error('No data to visualize. Check your code logic.');
//                 setTrace([]);
//             }
//         } catch (error) {
//             console.error('Visualization error:', error);
//             const msg = error.response?.data?.message || 'Execution failed. Check your code.';
//             toast.error(msg);
//             setTrace([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadExample = (key) => {
//         setCode(EXAMPLES[key]);
//         setShowExamples(false);
//         setTrace([]);
//         setCurrentStep(0);
//         setMobileTab('editor'); 
//         toast.success('Example loaded!');
//     };

//     return (
//         <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
//             <Navbar />
            
//             {/* --- HEADER --- */}
//             <div className="h-14 border-b border-gray-800 flex items-center justify-between px-2 md:px-4 bg-[#161b22] shrink-0 gap-2">
                
//                 {/* 1. Back Button */}
//                 <button 
//                     onClick={() => navigate('/dashboard')} 
//                     className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-2 md:px-3 py-2 rounded-lg group"
//                 >
//                     <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
//                     <span className="hidden md:inline">Dashboard</span>
//                 </button>

//                 {/* 2. Mobile Tab Switcher */}
//                 <div className="flex lg:hidden bg-gray-800 rounded-lg p-1">
//                     <button
//                         onClick={() => setMobileTab('editor')}
//                         className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
//                             mobileTab === 'editor' ? 'bg-[#0d1117] text-white shadow' : 'text-gray-400'
//                         }`}
//                     >
//                         Code
//                     </button>
//                     <button
//                         onClick={() => setMobileTab('visualizer')}
//                         className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
//                             mobileTab === 'visualizer' ? 'bg-[#0d1117] text-blue-400 shadow' : 'text-gray-400'
//                         }`}
//                     >
//                         Visualizer
//                     </button>
//                 </div>

                // {/* 3. Title */}
                // <div className="hidden md:flex items-center gap-3">
                //     <div className="flex items-center gap-2 text-green-400">
                //         <Eye size={18} />
                //         <h1 className="font-bold text-lg tracking-tight">Code Visualizer</h1>
                //     </div>
                //     <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">BETA</span>
                // </div>

//                 {/* 4. Examples Dropdown */}
//                 <div className="relative">
//                     <button 
//                         onClick={() => setShowExamples(!showExamples)}
//                         className="flex items-center gap-2 text-gray-400 hover:text-white text-xs md:text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-700"
//                     >
//                         <Code2 size={16} />
//                         <span className="hidden sm:inline">Examples</span>
//                     </button>
                    
//                     {showExamples && (
//                         <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-lg shadow-2xl py-2 w-48 z-50">
//                             {Object.keys(EXAMPLES).map(key => (
//                                 <button
//                                     key={key}
//                                     onClick={() => loadExample(key)}
//                                     className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors capitalize"
//                                 >
//                                     {key.replace(/([A-Z])/g, ' $1').trim()}
//                                 </button>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* --- MAIN CONTENT AREA --- */}
//             <div className="flex-1 flex overflow-hidden min-h-0 relative">
                
//                 {/* LEFT: CODE EDITOR */}
//                 <div className={`
//                     flex-col min-h-0 bg-[#0d1117] border-r border-gray-800
//                     ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'} 
//                     lg:flex lg:w-1/2
//                 `}>
//                     <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between">
//                         <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Editor</span>
//                         <div className="flex items-center gap-2">
//                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//                             <span className="text-xs text-gray-500">JS</span>
//                         </div>
//                     </div>
                    
//                     {/* Code Panel */}
//                     <div className="flex-1 overflow-hidden">
//                         <CodePanel 
//                             code={code} 
//                             setCode={setCode} 
//                             activeLine={trace[currentStep]?.line} 
//                         />
//                     </div>
//                 </div>

//                 {/* RIGHT: VISUALIZATION CANVAS */}
//                 <div className={`
//                     bg-[#010409] relative flex-col min-h-0
//                     ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'} 
//                     lg:flex lg:w-1/2
//                 `}>
//                     <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between">
//                         <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
//                             Output {trace.length > 0 && `(Step ${currentStep + 1}/${trace.length})`}
//                         </span>
//                         <span className="lg:hidden text-[10px] text-gray-600">
//                             {isPlaying ? "Playing..." : "Paused"}
//                         </span>
//                     </div>

//                     {loading && (
//                         <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/95 backdrop-blur-sm">
//                             <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
//                             <span className="text-gray-400 font-mono text-sm animate-pulse">Tracing execution...</span>
//                         </div>
//                     )}
                    
//                     <VizCanvas variables={trace[currentStep]?.variables} />
//                 </div>
//             </div>

//             {/* --- BOTTOM CONTROL BAR --- */}
//             <div className="h-auto min-h-[5rem] border-t border-gray-800 bg-[#161b22] px-4 py-2 shrink-0 z-10">
//                 <ControlBar 
//                     totalSteps={trace.length} 
//                     currentStep={currentStep} 
//                     setCurrentStep={setCurrentStep}
//                     isPlaying={isPlaying}
//                     setIsPlaying={setIsPlaying}
//                     onRun={handleRun}
//                     loading={loading}
//                 />
//             </div>
//         </div>
//     );
// };

// export default Visualizer;











// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Loader2, Code2, Eye, Play, Pause, RotateCcw, Settings } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- COMPONENTS ---
// import Navbar from '../components/Navbar'; 
// import CodePanel from '../components/Visualizer/CodePanel';
// import VizCanvas from '../components/Visualizer/VizCanvas';
// import ControlBar from '../components/Visualizer/ControlBar';
// import api from '../api.js';

// // --- ALGORITHM EXAMPLES ---
// const EXAMPLES = {
//     dfsMaze: `// Depth-First Search (DFS) Maze Solver
// // 0 = Wall, 1 = Path, 'S' = Start, 'G' = Goal
// let grid = [
//   ['S', 0, 1, 1, 1],
//   [1, 0, 1, 0, 1],
//   [1, 1, 1, 0, 1],
//   [0, 0, 0, 0, 1],
//   [1, 1, 1, 1, 'G']
// ];

// const dr = [0, 1, 0, -1];
// const dc = [1, 0, -1, 0];

// function solve(r, c) {
//   // Force a tracer step
//   const current = grid[r][c]; 
  
//   // 1. Check Bounds & Walls
//   if (r < 0 || c < 0 || r >= 5 || c >= 5 || current === 0) return false;
  
//   // 2. Check Goal
//   if (current === 'G') return true;
  
//   // 3. Mark Visited
//   if (current !== 'S' && current !== '*') {
//       grid[r][c] = '*'; // Mark as active
//   }

//   // 4. Explore Neighbors
//   for (let i = 0; i < 4; i++) {
//     // Explicitly define next steps for the visualizer
//     let nextR = r + dr[i];
//     let nextC = c + dc[i];
    
//     if (solve(nextR, nextC)) {
//       if (grid[r][c] !== 'S') grid[r][c] = '✓'; // Success path
//       return true;
//     }
//   }

//   // 5. Backtrack
//   if (grid[r][c] !== 'S') grid[r][c] = 1; // Unmark
//   return false;
// }

// solve(0, 0);`,

//     bubbleSort: `// Bubble Sort Visualization
// let arr = [64, 34, 25, 12, 22, 11, 90];
// for(let i = 0; i < arr.length; i++) {
//   for(let j = 0; j < arr.length - i - 1; j++) {
//     // Compare
//     if(arr[j] > arr[j+1]) {
//       // Swap
//       let temp = arr[j];
//       arr[j] = arr[j+1];
//       arr[j+1] = temp;
//     }
//   }
// }`,

//     binaryTree: `// Binary Search Tree Construction
// class Node {
//   constructor(val) {
//     this.val = val;
//     this.left = null;
//     this.right = null;
//   }
// }
// let root = new Node(50);
// root.left = new Node(30);
// root.right = new Node(70);
// root.left.left = new Node(20);
// root.left.right = new Node(40);
// root.right.left = new Node(60);
// root.right.right = new Node(80);`,

//     linkedList: `// Linked List Creation
// class Node {
//   constructor(val) {
//     this.val = val;
//     this.next = null;
//   }
// }
// let head = new Node(10);
// head.next = new Node(20);
// head.next.next = new Node(30);
// head.next.next.next = new Node(40);
// // Circular link example
// head.next.next.next.next = head.next;`,

//     matrix: `// 2D Matrix
// let matrix = [
//   [1, 2, 3],
//   [4, 5, 6],
//   [7, 8, 9]
// ];
// let i = 0, j = 0;
// // Matrix traversal
// for(i = 0; i < matrix.length; i++) {
//   for(j = 0; j < matrix[i].length; j++) {
//     matrix[i][j] *= 2;
//   }
// }`,

//     stack: `// Stack (LIFO)
// let stack = [];
// let top = -1;

// function push(val) {
//   top++;
//   stack[top] = val;
// }

// function pop() {
//   if (top >= 0) {
//     stack.pop(); // Remove from array
//     top--;
//   }
// }

// push(10);
// push(20);
// push(30);
// pop(); // Removes 30
// push(40);`,

//     queue: `// Queue Data Structure (FIFO)
// // We use a standard array to simulate a Queue
// let myQueue = [];

// // 1. ENQUEUE (Add to Rear)
// function enqueue(val) {
//     // Pushing to the end of array
//     myQueue.push(val);
// }

// // 2. DEQUEUE (Remove from Front)
// function dequeue() {
//     // Shifting from the start of array
//     if (myQueue.length > 0) {
//         myQueue.shift();
//     }
// }

// // --- Execution ---
// enqueue(10); // Queue: [10]
// enqueue(20); // Queue: [10, 20]
// enqueue(30); // Queue: [10, 20, 30]

// dequeue();   // Removes 10. Queue: [20, 30]
// dequeue();   // Removes 20. Queue: [30]

// enqueue(40); // Queue: [30, 40]
// enqueue(50); // Queue: [30, 40, 50]`,
// };

// const Visualizer = () => {
//     const navigate = useNavigate();
    
//     // --- STATE ---
//     const [code, setCode] = useState(EXAMPLES.dfsMaze);
//     const [trace, setTrace] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [showExamples, setShowExamples] = useState(false);
//     const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'visualizer'

//     // --- PLAYBACK ENGINE ---
//     // We use a custom logic here instead of a simple setInterval to avoid closure staleness
//     const [currentStep, setCurrentStep] = useState(0);
//     const [isPlaying, setIsPlaying] = useState(false);
//     const timerRef = useRef(null);
//     const speedRef = useRef(800); // Default 800ms
    
//     // Cleanup on unmount
//     useEffect(() => {
//         return () => stop();
//     }, []);

//     // The Heartbeat of the Visualizer
//     useEffect(() => {
//         if (isPlaying && trace.length > 0) {
//             timerRef.current = setInterval(() => {
//                 setCurrentStep((prev) => {
//                     if (prev >= trace.length - 1) {
//                         stop(); // Auto-stop at end
//                         return prev;
//                     }
//                     return prev + 1;
//                 });
//             }, speedRef.current);
//         } else {
//             stop();
//         }
//         return () => clearInterval(timerRef.current);
//     }, [isPlaying, trace.length]); // Re-run if play state changes

//     // Playback Controls
//     const stop = useCallback(() => {
//         clearInterval(timerRef.current);
//         setIsPlaying(false);
//     }, []);

//     const play = useCallback(() => {
//         if (currentStep >= trace.length - 1) {
//             setCurrentStep(0); // Restart if at end
//         }
//         setIsPlaying(true);
//     }, [currentStep, trace.length]);

//     const handleSpeedChange = (newSpeed) => {
//         speedRef.current = newSpeed;
//         // If playing, restart interval with new speed
//         if (isPlaying) {
//             stop();
//             setTimeout(play, 0);
//         }
//     };

//     // --- API & EXECUTION ---
//     const handleRun = async () => {
//         if (!code.trim()) return toast.error('Please write some code first!');

//         setLoading(true);
//         stop(); // Stop any running playback
        
//         // Optimistic UI
//         setTrace([]);
//         setCurrentStep(0);
//         setMobileTab('visualizer'); // Auto-switch on mobile

//         try {
//             const { data } = await api.post('/visualize/run', { 
//                 code, 
//                 language: 'javascript' 
//             });
            
//             if (data.success && data.trace && data.trace.length > 0) {
//                 setTrace(data.trace);
//                 toast.success(`Success! Generated ${data.trace.length} steps.`);
//             } else {
//                 toast.error('No steps generated. Check your logic.');
//             }
//         } catch (error) {
//             console.error('Viz Error:', error);
//             const msg = error.response?.data?.message || 'Execution failed';
//             const detail = error.response?.data?.error;
//             toast.error(detail ? `${msg}: ${detail}` : msg);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const loadExample = (key) => {
//         stop();
//         setCode(EXAMPLES[key]);
//         setShowExamples(false);
//         setTrace([]);
//         setCurrentStep(0);
//         setMobileTab('editor');
//         toast.success(`Loaded ${key} example`);
//     };

//     // --- MEMOIZED RENDER PROPS ---
//     // Critical for performance: Don't let the Canvas or Editor re-render unnecessarily
//     const currentVariables = useMemo(() => trace[currentStep]?.variables || {}, [trace, currentStep]);
//     const currentLine = useMemo(() => trace[currentStep]?.line || 0, [trace, currentStep]);

//     return (
//         <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
//             <Navbar />
            
//             {/* --- TOP BAR --- */}
//             <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22] shrink-0 z-20">
                
//                 {/* Left: Branding & Back Button */}
//                 <div className="flex items-center gap-4">
//                     {/* Back Button */}
//                     <button 
//                         onClick={() => navigate('/dashboard')} 
//                         className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
//                     >
//                         <ArrowLeft size={20} />
//                     </button>

//                     {/* Logo Area */}
//                     <div className="flex items-center gap-3">
//                         {/* Logo Image (or Fallback Icon) */}
//                         <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        
//                         <div className="flex flex-col">
//                             {/* Main Title: CodeArena1v1 Style */}
//                             <h1 className="font-extrabold text-xl tracking-tight leading-none text-white">
//                                 Code<span className="text-green-500">Arena</span><span className="text-white">1v1</span>
//                             </h1>
                            
//                             {/* Subtitle Badge */}
//                             <div className="flex items-center gap-2 mt-0.5">
//                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
//                                 <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
//                                     Visualizer
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Center: Mobile Tabs */}
//                 <div className="flex lg:hidden bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
//                     <button
//                         onClick={() => setMobileTab('editor')}
//                         className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
//                             mobileTab === 'editor' ? 'bg-[#21262d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
//                         }`}
//                     >
//                         Code
//                     </button>
//                     <button
//                         onClick={() => setMobileTab('visualizer')}
//                         className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
//                             mobileTab === 'visualizer' ? 'bg-[#21262d] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
//                         }`}
//                     >
//                         Preview
//                     </button>
//                 </div>

//                 {/* Right: Examples & Actions */}
//                 <div className="relative">
//                     <button 
//                         onClick={() => setShowExamples(!showExamples)}
//                         className="flex items-center gap-2 text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-gray-300 px-3 py-2 rounded-lg border border-gray-700 transition-all"
//                     >
//                         <Code2 size={14} />
//                         <span className="hidden sm:inline">Examples</span>
//                     </button>
                    
//                     {showExamples && (
//                         <>
//                             <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
//                             <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-xl shadow-2xl py-2 w-56 z-50 overflow-hidden ring-1 ring-black/50">
//                                 <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#21262d]/50 mb-1">
//                                     Load Preset
//                                 </div>
//                                 {Object.keys(EXAMPLES).map(key => (
//                                     <button
//                                         key={key}
//                                         onClick={() => loadExample(key)}
//                                         className="w-full text-left px-4 py-2.5 hover:bg-blue-500/10 hover:text-blue-400 text-sm text-gray-300 transition-colors flex items-center gap-2"
//                                     >
//                                         <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400"></span>
//                                         {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
//                                     </button>
//                                 ))}
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>

//             {/* --- MAIN SPLIT VIEW --- */}
//             <div className="flex-1 flex overflow-hidden min-h-0 relative bg-[#0d1117]">
                
//                 {/* 1. CODE EDITOR */}
//                 <div className={`
//                     flex-col min-h-0 border-r border-gray-800 bg-[#0d1117] relative z-10
//                     ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'} 
//                     lg:flex lg:w-1/2
//                 `}>
//                     <CodePanel 
//                         code={code} 
//                         setCode={setCode} 
//                         activeLine={currentLine} 
//                     />
//                 </div>

//                 {/* 2. VISUALIZATION CANVAS */}
//                 <div className={`
//                     flex-col relative min-h-0 bg-[#010409]
//                     ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'} 
//                     lg:flex lg:w-1/2
//                 `}>
//                     {/* Canvas Status Header */}
//                     <div className="h-8 bg-[#0d1117] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
//                         <div className="flex items-center gap-2">
//                             <div className={`w-2 h-2 rounded-full ${trace.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
//                             <span>Memory State</span>
//                         </div>
//                         <span>
//                             {trace.length > 0 
//                                 ? `Step ${currentStep + 1} / ${trace.length}`
//                                 : 'Idle'
//                             }
//                         </span>
//                     </div>

//                     {/* Loader Overlay */}
//                     {loading && (
//                         <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
//                             <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
//                             <span className="text-gray-300 font-mono text-xs animate-pulse">Running Algorithm...</span>
//                         </div>
//                     )}
                    
//                     {/* The Canvas */}
//                     <VizCanvas variables={currentVariables} />
//                 </div>
//             </div>

//             {/* --- CONTROL BAR --- */}
//             <div className="h-auto min-h-[4.5rem] border-t border-gray-800 bg-[#161b22] px-4 py-2 shrink-0 z-20">
//                 <ControlBar 
//                     totalSteps={trace.length} 
//                     currentStep={currentStep} 
//                     setCurrentStep={setCurrentStep}
//                     isPlaying={isPlaying}
//                     setIsPlaying={isPlaying ? stop : play}
//                     onRun={handleRun}
//                     loading={loading}
//                     // Optional: Pass speed control handler if ControlBar supports it
//                     // onSpeedChange={handleSpeedChange} 
//                 />
//             </div>
//         </div>
//     );
// };

// export default Visualizer;


















import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Code2, Eye, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

// --- COMPONENTS ---
import Navbar from '../components/Navbar'; 
import CodePanel from '../components/Visualizer/CodePanel';
import VizCanvas from '../components/Visualizer/VizCanvas';
import ControlBar from '../components/Visualizer/ControlBar';
import api from '../api.js';

// --- ALGORITHM EXAMPLES ---
const EXAMPLES = {
//     dfsMaze: `// Depth-First Search (DFS) Maze Solver
// // 0 = Wall, 1 = Path, 'S' = Start, 'G' = Goal
// let grid = [
//   ['S', 0, 1, 1, 1],
//   [1, 0, 1, 0, 1],
//   [1, 1, 1, 0, 1],
//   [0, 0, 0, 0, 1],
//   [1, 1, 1, 1, 'G']
// ];

// const dr = [0, 1, 0, -1];
// const dc = [1, 0, -1, 0];

// function solve(r, c) {
//   // Force a tracer step
//   const current = grid[r][c]; 
  
//   // 1. Check Bounds & Walls
//   if (r < 0 || c < 0 || r >= 5 || c >= 5 || current === 0) return false;
  
//   // 2. Check Goal
//   if (current === 'G') return true;
  
//   // 3. Mark Visited
//   if (current !== 'S' && current !== '*') {
//       grid[r][c] = '*'; // Mark as active
//   }

//   // 4. Explore Neighbors
//   for (let i = 0; i < 4; i++) {
//     // Explicitly define next steps for the visualizer
//     let nextR = r + dr[i];
//     let nextC = c + dc[i];
    
//     if (solve(nextR, nextC)) {
//       if (grid[r][c] !== 'S') grid[r][c] = '✓'; // Success path
//       return true;
//     }
//   }

//   // 5. Backtrack
//   if (grid[r][c] !== 'S') grid[r][c] = 1; // Unmark
//   return false;
// }

// solve(0, 0);`,

    bubbleSort: `// Bubble Sort Visualization
let arr = [64, 34, 25, 12, 22, 11, 90];
for(let i = 0; i < arr.length; i++) {
  for(let j = 0; j < arr.length - i - 1; j++) {
    // Compare
    if(arr[j] > arr[j+1]) {
      // Swap
      let temp = arr[j];
      arr[j] = arr[j+1];
      arr[j+1] = temp;
    }
  }
}`,

    binaryTree: `// Binary Search Tree Construction
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}
let root = new Node(50);
root.left = new Node(30);
root.right = new Node(70);
root.left.left = new Node(20);
root.left.right = new Node(40);
root.right.left = new Node(60);
root.right.right = new Node(80);`,

    linkedList: `// Linked List Creation
class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}
let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);
head.next.next.next = new Node(40);
// Circular link example
head.next.next.next.next = head.next;`,

    matrix: `// 2D Matrix
let matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
let i = 0, j = 0;
// Matrix traversal
for(i = 0; i < matrix.length; i++) {
  for(j = 0; j < matrix[i].length; j++) {
    matrix[i][j] *= 2;
  }
}`,

    stack: `// Stack (LIFO)
let stack = [];
let top = -1;

function push(val) {
  top++;
  stack[top] = val;
}

function pop() {
  if (top >= 0) {
    stack.pop(); // Remove from array
    top--;
  }
}

push(10);
push(20);
push(30);
pop(); // Removes 30
push(40);`,

    queue: `// Queue Data Structure (FIFO)
// We use a standard array to simulate a Queue
let myQueue = [];

// 1. ENQUEUE (Add to Rear)
function enqueue(val) {
    // Pushing to the end of array
    myQueue.push(val);
}

// 2. DEQUEUE (Remove from Front)
function dequeue() {
    // Shifting from the start of array
    if (myQueue.length > 0) {
        myQueue.shift();
    }
}

// --- Execution ---
enqueue(10); // Queue: [10]
enqueue(20); // Queue: [10, 20]
enqueue(30); // Queue: [10, 20, 30]

dequeue();   // Removes 10. Queue: [20, 30]
dequeue();   // Removes 20. Queue: [30]

enqueue(40); // Queue: [30, 40]
enqueue(50); // Queue: [30, 40, 50]`,
};

const Visualizer = () => {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [code, setCode] = useState(EXAMPLES.dfsMaze);
    const [trace, setTrace] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'visualizer'

    // --- PLAYBACK ENGINE ---
    // We use a custom logic here instead of a simple setInterval to avoid closure staleness
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef(null);
    const speedRef = useRef(800); // Default 800ms
    
    // Cleanup on unmount
    useEffect(() => {
        return () => stop();
    }, []);

    // The Heartbeat of the Visualizer
    useEffect(() => {
        if (isPlaying && trace.length > 0) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev >= trace.length - 1) {
                        stop(); // Auto-stop at end
                        return prev;
                    }
                    return prev + 1;
                });
            }, speedRef.current);
        } else {
            stop();
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, trace.length]); // Re-run if play state changes

    // Playback Controls
    const stop = useCallback(() => {
        clearInterval(timerRef.current);
        setIsPlaying(false);
    }, []);

    const play = useCallback(() => {
        if (currentStep >= trace.length - 1) {
            setCurrentStep(0); // Restart if at end
        }
        setIsPlaying(true);
    }, [currentStep, trace.length]);

    const handleSpeedChange = (newSpeed) => {
        speedRef.current = newSpeed;
        // If playing, restart interval with new speed
        if (isPlaying) {
            stop();
            setTimeout(play, 0);
        }
    };

    // --- API & EXECUTION ---
    const handleRun = async () => {
        if (!code.trim()) return toast.error('Please write some code first!');

        setLoading(true);
        stop(); // Stop any running playback
        
        // Optimistic UI
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('visualizer'); // Auto-switch on mobile

        try {
            const { data } = await api.post('/visualize/run', { 
                code, 
                language: 'javascript' 
            });
            
            if (data.success && data.trace && data.trace.length > 0) {
                setTrace(data.trace);
                toast.success(`Success! Generated ${data.trace.length} steps.`);
            } else {
                toast.error('No steps generated. Check your logic.');
            }
        } catch (error) {
            console.error('Viz Error:', error);
            const msg = error.response?.data?.message || 'Execution failed';
            const detail = error.response?.data?.error;
            toast.error(detail ? `${msg}: ${detail}` : msg);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = (key) => {
        stop();
        setCode(EXAMPLES[key]);
        setShowExamples(false);
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('editor');
        toast.success(`Loaded ${key} example`);
    };

    // --- MEMOIZED RENDER PROPS ---
    // Critical for performance: Don't let the Canvas or Editor re-render unnecessarily
    const currentVariables = useMemo(() => trace[currentStep]?.variables || {}, [trace, currentStep]);
    const currentLine = useMemo(() => trace[currentStep]?.line || 0, [trace, currentStep]);

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
            <Navbar />
            
            {/* --- TOP BAR --- */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22] shrink-0 z-20">
                
                {/* Left: Back Button */}
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* Center: Branding Title */}
                <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                    {/* Logo Image (or Fallback Icon) */}
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    
                    <div className="flex items-center gap-2">
                        {/* Main Title: CodeArena1v1 Style */}
                        <h1 className="font-extrabold text-xl tracking-tight leading-none text-white hidden md:block">
                            Code<span className="text-green-500">Arena</span><span className="text-white">1v1</span>
                        </h1>
                        <h1 className="font-extrabold text-lg tracking-tight leading-none text-white md:hidden">
                            CA<span className="text-green-500">1v1</span>
                        </h1>
                        
                        {/* BETA Badge */}
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-widest">
                            BETA
                        </span>
                    </div>
                </div>

                {/* Right: Examples & Mobile Tabs */}
                <div className="flex items-center gap-2">
                    {/* Mobile Tabs (Visible only on small screens) */}
                    <div className="flex lg:hidden bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 mr-2">
                        <button
                            onClick={() => setMobileTab('editor')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                mobileTab === 'editor' ? 'bg-[#21262d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setMobileTab('visualizer')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                mobileTab === 'visualizer' ? 'bg-[#21262d] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            View
                        </button>
                    </div>

                    {/* Examples Button */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-2 text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-4 py-2 rounded-lg border border-gray-700 transition-all shadow-sm"
                        >
                            <Code2 size={16} className="text-gray-400" />
                            <span className="hidden sm:inline">Examples</span>
                        </button>
                        
                        {showExamples && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
                                <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-xl shadow-2xl py-2 w-64 z-50 overflow-hidden ring-1 ring-black/50">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#21262d]/50 mb-1 border-b border-gray-800">
                                        Load Algorithm Preset
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {Object.keys(EXAMPLES).map(key => (
                                            <button
                                                key={key}
                                                onClick={() => loadExample(key)}
                                                className="w-full text-left px-4 py-3 hover:bg-green-500/10 hover:text-green-400 text-sm text-gray-300 transition-colors flex items-center gap-3 border-b border-gray-800/50 last:border-0"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-green-500 shrink-0"></div>
                                                <span className="truncate font-medium">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MAIN SPLIT VIEW --- */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative bg-[#0d1117]">
                
                {/* 1. CODE EDITOR */}
                <div className={`
                    flex-col min-h-0 border-r border-gray-800 bg-[#0d1117] relative z-10
                    ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    <CodePanel 
                        code={code} 
                        setCode={setCode} 
                        activeLine={currentLine} 
                    />
                </div>

                {/* 2. VISUALIZATION CANVAS */}
                <div className={`
                    flex-col relative min-h-0 bg-[#010409]
                    ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    {/* Canvas Status Header */}
                    <div className="h-8 bg-[#0d1117] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${trace.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <span>Memory State</span>
                        </div>
                        <span>
                            {trace.length > 0 
                                ? `Step ${currentStep + 1} / ${trace.length}`
                                : 'Idle'
                            }
                        </span>
                    </div>

                    {/* Loader Overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
                            <span className="text-gray-300 font-mono text-xs animate-pulse">Running Algorithm...</span>
                        </div>
                    )}
                    
                    {/* The Canvas */}
                    <VizCanvas variables={currentVariables} />
                </div>
            </div>

            {/* --- CONTROL BAR --- */}
            <div className="h-auto min-h-[4.5rem] border-t border-gray-800 bg-[#161b22] px-4 py-2 shrink-0 z-20">
                <ControlBar 
                    totalSteps={trace.length} 
                    currentStep={currentStep} 
                    setCurrentStep={setCurrentStep}
                    isPlaying={isPlaying}
                    setIsPlaying={isPlaying ? stop : play}
                    onRun={handleRun}
                    loading={loading}
                    // Optional: Pass speed control handler if ControlBar supports it
                    // onSpeedChange={handleSpeedChange} 
                />
            </div>
        </div>
    );
};

export default Visualizer;