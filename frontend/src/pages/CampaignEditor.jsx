// YE WALA OPTIMAL HIA PLUS REFRESH WALO PROBLEM SOLVE BHI KARTA HAI 


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
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

const getStorageKey = (nodeId, lang) => `codearena_campaign_${nodeId}_${lang}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const extractOutput = (data) => {
  if (!data) return { stdout: '', stderr: 'Empty response from server.' };
  if (data.run && typeof data.run === 'object') {
    return {
      stdout: sanitize(data.run.stdout ?? data.run.output ?? ''),
      stderr: sanitize(data.compile?.stderr ?? data.run.stderr ?? ''),
    };
  }
  const stdout = data.stdout ?? data.output ?? data.result ?? data.out ?? '';
  const stderr = data.stderr ?? data.error ?? data.err ?? '';
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

// ─── Micro-Components ─────────────────────────────────────────────────────────

const TimerDisplay = ({ startTime, isStopped }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isStopped || !startTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime, isStopped]);
  const elapsedSeconds = startTime ? Math.floor((now - startTime) / 1000) : 0;
  return <span className="font-mono text-xs tabular-nums">{fmt(elapsedSeconds)}</span>;
};

const ResultRow = ({ result, index }) => {
  const [open, setOpen] = useState(!result.passed);
  const isHidden = result.input === 'Hidden' || !result.input;
  return (
    <div className={`border rounded-xl overflow-hidden ${
      result.passed ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-red-800/40 bg-red-950/[0.08]'
    }`}>
      <button className="w-full flex items-center justify-between px-3.5 py-2.5 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5 min-w-0">
          {result.passed ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-red-400 shrink-0" />}
          <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
          </span>
          {!result.passed && (result.error || result.stderr) && (
            <span className="text-[10px] text-red-500 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-900/40 truncate max-w-[160px]">
              {result.error || result.stderr?.split('\n') || 'Wrong Answer'}
            </span>
          )}
        </div>
        {!isHidden && (open ? <ChevronUp size={12} className="text-gray-700 shrink-0" /> : <ChevronDown size={12} className="text-gray-700 shrink-0" />)}
      </button>
      {open && !isHidden && (
        <div className="px-3.5 pb-3 pt-2 space-y-2 border-t border-gray-800/40">
          {[
            { label: 'Input', val: result.input },
            { label: 'Expected', val: result.expected },
            { label: 'Actual', val: result.actual }
          ].map(row => row.val !== undefined && (
            <div key={row.label}>
              <p className="text-[10px] font-bold text-gray-600 dark:text-gray-700 uppercase tracking-wider mb-0.5">{row.label}</p>
              <pre className={`text-xs font-mono px-2.5 py-1.5 rounded-lg whitespace-pre-wrap break-all ${row.label === 'Actual' && !result.passed ? 'bg-red-950/25 text-red-300' : 'bg-gray-100 dark:bg-gray-900/60 text-slate-700 dark:text-gray-300'}`}>
                {row.val === '' ? <span className="italic text-gray-500">empty</span> : row.val}
              </pre>
            </div>
          ))}
          {result.stderr && (
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Compiler / Runtime Error</p>
              <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-950/20 text-orange-400 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">{result.stderr}</pre>
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
    <div className="h-full overflow-y-auto">
      <div className="px-4 sm:px-5 py-5 space-y-5 text-[13px]">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {node?.nodeType === 'boss' && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">⚔️ Boss</span>}
            {problem.difficulty && <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFF_BADGE[problem.difficulty] || DIFF_BADGE.Easy}`}>{problem.difficulty}</span>}
            {problem.timeLimit && <span className="text-[11px] text-slate-400 dark:text-gray-600 flex items-center gap-1"><Clock size={10} />{problem.timeLimit}ms limit</span>}
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{problem.title}</h2>
        </div>
        {existingBest && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
            <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm" />
            <span className="text-xs text-amber-600 dark:text-amber-400/80 flex-1">Your best</span>
            {existingBest.bestTimeMs && <span className="text-xs font-mono text-slate-400 dark:text-gray-600">{existingBest.bestTimeMs}ms avg</span>}
          </div>
        )}
        {problem.description && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Description</p>
            <div className="text-slate-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: (problem.description || '').replace(/\n/g, '<br/>') }} />
          </div>
        )}
        {problem.constraints?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Constraints</p>
            <ul className="space-y-1">
              {problem.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-500 dark:text-gray-500"><span className="text-cyan-500 mt-0.5 shrink-0">›</span><span className="font-mono text-[12px]">{c}</span></li>
              ))}
            </ul>
          </div>
        )}
        {publicCases.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-700 uppercase tracking-widest mb-2">Examples (public)</p>
            {publicCases.map((tc, i) => (
              <div key={i} className="mb-3 bg-slate-100 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-gray-800/40 bg-slate-50 dark:bg-gray-900/40">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-wider">Example {i + 1}</span>
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Input</p>
                    <pre className="text-xs font-mono text-slate-700 dark:text-gray-300 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.input}</pre>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-700 font-bold mb-1">Output</p>
                    <pre className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black/30 px-2.5 py-1.5 rounded whitespace-pre-wrap break-all">{tc.output}</pre>
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
  code, setCode, language, handleEditorMount, nodeId,
  showResults, setShowResults, runResults, execType,
  passedCount, totalCount, allPassed,
  sageShouldShow, showSage, setShowSage,
  lastFailedCode, lastError,
}) => (
  <div className="h-full flex flex-col bg-[#07090e] relative overflow-hidden">
    <div className="flex-1 min-h-0">
      <Editor
        height="100%"
        language={MONACO_LANG[language] || 'javascript'}
        value={code}
        onChange={(v) => {
          const newCode = v || '';
          setCode(newCode);
          // Persist code on keystroke
          localStorage.setItem(getStorageKey(nodeId, language), newCode);
        }}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono','Cascadia Code',monospace",
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>

    <AnimatePresence>
      {showResults && runResults && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-800/50 bg-[#07090f] overflow-hidden shrink-0">
          <div className="max-h-60 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[#07090f] border-b border-gray-800/40 z-10">
              <div className="flex items-center gap-2">
                {allPassed ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {execType === 'run' ? 'Run' : 'Submit'} · {passedCount}/{totalCount} passed
                </span>
              </div>
              <button onClick={() => setShowResults(false)} className="text-gray-600 hover:text-gray-300 text-xs px-1">✕</button>
            </div>
            <div className="px-3 py-3 space-y-2">
              {runResults.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
            {sageShouldShow && !showSage && (
              <div className="px-3 pb-3">
                <button onClick={() => setShowSage(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-700/35 text-purple-300 text-xs font-bold rounded-xl transition-all">
                  <Sparkles size={13} /> Consult The Sage
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <SagePanel nodeId={nodeId} failedCode={lastFailedCode} errorMessage={lastError} language={language} isVisible={showSage} onClose={() => setShowSage(false)} />
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

  const [showSuccess,   setShowSuccess]   = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [mobileTab,     setMobileTab]     = useState('problem');
  const [startTime,     setStartTime]     = useState(null);

  const editorRef = useRef(null);

  // ── Load node and recover session code (REFRESH FIX) ──────────────────
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
          setStartTime(Date.now());

          // 1. Recover the last used language for THIS node
          const lastUsedLang = localStorage.getItem(`last_lang_${nodeId}`) || 'javascript';
          setLanguage(lastUsedLang);

          // 2. Recover the code for THAT specific language
          const savedCode = localStorage.getItem(getStorageKey(nodeId, lastUsedLang));
          const starter = n?.problemId?.starterCode?.[lastUsedLang] || 
                          n?.problemId?.starterCode?.javascript || '';
          
          setCode(savedCode !== null ? savedCode : starter);
        } else {
          toast.error('Node not found');
          navigate('/campaign');
        }
      } catch (err) {
        if (cancelled) return;
        navigate('/campaign');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [nodeId, navigate]);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('ca-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#07090e',
        'editor.lineHighlightBackground': '#0e1420',
      },
    });
    monaco.editor.setTheme('ca-dark');
  }, []);

  // ── Language switch (PERSISTENCE FIX) ──────────────────────────────────
  const handleLanguageChange = useCallback((lang) => {
    const currentStarter = node?.problemId?.starterCode?.[language] || '';
    if (code !== currentStarter && code.trim().length > 0) {
      if (!window.confirm(`Switch to ${lang}? Your current progress in ${language} will be saved.`)) return;
    }
    
    // Save the new language preference for this node
    setLanguage(lang);
    localStorage.setItem(`last_lang_${nodeId}`, lang);
    
    // Load existing code for the NEW language
    const savedCode = localStorage.getItem(getStorageKey(nodeId, lang));
    setCode(savedCode !== null ? savedCode : (node?.problemId?.starterCode?.[lang] || ''));
    
    setRunResults(null);
    setShowResults(false);
  }, [code, language, node, nodeId]);

  const handleRun = useCallback(async () => {
    if (isRunning || isSubmitting || !code.trim()) return;
    const publicCases = (node?.problemId?.testCases || []).filter(tc => tc.isPublic);
    if (!publicCases.length) return;

    setIsRunning(true);
    setRunResults(null);
    setExecType('run');
    setShowResults(true);

    const results = [];
    for (const [i, tc] of publicCases.entries()) {
      try {
        const response = await api.post('/run', { language, code, stdin: tc.input });
        const { stdout, stderr } = extractOutput(response.data);
        const expected = sanitize(tc.output);
        results.push({ caseNum: i + 1, input: tc.input, expected, actual: stdout, passed: stdout === expected && !stderr, stderr, isPublic: true });
      } catch (err) {
        results.push({ caseNum: i + 1, input: tc.input, expected: sanitize(tc.output), actual: '', passed: false, error: 'Execution Error', isPublic: true });
      }
    }
    setRunResults(results);
    setIsRunning(false);
  }, [code, language, node, isRunning, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isRunning || !code.trim()) return;
    setIsSubmitting(true);
    setRunResults(null);
    setExecType('submit');
    setShowResults(true);
    try {
      const response = await api.post('/campaign/submit', { nodeId, code, language });
      const data = response.data;
      const normResults = (data.results || []).map(normaliseResult);
      setRunResults(normResults);

      if (data.allPassed) {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setSuccessResult({ ...data, elapsedSeconds });
        setShowSuccess(true);
        // Clean storage for this specific lang/node on win
        localStorage.removeItem(getStorageKey(nodeId, language));
      } else {
        setFailCount(f => f + 1);
        setLastFailedCode(code);
        setLastError(normResults.find(r => !r.passed)?.stderr || 'Wrong Answer');
        if (data.sageShouldTrigger || failCount + 1 >= 3) setSageShouldShow(true);
      }
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, nodeId, isSubmitting, isRunning, failCount, startTime]);

  // ── Keyboard Shortcuts (STABLE BUILD FIX) ────────────────────────────────
  const actionsRef = useRef({ run: handleRun, submit: handleSubmit });
  useEffect(() => { 
    actionsRef.current = { run: handleRun, submit: handleSubmit }; 
  }, [handleRun, handleSubmit]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) actionsRef.current.submit();
        else            actionsRef.current.run();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isBusy = isRunning || isSubmitting;
  const passedCount = useMemo(() => (runResults || []).filter(r => r.passed).length, [runResults]);
  const totalCount = runResults?.length ?? 0;
  const allPassed = totalCount > 0 && passedCount === totalCount;
  const problem = node?.problemId;

  if (loading) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex items-center justify-center gap-4">
      <Loader2 size={32} className="animate-spin text-cyan-500" />
      <p className="text-slate-500 dark:text-gray-500 font-bold text-sm">Loading challenge…</p>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex flex-col overflow-hidden">
      <header className="h-[52px] bg-white dark:bg-[#07090f]/95 border-b border-slate-200 dark:border-gray-800/50 flex items-center gap-2.5 px-4 shrink-0 z-20 backdrop-blur-md">
        <button onClick={() => navigate('/campaign')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-gray-200 rounded-lg text-xs font-bold">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Map</span>
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="text-slate-900 dark:text-white font-black text-sm truncate">{problem?.title}</h1>
        </div>
        <select value={language} onChange={e => handleLanguageChange(e.target.value)} disabled={isBusy} className="bg-slate-100 dark:bg-gray-900/80 border border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-300 text-xs rounded-lg px-2 py-1.5">
          {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <div className="flex items-center gap-1 text-slate-500 dark:text-gray-600 shrink-0">
          <Clock size={12} /> <TimerDisplay startTime={startTime} isStopped={showSuccess} />
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button onClick={handleRun} disabled={isBusy || !code.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-gray-800 text-xs font-bold rounded-lg transition-all">
            {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run
          </button>
          <button onClick={handleSubmit} disabled={isBusy || !code.trim()} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 text-black text-xs font-black rounded-lg shadow-md shadow-cyan-500/20">
            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col sm:flex-row">
        {mobileTab === 'problem' ? (
          <div className="flex-1 h-full sm:w-2/5 border-r border-slate-200 dark:border-gray-800/40">
            <ProblemPanel node={node} existingBest={existingBest} />
          </div>
        ) : null}
        
        <div className={`${mobileTab === 'editor' ? 'flex-1' : 'hidden sm:block sm:flex-1'} h-full`}>
           <EditorPane 
              code={code} setCode={setCode} language={language} handleEditorMount={handleEditorMount} nodeId={nodeId} 
              showResults={showResults} setShowResults={setShowResults} runResults={runResults} execType={execType} 
              passedCount={passedCount} totalCount={totalCount} allPassed={allPassed} 
              sageShouldShow={sageShouldShow} showSage={showSage} setShowSage={setShowSage} 
              lastFailedCode={lastFailedCode} lastError={lastError} 
            />
        </div>
      </div>

      <div className="sm:hidden flex items-center border-t border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#07090f]/80 shrink-0">
        <button onClick={() => setMobileTab('problem')} className={`flex-1 py-2.5 text-xs font-bold border-b-2 ${mobileTab === 'problem' ? 'border-cyan-500 text-cyan-500' : 'border-transparent'}`}>Problem</button>
        <button onClick={() => setMobileTab('editor')} className={`flex-1 py-2.5 text-xs font-bold border-b-2 ${mobileTab === 'editor' ? 'border-cyan-500 text-cyan-500' : 'border-transparent'}`}>Editor</button>
      </div>

      {/* ... bottom of CampaignEditor.jsx */}
      <SuccessModal
        isOpen={showSuccess}
        result={successResult}
        // ✅ Pass the new progress data directly to the Map
        onViewMap={() => navigate('/campaign', { state: { newProgress: successResult?.progress } })} 
        onContinue={() => {
          setShowSuccess(false);
          setRunResults(null);
          setShowResults(false);
        }}
      />

      {/* <SuccessModal
        isOpen={showSuccess}
        result={successResult}
        onViewMap={() => navigate('/campaign', { state: { refetch: true } })} // ✅ LEVEL UNLOCK FIX
        onContinue={() => {
          setShowSuccess(false);
          setRunResults(null);
          setShowResults(false);
        }}
      /> */}
    </div>
  );
};

export default CampaignEditor;