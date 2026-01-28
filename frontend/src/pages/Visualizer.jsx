// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Loader2, Code2, Eye } from 'lucide-react';

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

//     // ✅ FIXED: Safer Dijkstra Implementation
//     dijkstra: `// Dijkstra's Algorithm (Safe Mode)
// // 1=Road, 50=Mud (Slow), 9=Goal, 5=Start

// let grid = [
//   [5,  1,  1,  1,  1],
//   [99, 99, 99, 99, 1], // Wall
//   [1,  1,  1,  50, 1], // Mud
//   [1,  50, 1,  1,  9]
// ];

// let rows = 4, cols = 5;

// // Distance Matrix
// let dist = [];
// for(let i=0; i<rows; i++) {
//     let row = [];
//     for(let j=0; j<cols; j++) row.push(9999); // Use 9999 instead of Infinity for safety
//     dist.push(row);
// }
// dist[0][0] = 0;

// // Directions: Right, Down, Left, Up
// let dr = [0, 1, 0, -1];
// let dc = [1, 0, -1, 0];
// let arrows = ['→', '↓', '←', '↑'];

// // Priority Queue simulation
// let pq = [];
// pq.push({c: 0, r: 0, col: 0}); // Cost, Row, Col

// while (pq.length > 0) {
//     // Sort logic
//     pq.sort(function(a, b){ return a.c - b.c });
//     let curr = pq.shift(); // Remove first
//     let d = curr.c;
//     let r = curr.r;
//     let c = curr.col;

//     let cell = grid[r][c];
    
//     // Found Goal (9)
//     if (cell === 9) break; 

//     // Visual: Mark processing (if not Start)
//     if (cell !== 5) {
//         grid[r][c] = 3; // 3 = Active Color
//     }

//     // Neighbors
//     for (let i = 0; i < 4; i++) {
//         let nr = r + dr[i];
//         let nc = c + dc[i];
//         let sym = arrows[i];

//         if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) {
//             let nextVal = grid[nr][nc];
            
//             // Skip visual markers (arrows, visited)
//             if (typeof nextVal === 'string' || nextVal === 3) continue;

//             // Get Weight (if Goal 9, cost is 1, else use value)
//             let weight = (nextVal === 9 || nextVal === 5) ? 1 : nextVal;

//             if (d + weight < dist[nr][nc]) {
//                 dist[nr][nc] = d + weight;
//                 pq.push({c: dist[nr][nc], r: nr, col: nc});
                
//                 // Visual Path
//                 if (grid[r][c] !== 5) {
//                     grid[r][c] = sym; 
//                 }
//             }
//         }
//     }
// }`
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

//     // Auto-play Loop
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
//         setMobileTab('visualizer'); // Switch tab

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
//             const msg = error.response?.data?.message || 'Execution failed.';
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
            
//             {/* Header */}
//             <div className="h-14 border-b border-gray-800 flex items-center justify-between px-2 md:px-4 bg-[#161b22] shrink-0 gap-2">
//                 <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded-lg group text-sm font-medium">
//                     <ArrowLeft size={16} />
//                     <span className="hidden md:inline">Dashboard</span>
//                 </button>

//                 {/* Mobile Tabs */}
//                 <div className="flex lg:hidden bg-gray-800 rounded-lg p-1">
//                     <button onClick={() => setMobileTab('editor')} className={`px-3 py-1.5 text-xs font-bold rounded ${mobileTab === 'editor' ? 'bg-[#0d1117] text-white' : 'text-gray-400'}`}>Code</button>
//                     <button onClick={() => setMobileTab('visualizer')} className={`px-3 py-1.5 text-xs font-bold rounded ${mobileTab === 'visualizer' ? 'bg-[#0d1117] text-blue-400' : 'text-gray-400'}`}>Visualizer</button>
//                 </div>

//                 <div className="hidden md:flex items-center gap-3">
//                     <div className="flex items-center gap-2 text-green-400">
//                         <Eye size={18} />
//                         <h1 className="font-bold text-lg tracking-tight">Code Visualizer</h1>
//                     </div>
//                     <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">BETA</span>
//                 </div>

//                 <div className="relative">
//                     <button onClick={() => setShowExamples(!showExamples)} className="flex items-center gap-2 text-gray-400 hover:text-white text-xs md:text-sm bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
//                         <Code2 size={16} />
//                         <span className="hidden sm:inline">Examples</span>
//                     </button>
//                     {showExamples && (
//                         <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-lg shadow-2xl py-2 w-48 z-50">
//                             {Object.keys(EXAMPLES).map(key => (
//                                 <button key={key} onClick={() => loadExample(key)} className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-300 capitalize">
//                                     {key.replace(/([A-Z])/g, ' $1').trim()}
//                                 </button>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Content */}
//             <div className="flex-1 flex overflow-hidden min-h-0 relative">
//                 <div className={`flex-col min-h-0 bg-[#0d1117] border-r border-gray-800 lg:flex lg:w-1/2 ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'}`}>
//                     <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 justify-between">
//                         <span className="text-xs font-mono text-gray-500 uppercase">Editor</span>
//                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//                     </div>
//                     <div className="flex-1 overflow-hidden">
//                         <CodePanel code={code} setCode={setCode} activeLine={trace[currentStep]?.line} />
//                     </div>
//                 </div>

