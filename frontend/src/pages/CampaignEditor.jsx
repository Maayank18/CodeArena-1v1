// // src/pages/CampaignEditor.jsx  — Full corrected file
// // ─────────────────────────────────────────────────────────────────────────────
// // KEY FIXES in this version:
// //  1. extractOutput() handles every backend/Piston response shape
// //  2. handleRun maps output through extractOutput, shows stderr in UI
// //  3. handleSubmit maps campaign submit results through normaliseResult
// //  4. 503/500 surfaces the actual error string, not a silent failure
// //  5. sanitize() never strips valid values (0, false, empty string)
// // ─────────────────────────────────────────────────────────────────────────────

// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Editor from '@monaco-editor/react';
// import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle,
//   ChevronDown, ChevronUp, Sparkles, Clock, BookOpen, Code2,
//   AlertTriangle, RefreshCw,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import api from '../api';
// import SuccessModal from '../components/Campaign/SuccessModal';
// import SagePanel    from '../components/Campaign/SagePanel';
// import StarDisplay  from '../components/Campaign/StarDisplay';

// // ─── Constants ────────────────────────────────────────────────────────────────

// const MONACO_LANG = { javascript:'javascript', python:'python', cpp:'cpp', java:'java' };

// const LANG_OPTIONS = [
//   { value:'javascript', label:'JavaScript' },
//   { value:'python',     label:'Python'     },
//   { value:'cpp',        label:'C++'        },
//   { value:'java',       label:'Java'       },
// ];

// const DIFF_BADGE = {
//   Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
//   Medium: 'bg-amber-500/10   text-amber-400   border-amber-500/25',
//   Hard:   'bg-red-500/10     text-red-400     border-red-500/25',
// };

// const fmt = (s) =>
//   `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

// // ─── Output normalisation ─────────────────────────────────────────────────────

// /**
//  * Normalise ANY raw value from Piston or our backend wrapper.
//  * Never returns undefined — always a string.
//  */
// const sanitize = (raw) => {
//   if (raw == null) return '';
//   if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
//   if (Array.isArray(raw)) return sanitize(raw.join('\n'));
//   const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
//   return s
//     .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
//     .split('\n').map(l => l.trimEnd()).join('\n')
//     .replace(/\n+$/, '').trim();
// };

// /**
//  * Extracts { stdout, stderr } from ANY backend response shape:
//  *   { run: { stdout, stderr } }           ← Piston raw (forwarded by backend)
//  *   { stdout, stderr }                    ← our wrapper's common shape
//  *   { output, stderr }                    ← some wrappers use "output"
//  *   { result, stderr }                    ← older internal shape
//  */
// const extractOutput = (data) => {
//   if (!data) return { stdout: '', stderr: 'Empty response from server.' };

//   // Piston-style nested { run: { stdout, stderr } }
//   if (data.run && typeof data.run === 'object') {
//     return {
//       stdout: sanitize(data.run.stdout ?? data.run.output ?? ''),
//       stderr: sanitize(data.compile?.stderr ?? data.run.stderr ?? ''),
//     };
//   }

//   // Flat wrapper shapes — check every possible field name
//   const stdout =
//     data.stdout  !== undefined ? data.stdout  :
//     data.output  !== undefined ? data.output  :
//     data.result  !== undefined ? data.result  :
//     data.out     !== undefined ? data.out     : '';

//   const stderr =
//     data.stderr  !== undefined ? data.stderr  :
//     data.error   !== undefined ? data.error   :
//     data.err     !== undefined ? data.err     : '';

//   return { stdout: sanitize(stdout), stderr: sanitize(stderr) };
// };

// /**
//  * Normalises a single result object from /campaign/submit response.
//  * The submit endpoint returns results[] where each item was already
//  * run through campaignExecutor which uses sanitizeOutput server-side.
//  * We normalise again on the frontend for safety.
//  */
// const normaliseResult = (r, index) => {
//   const stdout = sanitize(r.actual ?? r.stdout ?? r.output ?? '');
//   const stderr = sanitize(r.stderr ?? r.error  ?? '');
//   const expected = sanitize(r.expected ?? '');
//   return {
//     ...r,
//     caseNum:  index + 1,
//     actual:   stdout,
//     expected,
//     stderr,
//     passed:   r.passed ?? (stdout === expected && !stderr),
//   };
// };

// // ─── Sub-components ───────────────────────────────────────────────────────────

// const ResultRow = ({ result, index }) => {
//   const [open, setOpen] = useState(!result.passed);
//   const isHidden = result.input === 'Hidden' || !result.input;

//   return (
//     <div className={`border rounded-xl overflow-hidden ${
//       result.passed
//         ? 'border-emerald-800/40 bg-emerald-950/10'
//         : 'border-red-800/40 bg-red-950/8'
//     }`}>
//       <button
//         className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
//         onClick={() => setOpen(o => !o)}
//       >
//         <div className="flex items-center gap-2.5 min-w-0">
//           {result.passed
//             ? <CheckCircle size={14} className="text-emerald-400 shrink-0"/>
//             : <XCircle    size={14} className="text-red-400 shrink-0"    />}
//           <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
//             {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
//           </span>
//           {!result.passed && (result.error || result.stderr) && (
//             <span className="text-[10px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-900/40 truncate max-w-[160px]">
//               {result.error || (result.stderr?.split('\n')[0]) || 'Wrong Answer'}
//             </span>
//           )}
//         </div>
//         {!isHidden && (open
//           ? <ChevronUp size={12} className="text-gray-700 shrink-0"/>
//           : <ChevronDown size={12} className="text-gray-700 shrink-0"/>
//         )}
//       </button>

//       {open && !isHidden && (
//         <div className="px-3.5 pb-3 pt-2 space-y-2 border-t border-gray-800/40">
//           {[
//             { label:'Input',    val: result.input    },
//             { label:'Expected', val: result.expected },
//             { label:'Actual',   val: result.actual   },
//           ].map(r => r.val !== undefined && (
//             <div key={r.label}>
//               <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">{r.label}</p>
//               <pre className={`text-xs font-mono px-2.5 py-1.5 rounded-lg whitespace-pre-wrap break-all ${
//                 r.label === 'Actual' && !result.passed
//                   ? 'bg-red-950/25 text-red-300'
//                   : 'bg-gray-900/60 text-gray-300'
//               }`}>
//                 {r.val === '' ? <span className="italic text-gray-600">empty</span> : r.val}
//               </pre>
//             </div>
//           ))}
//           {/* Always show stderr when it exists — it's the compilation/runtime error */}
//           {result.stderr && (
//             <div>
//               <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-0.5">
//                 Compiler / Runtime Error
//               </p>
//               <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-950/20 text-orange-400 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
//                 {result.stderr}
//               </pre>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── Main component ───────────────────────────────────────────────────────────

