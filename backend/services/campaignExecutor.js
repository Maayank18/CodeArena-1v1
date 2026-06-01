// backend/services/campaignExecutor.js
import { executeCode } from '../utils/judge0Client.js';
import { outputsMatch, sanitizeOutput } from '../utils/sanitizeOutput.js';

const JAVA_MAIN_CLASS_REGEX = /(?:public\s+)?class\s+Main\b/;
const JAVA_MAIN_METHOD_REGEX = /public\s+static\s+void\s+main\s*\(\s*(?:final\s+)?String\s*(?:(?:\[\s*\]\s*\w+)|(?:\w+\s*\[\s*\])|(?:\.\.\.\s*\w+))\s*\)/;

const getExecutionValidationError = (language, code) => {
  if (language !== 'java') {
    return null;
  }

  const hasMainClass = JAVA_MAIN_CLASS_REGEX.test(code);
  const hasMainMethod = JAVA_MAIN_METHOD_REGEX.test(code);

  if (hasMainClass && hasMainMethod) {
    return null;
  }

  return 'CodeArena runs Java in Standard I/O mode. Please submit a full executable program with public class Main and public static void main(String[] args), including input parsing, helper methods, and output.';
};

export const executeForCampaign = async (code, language, testCases) => {
  if (!code || !language) {
    throw new Error('Code and language are required');
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      allPassed: false,
      results: [],
      totalTimeMs: 0,
      avgTimeMs: 0,
    };
  }

  const validationError = getExecutionValidationError(language, code);
  if (validationError) {
    return {
      allPassed: false,
      results: [{
        input: 'Hidden',
        expected: 'Hidden',
        actual: '',
        passed: false,
        timeMs: 0,
        verdict: 'compile_error',
        error: validationError,
        stderr: validationError,
        isPublic: false,
      }],
      totalTimeMs: 0,
      avgTimeMs: 0,
    };
  }

  const results = [];
  let totalTimeMs = 0;
  let allPassed = true;

  for (const tc of testCases) {
    const t0 = Date.now();

    try {
      const result = await executeCode(language, code, tc.input || '');

      const elapsed = result?.run?.millis ?? (Date.now() - t0);
      totalTimeMs += elapsed;

      const verdict = result?.verdict || 'unknown';
      const stdout = sanitizeOutput(result?.run?.stdout ?? result?.run?.output ?? '');
      const stderr = sanitizeOutput(
        result?.run?.stderr ??
        result?.run?.compile_output ??
        result?.run?.message ??
        ''
      );

      const expected = sanitizeOutput(tc.output ?? '');
      const passed = verdict === 'accepted' && outputsMatch(stdout, expected);

      if (!passed) allPassed = false;

      results.push({
        input: tc.isPublic ? tc.input : 'Hidden',
        expected: tc.isPublic ? expected : 'Hidden',
        actual: stdout,
        passed,
        timeMs: elapsed,
        verdict,
        error:
          verdict === 'tle'
            ? 'Time Limit Exceeded'
            : stderr || (verdict === 'wrong_answer' ? 'Wrong Answer' : 'Execution Error'),
        stderr,
        isPublic: !!tc.isPublic,
      });
    } catch (err) {
      allPassed = false;

      const msg = err?.response?.data?.message || err?.message || 'Execution error';

      results.push({
        input: tc.isPublic ? tc.input : 'Hidden',
        expected: tc.isPublic ? sanitizeOutput(tc.output ?? '') : 'Hidden',
        actual: '',
        passed: false,
        error: msg,
        stderr: msg,
        timeMs: 0,
        isPublic: !!tc.isPublic,
      });
    }
  }

  return {
    allPassed,
    results,
    totalTimeMs,
    avgTimeMs: testCases.length ? Math.round(totalTimeMs / testCases.length) : 0,
  };
};
// V 1.5

// Version-2.0