//                 <div className={`bg-[#010409] relative flex-col min-h-0 lg:flex lg:w-1/2 ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'}`}>
//                     <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 justify-between">
//                         <span className="text-xs font-mono text-gray-500 uppercase">
//                             Output {trace.length > 0 && `(Step ${currentStep + 1}/${trace.length})`}
//                         </span>
//                     </div>
//                     {loading && (
//                         <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/95">
//                             <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
//                             <span className="text-gray-400 font-mono text-sm animate-pulse">Tracing execution...</span>
//                         </div>
//                     )}
//                     <VizCanvas variables={trace[currentStep]?.variables} />
//                 </div>
//             </div>

//             {/* Footer */}
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













import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Code2, Eye, Layout, Play } from 'lucide-react';

import Navbar from '../components/Navbar'; 
import CodePanel from '../components/Visualizer/CodePanel';
import VizCanvas from '../components/Visualizer/VizCanvas';
import ControlBar from '../components/Visualizer/ControlBar';
import api from '../api.js';
import toast from 'react-hot-toast';

// --- EXAMPLE ALGORITHMS ---
const EXAMPLES = {
    bubbleSort: `// Bubble Sort Visualization
let arr = [64, 34, 25, 12, 22, 11, 90];
for(let i = 0; i < arr.length; i++) {
  for(let j = 0; j < arr.length - i - 1; j++) {
    if(arr[j] > arr[j+1]) {
      let temp = arr[j];
      arr[j] = arr[j+1];
      arr[j+1] = temp;
    }
  }
}`,
    binaryTree: `// Binary Search Tree
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
root.left.right = new Node(40);`,
    linkedList: `// Linked List
class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}
let head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head.next.next.next = new Node(4);`,
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
    stack: `// Stack Data Structure (LIFO)
// We use an array 'myStack' and a 'top' pointer
let myStack = [];
let top = -1; 

// 1. PUSH Operation
function push(val) {
    top++;
    myStack[top] = val;
}

// 2. POP Operation
function pop() {
    if (top >= 0) {
        myStack.pop();
        top--;
    }
}

// --- Execution ---
push(10);
push(20);
push(30);
pop();     // Removes 30
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

    // ✅ FIXED: Robust Array-Based Dijkstra
    dijkstra: `// Dijkstra's Algorithm: Neon Pathfinding
// 1 = Road (Fast), 50 = Mud (Slow)

// 1. Initialize Grid (Weights)
let grid = [
  [1,  1,  1,  1,  1],
  [99, 99, 99, 99, 1], // Wall of 99s
  [1,  1,  1,  50, 1], // Mud pit (50)
  [1,  50, 1,  1,  1]
];

// 2. Set Start/Goal Positions (Indices)
let startR = 0, startC = 0;
let endR = 3, endC = 4;

let rows = 4, cols = 5;

// Distance Table (Use 9999 instead of Infinity)
let dist = [];
for(let i=0; i<rows; i++) {
    let row = [];
    for(let j=0; j<cols; j++) row.push(9999);
    dist.push(row);
}
dist[startR][startC] = 0;

// Directions: Right, Down, Left, Up
let moves = [
    [0, 1, '→'], [1, 0, '↓'], [0, -1, '←'], [-1, 0, '↑']
];

// Priority Queue: [cost, r, c]
// Using Array is safer for tracing than Objects
let pq = [[0, startR, startC]];

// Mark Start visual
grid[startR][startC] = 'S';
grid[endR][endC] = 'G';

while (pq.length > 0) {
    // 1. Sort to simulate Priority Queue
    pq.sort((a, b) => a[0] - b[0]);
    
    // 2. Pop element
    let curr = pq.shift();
    let d = curr[0];
    let r = curr[1];
    let c = curr[2];

    let cell = grid[r][c];
    if (cell === 'G') break; // Goal Found

    // Visual: Mark current node (thinking...)
    if (cell !== 'S') grid[r][c] = '*';

    // 3. Explore Neighbors
    for (let i = 0; i < 4; i++) {
        let nr = r + moves[i][0];
        let nc = c + moves[i][1];
        let arrow = moves[i][2];

        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) {
            let nextVal = grid[nr][nc];
            
            // SKIP if it's a visual marker (Arrow/String)
            if (typeof nextVal === 'string' && nextVal !== 'G') continue;

            // Calculate Weight
            let weight = (nextVal === 'G') ? 1 : nextVal;

            // Relaxation Step
            if (d + weight < dist[nr][nc]) {
                dist[nr][nc] = d + weight;
                pq.push([dist[nr][nc], nr, nc]);
                
                // Visual: Leave Path Arrow
                if (grid[r][c] !== 'S') {
                    grid[r][c] = arrow;
                }
            }
        }
    }
}`
};

const Visualizer = () => {
    const navigate = useNavigate();
    
    const [code, setCode] = useState(EXAMPLES.bubbleSort);
    const [trace, setTrace] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    
    // Mobile Tab State
    const [mobileTab, setMobileTab] = useState('editor'); 
    
    const playbackSpeed = useRef(800);

    // Auto-play game loop
    useEffect(() => {
        let interval;
        if (isPlaying && currentStep < trace.length - 1) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= trace.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, playbackSpeed.current);
        } else if (currentStep >= trace.length - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, trace.length]);

    const handleRun = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first!');
            return;
        }

        setLoading(true);
        setIsPlaying(false);
        setCurrentStep(0);
        
        // Mobile: Auto switch
        setMobileTab('visualizer');

        try {
            const { data } = await api.post('/visualize/run', { 
                code, 
                language: 'javascript' 
            });
            
            if (data.success && data.trace && data.trace.length > 0) {
                setTrace(data.trace);
                toast.success(`Traced ${data.trace.length} execution steps!`);
            } else {
                toast.error('No data to visualize. Check your code logic.');
                setTrace([]);
            }
        } catch (error) {
            console.error('Visualization error:', error);
            const msg = error.response?.data?.message || 'Execution failed. Check your code.';
            toast.error(msg);
            setTrace([]);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = (key) => {
        setCode(EXAMPLES[key]);
        setShowExamples(false);
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('editor'); 
        toast.success('Example loaded!');
    };

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
            <Navbar />
            
            {/* --- HEADER --- */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-2 md:px-4 bg-[#161b22] shrink-0 gap-2">
                
                {/* 1. Back Button */}
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-2 md:px-3 py-2 rounded-lg group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden md:inline">Dashboard</span>
                </button>

                {/* 2. Mobile Tab Switcher */}
                <div className="flex lg:hidden bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setMobileTab('editor')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            mobileTab === 'editor' ? 'bg-[#0d1117] text-white shadow' : 'text-gray-400'
                        }`}
                    >
                        Code
                    </button>
                    <button
                        onClick={() => setMobileTab('visualizer')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            mobileTab === 'visualizer' ? 'bg-[#0d1117] text-blue-400 shadow' : 'text-gray-400'
                        }`}
                    >
                        Visualizer
                    </button>
                </div>

                {/* 3. Title */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-green-400">
                        <Eye size={18} />
                        <h1 className="font-bold text-lg tracking-tight">Code Visualizer</h1>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">BETA</span>
                </div>

                {/* 4. Examples Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExamples(!showExamples)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white text-xs md:text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors border border-gray-700"
                    >
                        <Code2 size={16} />
                        <span className="hidden sm:inline">Examples</span>
                    </button>
                    
                    {showExamples && (
                        <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-lg shadow-2xl py-2 w-48 z-50">
                            {Object.keys(EXAMPLES).map(key => (
                                <button
                                    key={key}
                                    onClick={() => loadExample(key)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors capitalize"
                                >
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
                
                {/* LEFT: CODE EDITOR */}
                <div className={`
                    flex-col min-h-0 bg-[#0d1117] border-r border-gray-800
                    ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Editor</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-500">JS</span>
                        </div>
                    </div>
                    
                    {/* Code Panel */}
                    <div className="flex-1 overflow-hidden">
                        <CodePanel 
                            code={code} 
                            setCode={setCode} 
                            activeLine={trace[currentStep]?.line} 
                        />
                    </div>
                </div>

                {/* RIGHT: VISUALIZATION CANVAS */}
                <div className={`
                    bg-[#010409] relative flex-col min-h-0
                    ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0 justify-between">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                            Output {trace.length > 0 && `(Step ${currentStep + 1}/${trace.length})`}
                        </span>
                        <span className="lg:hidden text-[10px] text-gray-600">
                            {isPlaying ? "Playing..." : "Paused"}
                        </span>
                    </div>

                    {loading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]/95 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
                            <span className="text-gray-400 font-mono text-sm animate-pulse">Tracing execution...</span>
                        </div>
                    )}
                    
                    <VizCanvas variables={trace[currentStep]?.variables} />
                </div>
            </div>

            {/* --- BOTTOM CONTROL BAR --- */}
            <div className="h-auto min-h-[5rem] border-t border-gray-800 bg-[#161b22] px-4 py-2 shrink-0 z-10">
                <ControlBar 
                    totalSteps={trace.length} 
                    currentStep={currentStep} 
                    setCurrentStep={setCurrentStep}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    onRun={handleRun}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default Visualizer;