// const CampaignEditor = () => {
//   const { nodeId } = useParams();
//   const navigate   = useNavigate();

//   const [node,         setNode]         = useState(null);
//   const [existingBest, setExistingBest] = useState(null);
//   const [loading,      setLoading]      = useState(true);

//   const [code,         setCode]         = useState('');
//   const [language,     setLanguage]     = useState('javascript');

//   const [runResults,   setRunResults]   = useState(null);
//   const [execType,     setExecType]     = useState(null);
//   const [isRunning,    setIsRunning]    = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showResults,  setShowResults]  = useState(false);

//   const [failCount,      setFailCount]      = useState(0);
//   const [showSage,       setShowSage]       = useState(false);
//   const [sageShouldShow, setSageShouldShow] = useState(false);
//   const [lastFailedCode, setLastFailedCode] = useState('');
//   const [lastError,      setLastError]      = useState('');

//   const [showSuccess,   setShowSuccess]   = useState(false);
//   const [successResult, setSuccessResult] = useState(null);
//   const [mobileTab,     setMobileTab]     = useState('problem');
//   const [elapsed,       setElapsed]       = useState(0);

//   const timerRef  = useRef(null);
//   const editorRef = useRef(null);

//   // ── Load node ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;
//     const load = async () => {
//       setLoading(true);
//       try {
//         const { data } = await api.get(`/campaign/node/${nodeId}`);
//         if (cancelled) return;
//         if (data.success || data.node) {
//           const n = data.node;
//           setNode(n);
//           setExistingBest(data.existingCompletion || null);
//           // Load starter code — prefer current language, fall back to cpp
//           const starter = n?.problemId?.starterCode?.javascript
//             || n?.problemId?.starterCode?.cpp
//             || '';
//           setCode(starter);
//         } else {
//           toast.error('Node not found');
//           navigate('/campaign');
//         }
//       } catch (err) {
//         if (cancelled) return;
//         if (err.response?.status === 403) toast.error('Complete prerequisites first!');
//         else toast.error(err.response?.data?.message || 'Failed to load challenge');
//         navigate('/campaign');
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     load();
//     return () => { cancelled = true; };
//   }, [nodeId, navigate]);

//   // ── Timer ──────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
//     return () => clearInterval(timerRef.current);
//   }, []);

//   // ── Keyboard shortcuts ────────────────────────────────────────────────────
//   useEffect(() => {
//     const h = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
//         e.preventDefault();
//         e.shiftKey ? handleSubmit() : handleRun();
//       }
//     };
//     window.addEventListener('keydown', h);
//     return () => window.removeEventListener('keydown', h);
//   }, [handleRun, handleSubmit]);

//   // ── Monaco setup ──────────────────────────────────────────────────────────
//   const handleEditorMount = useCallback((editor, monaco) => {
//     editorRef.current = editor;
//     monaco.editor.defineTheme('ca-dark', {
//       base:'vs-dark', inherit:true, rules:[],
//       colors: {
//         'editor.background':              '#07090e',
//         'editor.lineHighlightBackground': '#0e1420',
//         'editorLineNumber.foreground':    '#1e2d3d',
//         'editorLineNumber.activeForeground':'#06b6d4',
//         'editor.selectionBackground':     '#06b6d425',
//         'editorCursor.foreground':        '#06b6d4',
//       },
//     });
//     monaco.editor.setTheme('ca-dark');
//   }, []);

//   // ── Language switch ───────────────────────────────────────────────────────
//   const handleLanguageChange = useCallback((lang) => {
//     const starter = node?.problemId?.starterCode?.[language] || '';
//     if (code !== starter && code.trim().length > 0) {
//       if (!window.confirm(`Switch to ${lang}? Your code will be replaced with the starter template.`)) return;
//     }
//     setLanguage(lang);
//     setCode(node?.problemId?.starterCode?.[lang] || '');
//     setRunResults(null);
//     setShowResults(false);
//   }, [code, language, node]);

//   // ── handleRun ─────────────────────────────────────────────────────────────
//   // Uses /api/run (existing endpoint) for public test cases only.
//   // This route goes: CampaignEditor → /api/run → pistonClient → Piston.
//   // The backend may return:
//   //   { run: { stdout, stderr } }   ← if forwarding Piston raw
//   //   { stdout, stderr }            ← if our wrapper flattens it
//   //   { output, stderr }            ← older wrapper variant
//   // extractOutput() handles ALL shapes.
//   const handleRun = useCallback(async () => {
//     if (isRunning || isSubmitting || !code.trim()) return;

//     const publicCases = (node?.problemId?.testCases || []).filter(tc => tc.isPublic);
//     if (!publicCases.length) {
//       toast.error('No public test cases for this node');
//       return;
//     }

//     setIsRunning(true);
//     setRunResults(null);
//     setExecType('run');
//     setShowResults(true);
//     setShowSage(false);
//     setMobileTab('editor');

//     const results = [];

//     for (const [i, tc] of publicCases.entries()) {
//       try {
//         const response = await api.post('/run', {
//           language,
//           code,
//           stdin: tc.input,
//         });

//         const { stdout, stderr } = extractOutput(response.data);
//         const expected = sanitize(tc.output);
//         const passed   = stdout === expected && !stderr;

//         results.push({
//           caseNum:  i + 1,
//           input:    tc.input,
//           expected,
//           actual:   stdout,
//           passed,
//           stderr,
//           isPublic: true,
//         });

//       } catch (err) {
//         // Surface the real HTTP error message to the user
//         const status = err.response?.status;
//         const errMsg =
//           err.response?.data?.message ||
//           err.response?.data?.error   ||
//           err.message                 ||
//           'Execution service unavailable';

//         const userMsg = status === 503
//           ? 'Execution service is temporarily unavailable — please retry in a moment'
//           : status === 500
//             ? `Server error: ${errMsg}`
//             : errMsg;

//         results.push({
//           caseNum:  i + 1,
//           input:    tc.input,
//           expected: sanitize(tc.output),
//           actual:   '',
//           passed:   false,
//           error:    userMsg,
//           stderr:   userMsg,
//           isPublic: true,
//         });

//         // Show a toast for service-level errors (not wrong-answer)
//         if (status === 503 || status === 500) {
//           toast.error(userMsg, { duration: 5000 });
//         }
//       }
//     }

//     setRunResults(results);
//     setIsRunning(false);

//     const passedCount = results.filter(r => r.passed).length;
//     if (passedCount === results.length) {
//       toast.success(`All ${results.length} public case(s) passed ✅`, { duration: 3500 });
//     } else {
//       toast.error(`${results.length - passedCount} / ${results.length} failed`);
//     }
//   }, [code, language, node, isRunning, isSubmitting]);

