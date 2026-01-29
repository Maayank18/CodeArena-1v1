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
    // Note: Graph/DFS example temporarily commented out or removed as per request to remove GraphViz logic
    /* dfsMaze: `...`, 
    */

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

// ✅ FIXED: PROFESSIONAL ITERATIVE CONSTRUCTION
    // This method guarantees a single, complete list visualization
    doublyLinkedList: `// Doubly Linked List (Iterative Construction)
class Node {
    constructor(val) {
        this.val = val;
        this.prev = null;
        this.next = null;
    }
}

// 1. Initialize Head
let head = new Node(10);
let current = head;

// 2. Data to insert
const values = [20, 30, 40];

// 3. Loop to build list dynamically
for (let i = 0; i < values.length; i++) {
    let newNode = new Node(values[i]);
    
    // Link Forward
    current.next = newNode;
    
    // Link Backward
    newNode.prev = current;
    
    // Move Pointer
    current = newNode;
}

// 'head' now points to the complete chain: 10 <-> 20 <-> 30 <-> 40`,

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
    const [code, setCode] = useState(EXAMPLES.bubbleSort); // Default is Bubble Sort
    const [trace, setTrace] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'visualizer'

    // --- PLAYBACK ENGINE ---
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
    }, [isPlaying, trace.length]);

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

    // --- API & EXECUTION ---
    // ✅ Reusable execution function
    const executeCode = async (codeToRun) => {
        if (!codeToRun.trim()) return;

        setLoading(true);
        stop(); // Stop any running playback
        
        // Reset state
        setTrace([]);
        setCurrentStep(0);

        try {
            const { data } = await api.post('/visualize/run', { 
                code: codeToRun, 
                language: 'javascript' 
            });
            
            if (data.success && data.trace && data.trace.length > 0) {
                setTrace(data.trace);
                // toast.success is suppressed for auto-runs to avoid spamming the user on load
            } else {
                toast.error('No steps generated. Check your logic.');
            }
        } catch (error) {
            console.error('Viz Error:', error);
            const msg = error.response?.data?.message || 'Execution failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ✅ AUTO-RUN ON MOUNT
    // This fixes the "Black Screen" issue by running the default example immediately
    useEffect(() => {
        executeCode(EXAMPLES.bubbleSort);
    }, []);

    // Manual Run Handler
    const handleRun = () => {
        if (!code.trim()) return toast.error('Please write some code first!');
        setMobileTab('visualizer'); // Switch tab on mobile
        executeCode(code);
        toast.success('Visualization started!');
    };

    const loadExample = (key) => {
        stop();
        const newCode = EXAMPLES[key];
        setCode(newCode);
        setShowExamples(false);
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('editor');
        toast.success(`Loaded ${key.replace(/([A-Z])/g, ' $1')} example`);
    };

    // --- MEMOIZED RENDER PROPS ---
    const currentVariables = useMemo(() => trace[currentStep]?.variables || {}, [trace, currentStep]);
    const currentLine = useMemo(() => trace[currentStep]?.line || 0, [trace, currentStep]);

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
            <Navbar />
            
            {/* --- TOP BAR --- */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22] shrink-0 z-20 relative">
                
                {/* 1. Left: Back Button */}
                <div className="flex items-center z-10">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* 2. Center: Branding & BETA Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {/* Main Title */}
                        <h1 className="font-extrabold text-xl tracking-tight leading-none text-white hidden md:block">
                            Code<span className="text-green-500">Arena</span><span className="text-white">1v1</span>
                        </h1>
                        <h1 className="font-extrabold text-lg tracking-tight leading-none text-white md:hidden">
                            CA<span className="text-green-500">1v1</span>
                        </h1>
                        
                        {/* BETA Badge */}
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                            BETA
                        </span>
                    </div>
                </div>

                {/* 3. Right: Examples & Mobile Tabs */}
                <div className="flex items-center gap-3 z-10">
                    
                    {/* Mobile Tabs Switcher */}
                    <div className="flex lg:hidden bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
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

                    {/* Examples Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-2 text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-3 py-2 rounded-lg border border-gray-700 transition-all shadow-sm"
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
                />
            </div>
        </div>
    );
};

export default Visualizer;