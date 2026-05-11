import React from 'react';
import ReactMarkdown from 'react-markdown';

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  Medium: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
  Hard: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
};

const EXAMPLE_HEADING_REGEX = /^(#{1,6}\s*)?example\s+\d+\s*:?.*$/i;
const SECTION_HEADING_REGEX = /^(#{1,6}\s*)?(constraints?|input\s*format|notes?)\s*:?\s*$/i;

const collapseBlankLines = (text = '') => text.replace(/\n{3,}/g, '\n\n').trim();

const stripLegacyExamples = (description = '') => {
  const normalized = String(description || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const filteredLines = [];
  let skippingExampleBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (EXAMPLE_HEADING_REGEX.test(trimmed)) {
      skippingExampleBlock = true;
      continue;
    }

    if (skippingExampleBlock) {
      if (SECTION_HEADING_REGEX.test(trimmed)) {
        skippingExampleBlock = false;
        filteredLines.push(line);
        continue;
      }

      if (!trimmed) {
        continue;
      }

      continue;
    }

    filteredLines.push(line);
  }

  return collapseBlankLines(filteredLines.join('\n'));
};

const getExampleInput = (testCase = {}) => {
  const displayValue = [testCase.displayInput, testCase.visualInput]
    .find((value) => typeof value === 'string' && value.trim());

  if (displayValue) {
    return displayValue.trim();
  }

  if (typeof testCase.input === 'string') {
    return testCase.input.replace(/\r\n/g, '\n').trim();
  }

  return '';
};

const getMarkdownComponents = (isDark) => ({
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
});

const ProblemMarkdown = ({
  problem,
  titlePrefix,
  isDark = true,
  prelude = null,
}) => {
  if (!problem) return null;

  const publicCases = (problem.testCases || []).filter(tc => tc.isPublic);
  const title = titlePrefix ? `${titlePrefix}. ${problem.title}` : problem.title;
  const difficultyClass = DIFFICULTY_STYLES[problem.difficulty] || DIFFICULTY_STYLES.Easy;
  const cleanDescription = stripLegacyExamples(problem.description || '');

  const proseClass = [
    isDark ? 'prose prose-invert' : 'prose',
    'max-w-none text-sm leading-7',
    isDark
      ? 'prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white prose-li:text-gray-300'
      : 'prose-p:text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-700',
  ].filter(Boolean).join(' ');
  const markdownComponents = getMarkdownComponents(isDark);

  return (
    <div className="space-y-8">
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

        {prelude}
      </div>

      {cleanDescription && (
        <div className={proseClass}>
          <ReactMarkdown components={markdownComponents}>
            {cleanDescription}
          </ReactMarkdown>
        </div>
      )}

      {publicCases.length > 0 && (
        <div className="space-y-6">
          {publicCases.map((tc, index) => (
            <div key={index} className="mt-6 mb-6">
              <p className={`mb-2 text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Example {index + 1}:
              </p>
              <div className={`rounded-md border-l-[3px] pl-4 pr-4 py-3 font-mono text-sm ${
                isDark
                  ? 'bg-[#282828] border-white/20 text-gray-300'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed break-words">
                  <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>Input: </strong>
                  {getExampleInput(tc)}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed mt-1 break-words">
                  <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>Output: </strong>
                  {tc.output}
                </div>
                {tc.explanation && (
                  <div className="whitespace-pre-wrap leading-relaxed mt-1 break-words">
                    <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>Explanation: </strong>
                    {tc.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {problem.inputFormatDescription?.trim() && (
        <div className="space-y-4">
          <h3 className={`font-bold uppercase tracking-widest text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Input Format
          </h3>
          <div className={proseClass}>
            <ReactMarkdown components={markdownComponents}>
              {problem.inputFormatDescription}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {Array.isArray(problem.constraints) && problem.constraints.length > 0 && (
        <div className="space-y-4">
          <h3 className={`font-bold uppercase tracking-widest text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Constraints
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
