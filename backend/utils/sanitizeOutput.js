// backend/utils/sanitizeOutput.js
// ─────────────────────────────────────────────────────────────────────────────
// Normalises execution output for comparison.
// Handles Python trailing \n, Java \r\n, C++ trailing spaces.
// NEVER strips values like "0", "false", empty arrays — only whitespace.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise raw stdout/output to a stable string for comparison.
 * @param {any} raw - Whatever comes back from Piston or our wrapper
 * @returns {string}
 */
export const sanitizeOutput = (raw) => {
  if (raw == null) return '';                        // null / undefined → ''
  if (typeof raw === 'number') return String(raw);   // 0, 1, -1 are valid
  if (typeof raw === 'boolean') return String(raw);  // false / true are valid
  if (Array.isArray(raw)) return sanitizeOutput(raw.join('\n'));

  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);

  return str
    .replace(/\r\n/g, '\n')       // Windows CRLF → LF
    .replace(/\r/g, '\n')          // old Mac CR → LF
    .split('\n')
    .map(line => line.trimEnd())   // trailing spaces per line only
    .join('\n')
    .replace(/\n+$/, '')           // strip trailing blank lines
    .trim();                        // final safety trim
};

/**
 * Compare two raw outputs after normalisation.
 * Use this in campaignExecutor.js instead of a raw === comparison.
 */
export const outputsMatch = (actual, expected) =>
  sanitizeOutput(actual) === sanitizeOutput(expected);