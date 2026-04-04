// src/pages/CampaignEditor.jsx  — V2
// ─────────────────────────────────────────────────────────────────────────────
// Key V2 upgrades:
//   ✓ Resizable problem/editor split via react-resizable-panels
//     (sizes saved to localStorage automatically via autoSaveId)
//   ✓ Output sanitization on the frontend for run results display
//     (backend also sanitizes before DB comparison)
//   ✓ Refined UI matching the screenshot aesthetic
//   ✓ Full keyboard shortcut: Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit
// ─────────────────────────────────────────────────────────────────────────────
//
// INSTALL (if not already in package.json):
//   npm install react-resizable-panels
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle,
    ChevronDown, ChevronUp, Sparkles, Clock, BookOpen,
    Code2, RefreshCw, Star,
} from 'lucide-react';
import toast       from 'react-hot-toast';
import api         from '../api';
import SuccessModal from '../components/Campaign/SuccessModal';
import SagePanel    from '../components/Campaign/SagePanel';
import StarDisplay  from '../components/Campaign/StarDisplay';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONACO_LANG = { javascript: 'javascript', python: 'python', cpp: 'cpp', java: 'java' };

const LANG_OPTIONS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python',     label: 'Python'     },
    { value: 'cpp',        label: 'C++'        },
    { value: 'java',       label: 'Java'       },
];

const DIFF_BADGE = {
    Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Medium: 'bg-amber-500/10   text-amber-400   border-amber-500/25',
    Hard:   'bg-red-500/10     text-red-400     border-red-500/25',
};

const elapsed = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Client-side output sanitizer (mirrors backend for display parity) ────────

