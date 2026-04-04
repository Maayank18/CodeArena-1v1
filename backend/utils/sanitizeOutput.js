// backend/utils/sanitizeOutput.js
// ─────────────────────────────────────────────────────────────────────────────
// Problem: Piston API returns raw stdout. Different runtimes add different
// trailing artifacts:
//   Python  → trailing \n on every print()
//   Java    → \r\n on Windows containers
//   C++     → possible trailing spaces from cout
//   Node.js → generally clean, but console.log adds \n
//
// A naive `actual === expected` fails correct code. This utility normalises
// BOTH sides before comparison so only logical content is compared.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a raw execution output string for comparison.
 *
 * Steps applied (order matters):
 *  1. Null / undefined guard  → return ''
 *  2. Normalise line endings  → \r\n and \r → \n
 *  3. Per-line trailing trim  → remove trailing spaces/tabs on every line
 *  4. Strip trailing newlines → remove empty lines at the end of the string
 *  5. Final trim              → remove any remaining leading/trailing whitespace
 *
 * @param {string|null|undefined} raw - Raw string from Piston stdout or DB
 * @returns {string} Sanitised string safe for strict === comparison
 */
export const sanitizeOutput = (raw) => {
    if (raw == null) return '';

    return raw
        .replace(/\r\n/g, '\n')      // Windows CRLF → LF
        .replace(/\r/g, '\n')         // old Mac CR → LF
        .split('\n')
        .map(line => line.trimEnd())  // strip trailing spaces per line
        .join('\n')
        .replace(/\n+$/, '')          // strip trailing blank lines
        .trim();                       // final safety trim
};

/**
 * Convenience: compare user output to expected output after sanitising both.
 *
 * @param {string} actual   - Raw stdout from Piston
 * @param {string} expected - Expected output stored in the database
 * @returns {boolean}
 */
export const outputsMatch = (actual, expected) =>
    sanitizeOutput(actual) === sanitizeOutput(expected);