//   // ── handleSubmit ──────────────────────────────────────────────────────────
//   // Uses /api/campaign/submit which runs ALL test cases server-side
//   // via campaignExecutor → pistonClient → Piston.
//   // Backend returns { allPassed, results[], stars, kpEarned, ... }
//   // Each result has: { actual, expected, passed, stderr, input }
//   const handleSubmit = useCallback(async () => {
//     if (isSubmitting || isRunning || !code.trim()) return;

//     setIsSubmitting(true);
//     setRunResults(null);
//     setExecType('submit');
//     setShowResults(true);
//     setShowSage(false);
//     setMobileTab('editor');

//     try {
//       const response = await api.post('/campaign/submit', {
//         nodeId,
//         code,
//         language,
//       });

//       const data = response.data;

//       // Normalise every result object for consistent display
//       const normResults = (data.results || []).map(normaliseResult);
//       setRunResults(normResults);

//       if (data.allPassed) {
//         clearInterval(timerRef.current);
//         setSuccessResult({ ...data, elapsedSeconds: elapsed });
//         setShowSuccess(true);
//         setFailCount(0);
//         setSageShouldShow(false);
//       } else {
//         const newFails = failCount + 1;
//         setFailCount(newFails);

//         // Give the Sage the best available error context
//         const failedResult = normResults.find(r => !r.passed);
//         const errMsg = failedResult?.stderr || failedResult?.error || 'Wrong answer on hidden test case';
//         setLastFailedCode(code);
//         setLastError(errMsg);

//         if (data.sageShouldTrigger || newFails >= 3) {
//           setSageShouldShow(true);
//           if (newFails === 3) toast('⚗️ The Sage has sensed your struggle…', { duration: 4000 });
//         } else {
//           const passed = normResults.filter(r => r.passed).length;
//           const total  = normResults.length;
//           toast.error(`${total - passed} case(s) failed · Attempt ${newFails}/3 before Sage`);
//         }
//       }

//     } catch (err) {
//       const status = err.response?.status;
//       const errMsg =
//         err.response?.data?.message ||
//         err.response?.data?.error   ||
//         err.message                 ||
//         'Submission failed';

//       const userMsg = status === 503
//         ? 'Execution service is temporarily unavailable — please retry in a moment'
//         : status === 500
//           ? `Server error: ${errMsg}`
//           : errMsg;

//       toast.error(userMsg, { duration: 5000 });

//       // Show an error row so the user can see what failed
//       setRunResults([{
//         caseNum:  1,
//         input:    'N/A',
//         expected: 'N/A',
//         actual:   '',
//         passed:   false,
//         error:    userMsg,
//         stderr:   userMsg,
//       }]);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [code, language, nodeId, isSubmitting, isRunning, failCount, elapsed]);

//   // ── Derived ───────────────────────────────────────────────────────────────
//   const isBusy      = isRunning || isSubmitting;
//   const passedCount = useMemo(() => (runResults || []).filter(r => r.passed).length, [runResults]);
//   const totalCount  = runResults?.length ?? 0;
//   const allPassed   = totalCount > 0 && passedCount === totalCount;
//   const problem     = node?.problemId;

//   // ── Loading ───────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-[#06080e] dark:bg-[#06080e] flex items-center justify-center gap-4">
//       <Loader2 size={32} className="animate-spin text-cyan-500"/>
//       <p className="text-gray-500 font-bold text-sm">Loading challenge…</p>
//     </div>
//   );

//   if (!node || !problem) return (
//     <div className="min-h-screen bg-[#06080e] flex items-center justify-center text-gray-600">
//       Challenge not found.
//     </div>
//   );

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="h-screen bg-slate-50 dark:bg-[#06080e] flex flex-col overflow-hidden">

//       {/* ── TOP BAR ─────────────────────────────────────────────────── */}
//       <header className="h-[52px] bg-white dark:bg-[#07090f]/95 border-b border-slate-200 dark:border-gray-800/50 flex items-center gap-2.5 px-3 sm:px-4 shrink-0 backdrop-blur-md z-20">

//         <button onClick={() => navigate('/campaign')}
//           className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 dark:text-gray-600 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-lg transition-all shrink-0 text-xs font-bold">
//           <ArrowLeft size={16}/>
//           <span className="hidden sm:inline">Map</span>
//         </button>

//         <div className="w-px h-4 bg-slate-200 dark:bg-gray-800 shrink-0"/>

//         <div className="flex items-center gap-2 flex-1 min-w-0">
//           <h1 className="text-slate-900 dark:text-white font-black text-sm truncate">{problem.title}</h1>
//           {problem.difficulty && (
//             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline-flex ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>
//               {problem.difficulty}
//             </span>
//           )}
//           {node.nodeType === 'boss' && (
//             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 shrink-0 hidden sm:inline-flex">Boss</span>
//           )}
//         </div>

//         <select value={language} onChange={e => handleLanguageChange(e.target.value)} disabled={isBusy}
//           className="bg-slate-100 dark:bg-gray-900/80 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50 cursor-pointer disabled:opacity-50 shrink-0 hidden sm:block">
//           {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
//         </select>

//         <div className="flex items-center gap-1 text-slate-500 dark:text-gray-600 shrink-0">
//           <Clock size={12}/>
//           <span className="font-mono text-xs tabular-nums">{fmt(elapsed)}</span>
//         </div>

//         <div className="hidden sm:flex items-center gap-2 shrink-0">
//           <button onClick={handleRun} disabled={isBusy || !code.trim()}
//             title="Run (Ctrl+Enter)"
//             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40">
//             {isRunning ? <Loader2 size={13} className="animate-spin"/> : <Play size={13}/>}
//             {isRunning ? 'Running…' : 'Run'}
//           </button>

//           <button onClick={handleSubmit} disabled={isBusy || !code.trim()}
//             title="Submit (Ctrl+Shift+Enter)"
//             className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40">
//             {isSubmitting ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
//             {isSubmitting ? 'Judging…' : 'Submit'}
//           </button>
//         </div>
//       </header>

//       {/* ── MOBILE TAB BAR ──────────────────────────────────────────── */}
//       <div className="sm:hidden flex items-center border-b border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#07090f]/80 shrink-0">
//         {[{id:'problem',icon:BookOpen,label:'Problem'},{id:'editor',icon:Code2,label:'Editor'}].map(t=>(
//           <button key={t.id} onClick={()=>setMobileTab(t.id)}
//             className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${mobileTab===t.id?'border-cyan-500 text-cyan-500':'border-transparent text-slate-400 dark:text-gray-600'}`}>
//             <t.icon size={13}/>{t.label}
//           </button>
//         ))}
//         <div className="px-2">
//           <select value={language} onChange={e=>handleLanguageChange(e.target.value)} disabled={isBusy}
//             className="bg-slate-100 dark:bg-gray-900 border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 text-[11px] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer disabled:opacity-50">
//             {LANG_OPTIONS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* ── MAIN SPLIT ──────────────────────────────────────────────── */}
//       <div className="flex-1 min-h-0 overflow-hidden">

