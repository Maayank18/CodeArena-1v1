import React from 'react';
import { CheckCircle, XCircle, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

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

      <div className="custom-scrollbar grid max-h-60 gap-2 overflow-y-auto pr-1">
        {results.map((res, idx) => {
          const isHidden = res.input === 'Hidden Test Case';

          return (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                res.passed
                  ? 'border-green-500/20 bg-green-500/5 text-green-500 dark:text-green-400'
                  : 'border-red-500/20 bg-red-500/5 text-red-500 dark:text-red-400'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {res.passed ? <CheckCircle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}

                <div className="truncate text-xs font-mono">
                  <span className="mr-2 font-bold text-[var(--text-secondary)]">#{idx + 1}</span>
                  {isHidden ? (
                    <span className="inline-flex items-center gap-1 italic text-[var(--text-secondary)]">
                      <Lock size={10} /> Hidden Case
                    </span>
                  ) : (
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'} title={res.input}>
                      {res.input.length > 25 ? `${res.input.substring(0, 25)}...` : res.input}
                    </span>
                  )}
                </div>
              </div>

              {!res.passed && (
                <span className="shrink-0 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {res.error || 'Failed'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestCaseResults;
