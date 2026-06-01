import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * ProblemMarkdown Component
 * Enhanced Markdown renderer using react-markdown and @tailwindcss/typography.
 * Intercepts specific elements to match LeetCode's professional UI.
 */
const SimpleMarkdown = ({ content, className = '' }) => {
  if (!String(content ?? '').trim()) return null;

  return (
    <ReactMarkdown
      className={`prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white ${className}`}
      components={{
        // Inline code (e.g. `nums`) - Styled as grey pills
        code: ({ node, inline, className, children, ...props }) => {
          return inline ? (
            <code className="bg-white/10 text-gray-200 px-1.5 py-0.5 rounded-md font-mono text-xs" {...props}>
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Block code / Preformatted text (e.g. Input/Output blocks)
        pre: ({ node, ...props }) => (
          <pre className="bg-white/5 border-l-2 border-white/20 p-4 rounded-r-md font-mono text-sm text-gray-300 my-4 overflow-x-auto whitespace-pre-wrap" {...props} />
        ),
        // Lists (Constraints section)
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 space-y-2 text-gray-400 mt-2" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed" {...props} />
        ),
        // Strong tags
        strong: ({ node, ...props }) => (
          <strong className="text-white font-bold" {...props} />
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default SimpleMarkdown;

// Version-2.0