//         {/* Desktop: resizable panels */}
//         <div className="hidden sm:flex h-full">
//           <PanelGroup orientation="horizontal" autoSaveId="ca-editor-v4" className="h-full">

//             {/* LEFT: Problem description */}
//             <Panel defaultSize={38} minSize={22} maxSize={65}>
//               <div className="h-full bg-white dark:bg-[#07090f] border-r border-slate-200 dark:border-gray-800/40 flex flex-col overflow-y-auto">
//                 <ProblemPanel node={node} existingBest={existingBest}/>
//               </div>
//             </Panel>

//             {/* Drag gutter */}
//             <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-gray-800/40 hover:bg-cyan-500/40 transition-colors cursor-col-resize group">
//               <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
//                 <div className="w-0.5 h-10 bg-cyan-500/60 rounded-full"/>
//               </div>
//             </PanelResizeHandle>

//             {/* RIGHT: Editor + results */}
//             <Panel defaultSize={62} minSize={30}>
//               <EditorPane
//                 code={code} setCode={setCode} language={language}
//                 handleEditorMount={handleEditorMount}
//                 showResults={showResults} setShowResults={setShowResults}
//                 runResults={runResults} execType={execType}
//                 passedCount={passedCount} totalCount={totalCount} allPassed={allPassed}
//                 sageShouldShow={sageShouldShow} showSage={showSage} setShowSage={setShowSage}
//                 nodeId={nodeId} lastFailedCode={lastFailedCode} lastError={lastError}
//               />
//             </Panel>
//           </PanelGroup>
//         </div>

//         {/* Mobile: tab-based */}
//         <div className="sm:hidden h-full">
//           {mobileTab === 'problem' ? (
//             <div className="h-full bg-white dark:bg-[#07090f] overflow-y-auto">
//               <ProblemPanel node={node} existingBest={existingBest}/>
//             </div>
//           ) : (
//             <EditorPane
//               code={code} setCode={setCode} language={language}
//               handleEditorMount={handleEditorMount}
//               showResults={showResults} setShowResults={setShowResults}
//               runResults={runResults} execType={execType}
//               passedCount={passedCount} totalCount={totalCount} allPassed={allPassed}
//               sageShouldShow={sageShouldShow} showSage={showSage} setShowSage={setShowSage}
//               nodeId={nodeId} lastFailedCode={lastFailedCode} lastError={lastError}
//             />
//           )}
//         </div>
//       </div>

//       {/* ── MOBILE BOTTOM BAR ───────────────────────────────────────── */}
//       <div className="sm:hidden flex gap-2 px-3 py-2 bg-white dark:bg-[#07090f]/95 border-t border-slate-200 dark:border-gray-800/50 shrink-0">
//         <button onClick={handleRun} disabled={isBusy||!code.trim()}
//           className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40">
//           {isRunning?<Loader2 size={14} className="animate-spin"/>:<Play size={14}/>}
//           {isRunning?'Running…':'Run'}
//         </button>
//         <button onClick={handleSubmit} disabled={isBusy||!code.trim()}
//           className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition-all disabled:opacity-40">
//           {isSubmitting?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>}
//           {isSubmitting?'Judging…':'Submit'}
//         </button>
//       </div>

//       {/* ── MODALS ──────────────────────────────────────────────────── */}
//       <SuccessModal
//         isOpen={showSuccess}
//         result={successResult}
//         onViewMap={() => navigate('/campaign')}
//         onContinue={() => { setShowSuccess(false); setRunResults(null); setShowResults(false); }}
//       />
//     </div>
//   );
// };

// // ─── Problem panel ────────────────────────────────────────────────────────────
// const ProblemPanel = ({ node, existingBest }) => {
//   const problem = node?.problemId;
//   if (!problem) return null;
//   const publicCases = (problem.testCases || []).filter(tc => tc.isPublic);
//   return (
//     <div className="px-5 py-5 space-y-5 text-[13px]">
//       <div>
//         <div className="flex items-center gap-2 flex-wrap mb-2">
//           {node.nodeType === 'boss' && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">⚔️ Boss</span>}
//           {problem.difficulty && <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFF_BADGE[problem.difficulty]||DIFF_BADGE.Easy}`}>{problem.difficulty}</span>}
//           {problem.timeLimit && <span className="text-[11px] text-slate-400 dark:text-gray-600 flex items-center gap-1"><Clock size={10}/>{problem.timeLimit}ms limit</span>}
//         </div>
//         <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{problem.title}</h2>
//       </div>
//       {existingBest && (
//         <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
//           <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm"/>
//           <span className="text-xs text-amber-600 dark:text-amber-400/80 flex-1">Your best</span>
//           {existingBest.bestTimeMs && <span className="text-xs font-mono text-slate-400 dark:text-gray-600">{existingBest.bestTimeMs}ms avg</span>}
//         </div>
//       )}
//       <div>
//         <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Star Thresholds</p>
//         <div className="space-y-1.5">
//           {[{s:1,label:'Pass all hidden test cases'},{s:2,label:`Avg time < ${node.starThresholds?.twoStarTimeMs??'?'}ms`},{s:3,label:`Avg time < ${node.starThresholds?.threeStarTimeMs??'?'}ms`}].map(r=>(
//             <div key={r.s} className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-gray-900/40 rounded-lg">
//               <StarDisplay stars={r.s} total={3} size="sm"/>
//               <span className="text-slate-400 dark:text-gray-600 text-[11px]">{r.label}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div>
//         <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Description</p>
//         <div className="text-slate-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{__html:(problem.description||'').replace(/\n/g,'<br/>')}}/>
//       </div>
//       {problem.constraints?.length > 0 && (
//         <div>
//           <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Constraints</p>
//           <ul className="space-y-1">
//             {problem.constraints.map((c,i)=>(
//               <li key={i} className="flex items-start gap-2 text-slate-500 dark:text-gray-500">
//                 <span className="text-cyan-500 mt-0.5 shrink-0">›</span>
//                 <span className="font-mono text-[12px]">{c}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//       {publicCases.length > 0 && (
//         <div>
//           <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Examples (public)</p>
//           {publicCases.map((tc,i)=>(
//             <div key={i} className="mb-3 bg-slate-100 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
//               <div className="px-3 py-1.5 border-b border-slate-200 dark:border-gray-800/40 bg-slate-50 dark:bg-gray-900/40">
//                 <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">Example {i+1}</span>
//               </div>
//               <div className="p-3 space-y-2">
//                 <div><p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Input</p><pre className="text-xs font-mono text-slate-700 dark:text-gray-300 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.input}</pre></div>
//                 <div><p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Output</p><pre className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.output}</pre></div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//       <div className="h-4"/>
//     </div>
//   );
// };

