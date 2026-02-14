// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// // ✅ ADDED: AlertTriangle for error display
// import { ArrowLeft, Loader2, Code2, Eye, Play, Pause, RotateCcw, Settings, AlertTriangle } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- COMPONENTS ---
// import Navbar from '../components/Navbar'; 
// import CodePanel from '../components/Visualizer/CodePanel';
// import VizCanvas from '../components/Visualizer/VizCanvas';
// import ControlBar from '../components/Visualizer/ControlBar';
// import api from '../api.js';

// // --- ALGORITHM EXAMPLES ---
// const EXAMPLES = {
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

//     doublyLinkedList: `// Doubly Linked List (Professional OOP)
// class Node {
//     constructor(val) {
//         this.val = val;
//         this.prev = null;
//         this.next = null;
//     }
// }

// class DoublyLinkedList {
//     constructor() {
//         this.head = null;
//         this.tail = null;
//     }

//     push(val) {
//         const newNode = new Node(val);
//         if (!this.head) {
//             this.head = newNode;
//             this.tail = newNode;
//         } else {
//             this.tail.next = newNode;
//             newNode.prev = this.tail;
//             this.tail = newNode;
//         }
//     }
// }

// // Execution: Only 'list' exists in global scope
// const list = new DoublyLinkedList();

// list.push(10); // Adds 10
// list.push(20); // Adds 20 <-> 10
// list.push(30); // Adds 30 <-> 20
// list.push(40); // Adds 40 <-> 30`,

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
//     const [code, setCode] = useState(EXAMPLES.bubbleSort); 
//     const [trace, setTrace] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [showExamples, setShowExamples] = useState(false);
//     const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'visualizer'

//     // --- PLAYBACK ENGINE ---
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
//     }, [isPlaying, trace.length]);

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

//     // --- API & EXECUTION ---
//     const executeCode = async (codeToRun) => {
//         if (!codeToRun.trim()) return;

//         setLoading(true);
//         stop(); // Stop any running playback
        
//         // Reset state
//         setTrace([]);
//         setCurrentStep(0);

//         try {
//             const { data } = await api.post('/visualize/run', { 
//                 code: codeToRun, 
//                 language: 'javascript' 
//             });
            
//             if (data.success && data.trace && data.trace.length > 0) {
//                 setTrace(data.trace);
//                 // No toast on success to allow smooth auto-runs
//             } else {
//                 toast.error('No steps generated. Check your logic.');
//             }
//         } catch (error) {
//             console.error('Viz Error:', error);
//             const msg = error.response?.data?.message || 'Execution failed';
            
//             // ✅ IMPROVED ERROR HANDLING:
//             // Instead of just a toast, we create a fake trace step with the error
//             // so it renders in the main view.
//             setTrace([{ 
//                 line: 0, 
//                 error: msg, 
//                 type: 'error',
//                 variables: {} // Ensure variables is defined
//             }]);
            
//             toast.error(msg);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ AUTO-RUN ON MOUNT
//     useEffect(() => {
//         executeCode(EXAMPLES.bubbleSort);
//     }, []);

//     // Manual Run Handler
//     const handleRun = () => {
//         if (!code.trim()) return toast.error('Please write some code first!');
//         setMobileTab('visualizer'); 
//         executeCode(code);
//         toast.success('Visualization started!');
//     };

//     const loadExample = (key) => {
//         stop();
//         const newCode = EXAMPLES[key];
//         setCode(newCode);
//         setShowExamples(false);
//         setTrace([]);
//         setCurrentStep(0);
//         setMobileTab('editor');
//         toast.success(`Loaded ${key.replace(/([A-Z])/g, ' $1')} example`);
//     };

//     // --- MEMOIZED RENDER PROPS (OPTIMIZED) ---
//     // ✅ FIX: Safely access current frame to prevent crashes
//     const currentFrame = trace[currentStep];
//     const currentVariables = useMemo(() => currentFrame?.variables || {}, [currentFrame]);
//     const currentLine = useMemo(() => currentFrame?.line || 0, [currentFrame]);
    
//     // ✅ FIX: Extract Error State
//     const executionError = useMemo(() => {
//         return currentFrame?.type === 'error' ? currentFrame.error : null;
//     }, [currentFrame]);

