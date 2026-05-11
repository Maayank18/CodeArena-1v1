import React from 'react';
import ReactMarkdown from 'react-markdown';

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  Medium: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  Hard: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
};

const escapeRegExp = (value) => String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeMarkdownSource = (value) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();

const hasMarkdownHeading = (markdown, heading) =>
  new RegExp(`^#{1,6}\\s+${escapeRegExp(heading)}\\b`, 'im').test(markdown);

const buildProblemMarkdown = (problem) => {
  const description = normalizeMarkdownSource(problem?.description);
  const inputFormat = normalizeMarkdownSource(problem?.inputFormatDescription);
  const constraints = Array.isArray(problem?.constraints)
    ? problem.constraints
        .map((item) => normalizeMarkdownSource(item))
        .filter(Boolean)
    : [];

  let markdown = description;

  if (inputFormat && !hasMarkdownHeading(markdown, 'Input Format')) {
    markdown = [markdown, `## Input Format\n${inputFormat}`].filter(Boolean).join('\n\n');
  } else if (!markdown) {
    markdown = inputFormat;
  }

  if (constraints.length && !hasMarkdownHeading(markdown, 'Constraints')) {
    markdown = [
      markdown,
      `## Constraints\n${constraints.map((constraint) => `- ${constraint}`).join('\n')}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return markdown.trim();
};

const ProblemMarkdown = ({
  problem,
  titlePrefix,
  prelude,
  isDark = true,
}) => {
  if (!problem) return null;

  const markdown = buildProblemMarkdown(problem);
  const title = titlePrefix ? `${titlePrefix}. ${problem.title}` : problem.title;
  const difficultyClass = DIFFICULTY_STYLES[problem.difficulty] || DIFFICULTY_STYLES.Easy;
  const wrapperClassName = [
    'prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white',
    'prose-p:leading-7 prose-pre:my-0 prose-li:my-0 prose-ul:my-0',
    !isDark &&
      '!prose-p:text-slate-700 !prose-headings:text-slate-900 !prose-strong:text-slate-900',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
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
                    ? 'border-white/10 bg-white/[0.06] text-gray-200'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}
              >
                {topic}
              </span>
            ))}
        </div>

        {prelude}
      </div>

      {markdown ? (
        <ReactMarkdown
          className={wrapperClassName}
          components={{
            h2: ({ node, ...props }) => (
              <h2
                className={`mt-10 mb-4 text-xs font-black uppercase tracking-[0.22em] ${
                  isDark ? 'text-gray-500' : 'text-slate-500'
                }`}
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className={`mt-8 mb-3 text-lg font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p className={isDark ? 'text-gray-300' : 'text-slate-700'} {...props} />
            ),
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
                className={`my-4 overflow-x-auto rounded-r-md border-l-2 p-4 font-mono text-sm ${
                  isDark
                    ? 'border-white/20 bg-white/5 text-gray-300'
                    : 'border-slate-300 bg-slate-100 text-slate-700'
                }`}
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className={`mt-2 list-disc space-y-2 pl-5 ${
                  isDark ? 'text-gray-400 marker:text-gray-500' : 'text-slate-600 marker:text-slate-400'
                }`}
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          }}
        >
          {markdown}
        </ReactMarkdown>
      ) : (
        <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>No description available yet.</p>
      )}
    </div>
  );
};

export default ProblemMarkdown;
