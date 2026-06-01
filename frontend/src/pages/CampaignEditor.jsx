// YE WALA OPTIMAL HIA PLUS REFRESH WALO PROBLEM SOLVE BHI KARTA HAI 


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Sparkles, Clock, BookOpen, Code2,
  Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import api from '../api';
import SuccessModal from '../components/Campaign/SuccessModal';
import SagePanel    from '../components/Campaign/SagePanel';
import StarDisplay  from '../components/Campaign/StarDisplay';
import CampaignTeaserModal from '../components/Campaign/CampaignTeaserModal';
import ProblemMarkdown from '../components/ProblemMarkdown';
import AIHelpWidget from '../components/AIHelpWidget';
import {
  getStoredCampaignUser,
  hasPremiumCampaignAccess,
  isRootCampaignNodeId,
} from '../utils/campaignAccess';
import SpiralNotebookWidget from '../components/SpiralNotebookWidget';
import { outputsMatch } from '../utils/outputMatching';

// --- Constants ----------------------------------------------------------------

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
const isValidNodeId = (value) => typeof value === 'string' && value.trim().length > 0;
const buildCampaignNoteTitle = (problem, node, nodeId) => {
  if (problem?.title) {
    return `Campaign - ${problem.title}`;
  }

  const region = node?.campaignRegion ? `Region ${node.campaignRegion}` : 'Campaign';
  const order = node?.nodeOrder ? `Node ${node.nodeOrder}` : nodeId;
  return `${region} - ${order}`;
};

// --- Helpers ------------------------------------------------------------------

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
    passed:   r.passed ?? (outputsMatch(stdout, expected) && !stderr),
  };
};