//     return (
//         <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
//             <Navbar />
            
//             {/* --- TOP BAR --- */}
//             <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22] shrink-0 z-20 relative">
                
//                 {/* 1. Left: Back Button */}
//                 <div className="flex items-center z-10">
//                     <button 
//                         onClick={() => navigate('/dashboard')} 
//                         className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
//                         title="Back to Dashboard"
//                     >
//                         <ArrowLeft size={20} />
//                     </button>
//                 </div>

//                 {/* 2. Center: Branding & BETA Badge */}
//                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
//                     <div className="flex items-center gap-2">
//                         {/* Main Title */}
//                         <h1 className="font-extrabold text-xl tracking-tight leading-none text-white hidden md:block">
//                             Code<span className="text-green-500">Arena</span><span className="text-white">1v1</span>
//                         </h1>
//                         <h1 className="font-extrabold text-lg tracking-tight leading-none text-white md:hidden">
//                             CA<span className="text-green-500">1v1</span>
//                         </h1>
                        
//                         {/* BETA Badge */}
//                         <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(74,222,128,0.1)]">
//                             BETA
//                         </span>
//                     </div>
//                 </div>

//                 {/* 3. Right: Examples & Mobile Tabs */}
//                 <div className="flex items-center gap-3 z-10">
                    
//                     {/* Mobile Tabs Switcher */}
//                     <div className="flex lg:hidden bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
//                         <button
//                             onClick={() => setMobileTab('editor')}
//                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
//                                 mobileTab === 'editor' ? 'bg-[#21262d] text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
//                             }`}
//                         >
//                             Code
//                         </button>
//                         <button
//                             onClick={() => setMobileTab('visualizer')}
//                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
//                                 mobileTab === 'visualizer' ? 'bg-[#21262d] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-300'
//                             }`}
//                         >
//                             View
//                         </button>
//                     </div>

//                     {/* Examples Dropdown */}
//                     <div className="relative">
//                         <button 
//                             onClick={() => setShowExamples(!showExamples)}
//                             className="flex items-center gap-2 text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-3 py-2 rounded-lg border border-gray-700 transition-all shadow-sm"
//                         >
//                             <Code2 size={16} className="text-gray-400" />
//                             <span className="hidden sm:inline">Examples</span>
//                         </button>
                        
//                         {showExamples && (
//                             <>
//                                 <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
//                                 <div className="absolute right-0 top-12 bg-[#1c2128] border border-gray-700 rounded-xl shadow-2xl py-2 w-64 z-50 overflow-hidden ring-1 ring-black/50">
//                                     <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#21262d]/50 mb-1 border-b border-gray-800">
//                                         Load Algorithm Preset
//                                     </div>
//                                     <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
//                                         {Object.keys(EXAMPLES).map(key => (
//                                             <button
//                                                 key={key}
//                                                 onClick={() => loadExample(key)}
//                                                 className="w-full text-left px-4 py-3 hover:bg-green-500/10 hover:text-green-400 text-sm text-gray-300 transition-colors flex items-center gap-3 border-b border-gray-800/50 last:border-0"
//                                             >
//                                                 <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-green-500 shrink-0"></div>
//                                                 <span className="truncate font-medium">
//                                                     {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
//                                                 </span>
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </>
//                         )}
//                     </div>
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
//                             <div className={`w-2 h-2 rounded-full ${trace.length > 0 && !executionError ? 'bg-green-500' : 'bg-gray-600'}`} />
//                             <span>{executionError ? 'Error Detected' : 'Memory State'}</span>
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
                    
//                     {/* ✅ FIX: ERROR OVERLAY */}
//                     {executionError ? (
//                         <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in select-none">
//                             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
//                                 <AlertTriangle size={32} className="text-red-500" />
//                             </div>
//                             <h3 className="text-xl font-bold text-white mb-2">Execution Error</h3>
//                             <p className="text-red-400 font-mono text-sm bg-red-900/10 px-4 py-3 rounded-lg border border-red-900/30 max-w-md">
//                                 {executionError}
//                             </p>
//                             <button 
//                                 onClick={() => loadExample('bubbleSort')}
//                                 className="mt-6 text-xs text-gray-500 hover:text-white underline"
//                             >
//                                 Reset to Default Example
//                             </button>
//                         </div>
//                     ) : (
//                         /* The Canvas */
//                         <VizCanvas variables={currentVariables} />
//                     )}
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
//                 />
//             </div>
//         </div>
//     );
// };

