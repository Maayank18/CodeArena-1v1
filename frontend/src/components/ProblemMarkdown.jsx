import React from 'react';
import ReactMarkdown from 'react-markdown';

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  Medium: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
  Hard: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
};

const ProblemMarkdown = ({
  problem,
  titlePrefix,
  isDark = true,
}) => {
  if (!problem) return null;

  const publicCases = (problem.testCases || []).filter(tc => tc.isPublic);
  const title = titlePrefix ? `${titlePrefix}. ${problem.title}` : problem.title;
  const difficultyClass = DIFFICULTY_STYLES[problem.difficulty] || DIFFICULTY_STYLES.Easy;

  // Step 1: Tailwind Typography Wrapper Class
  const proseClass = [
    'prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-7',
    !isDark && '!prose-p:text-slate-700 !prose-headings:text-slate-900 !prose-strong:text-slate-900',
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className={`text-[2rem] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {problem.difficulty && (
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${difficultyClass}`}>
              {problem.difficulty}
            </span>
          )}

          {Array.isArray(problem.topics) &&
            problem.topics.filter(Boolean).map((topic) => (
              <span
                key={topic}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isDark
                    ? 'border-white/10 bg-white/[0.06] text-gray-400'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}
              >
                {topic}
              </span>
            ))}
        </div>
      </div>

      {/* Step 1: Clean Markdown Description */}
      <div className={proseClass}>
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) =>
              inline ? (
                <code
                  className={`rounded-md px-1.5 py-0.5 font-mono text-sm ${
                    isDark ? 'bg-white/10 text-gray-200' : 'bg-slate-200 text-slate-800'
                  }`}
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              ),
            pre: ({ node, ...props }) => (
              <pre
                className={`my-4 overflow-x-auto rounded-md p-4 font-mono text-sm ${
                  isDark
                    ? 'bg-white/5 text-gray-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                {...props}
              />
            ),
          }}
        >
          {problem.description || ''}
        </ReactMarkdown>
      </div>

      {/* Step 2: Dynamic Examples Section */}
      {publicCases.length > 0 && (
        <div className="space-y-6">
          {publicCases.map((tc, index) => (
            <div key={index} className="space-y-2">
              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Example {index + 1}:</p>
              <div className={`border-l-2 p-4 rounded-r-md font-mono text-sm whitespace-pre-wrap overflow-x-auto ${
                isDark 
                  ? 'bg-white/5 border-white/20 text-gray-300' 
                  : 'bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}>
                <div className="space-y-1">
                  <p><strong className={isDark ? 'text-white' : 'text-slate-900'}>Input:</strong> {tc.displayInput || tc.input}</p>
                  <p><strong className={isDark ? 'text-white' : 'text-slate-900'}>Output:</strong> {tc.output}</p>
                  {tc.explanation && (
                    <p className="mt-3">
                      <strong className={isDark ? 'text-white' : 'text-slate-900'}>Explanation:</strong> {tc.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Dynamic Constraints Section */}
      {Array.isArray(problem.constraints) && problem.constraints.length > 0 && (
        <div className="space-y-4">
          <h3 className={`font-bold uppercase tracking-widest text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Constraints:
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                <code className={`px-1.5 py-0.5 rounded-md font-mono text-xs ${
                  isDark ? 'bg-white/10 text-gray-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  {constraint}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="h-12" />
    </div>
  );
};

export default ProblemMarkdown;
