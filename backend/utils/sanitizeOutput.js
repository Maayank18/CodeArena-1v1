// backend/utils/sanitizeOutput.js

/**
 * Normalize raw execution output to a stable display string.
 * This preserves semantic content while smoothing out line-ending noise.
 */
export const sanitizeOutput = (raw) => {
  if (raw == null) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) return sanitizeOutput(raw.join('\n'));

  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);

  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/, '')
    .trim();
};

/**
 * Convert output into whitespace-separated tokens so formatting differences
 * like trailing spaces or repeated spaces do not fail correct solutions.
 */
export const tokenizeOutput = (raw) => {
  const sanitized = sanitizeOutput(raw);
  if (!sanitized) return [];
  return sanitized.split(/\s+/).filter(Boolean);
};

export const normalizeForComparison = (raw) => tokenizeOutput(raw).join(' ');

export const outputsMatch = (actual, expected) =>
  normalizeForComparison(actual) === normalizeForComparison(expected);

// Version-2.0