// export default Visualizer;




































// FILE: frontend/src/pages/Visualizer.jsx
// PRODUCTION-OPTIMIZED VERSION - MODERN UI WITH THEME SUPPORT
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Loader2, Code2, Play, Pause, RotateCcw, 
    AlertTriangle, Sparkles, Zap, ChevronDown 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import Navbar from '../components/Navbar'; 
import CodePanel from '../components/Visualizer/CodePanel';
import VizCanvas from '../components/Visualizer/VizCanvas';
import ControlBar from '../components/Visualizer/ControlBar';
import api from '../api.js';

// ✅ ALGORITHM EXAMPLES
const EXAMPLES = {
    bubbleSort: {
        name: 'Bubble Sort',
        icon: '🔄',
        category: 'Sorting',
        code: `// Bubble Sort Visualization
let arr = [64, 34, 25, 12, 22, 11, 90];
for(let i = 0; i < arr.length; i++) {
  for(let j = 0; j < arr.length - i - 1; j++) {
    if(arr[j] > arr[j+1]) {
      let temp = arr[j];
      arr[j] = arr[j+1];
      arr[j+1] = temp;
    }
  }
}`
    },
    binaryTree: {
        name: 'Binary Tree',
        icon: '🌳',
        category: 'Trees',
        code: `// Binary Search Tree
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
root.right.right = new Node(80);`
    },
    linkedList: {
        name: 'Linked List',
        icon: '🔗',
        category: 'Lists',
        code: `// Linked List Creation
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
head.next.next.next.next = head.next;`
    },
    doublyLinkedList: {
        name: 'Doubly Linked List',
        icon: '⛓️',
        category: 'Lists',
        code: `// Doubly Linked List
class Node {
    constructor(val) {
        this.val = val;
        this.prev = null;
        this.next = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    push(val) {
        const newNode = new Node(val);
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
        }
    }
}

const list = new DoublyLinkedList();
list.push(10);
list.push(20);
list.push(30);
list.push(40);`
    },
    matrix: {
        name: '2D Matrix',
        icon: '⬜',
        category: 'Arrays',
        code: `// 2D Matrix Traversal
let matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];
let i = 0, j = 0;
for(i = 0; i < matrix.length; i++) {
  for(j = 0; j < matrix[i].length; j++) {
    matrix[i][j] *= 2;
  }
}`
    },
    stack: {
        name: 'Stack (LIFO)',
        icon: '📚',
        category: 'Stacks & Queues',
        code: `// Stack Implementation
let stack = [];
let top = -1;

function push(val) {
  top++;
  stack[top] = val;
}

function pop() {
  if (top >= 0) {
    stack.pop();
    top--;
  }
}

push(10);
push(20);
push(30);
pop();
push(40);`
    },
    queue: {
        name: 'Queue (FIFO)',
        icon: '➡️',
        category: 'Stacks & Queues',
        code: `// Queue Implementation
let myQueue = [];

function enqueue(val) {
    myQueue.push(val);
}

function dequeue() {
    if (myQueue.length > 0) {
        myQueue.shift();
    }
}

enqueue(10);
enqueue(20);
enqueue(30);
dequeue();
dequeue();
enqueue(40);
enqueue(50);`
    },
};

