import React, { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Lock, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const DetailBlock = ({ label, value, tone = 'default' }) => {
  const classes =
    tone === 'error'
      ? 'bg-red-500/10 text-red-200 border-red-500/20'
      : 'bg-black/20 text-[var(--text-primary)] border-white/10';

  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </p>
      <pre className={`whitespace-pre-wrap break-all rounded-lg border px-3 py-2 text-[11px] font-mono ${classes}`}>
        {value === '' ? <span className="italic text-[var(--text-secondary)]">empty</span> : value}
      </pre>
    </div>
  );
};

const ResultCard = ({ res, idx, isDark }) => {
  const [open, setOpen] = useState(!res.passed);
  const isHidden = res.input === 'Hidden' || res.input === 'Hidden Test Case';

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        res.passed
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {res.passed ? (
            <CheckCircle size={16} className="shrink-0 text-green-500 dark:text-green-400" />
          ) : (
            <XCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
          )}

          <div className="min-w-0">
            <div className="truncate text-xs font-mono">
              <span className="mr-2 font-bold text-[var(--text-secondary)]">#{idx + 1}</span>
              {isHidden ? (
                <span className="inline-flex items-center gap-1 italic text-[var(--text-secondary)]">
                  <Lock size={10} /> Hidden Case
                </span>
              ) : (
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'} title={res.input}>
                  {res.input?.length > 40 ? `${res.input.substring(0, 40)}...` : res.input}
                </span>
              )}
            </div>

            {!res.passed && (
              <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-red-500 dark:text-red-400">
                {res.error || res.stderr || 'Failed'}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {open ? (
            <ChevronUp size={14} className="text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--text-secondary)]" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 px-3 pb-3 pt-3">
          {!isHidden && <DetailBlock label="Input" value={res.input ?? ''} />}
          {!isHidden && res.expected !== undefined && <DetailBlock label="Expected" value={res.expected ?? ''} />}
          <DetailBlock label="Actual" value={res.actual ?? ''} tone={!res.passed ? 'error' : 'default'} />
          {!res.passed && (res.stderr || res.error) && (
            <DetailBlock label="Compiler / Runtime Error" value={res.stderr || res.error || ''} tone="error" />
          )}
        </div>
      )}
    </div>
  );
};

const TestCaseResults = ({ results }) => {
  const { theme } = useTheme();

  if (!results || results.length === 0) return null;

  const isDark = theme === 'dark';

  return (
    <div className="mt-4 space-y-2 animate-fade-in">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Test Results
        </h3>
        <span className={`rounded px-2 py-1 text-[10px] ${isDark ? 'bg-[#2d2d2d] text-gray-500' : 'bg-stone-100 text-slate-500'}`}>
          {results.filter((r) => r.passed).length} / {results.length} Passed
        </span>
      </div>

      <div className="custom-scrollbar grid max-h-72 gap-2 overflow-y-auto pr-1">
        {results.map((res, idx) => (
          <ResultCard key={idx} res={res} idx={idx} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};

export default TestCaseResults;
