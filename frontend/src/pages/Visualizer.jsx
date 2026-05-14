// FILE: frontend/src/pages/Visualizer.jsx
// FULLY OPTIMIZED — Bug fixes, dark/light theme, responsive layout, speed control
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Loader2, Code2, AlertTriangle,
    Sparkles, ChevronDown, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import Navbar from '../components/Navbar';
import CodePanel from '../components/Visualizer/CodePanel';
import VizCanvas from '../components/Visualizer/VizCanvas';
import ControlBar from '../components/Visualizer/ControlBar';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import TeaserModal from '../components/TeaserModal';

// ─── ALGORITHM EXAMPLES ──────────────────────────────────────────────────────
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
}`,
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
root.right.right = new Node(80);`,
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
head.next.next.next.next = head.next;`,
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
list.push(40);`,
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
}`,
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
push(40);`,
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
enqueue(50);`,
    },
};

// ─── SPEED OPTIONS ────────────────────────────────────────────────────────────
const SPEED_OPTIONS = [
    { label: '0.5×', ms: 1600 },
    { label: '1×',   ms: 800  },
    { label: '2×',   ms: 400  },
    { label: '4×',   ms: 200  },
];
const DEFAULT_SPEED_INDEX = 1; // 1× = 800ms

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Visualizer = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    
    // Auth state
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('codearena_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Logout handler
    const handleLogout = useCallback(() => {
        localStorage.removeItem('codearena_user');
        toast.success('Logged out successfully');
        navigate('/');
    }, [navigate]);

    // Auth check
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(storedUser);
        }
    }, [navigate]);

    // ── Core state ────────────────────────────────────────────────────────────
    const [code, setCode]               = useState(EXAMPLES.bubbleSort.code);
    const [trace, setTrace]             = useState([]);
    const [loading, setLoading]         = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [mobileTab, setMobileTab]     = useState('editor');

    // ── Theme ─────────────────────────────────────────────────────────────────
    // Reads the current theme from <html> or <body> class set by global theme system.
    // Falls back to local state if no global system is present.
    // ── Playback ──────────────────────────────────────────────────────────────
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [speedIndex, setSpeedIndex]   = useState(DEFAULT_SPEED_INDEX);
    const [showTeaserModal, setShowTeaserModal] = useState(false);

    const timerRef = useRef(null);

    // Derived speed ms — always reads latest via ref so interval stays fresh
    const speedMsRef = useRef(SPEED_OPTIONS[DEFAULT_SPEED_INDEX].ms);
    useEffect(() => {
        speedMsRef.current = SPEED_OPTIONS[speedIndex].ms;
    }, [speedIndex]);

    // Cleanup on unmount
    useEffect(() => () => { clearInterval(timerRef.current); }, []);

    // ── FIXED: Playback heartbeat — restarts cleanly when speed changes ────────
    useEffect(() => {
        clearInterval(timerRef.current);

        if (isPlaying && trace.length > 0) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= trace.length - 1) {
                        clearInterval(timerRef.current);
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, speedMsRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isPlaying, trace.length, speedIndex]); // ← speedIndex here triggers restart at new speed

    // ── FIXED: Clear, unambiguous playback controls ───────────────────────────
    const pause = useCallback(() => {
        clearInterval(timerRef.current);
        setIsPlaying(false);
    }, []);

    const play = useCallback(() => {
        setCurrentStep(prev => (prev >= trace.length - 1 ? 0 : prev));
        setIsPlaying(true);
    }, [trace.length]);

    // ── FIXED: Single toggle handler — no more prop mismatch ─────────────────
    const handlePlayPause = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, pause, play]);

    // ── Code execution ────────────────────────────────────────────────────────
    const executeCode = useCallback(async (codeToRun) => {
        if (!codeToRun.trim()) return;

        setLoading(true);
        pause();
        setTrace([]);
        setCurrentStep(0);

        try {
            const { data } = await api.post('/visualize/run', {
                code: codeToRun,
                language: 'javascript',
            });

            if (data.success && data.trace?.length > 0) {
                setTrace(data.trace);
            } else {
                toast.error('No steps generated. Check your code.');
            }
        } catch (error) {
            console.error('[VISUALIZER]', error);
            const msg = error.response?.data?.message || 'Execution failed';
            if (error.response?.status === 403 && error.response?.data?.code === 'TRIAL_EXPIRED') {
                setShowTeaserModal(true);
                return;
            }
            setTrace([{ line: 0, error: msg, type: 'error', variables: {} }]);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [pause]);

    // Auto-run on mount
    useEffect(() => {
        executeCode(EXAMPLES.bubbleSort.code);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRun = useCallback(() => {
        if (!code.trim()) return toast.error('Please write some code first!');
        setMobileTab('visualizer');
        executeCode(code);
        toast.success('Visualizing…', { icon: '✨', duration: 2000 });
    }, [code, executeCode]);

    const loadExample = useCallback((key) => {
        pause();
        setCode(EXAMPLES[key].code);
        setShowExamples(false);
        setTrace([]);
        setCurrentStep(0);
        setMobileTab('editor');
        toast.success(`Loaded ${EXAMPLES[key].name}`, { icon: EXAMPLES[key].icon });
    }, [pause]);

    // ── Derived values ────────────────────────────────────────────────────────
    const currentFrame     = useMemo(() => trace[currentStep],                  [trace, currentStep]);
    const currentVariables = useMemo(() => currentFrame?.variables || {},        [currentFrame]);
    const currentLine      = useMemo(() => currentFrame?.line || 0,              [currentFrame]);
    const executionError   = useMemo(() =>
        currentFrame?.type === 'error' ? currentFrame.error : null,             [currentFrame]);

    const groupedExamples = useMemo(() => {
        const groups = {};
        Object.entries(EXAMPLES).forEach(([key, val]) => {
            (groups[val.category] ??= []).push({ key, ...val });
        });
        return groups;
    }, []);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            // Don't fire when user is typing in the editor
            if (e.target.closest('.monaco-editor')) return;
            if (e.code === 'Space')       { e.preventDefault(); handlePlayPause(); }
            if (e.code === 'ArrowRight')  setCurrentStep(p => Math.min(trace.length - 1, p + 1));
            if (e.code === 'ArrowLeft')   setCurrentStep(p => Math.max(0, p - 1));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handlePlayPause, trace.length]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className="viz-root h-screen flex flex-col overflow-hidden font-sans transition-colors duration-300"
            data-theme={theme}
        >
            <TeaserModal 
                isOpen={showTeaserModal}
                onClose={() => setShowTeaserModal(false)}
                title="Trial Expired"
                message="You've used your free visualization! Upgrade to Pro to visualize endless algorithms and data structures."
            />
            {/* Inject scoped CSS variables for both themes */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .vz-bg-p { background: #0d1117; }
                .vz-bg-s { background: #161b22; }
                .vz-border { border-color: var(--vz-border); }
                .vz-text { color: var(--vz-text-primary); }
                .vz-muted { color: var(--vz-text-muted); }
                
                .vz-segmented-control {
                    display: flex;
                    padding: 2px;
                    border-radius: 8px;
                    background: var(--vz-bg-primary);
                    border: 1px solid var(--vz-border);
                }
                .vz-segmented-control button {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    transition: all 0.2s ease;
                }
                .vz-segmented-control button.active {
                    background: var(--vz-accent);
                    color: #fff;
                    box-shadow: 0 2px 6px var(--vz-accent-glow);
                }
                .vz-segmented-control button:not(.active) {
                    color: var(--vz-text-muted);
                }
                
                /* Responsive Visualization Cell Sizes */
                :root {
                    --vz-cell-size: 56px;
                    --vz-cell-font: 1.1rem;
                    --vz-stack-width: 96px;
                }
                @media (max-width: 640px) {
                    :root {
                        --vz-cell-size: 42px;
                        --vz-cell-font: 0.85rem;
                        --vz-stack-width: 80px;
                    }
                }
                @media (max-width: 400px) {
                    :root {
                        --vz-cell-size: 36px;
                        --vz-cell-font: 0.75rem;
                        --vz-stack-width: 70px;
                    }
                }
                
                .anim-dropdown { animation: fadeSlideIn 0.18s ease forwards; }
    `}</style>

            {/* ── NAVBAR (from parent project) ───────────────────────────── */}
            <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />

            {/* ── TOP BAR ────────────────────────────────────────────────── */}
            <TopBar
                theme={theme}
                toggleTheme={toggleTheme}
                mobileTab={mobileTab}
                setMobileTab={setMobileTab}
                showExamples={showExamples}
                setShowExamples={setShowExamples}
                groupedExamples={groupedExamples}
                loadExample={loadExample}
                navigate={navigate}
            />

            {/* ── MAIN SPLIT VIEW ────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative vz-bg-p">

                {/* LEFT — Code Editor */}
                <div
                    className={`
                        flex-col min-h-0 border-r vz-border vz-bg-p relative transition-all
                        ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'}
                        lg:flex lg:w-1/2
                    `}
                >
                    <PanelHeader title="editor.js" />
                    <CodePanel
                        code={code}
                        setCode={setCode}
                        activeLine={currentLine}
                        theme={theme}
                    />
                </div>

                {/* RIGHT — Visualization */}
                <div
                    className={`
                        flex-col relative min-h-0 vz-bg-p
                        ${mobileTab === 'visualizer' ? 'flex w-full' : 'hidden'}
                        lg:flex lg:w-1/2
                    `}
                >
                    <PanelHeader
                        title={executionError ? 'Error' : 'Memory State'}
                        right={
                            trace.length > 0
                                ? `${currentStep + 1} / ${trace.length}`
                                : 'Ready'
                        }
                        dot={trace.length > 0 && !executionError ? 'green' : 'gray'}
                    />

                    {/* Loading overlay */}
                    {loading && <LoadingOverlay />}

                    {/* Error state */}
                    {!loading && executionError ? (
                        <ErrorDisplay error={executionError} onReset={() => loadExample('bubbleSort')} />
                    ) : (
                        <VizCanvas variables={currentVariables} />
                    )}
                </div>
            </div>

            {/* ── CONTROL BAR ────────────────────────────────────────────── */}
            <div
                className="border-t vz-border vz-bg-s px-3 sm:px-5 py-3 shrink-0 z-20"
                style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.18)' }}
            >
                <ControlBar
                    totalSteps={trace.length}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}   // ✅ FIXED: clean prop name
                    onPause={pause}                 // ✅ FIXED: separate pause for scrubbing
                    onRun={handleRun}
                    loading={loading}
                    speedIndex={speedIndex}
                    onSpeedChange={setSpeedIndex}
                    speedOptions={SPEED_OPTIONS}
                />
            </div>
        </div>
    );
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const TopBar = ({
    theme, toggleTheme,
    mobileTab, setMobileTab,
    showExamples, setShowExamples,
    groupedExamples, loadExample, navigate,
}) => (
    <div
        className="h-14 sm:h-16 border-b vz-border vz-bg-s flex items-center px-2 sm:px-5 shrink-0 z-[100] relative gap-2 sm:gap-4"
        style={{ boxShadow: '0 1px 0 var(--vz-border)' }}
    >
        {/* Left — back */}
        <div className="flex-1 flex items-center">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-2 py-1.5 vz-muted
                           hover:vz-text rounded-lg transition-colors group
                           hover:bg-[var(--vz-bg-hover)] text-xs sm:text-sm font-medium"
                aria-label="Back to Dashboard"
            >
                <ArrowLeft size={17} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back</span>
            </button>
        </div>

        {/* Center — branding */}
        <div className="flex-[2] flex justify-center items-center gap-1.5 sm:gap-2 select-none overflow-hidden">
            <Sparkles size={16} className="shrink-0" style={{ color: 'var(--vz-accent)' }} />
            <span className="font-extrabold text-[11px] sm:text-lg tracking-tight vz-text truncate">
                <span className="hidden xs:inline">Algo </span>
                <span style={{ color: 'var(--vz-accent)' }}>Visualizer</span>
            </span>
            <span
                className="hidden md:inline-block text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded border uppercase tracking-widest shrink-0"
                style={{
                    background: 'var(--vz-badge-bg)',
                    color: 'var(--vz-accent)',
                    borderColor: 'var(--vz-accent-glow)',
                }}
            >
                BETA
            </span>
        </div>

        {/* Right — controls */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-3">
            
            {/* Examples dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowExamples(v => !v)}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-2
                               rounded-lg border vz-border vz-bg-p vz-muted
                               hover:vz-text hover:bg-[var(--vz-bg-hover)] transition-all shrink-0"
                >
                    <Code2 size={15} style={{ color: 'var(--vz-accent)' }} />
                    <span className="hidden sm:inline">Examples</span>
                    <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${showExamples ? 'rotate-180' : ''}`}
                    />
                </button>

                {showExamples && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExamples(false)} />
                        <div className="absolute right-0 mt-2 w-64 max-h-[70vh] overflow-y-auto 
                                      rounded-xl border vz-border vz-bg-s shadow-2xl z-50 p-2 anim-dropdown custom-scrollbar">
                            {Object.entries(groupedExamples).map(([cat, items]) => (
                                <div key={cat} className="mb-3 last:mb-0">
                                    <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest vz-muted mb-1 opacity-50">
                                        {cat}
                                    </div>
                                    <div className="space-y-1">
                                        {items.map(ex => (
                                            <button
                                                key={ex.key}
                                                onClick={() => { loadExample(ex.key); setShowExamples(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                                         vz-text hover:bg-[var(--vz-bg-hover)] transition-colors text-left"
                                            >
                                                <span className="text-lg shrink-0">{ex.icon}</span>
                                                <span className="text-xs font-medium truncate">{ex.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex lg:hidden vz-segmented-control shrink-0">
                {['editor', 'visualizer'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setMobileTab(tab)}
                        className={mobileTab === tab ? 'active' : ''}
                    >
                        {tab === 'editor' ? 'Code' : 'View'}
                    </button>
                ))}
            </div>
            <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg border vz-border vz-bg-p vz-muted
                           hover:vz-text transition-colors hover:bg-[var(--vz-bg-hover)] shrink-0"
            >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
        </div>
    </div>
);

const PanelHeader = ({ title, right, dot }) => (
    <div
        className="h-9 vz-bg-s border-b vz-border flex items-center
                   justify-between px-4 shrink-0"
    >
        <div className="flex items-center gap-2">
            {dot && (
                <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                        dot === 'green' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`}
                />
            )}
            {!dot && (
                <div className="flex items-center gap-1.5">
                    {['bg-red-500','bg-yellow-500','bg-green-500'].map(c => (
                        <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                    ))}
                </div>
            )}
            <span className="text-[11px] font-mono vz-muted ml-1">{title}</span>
        </div>
        {right && <span className="text-[11px] font-mono vz-muted tabular-nums">{right}</span>}
    </div>
);

const LoadingOverlay = () => (
    <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center
                   vz-bg-p/95 backdrop-blur-md"
        style={{ background: 'color-mix(in srgb, var(--vz-bg-primary) 88%, transparent)' }}
    >
        <Loader2
            className="animate-spin mb-3"
            size={36}
            style={{ color: 'var(--vz-accent)' }}
        />
        <span className="vz-muted font-mono text-sm animate-pulse">
            Executing algorithm…
        </span>
    </div>
);

const ErrorDisplay = ({ error, onReset }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border-2"
            style={{
                background: 'rgba(248,81,73,0.08)',
                borderColor: 'rgba(248,81,73,0.3)',
            }}
        >
            <AlertTriangle size={32} style={{ color: 'var(--vz-red)' }} />
        </div>
        <h3 className="text-xl font-bold vz-text mb-3">Execution Error</h3>
        <p
            className="font-mono text-sm px-5 py-3 rounded-xl border max-w-md mb-5 break-all"
            style={{
                color: 'var(--vz-red)',
                background: 'rgba(248,81,73,0.07)',
                borderColor: 'rgba(248,81,73,0.25)',
            }}
        >
            {error}
        </p>
        <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium rounded-lg border vz-border
                       vz-bg-s vz-text hover:bg-[var(--vz-bg-hover)] transition-colors"
        >
            Reset to Bubble Sort
        </button>
    </div>
);

export default Visualizer;
// V 1.5
