// // src/pages/Visualizer.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom'; // ✅ Added for navigation
// import { ArrowLeft, Loader2 } from 'lucide-react'; // ✅ Added ArrowLeft icon

// import Navbar from '../components/Navbar'; 
// import CodePanel from '../components/Visualizer/CodePanel';
// import VizCanvas from '../components/Visualizer/VizCanvas';
// import ControlBar from '../components/Visualizer/ControlBar';
// import api from '../api.js'; // ✅ Checked path: src/utils/api.js
// import toast from 'react-hot-toast';

// const Visualizer = () => {
//     const navigate = useNavigate(); // ✅ Hook for back button
    
//     // Default code: Bubble Sort (Great for showing off the visualizer)
//     const [code, setCode] = useState('// Write JS code here\nlet arr = [5, 2, 8, 1];\n// Sort the array\nfor(let i=0; i<arr.length; i++) {\n  for(let j=0; j<arr.length-i-1; j++) {\n    if(arr[j] > arr[j+1]) {\n      let temp = arr[j];\n      arr[j] = arr[j+1];\n      arr[j+1] = temp;\n    }\n  }\n}');
    
//     const [trace, setTrace] = useState([]);
//     const [currentStep, setCurrentStep] = useState(0);
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const playbackSpeed = useRef(800); // Default speed (ms)

//     // THE "GAME LOOP" for Auto-Play
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
//         } else {
//             setIsPlaying(false);
//         }
//         return () => clearInterval(interval);
//     }, [isPlaying, currentStep, trace.length]);

//     const handleRun = async () => {
//         setLoading(true);
//         setIsPlaying(false);
//         try {
//             const { data } = await api.post('/visualize/run', { code, language: 'javascript' });
//             if (data.success) {
//                 setTrace(data.trace);
//                 setCurrentStep(0);
//                 toast.success("Visualization Ready!");
//             }
//         } catch (error) {
//             console.error(error);
//             toast.error(error.response?.data?.message || "Execution Failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
//             <Navbar />
            
//             {/* ✅ NEW: Navigation Header (Back Button) */}
//             <div className="h-12 border-b border-gray-800 flex items-center px-4 bg-[#161b22] shrink-0">
//                 <button 
//                     onClick={() => navigate('/dashboard')} 
//                     className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-3 py-1.5 rounded-lg"
//                 >
//                     <ArrowLeft size={16} />
//                     <span>Back to Dashboard</span>
//                 </button>
//             </div>

//             {/* MAIN CONTENT AREA */}
//             <div className="flex-1 flex overflow-hidden min-h-0">
//                 {/* LEFT: Code Editor */}
//                 <div className="w-1/2 border-r border-gray-800 flex flex-col min-h-0">
//                     <CodePanel 
//                         code={code} 
//                         setCode={setCode} 
//                         activeLine={trace[currentStep]?.line} 
//                     />
//                 </div>

//                 {/* RIGHT: Visualization Canvas */}
//                 <div className="w-1/2 bg-[#010409] relative flex flex-col min-h-0">
//                     {loading && (
//                         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
//                             <Loader2 className="animate-spin text-green-500 mb-2" size={40} />
//                             <span className="text-gray-400 font-mono text-sm animate-pulse">Tracing Execution...</span>
//                         </div>
//                     )}
                    
//                     <VizCanvas 
//                         variables={trace[currentStep]?.variables} 
//                     />
//                 </div>
//             </div>

//             {/* BOTTOM: Controls */}
//             <div className="h-20 border-t border-gray-800 bg-[#161b22] px-6 shrink-0 z-10">
//                 <ControlBar 
//                     totalSteps={trace.length} 
//                     currentStep={currentStep} 
//                     setCurrentStep={setCurrentStep}
//                     isPlaying={isPlaying}
//                     setIsPlaying={setIsPlaying}
//                     onRun={handleRun}
//                 />
//             </div>
//         </div>
//     );
// };

// export default Visualizer;





















// src/pages/Visualizer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Code2, Eye } from 'lucide-react';

import Navbar from '../components/Navbar'; 
import CodePanel from '../components/Visualizer/CodePanel';
import VizCanvas from '../components/Visualizer/VizCanvas';
import ControlBar from '../components/Visualizer/ControlBar';
import api from '../api.js';
import toast from 'react-hot-toast';

// Sample algorithms for quick testing
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
        
        try {
            const { data } = await api.post('/visualize/run', { 
                code, 
                language: 'javascript' 
            });
            
            if (data.success && data.trace && data.trace.length > 0) {
                setTrace(data.trace);
                toast.success(`Traced ${data.trace.length} execution steps!`);
            } else {
                toast.error('No data to visualize. Try adding variables!');
                setTrace([]);
            }
        } catch (error) {
            console.error('Visualization error:', error);
            toast.error(error.response?.data?.message || 'Execution failed. Check your code.');
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
        toast.success('Example loaded!');
    };

    return (
        <div className="h-screen bg-[#0d1117] flex flex-col text-white overflow-hidden font-sans">
            <Navbar />
            
            {/* Navigation + Title Bar */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#161b22] shrink-0">
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-3 py-2 rounded-lg group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-green-400">
                        <Eye size={18} />
                        <h1 className="font-bold text-lg tracking-tight">Code Visualizer</h1>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">BETA</span>
                </div>

                {/* Example Selector */}
                <div className="relative">
                    <button 
                        onClick={() => setShowExamples(!showExamples)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-700"
                    >
                        <Code2 size={16} />
                        <span>Examples</span>
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

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left: Code Editor */}
                <div className="w-1/2 border-r border-gray-800 flex flex-col min-h-0 bg-[#0d1117]">
                    <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Editor</span>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-500">JavaScript</span>
                        </div>
                    </div>
                    <CodePanel 
                        code={code} 
                        setCode={setCode} 
                        activeLine={trace[currentStep]?.line} 
                    />
                </div>

                {/* Right: Visualization Canvas */}
                <div className="w-1/2 bg-[#010409] relative flex flex-col min-h-0">
                    <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 shrink-0">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                            Visualization {trace.length > 0 && `(Step ${currentStep + 1}/${trace.length})`}
                        </span>
                    </div>

                    {loading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/95 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
                            <span className="text-gray-400 font-mono text-sm animate-pulse">Tracing execution...</span>
                            <span className="text-gray-600 text-xs mt-2">Analyzing code flow</span>
                        </div>
                    )}
                    
                    <VizCanvas variables={trace[currentStep]?.variables} />
                </div>
            </div>

            {/* Bottom: Control Bar */}
            <div className="h-20 border-t border-gray-800 bg-[#161b22] px-6 shrink-0 z-10">
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