// // ─── Editor pane (shared between desktop panel and mobile tab) ────────────────
// const EditorPane = ({
//   code, setCode, language, handleEditorMount,
//   showResults, setShowResults, runResults, execType,
//   passedCount, totalCount, allPassed,
//   sageShouldShow, showSage, setShowSage,
//   nodeId, lastFailedCode, lastError,
// }) => (
//   <div className="h-full flex flex-col bg-[#07090e] relative">
//     <div className="flex-1 min-h-0">
//       <Editor
//         height="100%"
//         language={MONACO_LANG[language]}
//         value={code}
//         onChange={v => setCode(v || '')}
//         onMount={handleEditorMount}
//         options={{
//           minimap:{enabled:false}, fontSize:13.5,
//           fontFamily:"'JetBrains Mono','Cascadia Code','Fira Code',monospace",
//           fontLigatures:true, lineNumbers:'on', scrollBeyondLastLine:false,
//           wordWrap:'on', tabSize:4, automaticLayout:true,
//           padding:{top:16,bottom:16}, renderLineHighlight:'all',
//           bracketPairColorization:{enabled:true},
//           scrollbar:{vertical:'auto',horizontal:'auto'},
//         }}
//       />
//     </div>

//     <AnimatePresence>
//       {showResults && runResults && (
//         <motion.div
//           initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
//           transition={{duration:0.2}}
//           className="border-t border-gray-800/50 bg-[#07090f] overflow-hidden shrink-0">
//           <div className="max-h-64 overflow-y-auto">
//             <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[#07090f] border-b border-gray-800/40 z-10">
//               <div className="flex items-center gap-2">
//                 {allPassed ? <CheckCircle size={14} className="text-emerald-400"/> : <XCircle size={14} className="text-red-400"/>}
//                 <span className={`text-xs font-bold ${allPassed?'text-emerald-400':'text-red-400'}`}>
//                   {execType==='run'?'Run':'Submit'} · {passedCount}/{totalCount} passed
//                 </span>
//               </div>
//               <button onClick={()=>setShowResults(false)} className="text-gray-700 hover:text-gray-400 text-xs">✕</button>
//             </div>
//             <div className="px-3 py-3 space-y-2">
//               {runResults.map((r,i) => <ResultRow key={i} result={r} index={i}/>)}
//             </div>
//             {sageShouldShow && !showSage && (
//               <div className="px-3 pb-3">
//                 <button onClick={()=>setShowSage(true)}
//                   className="w-full flex items-center justify-center gap-2 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-700/35 text-purple-300 text-xs font-bold rounded-xl transition-all">
//                   <Sparkles size={13}/> Consult The Sage
//                 </button>
//               </div>
//             )}
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>

//     <SagePanel
//       nodeId={nodeId} failedCode={lastFailedCode}
//       errorMessage={lastError} language={language}
//       isVisible={showSage} onClose={()=>setShowSage(false)}
//     />
//   </div>
// );

// export default CampaignEditor;













































































// src/pages/CampaignEditor.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ALL CRASHES FIXED:
//
//  CRASH 1 (TDZ / Black Screen): keyboard useEffect MUST live AFTER handleRun
//  and handleSubmit const declarations. Vite minifies them to short names like
//  'Ze'; referencing 'Ze' before its `const` line = ReferenceError in prod.
//
//  CRASH 2: react-resizable-panels has been COMPLETELY REMOVED. Layout uses
//  100% plain Tailwind flexbox — nothing that can crash at import time.
//
//  CRASH 3: language in the node-load useEffect dep array caused an infinite
//  re-fetch loop. Fixed: load only on [nodeId] change, set starter code once.
//
//  OUTPUT BUG: extractOutput() handles every Piston/wrapper response shape.
//  handleRun sends both `stdin` and `input` to cover all backend variants.
//  sanitize() never strips "0" or "false" — they stringify correctly.
//
//  MOBILE: 100dvh flex-col layout with sticky bottom tab bar. Works on iOS.
//  THEMING: All hardcoded hex colours replaced with dark: semantic classes.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
// ✅ react-resizable-panels REMOVED — was causing production bundle crashes
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Sparkles, Clock, BookOpen, Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import SuccessModal from '../components/Campaign/SuccessModal';
import SagePanel    from '../components/Campaign/SagePanel';
import StarDisplay  from '../components/Campaign/StarDisplay';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DIFF_BADGE = {
  Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Medium: 'bg-amber-500/10   text-amber-400   border-amber-500/25',
  Hard:   'bg-red-500/10     text-red-400     border-red-500/25',
};

const fmt = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Output helpers ───────────────────────────────────────────────────────────

/**
 * Normalise ANY value to a stable comparison string.
 * Never strips "0", "false", empty arrays — only normalises whitespace.
 */
const sanitize = (raw) => {
  if (raw == null) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) return sanitize(raw.join('\n'));
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return s
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').map(l => l.trimEnd()).join('\n')
    .replace(/\n+$/, '').trim();
};

/**
 * Extracts { stdout, stderr } from every possible backend/Piston response shape:
 *   Piston native:  { run: { stdout, stderr, code }, compile: { stderr } }
 *   Flat wrapper:   { stdout }  |  { output }  |  { result }  |  { out }
 */
const extractOutput = (data) => {
  if (!data) return { stdout: '', stderr: 'Empty response from server.' };

  if (data.run && typeof data.run === 'object') {
    return {
      stdout: sanitize(data.run.stdout ?? data.run.output ?? ''),
      stderr: sanitize(data.compile?.stderr ?? data.run.stderr ?? ''),
    };
  }

  const stdout =
    data.stdout !== undefined ? data.stdout :
    data.output !== undefined ? data.output :
    data.result !== undefined ? data.result :
    data.out    !== undefined ? data.out    : '';

  const stderr =
    data.stderr !== undefined ? data.stderr :
    data.error  !== undefined ? data.error  :
    data.err    !== undefined ? data.err    : '';

  return { stdout: sanitize(stdout), stderr: sanitize(stderr) };
};

const normaliseResult = (r, index) => {
  const stdout   = sanitize(r.actual ?? r.stdout ?? r.output ?? '');
  const stderr   = sanitize(r.stderr ?? r.error  ?? '');
  const expected = sanitize(r.expected ?? '');
  return {
    ...r,
    caseNum:  index + 1,
    actual:   stdout,
    expected,
    stderr,
    passed:   r.passed ?? (stdout === expected && !stderr),
  };
};