const sanitize = (raw) => {
    if (raw == null) return '';
    return raw
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n')
        .replace(/\n+$/, '')
        .trim();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ResultRow = ({ result, index }) => {
    const [open, setOpen] = useState(!result.passed);
    const isHidden = result.input === 'Hidden' || !result.input;

    return (
        <div className={`border rounded-xl overflow-hidden ${result.passed ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-red-800/40 bg-red-950/8'}`}>
            <button
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {result.passed
                        ? <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                        : <XCircle    size={14} className="text-red-400 shrink-0"     />
                    }
                    <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
                    </span>
                    {!result.passed && (
                        <span className="text-[10px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-900/40 truncate">
                            {result.error || 'Wrong Answer'}
                        </span>
                    )}
                </div>
                {!isHidden && (open ? <ChevronUp size={12} className="text-gray-700 shrink-0" /> : <ChevronDown size={12} className="text-gray-700 shrink-0" />)}
            </button>

            {open && !isHidden && (
                <div className="px-3.5 pb-3 pt-2 space-y-2 border-t border-gray-800/40">
                    {[
                        { label: 'Input',    val: result.input    },
                        { label: 'Expected', val: sanitize(result.expected) },
                        { label: 'Actual',   val: sanitize(result.actual)   },
                    ].map(r => r.val != null && (
                        <div key={r.label}>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">{r.label}</p>
                            <pre className={`text-xs font-mono px-2.5 py-1.5 rounded-lg whitespace-pre-wrap break-all ${r.label === 'Actual' && !result.passed ? 'bg-red-950/25 text-red-300' : 'bg-gray-900/60 text-gray-300'}`}>
                                {r.val || <span className="text-gray-700 italic">empty</span>}
                            </pre>
                        </div>
                    ))}
                    {result.stderr && (
                        <div>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">Stderr</p>
                            <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-950/20 text-orange-400 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">{result.stderr}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ProblemPanel = ({ node, existingBest }) => {
    const problem = node?.problemId;
    if (!problem) return null;
    const publicCases = (problem.testCases || []).filter(tc => tc.isPublic);

    return (
        <div className="h-full overflow-y-auto px-5 py-5 space-y-5 text-[13px] custom-scrollbar">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    {node.nodeType === 'boss' && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">⚔️ Boss</span>}
                    {problem.difficulty && <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>{problem.difficulty}</span>}
                    {problem.timeLimit && <span className="text-[11px] text-gray-600 flex items-center gap-1"><Clock size={10} />{problem.timeLimit}ms limit</span>}
                </div>
                <h2 className="text-xl font-black text-white leading-tight">{problem.title}</h2>
            </div>

            {/* Personal best */}
            {existingBest && (
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-950/20 border border-amber-800/30 rounded-xl">
                    <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm" />
                    <span className="text-xs text-amber-400/70 flex-1">Your best</span>
                    {existingBest.bestTimeMs && <span className="text-xs font-mono text-gray-600">{existingBest.bestTimeMs}ms avg</span>}
                </div>
            )}

            {/* Star thresholds */}
            <div>
                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Star Thresholds</p>
                <div className="space-y-1.5">
                    {[
                        { s: 1, label: 'Pass all hidden test cases' },
                        { s: 2, label: `Avg time < ${node.starThresholds?.twoStarTimeMs ?? '?'}ms` },
                        { s: 3, label: `Avg time < ${node.starThresholds?.threeStarTimeMs ?? '?'}ms` },
                    ].map(r => (
                        <div key={r.s} className="flex items-center justify-between px-3 py-1.5 bg-gray-900/40 rounded-lg">
                            <StarDisplay stars={r.s} total={3} size="sm" />
                            <span className="text-gray-600 text-[11px]">{r.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Description</p>
                <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: (problem.description || '').replace(/\n/g, '<br/>') }} />
            </div>

            {/* Constraints */}
            {problem.constraints?.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Constraints</p>
                    <ul className="space-y-1">
                        {problem.constraints.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-500">
                                <span className="text-cyan-500 mt-0.5 shrink-0">›</span>
                                <span className="font-mono text-[12px]">{c}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Examples */}
            {publicCases.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Examples (public)</p>
                    {publicCases.map((tc, i) => (
                        <div key={i} className="mb-3 bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                            <div className="px-3 py-1.5 bg-gray-900/40 border-b border-gray-800/40">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Example {i + 1}</span>
                            </div>
                            <div className="p-3 space-y-2">
                                <div>
                                    <p className="text-[10px] text-gray-700 font-bold mb-1">Input</p>
                                    <pre className="text-xs font-mono text-gray-300 bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.input}</pre>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-700 font-bold mb-1">Output</p>
                                    <pre className="text-xs font-mono text-emerald-400 bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.output}</pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="h-4" />
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const CampaignEditor = () => {
    const { nodeId } = useParams();
    const navigate   = useNavigate();

    const [node,         setNode]         = useState(null);
    const [existingBest, setExistingBest] = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [code,         setCode]         = useState('');
    const [language,     setLanguage]     = useState('javascript');

    const [runResults,   setRunResults]   = useState(null);
    const [execType,     setExecType]     = useState(null);
    const [isRunning,    setIsRunning]    = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults,  setShowResults]  = useState(false);

    const [failCount,          setFailCount]          = useState(0);
    const [showSage,           setShowSage]           = useState(false);
    const [sageShouldShow,     setSageShouldShow]     = useState(false);
    const [lastFailedCode,     setLastFailedCode]     = useState('');
    const [lastError,          setLastError]          = useState('');

    const [showSuccess,   setShowSuccess]   = useState(false);
    const [successResult, setSuccessResult] = useState(null);
    const [mobileTab,     setMobileTab]     = useState('problem');
    const [time,          setTime]          = useState(0);

    const timerRef  = useRef(null);
    const editorRef = useRef(null);

    // ── Load node ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/campaign/node/${nodeId}`);
                if (cancelled) return;
                if (data.success || data.node) {
                    const n = data.node;
                    setNode(n);
                    setExistingBest(data.existingCompletion || null);
                    const starter = n?.problemId?.starterCode?.javascript || n?.problemId?.starterCode?.cpp || '';
                    setCode(starter);
                } else {
                    toast.error('Node not found'); navigate('/campaign');
                }
            } catch (err) {
                if (cancelled) return;
                if (err.response?.status === 403) toast.error('Complete prerequisites first!');
                else toast.error('Failed to load challenge');
                navigate('/campaign');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [nodeId, navigate]);

    // ── Timer ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handleSubmit();
                else            handleRun();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Monaco setup ──────────────────────────────────────────────────────────
    const handleEditorMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monaco.editor.defineTheme('ca-v2', {
            base: 'vs-dark', inherit: true, rules: [],
            colors: {
                'editor.background':                '#07090e',
                'editor.lineHighlightBackground':   '#0e1420',
                'editorLineNumber.foreground':       '#1e2d3d',
                'editorLineNumber.activeForeground': '#06b6d4',
                'editor.selectionBackground':        '#06b6d425',
                'editorCursor.foreground':           '#06b6d4',
            },
        });
        monaco.editor.setTheme('ca-v2');
    }, []);

    // ── Language switch ───────────────────────────────────────────────────────
    const handleLanguageChange = useCallback((lang) => {
        const starter = node?.problemId?.starterCode?.[language] || '';
        const dirty   = code !== starter && code.trim().length > 0;
        if (dirty && !window.confirm(`Switch to ${lang}? Current code will be replaced.`)) return;
        setLanguage(lang);
        setCode(node?.problemId?.starterCode?.[lang] || '');
        setRunResults(null); setShowResults(false);
    }, [code, language, node]);

    // ── Run (public cases, /api/run) ──────────────────────────────────────────
    const handleRun = useCallback(async () => {
        if (isRunning || isSubmitting || !code.trim()) return;
        const publicCases = (node?.problemId?.testCases || []).filter(tc => tc.isPublic);
        if (!publicCases.length) { toast.error('No public test cases'); return; }

        setIsRunning(true); setRunResults(null); setExecType('run');
        setShowResults(true); setShowSage(false); setMobileTab('editor');

        const results = [];
        for (const [i, tc] of publicCases.entries()) {
            try {
                const { data } = await api.post('/run', { language, code, stdin: tc.input });
                const actual   = sanitize(data.stdout || '');
                const expected = sanitize(tc.output || '');
                results.push({ caseNum: i+1, input: tc.input, expected, actual, passed: actual === expected, stderr: data.stderr || '', isPublic: true });
            } catch (err) {
                results.push({ caseNum: i+1, input: tc.input, passed: false, error: err.response?.data?.message || 'Execution error', actual: '', expected: tc.output, isPublic: true });
            }
        }

        setRunResults(results); setIsRunning(false);
        const passed = results.filter(r => r.passed).length;
        if (passed === results.length) toast.success('All public cases passed! Ready to submit.', { icon: '✅', duration: 3500 });
        else toast.error(`${results.length - passed}/${results.length} case(s) failed`);
    }, [code, language, node, isRunning, isSubmitting]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (isSubmitting || isRunning || !code.trim()) return;
        setIsSubmitting(true); setRunResults(null); setExecType('submit');
        setShowResults(true);  setShowSage(false);  setMobileTab('editor');

        try {
            const { data } = await api.post('/campaign/submit', { nodeId, code, language });
            setRunResults(data.results || []);

            if (data.allPassed) {
                clearInterval(timerRef.current);
                setSuccessResult({ ...data, elapsedSeconds: time });
                setShowSuccess(true); setFailCount(0); setSageShouldShow(false);
            } else {
                const newFails = failCount + 1;
                setFailCount(newFails);
                const failedResult = (data.results || []).find(r => !r.passed);
                setLastFailedCode(code);
                setLastError(failedResult?.error || failedResult?.stderr || 'Wrong answer');

                if (newFails >= 3) {
                    setSageShouldShow(true);
                    if (newFails === 3) toast('The Sage has appeared 🔮', { duration: 4000, icon: '✨' });
                } else {
                    const passed = (data.results || []).filter(r => r.passed).length;
                    const total  = (data.results || []).length;
                    toast.error(`${total - passed} case(s) failed · Attempt ${newFails}/3 before Sage appears`);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
            setShowResults(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [code, language, nodeId, isSubmitting, isRunning, failCount, time]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const isBusy      = isRunning || isSubmitting;
    const passedCount = useMemo(() => (runResults || []).filter(r => r.passed).length, [runResults]);
    const totalCount  = runResults?.length ?? 0;
    const allPassed   = totalCount > 0 && passedCount === totalCount;
    const problem     = node?.problemId;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#06080e] flex flex-col items-center justify-center gap-4">
            <Loader2 size={36} className="animate-spin text-cyan-500" />
            <p className="text-gray-600 font-bold text-sm">Loading challenge...</p>
        </div>
    );

    if (!node || !problem) return (
        <div className="min-h-screen bg-[#06080e] flex items-center justify-center text-gray-600">Challenge not found.</div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#06080e] flex flex-col overflow-hidden">

            {/* ── TOP BAR ──────────────────────────────────────────────── */}
            <header className="h-[52px] bg-[#07090f]/95 border-b border-gray-800/50 flex items-center gap-2.5 px-3 sm:px-4 shrink-0 backdrop-blur-md z-20">
                {/* Back */}
                <button
                    onClick={() => navigate('/campaign')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-200 hover:bg-gray-800/60 rounded-lg transition-all shrink-0 text-xs font-bold"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Map</span>
                </button>

                <div className="w-px h-4 bg-gray-800 shrink-0" />

                {/* Title */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h1 className="text-white font-black text-sm truncate">{problem.title}</h1>
                    {problem.difficulty && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline-flex ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>
                            {problem.difficulty}
                        </span>
                    )}
                    {node.nodeType === 'boss' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 shrink-0 hidden sm:inline-flex">Boss</span>
                    )}
                </div>

                {/* Lang select */}
                <select
                    value={language}
                    onChange={e => handleLanguageChange(e.target.value)}
                    disabled={isBusy}
                    className="bg-gray-900/80 border border-gray-700/60 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50 cursor-pointer disabled:opacity-50 shrink-0 hidden sm:block"
                >
                    {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>

                {/* Timer */}
                <div className="flex items-center gap-1 text-gray-600 shrink-0">
                    <Clock size={12} />
                    <span className="font-mono text-xs tabular-nums">{elapsed(time)}</span>
                </div>

                {/* Desktop action buttons */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleRun}
                        disabled={isBusy || !code.trim()}
                        title="Run (Ctrl+Enter)"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
                    >
                        {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                        {isRunning ? 'Running…' : 'Run'}
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isBusy || !code.trim()}
                        title="Submit (Ctrl+Shift+Enter)"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40"
                    >
                        {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        {isSubmitting ? 'Judging…' : 'Submit'}
                    </button>
                </div>
            </header>

            {/* ── MOBILE TAB BAR ───────────────────────────────────────── */}
            <div className="sm:hidden flex items-center border-b border-gray-800/50 bg-[#07090f]/80 shrink-0">
                {[{ id: 'problem', icon: BookOpen, label: 'Problem' }, { id: 'editor', icon: Code2, label: 'Editor' }].map(t => (
                    <button key={t.id} onClick={() => setMobileTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${mobileTab === t.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-600'}`}
                    >
                        <t.icon size={13} />{t.label}
                    </button>
                ))}
                <div className="px-2">
                    <select value={language} onChange={e => handleLanguageChange(e.target.value)} disabled={isBusy}
                        className="bg-gray-900 border border-gray-700 text-gray-400 text-[11px] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                        {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
            </div>

            {/* ── MAIN SPLIT: desktop = resizable panels, mobile = tabs ── */}
            <div className="flex-1 min-h-0 overflow-hidden">

                {/* Desktop — react-resizable-panels */}
                <div className="hidden sm:flex h-full">
                    <PanelGroup
                        direction="horizontal"
                        autoSaveId="ca-editor-layout-v2"
                        className="h-full"
                    >
                        {/* LEFT: Problem description */}
                        <Panel defaultSize={38} minSize={22} maxSize={65}>
                            <div className="h-full bg-[#07090f] border-r border-gray-800/40 flex flex-col">
                                <ProblemPanel node={node} existingBest={existingBest} />
                            </div>
                        </Panel>

                        {/* Draggable gutter */}
                        <PanelResizeHandle className="w-1 bg-gray-800/40 hover:bg-cyan-500/40 transition-colors cursor-col-resize relative group">
                            {/* Visual handle pill */}
                            <div className="absolute inset-y-0 -left-1.5 -right-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-1 h-12 bg-cyan-500/60 rounded-full" />
                            </div>
                        </PanelResizeHandle>

                        {/* RIGHT: Code editor + results + sage */}
                        <Panel defaultSize={62} minSize={30}>
                            <div className="h-full bg-[#07090e] flex flex-col relative">
                                <EditorAndResults
                                    code={code} setCode={setCode} language={language}
                                    handleEditorMount={handleEditorMount}
                                    showResults={showResults} setShowResults={setShowResults}
                                    runResults={runResults} execType={execType}
                                    passedCount={passedCount} totalCount={totalCount} allPassed={allPassed}
                                    sageShouldShow={sageShouldShow}
                                    showSage={showSage}     setShowSage={setShowSage}
                                    nodeId={nodeId} lastFailedCode={lastFailedCode}
                                    lastError={lastError}
                                />
                            </div>
                        </Panel>
                    </PanelGroup>
                </div>

                {/* Mobile — tab-based */}
                <div className="sm:hidden h-full flex flex-col">
                    {mobileTab === 'problem' && (
                        <div className="flex-1 bg-[#07090f] overflow-hidden">
                            <ProblemPanel node={node} existingBest={existingBest} />
                        </div>
                    )}
                    {mobileTab === 'editor' && (
                        <div className="flex-1 bg-[#07090e] flex flex-col relative overflow-hidden">
                            <EditorAndResults
                                code={code} setCode={setCode} language={language}
                                handleEditorMount={handleEditorMount}
                                showResults={showResults} setShowResults={setShowResults}
                                runResults={runResults} execType={execType}
                                passedCount={passedCount} totalCount={totalCount} allPassed={allPassed}
                                sageShouldShow={sageShouldShow}
                                showSage={showSage}     setShowSage={setShowSage}
                                nodeId={nodeId} lastFailedCode={lastFailedCode}
                                lastError={lastError} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── MOBILE BOTTOM BAR ────────────────────────────────────── */}
            <div className="sm:hidden flex gap-2 px-3 py-2 bg-[#07090f]/95 border-t border-gray-800/50 shrink-0">
                <button onClick={handleRun} disabled={isBusy || !code.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isRunning ? 'Running…' : 'Run'}
                </button>
                <button onClick={handleSubmit} disabled={isBusy || !code.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition-all disabled:opacity-40"
                >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isSubmitting ? 'Judging…' : 'Submit'}
                </button>
            </div>

            {/* ── MODALS ───────────────────────────────────────────────── */}
            <SuccessModal
                isOpen={showSuccess}
                result={successResult}
                onViewMap={() => navigate('/campaign')}
                onContinue={() => { setShowSuccess(false); setRunResults(null); setShowResults(false); }}
            />
        </div>
    );
};

// ─── Editor + Results panel (extracted to avoid duplication between desktop/mobile) ─

const EditorAndResults = ({
    code, setCode, language, handleEditorMount,
    showResults, setShowResults, runResults, execType,
    passedCount, totalCount, allPassed,
    sageShouldShow, showSage, setShowSage,
    nodeId, lastFailedCode, lastError,
}) => (
    <>
        {/* Monaco editor fills available space */}
        <div className="flex-1 min-h-0">
            <Editor
                height="100%"
                language={MONACO_LANG[language]}
                value={code}
                onChange={v => setCode(v || '')}
                onMount={handleEditorMount}
                options={{
                    minimap:              { enabled: false },
                    fontSize:             13.5,
                    fontFamily:           "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
                    fontLigatures:        true,
                    lineNumbers:          'on',
                    scrollBeyondLastLine: false,
                    wordWrap:             'on',
                    tabSize:              4,
                    automaticLayout:      true,
                    padding:              { top: 16, bottom: 16 },
                    renderLineHighlight:  'all',
                    bracketPairColorization: { enabled: true },
                    scrollbar: { vertical: 'auto', horizontal: 'auto' },
                    quickSuggestions:     true,
                    suggest:              { showWords: false },
                }}
            />
        </div>

        {/* Results panel */}
        <AnimatePresence>
            {showResults && runResults && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{    height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-800/50 bg-[#07090f] overflow-hidden shrink-0"
                >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {/* Results header */}
                        <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[#07090f] border-b border-gray-800/40 z-10">
                            <div className="flex items-center gap-2">
                                {allPassed ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                                <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {execType === 'run' ? 'Run' : 'Submit'} · {passedCount}/{totalCount} passed
                                </span>
                            </div>
                            <button onClick={() => setShowResults(false)} className="text-gray-700 hover:text-gray-400 text-xs">✕</button>
                        </div>

                        <div className="px-3 py-3 space-y-2">
                            {runResults.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
                        </div>

                        {/* Ask Sage button */}
                        {sageShouldShow && !showSage && (
                            <div className="px-3 pb-3">
                                <button
                                    onClick={() => setShowSage(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-700/35 hover:border-purple-600/50 text-purple-300 text-xs font-bold rounded-xl transition-all"
                                >
                                    <Sparkles size={13} /> Consult The Sage
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Sage panel */}
        <SagePanel
            nodeId={nodeId}
            failedCode={lastFailedCode}
            errorMessage={lastError}
            language={language}
            isVisible={showSage}
            onClose={() => setShowSage(false)}
        />
    </>
);

export default CampaignEditor;