const Visualizer = () => {
    const navigate = useNavigate();
    
    // ✅ STATE
    const [code, setCode] = useState(EXAMPLES.bubbleSort.code); 
    const [trace, setTrace] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [mobileTab, setMobileTab] = useState('editor');

    // ✅ PLAYBACK ENGINE
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef(null);
    const speedRef = useRef(800);
    
    // ✅ Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // ✅ PLAYBACK HEARTBEAT
    useEffect(() => {
        if (isPlaying && trace.length > 0) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev >= trace.length - 1) {
                        stop();
                        return prev;
                    }
                    return prev + 1;
                });
            }, speedRef.current);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, trace.length]);

    // ✅ PLAYBACK CONTROLS
    const stop = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setIsPlaying(false);
    }, []);

    const play = useCallback(() => {
        if (currentStep >= trace.length - 1) {
            setCurrentStep(0);
        }
        setIsPlaying(true);
    }, [currentStep, trace.length]);

    // ✅ CODE EXECUTION
    const executeCode = useCallback(async (codeToRun) => {
        if (!codeToRun.trim()) return;

        setLoading(true);
        stop();
        setTrace([]);
        setCurrentStep(0);

        try {
            const { data } = await api.post('/visualize/run', { 
                code: codeToRun, 
                language: 'javascript' 
            });
            
            if (data.success && data.trace && data.trace.length > 0) {
                setTrace(data.trace);
            } else {
                toast.error('No steps generated. Check your code.');
            }
        } catch (error) {
            console.error('[VISUALIZER] Error:', error);
            const msg = error.response?.data?.message || 'Execution failed';
            
            setTrace([{ 
                line: 0, 
                error: msg, 
                type: 'error',
                variables: {}
            }]);
            
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [stop]);

    // ✅ AUTO-RUN ON MOUNT
    useEffect(() => {
        executeCode(EXAMPLES.bubbleSort.code);
    }, [executeCode]);

    // ✅ MANUAL RUN
    const handleRun = useCallback(() => {
        if (!code.trim()) {
            return toast.error('Please write some code first!');
        }
        setMobileTab('visualizer'); 
        executeCode(code);
        toast.success('Visualizing...', { icon: '✨', duration: 2000 });
    }, [code, executeCode]);

    // ✅ LOAD EXAMPLE
    const loadExample = useCallback((key) => {
        stop();
        const newCode = EXAMPLES[key].code;
        setCode(newCode);
        setShowExamples(false);
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('editor');
        toast.success(`Loaded ${EXAMPLES[key].name}`, { icon: EXAMPLES[key].icon });
    }, [stop]);

    // ✅ MEMOIZED VALUES
    const currentFrame = useMemo(() => trace[currentStep], [trace, currentStep]);
    const currentVariables = useMemo(() => currentFrame?.variables || {}, [currentFrame]);
    const currentLine = useMemo(() => currentFrame?.line || 0, [currentFrame]);
    const executionError = useMemo(() => {
        return currentFrame?.type === 'error' ? currentFrame.error : null;
    }, [currentFrame]);

    // ✅ GROUP EXAMPLES BY CATEGORY
    const groupedExamples = useMemo(() => {
        const groups = {};
        Object.entries(EXAMPLES).forEach(([key, value]) => {
            if (!groups[value.category]) {
                groups[value.category] = [];
            }
            groups[value.category].push({ key, ...value });
        });
        return groups;
    }, []);

    return (
        <div className="h-screen bg-[var(--bg-primary)] flex flex-col text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-300">
            <Navbar />
            
            {/* ✅ TOP BAR - Modern Design */}
            <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 bg-[var(--bg-secondary)] shrink-0 z-20 relative shadow-lg">
                
                {/* Left: Back Button */}
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-lg transition-all group"
                    aria-label="Back to Dashboard"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden sm:inline text-sm font-medium">Back</span>
                </button>

                {/* Center: Branding */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Sparkles size={20} className="text-accent" />
                    <h1 className="font-extrabold text-lg sm:text-xl tracking-tight">
                        <span className="hidden sm:inline">Algorithm </span>
                        <span className="text-accent">Visualizer</span>
                    </h1>
                    <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/30 uppercase tracking-widest">
                        BETA
                    </span>
                </div>

                {/* Right: Mobile Tabs + Examples */}
                <div className="flex items-center gap-2">
                    
                    {/* Mobile View Switcher */}
                    <div className="flex lg:hidden bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border-color)]">
                        <button
                            onClick={() => setMobileTab('editor')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                mobileTab === 'editor' 
                                    ? 'bg-accent text-black shadow-sm' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setMobileTab('visualizer')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                mobileTab === 'visualizer' 
                                    ? 'bg-accent text-black shadow-sm' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <span className="hidden sm:inline">Visualizer</span>
                            <span className="sm:hidden">View</span>
                        </button>
                    </div>

                    {/* Examples Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-2 text-xs font-bold bg-[var(--bg-primary)] hover:bg-accent/10 text-[var(--text-primary)] px-3 py-2 rounded-lg border border-[var(--border-color)] hover:border-accent transition-all"
                        >
                            <Code2 size={16} className="text-accent" />
                            <span className="hidden sm:inline">Examples</span>
                            <ChevronDown size={14} className={`transition-transform ${showExamples ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showExamples && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
                                <div className="absolute right-0 top-14 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl w-80 z-50 overflow-hidden animate-fade-in">
                                    
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                                        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                            Algorithm Examples
                                        </h3>
                                    </div>
                                    
                                    {/* Categories */}
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {Object.entries(groupedExamples).map(([category, examples]) => (
                                            <div key={category}>
                                                <div className="px-4 py-2 bg-[var(--bg-primary)]/50 border-b border-[var(--border-color)]/50">
                                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {category}
                                                    </span>
                                                </div>
                                                {examples.map(({ key, name, icon }) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => loadExample(key)}
                                                        className="w-full text-left px-4 py-3 hover:bg-accent/10 hover:text-accent text-sm text-[var(--text-primary)] transition-colors flex items-center gap-3 border-b border-[var(--border-color)]/30 last:border-0 group"
                                                    >
                                                        <span className="text-xl group-hover:scale-110 transition-transform">
                                                            {icon}
                                                        </span>
                                                        <span className="font-medium">{name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ MAIN SPLIT VIEW */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
                
                {/* Left: CODE EDITOR */}
                <div className={`
                    flex-col min-h-0 border-r border-[var(--border-color)] bg-[var(--bg-primary)] relative
                    ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    {/* Editor Header */}
                    <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="ml-4 text-xs font-mono text-[var(--text-secondary)]">
                            editor.js
                        </span>
                    </div>
                    
                    <CodePanel 
                        code={code} 
                        setCode={setCode} 
                        activeLine={currentLine} 
                    />
                </div>

                {/* Right: VISUALIZATION */}
                <div className={`
                    flex-col relative min-h-0 bg-[var(--bg-primary)]
                    ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'} 
                    lg:flex lg:w-1/2
                `}>
                    {/* Canvas Header */}
                    <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-4 shrink-0 justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                trace.length > 0 && !executionError ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                            }`} />
                            <span className="text-xs font-mono text-[var(--text-secondary)]">
                                {executionError ? 'Error' : 'Memory State'}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                            {trace.length > 0 
                                ? `${currentStep + 1} / ${trace.length}`
                                : 'Ready'
                            }
                        </span>
                    </div>

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--bg-primary)]/90 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-accent mb-4" size={40} />
                            <span className="text-[var(--text-secondary)] font-mono text-sm animate-pulse">
                                Executing algorithm...
                            </span>
                        </div>
                    )}
                    
                    {/* Error Display */}
                    {executionError ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/30">
                                <AlertTriangle size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                                Execution Error
                            </h3>
                            <p className="text-red-400 font-mono text-sm bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/30 max-w-lg mb-6">
                                {executionError}
                            </p>
                            <button 
                                onClick={() => loadExample('bubbleSort')}
                                className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-accent/10 text-[var(--text-primary)] text-sm font-medium rounded-lg border border-[var(--border-color)] hover:border-accent transition-all"
                            >
                                Reset to Bubble Sort
                            </button>
                        </div>
                    ) : (
                        /* Canvas */
                        <VizCanvas variables={currentVariables} />
                    )}
                </div>
            </div>

            {/* ✅ CONTROL BAR */}
            <div className="h-auto min-h-[5rem] border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 shrink-0 z-20 shadow-2xl">
                <ControlBar 
                    totalSteps={trace.length} 
                    currentStep={currentStep} 
                    setCurrentStep={setCurrentStep}
                    isPlaying={isPlaying}
                    setIsPlaying={isPlaying ? stop : play}
                    onRun={handleRun}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default Visualizer;