// ─── ResultRow ────────────────────────────────────────────────────────────────

const ResultRow = ({ result, index }) => {
  const [open, setOpen] = useState(!result.passed);
  const isHidden = result.input === 'Hidden' || !result.input;

  return (
    <div className={`border rounded-xl overflow-hidden ${
      result.passed
        ? 'border-emerald-800/40 bg-emerald-950/10'
        : 'border-red-800/40 bg-red-950/[0.08]'
    }`}>
      <button
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {result.passed
            ? <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            : <XCircle    size={14} className="text-red-400 shrink-0"     />}
          <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
          </span>
          {!result.passed && (result.error || result.stderr) && (
            <span className="text-[10px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-900/40 truncate max-w-[160px]">
              {result.error || result.stderr?.split('\n')[0] || 'Wrong Answer'}
            </span>
          )}
        </div>
        {!isHidden && (open
          ? <ChevronUp   size={12} className="text-gray-700 shrink-0" />
          : <ChevronDown size={12} className="text-gray-700 shrink-0" />
        )}
      </button>

      {open && !isHidden && (
        <div className="px-3.5 pb-3 pt-2 space-y-2 border-t border-gray-800/40">
          {[
            { label: 'Input',    val: result.input    },
            { label: 'Expected', val: result.expected },
            { label: 'Actual',   val: result.actual   },
          ].map(row => row.val !== undefined && (
            <div key={row.label}>
              <p className="text-[10px] font-bold text-gray-600 dark:text-gray-700 uppercase tracking-wider mb-0.5">
                {row.label}
              </p>
              <pre className={`text-xs font-mono px-2.5 py-1.5 rounded-lg whitespace-pre-wrap break-all ${
                row.label === 'Actual' && !result.passed
                  ? 'bg-red-950/25 text-red-300'
                  : 'bg-gray-100 dark:bg-gray-900/60 text-slate-700 dark:text-gray-300'
              }`}>
                {row.val === '' ? <span className="italic text-gray-500">empty</span> : row.val}
              </pre>
            </div>
          ))}
          {result.stderr && (
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">
                Compiler / Runtime Error
              </p>
              <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-950/20 text-orange-400 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
                {result.stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ProblemPanel ─────────────────────────────────────────────────────────────

const ProblemPanel = ({ node, existingBest }) => {
  const problem = node?.problemId;
  if (!problem) return null;
  const publicCases = (problem.testCases || []).filter(tc => tc.isPublic);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-5 py-5 space-y-5 text-[13px]">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {node?.nodeType === 'boss' && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">
                ⚔️ Boss
              </span>
            )}
            {problem.difficulty && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>
                {problem.difficulty}
              </span>
            )}
            {problem.timeLimit && (
              <span className="text-[11px] text-slate-400 dark:text-gray-600 flex items-center gap-1">
                <Clock size={10} />{problem.timeLimit}ms limit
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            {problem.title}
          </h2>
        </div>

        {existingBest && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
            <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm" />
            <span className="text-xs text-amber-600 dark:text-amber-400/80 flex-1">Your best</span>
            {existingBest.bestTimeMs && (
              <span className="text-xs font-mono text-slate-400 dark:text-gray-600">
                {existingBest.bestTimeMs}ms avg
              </span>
            )}
          </div>
        )}

        {node?.starThresholds && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">
              Star Thresholds
            </p>
            <div className="space-y-1.5">
              {[
                { s: 1, label: 'Pass all hidden test cases' },
                { s: 2, label: `Avg time < ${node.starThresholds?.twoStarTimeMs ?? '?'}ms` },
                { s: 3, label: `Avg time < ${node.starThresholds?.threeStarTimeMs ?? '?'}ms` },
              ].map(r => (
                <div key={r.s} className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-gray-900/40 rounded-lg">
                  <StarDisplay stars={r.s} total={3} size="sm" />
                  <span className="text-slate-400 dark:text-gray-600 text-[11px]">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {problem.description && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">
              Description
            </p>
            <div
              className="text-slate-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: (problem.description || '').replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        )}

        {problem.constraints?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">
              Constraints
            </p>
            <ul className="space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-500 dark:text-gray-500">
                  <span className="text-cyan-500 mt-0.5 shrink-0">›</span>
                  <span className="font-mono text-[12px]">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {publicCases.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">
              Examples (public)
            </p>
            {publicCases.map((tc, i) => (
              <div key={i} className="mb-3 bg-slate-100 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-gray-800/40 bg-slate-50 dark:bg-gray-900/40">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">
                    Example {i + 1}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Input</p>
                    <pre className="text-xs font-mono text-slate-700 dark:text-gray-300 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">
                      {tc.input}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Output</p>
                    <pre className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">
                      {tc.output}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
};

// ─── EditorPane ───────────────────────────────────────────────────────────────

const EditorPane = ({
  code, setCode, language, handleEditorMount,
  showResults, setShowResults, runResults, execType,
  passedCount, totalCount, allPassed,
  sageShouldShow, showSage, setShowSage,
  nodeId, lastFailedCode, lastError,
}) => (
  <div className="h-full flex flex-col bg-[#07090e] relative overflow-hidden">
    <div className="flex-1 min-h-0">
      <Editor
        height="100%"
        language={MONACO_LANG[language] || 'javascript'}
        value={code}
        onChange={v => setCode(v || '')}
        onMount={handleEditorMount}
        options={{
          minimap:              { enabled: false },
          fontSize:             13.5,
          fontFamily:           "'JetBrains Mono','Cascadia Code','Fira Code',monospace",
          fontLigatures:        true,
          lineNumbers:          'on',
          scrollBeyondLastLine: false,
          wordWrap:             'on',
          tabSize:              4,
          automaticLayout:      true,
          padding:              { top: 16, bottom: 16 },
          renderLineHighlight:  'all',
          bracketPairColorization: { enabled: true },
          scrollbar:            { vertical: 'auto', horizontal: 'auto' },
        }}
      />
    </div>

    <AnimatePresence>
      {showResults && runResults && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-800/50 bg-[#07090f] overflow-hidden shrink-0"
        >
          <div className="max-h-60 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[#07090f] border-b border-gray-800/40 z-10">
              <div className="flex items-center gap-2">
                {allPassed
                  ? <CheckCircle size={14} className="text-emerald-400" />
                  : <XCircle    size={14} className="text-red-400"     />}
                <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {execType === 'run' ? 'Run' : 'Submit'} · {passedCount}/{totalCount} passed
                </span>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-600 hover:text-gray-300 text-xs px-1"
              >
                ✕
              </button>
            </div>
            <div className="px-3 py-3 space-y-2">
              {runResults.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
            {sageShouldShow && !showSage && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => setShowSage(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-700/35 text-purple-300 text-xs font-bold rounded-xl transition-all"
                >
                  <Sparkles size={13} /> Consult The Sage
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <SagePanel
      nodeId={nodeId}
      failedCode={lastFailedCode}
      errorMessage={lastError}
      language={language}
      isVisible={showSage}
      onClose={() => setShowSage(false)}
    />
  </div>
);

// ─── Main CampaignEditor ──────────────────────────────────────────────────────

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

  const [failCount,      setFailCount]      = useState(0);
  const [showSage,       setShowSage]       = useState(false);
  const [sageShouldShow, setSageShouldShow] = useState(false);
  const [lastFailedCode, setLastFailedCode] = useState('');
  const [lastError,      setLastError]      = useState('');

  const [showSuccess,    setShowSuccess]   = useState(false);
  const [successResult,  setSuccessResult] = useState(null);
  const [mobileTab,      setMobileTab]     = useState('problem');
  const [elapsed,        setElapsed]       = useState(0);

  const timerRef  = useRef(null);
  const editorRef = useRef(null);

  // ── Load node ─────────────────────────────────────────────────────────────
  // ✅ FIXED: `language` removed from dep array — it caused infinite re-fetch.
  //    Starter code for the initial language is set once on load.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/campaign/node/${nodeId}`);
        if (cancelled) return;
        if (data?.node) {
          const n = data.node;
          setNode(n);
          setExistingBest(data.existingCompletion || null);
          const starter =
            n?.problemId?.starterCode?.javascript ||
            n?.problemId?.starterCode?.cpp        ||
            n?.problemId?.starterCode?.python     ||
            '';
          setCode(starter);
          setLanguage('javascript');
        } else {
          toast.error('Node not found');
          navigate('/campaign');
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 403) toast.error('Complete prerequisites first!');
        else toast.error(err.response?.data?.message || 'Failed to load challenge');
        navigate('/campaign');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [nodeId, navigate]); // ← language intentionally omitted

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Monaco setup ──────────────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('ca-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background':               '#07090e',
        'editor.lineHighlightBackground':  '#0e1420',
        'editorLineNumber.foreground':     '#1e2d3d',
        'editorLineNumber.activeForeground': '#06b6d4',
        'editor.selectionBackground':      '#06b6d425',
        'editorCursor.foreground':         '#06b6d4',
      },
    });
    monaco.editor.setTheme('ca-dark');
  }, []);

  // ── Language switch ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((lang) => {
    const currentStarter = node?.problemId?.starterCode?.[language] || '';
    if (code !== currentStarter && code.trim().length > 0) {
      if (!window.confirm(`Switch to ${lang}? Your current code will be replaced.`)) return;
    }
    setLanguage(lang);
    setCode(node?.problemId?.starterCode?.[lang] || '');
    setRunResults(null);
    setShowResults(false);
  }, [code, language, node]);

  // ── handleRun ─────────────────────────────────────────────────────────────
  // NOTE: This const MUST be declared before the keyboard useEffect below.
  const handleRun = useCallback(async () => {
    if (isRunning || isSubmitting || !code.trim()) return;

    const publicCases = (node?.problemId?.testCases || []).filter(tc => tc.isPublic);
    if (!publicCases.length) {
      toast.error('No public test cases for this node');
      return;
    }

    setIsRunning(true);
    setRunResults(null);
    setExecType('run');
    setShowResults(true);
    setShowSage(false);
    setMobileTab('editor');

    const results = [];
    for (const [i, tc] of publicCases.entries()) {
      try {
        const response = await api.post('/run', {
          language,
          code,
          stdin: tc.input, // primary
          input: tc.input, // fallback for backends expecting 'input'
        });

        console.log('Raw Backend Response:', response.data);

        const { stdout, stderr } = extractOutput(response.data);
        const expected = sanitize(tc.output);
        const passed   = stdout === expected && !stderr;

        results.push({
          caseNum: i + 1, input: tc.input, expected, actual: stdout,
          passed, stderr, isPublic: true,
        });
      } catch (err) {
        const status  = err.response?.status;
        const errMsg  =
          err.response?.data?.message ||
          err.response?.data?.error   ||
          err.message                 ||
          'Execution service unavailable';
        const userMsg = status === 503
          ? 'Execution service is temporarily unavailable — please retry in a moment'
          : status === 500 ? `Server error: ${errMsg}` : errMsg;

        results.push({
          caseNum: i + 1, input: tc.input, expected: sanitize(tc.output),
          actual: '', passed: false, error: userMsg, stderr: userMsg, isPublic: true,
        });
        if (status === 503 || status === 500) toast.error(userMsg, { duration: 5000 });
      }
    }

    setRunResults(results);
    setIsRunning(false);
    const pc = results.filter(r => r.passed).length;
    if (pc === results.length) {
      toast.success(`All ${results.length} public case(s) passed ✅`, { duration: 3500 });
    } else {
      toast.error(`${results.length - pc} / ${results.length} failed`);
    }
  }, [code, language, node, isRunning, isSubmitting]);

  // ── handleSubmit ──────────────────────────────────────────────────────────
  // NOTE: This const MUST be declared before the keyboard useEffect below.
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isRunning || !code.trim()) return;

    setIsSubmitting(true);
    setRunResults(null);
    setExecType('submit');
    setShowResults(true);
    setShowSage(false);
    setMobileTab('editor');

    try {
      const response = await api.post('/campaign/submit', { nodeId, code, language });

      console.log('Raw Backend Response:', response.data);

      const data        = response.data;
      const normResults = (data.results || []).map(normaliseResult);
      setRunResults(normResults);

      if (data.allPassed) {
        clearInterval(timerRef.current);
        setSuccessResult({ ...data, elapsedSeconds: elapsed });
        setShowSuccess(true);
        setFailCount(0);
        setSageShouldShow(false);
      } else {
        const newFails     = failCount + 1;
        setFailCount(newFails);
        const failedResult = normResults.find(r => !r.passed);
        const errMsg       = failedResult?.stderr || failedResult?.error || 'Wrong answer';
        setLastFailedCode(code);
        setLastError(errMsg);

        if (data.sageShouldTrigger || newFails >= 3) {
          setSageShouldShow(true);
          if (newFails === 3) toast('⚗️ The Sage has sensed your struggle…', { duration: 4000 });
        } else {
          const p = normResults.filter(r => r.passed).length;
          toast.error(`${normResults.length - p} case(s) failed · Attempt ${newFails}/3 before Sage`);
        }
      }
    } catch (err) {
      const status  = err.response?.status;
      const errMsg  =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        'Submission failed';
      const userMsg = status === 503
        ? 'Execution service is temporarily unavailable — please retry in a moment'
        : status === 500 ? `Server error: ${errMsg}` : errMsg;

      toast.error(userMsg, { duration: 5000 });
      setRunResults([{
        caseNum: 1, input: 'N/A', expected: 'N/A', actual: '',
        passed: false, error: userMsg, stderr: userMsg,
      }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, nodeId, isSubmitting, isRunning, failCount, elapsed]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // ✅ CRITICAL FIX: This useEffect MUST be placed AFTER handleRun and
  //    handleSubmit const declarations. In Vite's production build, these
  //    functions get minified to names like 'Ze'. Referencing 'Ze' in a
  //    useEffect dependency array that runs BEFORE the `const Ze = ...` line
  //    triggers JavaScript's Temporal Dead Zone → ReferenceError → black screen.
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
  }, [handleRun, handleSubmit]); // ← safe: both are declared above this line

  // ── Derived values ────────────────────────────────────────────────────────
  const isBusy      = isRunning || isSubmitting;
  const passedCount = useMemo(() => (runResults || []).filter(r => r.passed).length, [runResults]);
  const totalCount  = runResults?.length ?? 0;
  const allPassed   = totalCount > 0 && passedCount === totalCount;
  const problem     = node?.problemId;

  // ── Shared editor pane props ──────────────────────────────────────────────
  const editorPaneProps = {
    code, setCode, language, handleEditorMount,
    showResults, setShowResults, runResults, execType,
    passedCount, totalCount, allPassed,
    sageShouldShow, showSage, setShowSage,
    nodeId, lastFailedCode, lastError,
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex items-center justify-center gap-4">
      <Loader2 size={32} className="animate-spin text-cyan-500" />
      <p className="text-slate-500 dark:text-gray-500 font-bold text-sm">Loading challenge…</p>
    </div>
  );

  if (!node || !problem) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-slate-400 dark:text-gray-600 text-center">Challenge not found or not yet unlocked.</p>
      <button
        onClick={() => navigate('/campaign')}
        className="px-4 py-2 bg-cyan-500 text-black font-bold text-sm rounded-xl"
      >
        ← Back to Map
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT — Pure Tailwind Flexbox, zero external panel libraries
  //
  // Desktop (sm+): flex-row → [40% problem | 60% editor], both 100% height
  // Mobile:        flex-col → tab bar at top, sticky action bar at bottom
  //                Uses 100dvh so iOS Safari bottom bar doesn't cause overflow
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="h-[52px] bg-white dark:bg-[#07090f]/95 border-b border-slate-200 dark:border-gray-800/50 flex items-center gap-2.5 px-3 sm:px-4 shrink-0 z-20 backdrop-blur-md">
        <button
          onClick={() => navigate('/campaign')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 dark:text-gray-600 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-lg transition-all shrink-0 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Map</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-gray-800 shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-slate-900 dark:text-white font-black text-sm truncate">
            {problem?.title}
          </h1>
          {problem?.difficulty && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline-flex ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>
              {problem.difficulty}
            </span>
          )}
          {node?.nodeType === 'boss' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 shrink-0 hidden sm:inline-flex">
              Boss
            </span>
          )}
        </div>

        <select
          value={language}
          onChange={e => handleLanguageChange(e.target.value)}
          disabled={isBusy}
          className="bg-slate-100 dark:bg-gray-900/80 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer disabled:opacity-50 shrink-0 hidden sm:block"
        >
          {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <div className="flex items-center gap-1 text-slate-500 dark:text-gray-600 shrink-0">
          <Clock size={12} />
          <span className="font-mono text-xs tabular-nums">{fmt(elapsed)}</span>
        </div>

        {/* Desktop Run/Submit */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={handleRun}
            disabled={isBusy || !code.trim()}
            title="Run (Ctrl+Enter)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
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

      {/* ── MOBILE TAB BAR ──────────────────────────────────────────── */}
      <div className="sm:hidden flex items-center border-b border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#07090f]/80 shrink-0">
        {[
          { id: 'problem', icon: BookOpen, label: 'Problem' },
          { id: 'editor',  icon: Code2,    label: 'Editor'  },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              mobileTab === t.id
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-slate-400 dark:text-gray-600'
            }`}
          >
            <t.icon size={13} />{t.label}
          </button>
        ))}
        <div className="px-2 shrink-0">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            disabled={isBusy}
            className="bg-slate-100 dark:bg-gray-900 border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 text-[11px] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer disabled:opacity-50"
          >
            {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ── DESKTOP: side-by-side ──────────────────────────────────
            Pure CSS flex-row. No external panel library. No crashes.
            40% problem panel / 60% editor panel, separated by a border. */}
        <div className="hidden sm:flex h-full">
          {/* Problem panel — 40% */}
          <div className="w-2/5 h-full bg-white dark:bg-[#07090f] border-r border-slate-200 dark:border-gray-800/40 flex flex-col overflow-hidden">
            <ProblemPanel node={node} existingBest={existingBest} />
          </div>

          {/* Drag-to-resize handle visual (purely decorative, no library) */}
          <div className="w-1 shrink-0 bg-slate-200 dark:bg-gray-800/40 hover:bg-cyan-500/40 transition-colors cursor-col-resize" />

          {/* Editor panel — 60% */}
          <div className="flex-1 h-full overflow-hidden">
            <EditorPane {...editorPaneProps} />
          </div>
        </div>

        {/* ── MOBILE: tab-switched views ─────────────────────────────── */}
        <div className="sm:hidden h-full overflow-hidden">
          {mobileTab === 'problem' ? (
            <div className="h-full bg-white dark:bg-[#07090f] overflow-hidden">
              <ProblemPanel node={node} existingBest={existingBest} />
            </div>
          ) : (
            <EditorPane {...editorPaneProps} />
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM ACTION BAR ─────────────────────────────────── */}
      <div className="sm:hidden flex gap-2 px-3 py-2 bg-white dark:bg-[#07090f]/95 border-t border-slate-200 dark:border-gray-800/50 shrink-0">
        <button
          onClick={handleRun}
          disabled={isBusy || !code.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isRunning ? 'Running…' : 'Run'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isBusy || !code.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition-all disabled:opacity-40"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isSubmitting ? 'Judging…' : 'Submit'}
        </button>
      </div>

      {/* ── SUCCESS MODAL ─────────────────────────────────────────────── */}
      <SuccessModal
        isOpen={showSuccess}
        result={successResult}
        onViewMap={() => navigate('/campaign')}
        onContinue={() => {
          setShowSuccess(false);
          setRunResults(null);
          setShowResults(false);
        }}
      />
    </div>
  );
};

export default CampaignEditor;