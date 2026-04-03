// src/pages/CampaignEditor.jsx
// Single-player campaign challenge page.
// Deliberately simpler than EditorPage: no Yjs, no sockets, one editor pane.

import React, {
    useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
// motion
import {AnimatePresence} from 'framer-motion';
import {
    ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle,
    ChevronDown, ChevronUp, Sparkles, Clock, BookOpen,
    Code2, RefreshCw, AlertTriangle, Zap, Star
} from 'lucide-react';
import toast          from 'react-hot-toast';
import api            from '../api';
import SuccessModal   from '../components/Campaign/SuccessModal';
import SagePanel      from '../components/Campaign/SagePanel';
import StarDisplay    from '../components/Campaign/StarDisplay';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONACO_LANG = {
    javascript: 'javascript',
    python:     'python',
    cpp:        'cpp',
    java:       'java',
};

const LANG_OPTIONS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python',     label: 'Python'     },
    { value: 'cpp',        label: 'C++'        },
    { value: 'java',       label: 'Java'       },
];

const DIFF_STYLE = {
    Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Hard:   'bg-red-500/10 text-red-400 border-red-500/25',
};

const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// Single test-case result row
const ResultRow = ({ result, index }) => {
    const [expanded, setExpanded] = useState(!result.passed);
    const isHidden  = result.input === 'Hidden' || result.expected === 'Hidden';

    return (
        <div className={`border rounded-xl overflow-hidden transition-colors ${
            result.passed
                ? 'border-emerald-800/40 bg-emerald-950/15'
                : 'border-red-800/40 bg-red-950/10'
        }`}>
            {/* Row header */}
            <button
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-2.5">
                    {result.passed
                        ? <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                        : <XCircle    size={15} className="text-red-400 shrink-0"     />
                    }
                    <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
                    </span>
                    {!result.passed && (
                        <span className="text-[10px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-900/40">
                            {result.error || 'Wrong Answer'}
                        </span>
                    )}
                </div>
                {!isHidden && (
                    expanded
                        ? <ChevronUp   size={13} className="text-gray-600" />
                        : <ChevronDown size={13} className="text-gray-600" />
                )}
            </button>

            {/* Expanded detail */}
            {expanded && !isHidden && (
                <div className="px-3.5 pb-3.5 space-y-2 border-t border-gray-800/40 pt-2.5">
                    {[
                        { label: 'Input',    val: result.input    },
                        { label: 'Expected', val: result.expected },
                        { label: 'Actual',   val: result.actual   },
                    ].map(row => row.val !== undefined && (
                        <div key={row.label}>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">
                                {row.label}
                            </p>
                            <pre className={`text-xs font-mono px-2.5 py-1.5 rounded-lg whitespace-pre-wrap break-all ${
                                row.label === 'Actual' && !result.passed
                                    ? 'bg-red-950/30 text-red-300'
                                    : 'bg-gray-900/60 text-gray-300'
                            }`}>
                                {row.val || <span className="text-gray-700 italic">empty</span>}
                            </pre>
                        </div>
                    ))}
                    {result.stderr && (
                        <div>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">Stderr</p>
                            <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-950/25 text-orange-400 whitespace-pre-wrap break-all max-h-20 overflow-y-auto">
                                {result.stderr}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Problem statement panel
const ProblemPanel = ({ node, existingBest }) => {
    const problem = node?.problemId;
    if (!problem) return null;

    const publicCases = problem.testCases?.filter(tc => tc.isPublic) || [];

    return (
        <div className="h-full overflow-y-auto px-5 py-5 space-y-5 text-[13px] custom-scrollbar">
            {/* Title + difficulty */}
            <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {node.nodeType === 'boss' && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">
                            ⚔️ Boss
                        </span>
                    )}
                    {problem.difficulty && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFF_STYLE[problem.difficulty] || DIFF_STYLE.Easy}`}>
                            {problem.difficulty}
                        </span>
                    )}
                    {problem.timeLimit && (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock size={11} />{problem.timeLimit}ms limit
                        </span>
                    )}
                </div>
                <h2 className="text-xl font-black text-white leading-tight">{problem.title}</h2>
            </div>

            {/* Existing best */}
            {existingBest && (
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-950/20 border border-amber-800/35 rounded-xl">
                    <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm" />
                    <span className="text-xs text-amber-400/80">Your best</span>
                    {existingBest.bestTimeMs && (
                        <span className="text-xs font-mono text-gray-600 ml-auto">
                            {existingBest.bestTimeMs}ms avg
                        </span>
                    )}
                </div>
            )}

            {/* Star thresholds */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Star thresholds</p>
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

            {/* Description */}
            <div>
                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Description</p>
                <div
                    className="text-gray-300 leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{
                        __html: (problem.description || '').replace(/\n/g, '<br/>')
                    }}
                />
            </div>

            {/* Constraints */}
            {problem.constraints?.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Constraints</p>
                    <ul className="space-y-1">
                        {problem.constraints.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-500">
                                <span className="text-accent mt-0.5 shrink-0">›</span>
                                <span className="font-mono text-[12px]">{c}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Public examples */}
            {publicCases.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">
                        Examples (public)
                    </p>
                    {publicCases.map((tc, i) => (
                        <div key={i} className="mb-3 bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden">
                            <div className="px-3 py-1.5 border-b border-gray-800/40 bg-gray-900/40">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                    Example {i + 1}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                <div>
                                    <p className="text-[10px] text-gray-700 mb-1 font-bold">Input</p>
                                    <pre className="text-xs font-mono text-gray-300 bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">
                                        {tc.input}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-700 mb-1 font-bold">Output</p>
                                    <pre className="text-xs font-mono text-emerald-400 bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">
                                        {tc.output}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom padding so content doesn't sit behind sticky elements */}
            <div className="h-4" />
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CampaignEditor = () => {
    const { nodeId } = useParams();
    const navigate   = useNavigate();

    // ── Data ─────────────────────────────────────────────────────────────────
    const [node,         setNode]         = useState(null);
    const [existingBest, setExistingBest] = useState(null);
    const [loading,      setLoading]      = useState(true);

    // ── Editor ───────────────────────────────────────────────────────────────
    const [code,         setCode]         = useState('');
    const [language,     setLanguage]     = useState('javascript');

    // ── Execution ────────────────────────────────────────────────────────────
    const [runResults,   setRunResults]   = useState(null);   // array after run/submit
    const [execType,     setExecType]     = useState(null);   // 'run' | 'submit'
    const [isRunning,    setIsRunning]    = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults,  setShowResults]  = useState(false);

    // ── Sage ─────────────────────────────────────────────────────────────────
    const [sageShouldTrigger, setSageShouldTrigger] = useState(false);
    const [showSage,          setShowSage]           = useState(false);
    const [lastFailedCode,    setLastFailedCode]     = useState('');
    const [lastError,         setLastError]          = useState('');

    // ── Success ──────────────────────────────────────────────────────────────
    const [showSuccess,   setShowSuccess]   = useState(false);
    const [successResult, setSuccessResult] = useState(null);

    // ── UI ───────────────────────────────────────────────────────────────────
    const [mobileTab, setMobileTab] = useState('problem');
    const [elapsed,   setElapsed]   = useState(0);

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
                if (data.success) {
                    setNode(data.node);
                    setExistingBest(data.existingCompletion || null);
                    // Load starter code
                    const starter = data.node.problemId?.starterCode?.javascript || '';
                    setCode(starter);
                } else {
                    toast.error('Node not found');
                    navigate('/campaign');
                }
            } catch (err) {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 403) {
                    toast.error('Complete prerequisites first!');
                } else {
                    toast.error('Failed to load challenge');
                }
                navigate('/campaign');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [nodeId, navigate]);

    // ── Timer (starts once, stops on success) ─────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // ── Monaco setup ──────────────────────────────────────────────────────────
    const handleEditorMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monaco.editor.defineTheme('ca-dark', {
            base:    'vs-dark',
            inherit: true,
            rules:   [],
            colors: {
                'editor.background':                '#080b10',
                'editor.lineHighlightBackground':   '#12191f',
                'editorLineNumber.foreground':       '#2a3040',
                'editorLineNumber.activeForeground': '#4aee88',
                'editor.selectionBackground':        '#4aee8830',
                'editorCursor.foreground':           '#4aee88',
            },
        });
        monaco.editor.setTheme('ca-dark');
    }, []);

    // ── Language change ───────────────────────────────────────────────────────
    const handleLanguageChange = useCallback((lang) => {
        const defaultStarter = node?.problemId?.starterCode?.[language] || '';
        const isDirty = code !== defaultStarter && code.trim().length > 0;

        if (isDirty) {
            const ok = window.confirm(
                `Switch to ${lang}? Your current code will be replaced with the starter template.`
            );
            if (!ok) return;
        }
        setLanguage(lang);
        const newStarter = node?.problemId?.starterCode?.[lang] || '';
        setCode(newStarter);
        setRunResults(null);
        setShowResults(false);
    }, [code, language, node]);

    // ── Run (public cases only via /api/run) ───────────────────────────────────
    const handleRun = useCallback(async () => {
        if (isRunning || isSubmitting || !code.trim()) return;

        const publicCases = node?.problemId?.testCases?.filter(tc => tc.isPublic) || [];
        if (!publicCases.length) {
            toast.error('No public test cases available');
            return;
        }

        setIsRunning(true);
        setRunResults(null);
        setExecType('run');
        setShowResults(true);
        setShowSage(false);
        setMobileTab('editor'); // switch to editor tab on mobile

        const results = [];
        for (const [i, tc] of publicCases.entries()) {
            try {
                const { data } = await api.post('/run', { language, code, stdin: tc.input });
                const actual   = (data.stdout || '').trim();
                const expected = tc.output.trim();
                results.push({
                    caseNum:  i + 1,
                    input:    tc.input,
                    expected,
                    actual,
                    passed:   actual === expected,
                    stderr:   data.stderr || '',
                    isPublic: true,
                });
            } catch (err) {
                results.push({
                    caseNum:  i + 1,
                    input:    tc.input,
                    passed:   false,
                    error:    err.response?.data?.message || 'Execution error',
                    actual:   '',
                    expected: tc.output,
                    isPublic: true,
                });
            }
        }

        setRunResults(results);
        setIsRunning(false);

        const passed = results.filter(r => r.passed).length;
        if (passed === results.length) {
            toast.success('All public cases passed! Try submitting now.', { icon: '✅', duration: 3500 });
        } else {
            toast.error(`${results.length - passed} / ${results.length} case(s) failed`);
        }
    }, [code, language, node, isRunning, isSubmitting]);

    // ── Submit (all test cases via /api/campaign/submit) ──────────────────────
    const handleSubmit = useCallback(async () => {
        if (isSubmitting || isRunning || !code.trim()) return;

        setIsSubmitting(true);
        setRunResults(null);
        setExecType('submit');
        setShowResults(true);
        setShowSage(false);
        setMobileTab('editor');

        try {
            const { data } = await api.post('/campaign/submit', { nodeId, code, language });

            setRunResults(data.results || []);

            if (data.allPassed) {
                clearInterval(timerRef.current); // freeze timer
                setSuccessResult({ ...data, elapsedSeconds: elapsed });
                setShowSuccess(true);
                setSageShouldTrigger(false);
            } else {
                // Build error summary for the sage
                const failedResult = (data.results || []).find(r => !r.passed);
                const errMsg =
                    failedResult?.error ||
                    failedResult?.stderr ||
                    'Wrong answer on hidden test case';
                setLastFailedCode(code);
                setLastError(errMsg);

                if (data.sageShouldTrigger) {
                    setSageShouldTrigger(true);
                    toast('The Sage senses your struggle… 🔮', { duration: 4000 });
                } else {
                    const passed = (data.results || []).filter(r => r.passed).length;
                    const total  = (data.results || []).length;
                    toast.error(`${total - passed} test case(s) failed. Keep going!`);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed. Try again.');
            setRunResults(null);
            setShowResults(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [code, language, nodeId, isSubmitting, isRunning, elapsed]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const problem     = node?.problemId;
    const isBusy      = isRunning || isSubmitting;
    const passedCount = useMemo(() => (runResults || []).filter(r => r.passed).length, [runResults]);
    const totalCount  = runResults?.length ?? 0;
    const allPassed   = totalCount > 0 && passedCount === totalCount;

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center gap-4">
                <Loader2 size={36} className="animate-spin text-accent" />
                <p className="text-gray-600 font-bold text-sm">Loading challenge...</p>
            </div>
        );
    }

    if (!node || !problem) {
        return (
            <div className="min-h-screen bg-[#060810] flex items-center justify-center text-gray-500">
                <p>Challenge not found.</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#060810] flex flex-col overflow-hidden font-sans">

            {/* ── TOP BAR ────────────────────────────────────────────────── */}
            <header className="h-14 bg-[#07090f]/95 border-b border-gray-800/50 flex items-center gap-3 px-3 sm:px-4 shrink-0 backdrop-blur-md z-20">

                {/* Back */}
                <button
                    onClick={() => navigate('/campaign')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 rounded-lg transition-colors shrink-0"
                >
                    <ArrowLeft size={17} />
                    <span className="text-xs font-bold hidden sm:inline">Map</span>
                </button>

                <div className="w-px h-5 bg-gray-800 shrink-0" />

                {/* Node title */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-white font-black text-sm truncate">{problem.title}</h1>
                        {problem.difficulty && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${DIFF_STYLE[problem.difficulty] || DIFF_STYLE.Easy}`}>
                                {problem.difficulty}
                            </span>
                        )}
                        {node.nodeType === 'boss' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 shrink-0">
                                Boss
                            </span>
                        )}
                    </div>
                </div>

                {/* Language selector */}
                <select
                    value={language}
                    onChange={e => handleLanguageChange(e.target.value)}
                    disabled={isBusy}
                    className="bg-gray-900/80 border border-gray-700/60 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent/50 cursor-pointer disabled:opacity-50 shrink-0 hidden sm:block"
                >
                    {LANG_OPTIONS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                </select>

                {/* Timer */}
                <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
                    <Clock size={13} />
                    <span className="font-mono text-xs tabular-nums">{formatElapsed(elapsed)}</span>
                </div>

                {/* Run / Submit (desktop) */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleRun}
                        disabled={isBusy || !code.trim()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isRunning
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Play    size={13} />
                        }
                        {isRunning ? 'Running…' : 'Run'}
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isBusy || !code.trim()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-[#3bd175] text-black text-xs font-black rounded-lg transition-all shadow-md shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Send    size={13} />
                        }
                        {isSubmitting ? 'Judging…' : 'Submit'}
                    </button>
                </div>
            </header>

            {/* ── MOBILE TAB BAR ──────────────────────────────────────────── */}
            <div className="sm:hidden flex border-b border-gray-800/50 bg-[#07090f]/80 shrink-0">
                {[
                    { id: 'problem', icon: BookOpen, label: 'Problem' },
                    { id: 'editor',  icon: Code2,    label: 'Editor'  },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setMobileTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                            mobileTab === t.id
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-600 hover:text-gray-400'
                        }`}
                    >
                        <t.icon size={14} />{t.label}
                    </button>
                ))}
                {/* Language selector (mobile) */}
                <div className="flex items-center pr-3">
                    <select
                        value={language}
                        onChange={e => handleLanguageChange(e.target.value)}
                        disabled={isBusy}
                        className="bg-gray-900 border border-gray-700 text-gray-400 text-[11px] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                        {LANG_OPTIONS.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── MAIN SPLIT ──────────────────────────────────────────────── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: Problem panel */}
                <div className={`
                    flex-col bg-[#07090f] border-r border-gray-800/40
                    ${mobileTab === 'problem' ? 'flex w-full' : 'hidden'}
                    sm:flex sm:w-[42%] lg:w-[38%]
                `}>
                    <ProblemPanel node={node} existingBest={existingBest} />
                </div>

                {/* RIGHT: Editor + Results + Sage */}
                <div className={`
                    flex-col min-h-0 bg-[#080b10] relative
                    ${mobileTab === 'editor' ? 'flex w-full' : 'hidden'}
                    sm:flex sm:flex-1
                `}>
                    {/* Monaco editor */}
                    <div className="flex-1 min-h-0 relative">
                        <Editor
                            height="100%"
                            language={MONACO_LANG[language]}
                            value={code}
                            onChange={val => setCode(val || '')}
                            onMount={handleEditorMount}
                            options={{
                                minimap:              { enabled: false },
                                fontSize:             13,
                                fontFamily:           "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                lineNumbers:          'on',
                                scrollBeyondLastLine: false,
                                wordWrap:             'on',
                                tabSize:              4,
                                automaticLayout:      true,
                                padding:              { top: 14, bottom: 14 },
                                suggest:              { showWords: false },
                                quickSuggestions:     true,
                                folding:              true,
                                bracketPairColorization: { enabled: true },
                                renderLineHighlight:  'all',
                                scrollbar: {
                                    vertical:   'auto',
                                    horizontal: 'auto',
                                },
                            }}
                        />
                    </div>

                    {/* ── RESULTS PANEL ──────────────────────────────────── */}
                    <AnimatePresence>
                        {showResults && runResults && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                className="border-t border-gray-800/50 bg-[#07090f] overflow-hidden shrink-0"
                            >
                                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                    {/* Results header */}
                                    <div className="flex items-center justify-between px-4 py-2.5 sticky top-0 bg-[#07090f] border-b border-gray-800/40 z-10">
                                        <div className="flex items-center gap-2">
                                            {allPassed
                                                ? <CheckCircle size={14} className="text-emerald-400" />
                                                : <XCircle    size={14} className="text-red-400"     />
                                            }
                                            <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {execType === 'run' ? 'Run Results' : 'Submit Results'}
                                                &nbsp;·&nbsp;{passedCount}/{totalCount} passed
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowResults(false)}
                                            className="text-gray-700 hover:text-gray-400 text-xs transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Result rows */}
                                    <div className="px-3 py-3 space-y-2">
                                        {runResults.map((r, i) => (
                                            <ResultRow key={i} result={r} index={i} />
                                        ))}
                                    </div>
                                </div>

                                {/* Ask The Sage button */}
                                {sageShouldTrigger && !showSage && (
                                    <div className="px-4 pb-3">
                                        <button
                                            onClick={() => setShowSage(true)}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-700/35 hover:border-purple-600/50 text-purple-300 text-xs font-bold rounded-xl transition-all"
                                        >
                                            <Sparkles size={13} />
                                            Ask The Sage
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── SAGE PANEL ────────────────────────────────────── */}
                    <SagePanel
                        nodeId={nodeId}
                        failedCode={lastFailedCode}
                        errorMessage={lastError}
                        language={language}
                        isVisible={showSage}
                        onClose={() => setShowSage(false)}
                    />
                </div>
            </div>

            {/* ── MOBILE BOTTOM ACTION BAR ─────────────────────────────────── */}
            <div className="sm:hidden flex gap-2 px-3 py-2.5 bg-[#07090f]/95 border-t border-gray-800/50 shrink-0">
                <button
                    onClick={handleRun}
                    disabled={isBusy || !code.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isRunning ? 'Running…' : 'Run'}
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isBusy || !code.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-[#3bd175] text-black text-xs font-black rounded-xl transition-all shadow-md shadow-accent/15 disabled:opacity-40"
                >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isSubmitting ? 'Judging…' : 'Submit'}
                </button>
            </div>

            {/* ── SUCCESS MODAL ──────────────────────────────────────────────── */}
            <SuccessModal
                isOpen={showSuccess}
                result={successResult}
                onViewMap={() => navigate('/campaign')}
                onContinue={() => {
                    setShowSuccess(false);
                    // Allow re-attempt for improvement
                    setRunResults(null);
                    setShowResults(false);
                }}
            />
        </div>
    );
};

export default CampaignEditor;