// --- Micro-Components ---------------------------------------------------------

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
    <div className={`border rounded-xl overflow-hidden transition-colors ${
      result.passed 
        ? 'border-emerald-500/30 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/10' 
        : 'border-red-500/30 dark:border-red-800/40 bg-red-50 dark:bg-red-950/[0.08]'
    }`}>
      <button className="w-full flex items-center justify-between px-3.5 py-2.5 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5 min-w-0">
          {result.passed ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-red-400 shrink-0" />}
          <span className={`text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {isHidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
          </span>
          {!result.passed && (result.error || result.stderr) && (
            <span className="text-[10px] text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-200 dark:border-red-900/40 truncate max-w-[160px]">
              {result.error || result.stderr?.split('\n')?.[0] || 'Wrong Answer'}
            </span>
          )}
        </div>
        {!isHidden && (open ? <ChevronUp size={12} className="text-gray-700 shrink-0" /> : <ChevronDown size={12} className="text-gray-700 shrink-0" />)}
      </button>
      {open && !isHidden && (
        <div className="px-3.5 pb-3 pt-2 space-y-2 border-t border-gray-200 dark:border-gray-800/40">
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
              <pre className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">{result.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProblemPanel = ({ node, existingBest, currentAttempt, isDark, currentCode }) => {
  const problem = node?.problemId;
  if (!problem) return null;
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-[#07090e] transition-colors">
      <div className="px-4 sm:px-5 py-5 text-[13px]">
        <ProblemMarkdown
          problem={problem}
          titlePrefix={node?.nodeOrder}
          isDark={isDark}
          prelude={
            <div className="flex flex-wrap items-center gap-2">
              {node?.nodeType === 'boss' && (
                <span className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  Boss
                </span>
              )}
              <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                Attempt: {currentAttempt}
              </span>
              {existingBest && (
                <div className="mt-2 w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-800/30 dark:bg-amber-950/20">
                  <StarDisplay stars={existingBest.starsAwarded} total={3} size="sm" />
                  <span className="flex-1 text-xs text-amber-600 dark:text-amber-400/80">Your best</span>
                  {existingBest.bestTimeMs && (
                    <span className="text-xs font-mono text-slate-400 dark:text-gray-600">
                      {existingBest.bestTimeMs}ms avg
                    </span>
                  )}
                </div>
              )}
            </div>
          }
        />
        <AIHelpWidget
          problemTitle={problem.title}
          currentCode={currentCode}
        />
        <div className="h-6" />
      </div>
    </div>
  );
};

// --- EditorPane ---------------------------------------------------------------

const EditorPane = ({
  code, setCode, language, handleEditorMount, handleEditorBeforeMount, nodeId,
  showResults, setShowResults, runResults, execType,
  passedCount, totalCount, allPassed,
  sageShouldShow, showSage, setShowSage,
  lastFailedCode, lastError, isDark
}) => (
  <div className={`h-full flex flex-col transition-colors relative overflow-hidden ${isDark ? 'bg-[#07090e]' : 'bg-white'}`}>
    <div className="flex-1 min-h-0">
      <Editor
        height="100%"
        language={MONACO_LANG[language] || 'javascript'}
        theme={isDark ? 'ca-dark' : 'ca-light'}
        value={code}
        onChange={(v) => {
          const newCode = v || '';
          setCode(newCode);
          // Persist code on keystroke
          localStorage.setItem(getStorageKey(nodeId, language), newCode);
        }}
        onMount={handleEditorMount}
        beforeMount={handleEditorBeforeMount}
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
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#07090f] overflow-hidden shrink-0">
          <div className="max-h-60 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[#07090f] border-b border-gray-200 dark:border-gray-800/40 z-10">
              <div className="flex items-center gap-2">
                {allPassed ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className={`text-xs font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {execType === 'run' ? 'Run' : 'Submit'} · {passedCount}/{totalCount} passed
                </span>
              </div>
              <button onClick={() => setShowResults(false)} className="text-gray-600 hover:text-gray-300 text-xs px-1">?</button>
            </div>
            <div className="px-3 py-3 space-y-2">
              {runResults.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
            </div>
            {sageShouldShow && !showSage && (
              <div className="px-3 pb-3">
                <button onClick={() => setShowSage(true)} className="w-full flex items-center justify-center gap-2 py-2 bg-purple-100 dark:bg-purple-950/30 hover:bg-purple-200 dark:hover:bg-purple-950/50 border border-purple-200 dark:border-purple-700/35 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition-all">
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

// --- Main CampaignEditor ------------------------------------------------------

const CampaignEditor = () => {
  const { nodeId } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [notesSessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const [node,         setNode]         = useState(null);
  const [existingBest, setExistingBest] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState('');

  const [code,         setCode]         = useState('');
  const [language,     setLanguage]     = useState('javascript');

  const [runResults,   setRunResults]   = useState(null);
  const [execType,     setExecType]     = useState(null);
  const [isRunning,    setIsRunning]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults,  setShowResults]  = useState(false);
  const [isNotesOpen,  setIsNotesOpen]  = useState(false);

  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [failCount,      setFailCount]      = useState(0);
  const [showSage,       setShowSage]       = useState(false);
  const [sageShouldShow, setSageShouldShow] = useState(false);
  const [lastFailedCode, setLastFailedCode] = useState('');
  const [lastError,      setLastError]      = useState('');

  const [showSuccess,   setShowSuccess]   = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [showTeaserModal, setShowTeaserModal] = useState(false);
  const [mobileTab,     setMobileTab]     = useState('problem');
  const [startTime,     setStartTime]     = useState(null);

  const editorRef = useRef(null);

  // -- Load node and recover session code (REFRESH FIX) ------------------
  useEffect(() => {
    // Sync profile to ensure subscription plan is up-to-date
    api.get('/settings/profile').then(({ data }) => {
        if (data?.user) {
            const existing = JSON.parse(localStorage.getItem('codearena_user') || '{}');
            const merged = { ...existing, ...data.user };
            localStorage.setItem('codearena_user', JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: merged }));
        }
    }).catch(() => {});

    let cancelled = false;
    const load = async () => {
      if (!isValidNodeId(nodeId)) {
        if (!cancelled) {
          setLoadError('Problem not found. Return to Campaign.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const { data } = await api.get(`/campaign/node/${nodeId}`);
        if (cancelled) return;
        
        if (data?.node?.problemId) {
          const n = data.node;
          setNode(n);
          setExistingBest(data.existingCompletion || null);
          setCurrentAttempt(data.currentAttempt || 1);
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
          setLoadError('Problem not found. Return to Campaign.');
        }
      } catch (err) {
        // console.log(err);
        if (cancelled) return;

        if (err?.response?.status === 403 && err?.response?.data?.code === 'TRIAL_EXPIRED') {
            setShowTeaserModal(true);
            return;
        }

        setLoadError(
          err?.response?.status === 404 || err?.response?.status === 403
            ? 'Problem not found. Return to Campaign.'
            : 'Failed to load challenge. Return to Campaign.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [nodeId, navigate, location.key]);

  useEffect(() => {
    const user = getStoredCampaignUser();
    const shouldLock =
      !hasPremiumCampaignAccess(user) &&
      isRootCampaignNodeId(nodeId) &&
      Boolean(existingBest);

    if (!shouldLock) {
      setShowTeaserModal(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowTeaserModal(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [existingBest, nodeId]);

  const handleEditorBeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('ca-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#07090e',
        'editor.lineHighlightBackground': '#0e1420',
      },
    });
    monaco.editor.defineTheme('ca-light', {
      base: 'vs', inherit: true, rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f3f4f6',
      },
    });
  }, []);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
  }, []);

  // -- Language switch (PERSISTENCE FIX) ----------------------------------
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
        const verdict = response.data?.verdict || (stderr ? 'runtime_error' : 'accepted');
        results.push({
          caseNum: i + 1,
          input: tc.input,
          expected,
          actual: stdout,
          passed: verdict === 'accepted' && outputsMatch(stdout, expected),
          stderr,
          error: verdict === 'wrong_answer' ? 'Wrong Answer' : stderr,
          verdict,
          isPublic: true
        });
      } catch (err) {
        // console.log(err);
        const errorMessage = err?.response?.data?.message || 'Execution Error';
        results.push({
          caseNum: i + 1,
          input: tc.input,
          expected: sanitize(tc.output),
          actual: '',
          passed: false,
          error: errorMessage,
          stderr: errorMessage,
          verdict: 'internal_error',
          isPublic: true
        });
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

    //   if (data.allPassed) {
    //     const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    //     setSuccessResult({ ...data, elapsedSeconds });
    //     setShowSuccess(true);
    //     // Clean storage for this specific lang/node on win
    //     localStorage.removeItem(getStorageKey(nodeId, language));
    //   } 
        if (data.allPassed) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            setSuccessResult({ ...data, elapsedSeconds });
            setShowSuccess(true);
            localStorage.removeItem(getStorageKey(nodeId, language));
        }
      else {
        setFailCount(f => f + 1);
        setCurrentAttempt(a => a + 1);
        setLastFailedCode(code);
        setLastError(normResults.find(r => !r.passed)?.stderr || 'Wrong Answer');
        if (data.sageShouldTrigger || failCount + 1 >= 3) setSageShouldShow(true);
      }
    } catch (err) {
        // console.log(err);
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, nodeId, isSubmitting, isRunning, failCount, startTime]);

  // -- Keyboard Shortcuts (STABLE BUILD FIX) --------------------------------
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

  if (loadError || !problem) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#06080e] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800/60 bg-white dark:bg-[#0a0d14] shadow-2xl p-6 text-center">
        <h1 className="text-lg font-black text-slate-900 dark:text-white mb-2">Problem Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
          {loadError || 'Problem not found. Return to Campaign.'}
        </p>
        <button
          onClick={() => navigate('/campaign')}
          className="w-full py-3 rounded-xl text-sm font-black bg-cyan-500 text-black"
        >
          Return to Campaign
        </button>
      </div>
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

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all ml-1"
          title={isDark ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => setIsNotesOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 ml-2 text-xs font-bold rounded-lg transition-all border
            ${isNotesOpen 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'text-slate-600 dark:text-gray-400 border-transparent hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <BookOpen size={14} /> <span className="hidden sm:inline">Notes</span>
        </button>

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
            <ProblemPanel node={node} existingBest={existingBest} currentAttempt={currentAttempt} isDark={isDark} currentCode={code} />
          </div>
        ) : null}
        
        <div className={`${mobileTab === 'editor' ? 'flex-1' : 'hidden sm:block sm:flex-1'} h-full`}>
            <EditorPane 
              code={code} setCode={setCode} language={language} 
              handleEditorMount={handleEditorMount} 
              handleEditorBeforeMount={handleEditorBeforeMount}
              nodeId={nodeId} 
              showResults={showResults} setShowResults={setShowResults} runResults={runResults} execType={execType} 
              passedCount={passedCount} totalCount={totalCount} allPassed={allPassed} 
              sageShouldShow={sageShouldShow} showSage={showSage} setShowSage={setShowSage} 
              lastFailedCode={lastFailedCode} lastError={lastError} isDark={isDark}
            />
        </div>
      </div>

      <div className="sm:hidden flex items-center justify-between border-t border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#07090f]/80 shrink-0 w-full h-12">
        <div className="flex flex-1 h-full">
          <button onClick={() => setMobileTab('problem')} className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${mobileTab === 'problem' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 dark:text-gray-400'}`}>
            Problem
          </button>
          <button onClick={() => setMobileTab('editor')} className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${mobileTab === 'editor' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 dark:text-gray-400'}`}>
            Editor
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 border-l border-slate-200 dark:border-gray-800/50 h-full bg-slate-50 dark:bg-[#0a0d14]">
          <button 
            onClick={() => { setMobileTab('editor'); handleRun(); }} 
            disabled={isBusy || !code.trim()} 
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 disabled:opacity-50"
            title="Run Code"
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="ml-0.5" />}
          </button>
          <button 
            onClick={() => { setMobileTab('editor'); handleSubmit(); }} 
            disabled={isBusy || !code.trim()} 
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 text-black shadow-md shadow-cyan-500/20 disabled:opacity-50"
            title="Submit Code"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="mr-0.5" />}
          </button>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        result={successResult}
        onViewMap={() =>
            navigate('/campaign', {
                state: { newProgress: successResult?.progress }
            })
        }
        onContinue={() => {
            setShowSuccess(false);
            navigate(`/campaign/${nodeId}`, {
              replace: true,
              state: { retryAt: Date.now() }
            });
        }}
    />

      <CampaignTeaserModal isOpen={showTeaserModal} />

      <SpiralNotebookWidget 
          isOpen={isNotesOpen} 
          onClose={() => setIsNotesOpen(false)} 
          type="campaign_editor" 
          contextKey={`${node?.campaignNodeId || nodeId}:${notesSessionId}`}
          contextTitle={buildCampaignNoteTitle(problem, node, nodeId)}
      />
    </div>
  );
};

export default CampaignEditor;
// V 1.5

// Version-2.0