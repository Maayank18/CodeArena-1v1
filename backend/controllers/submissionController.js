import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import { recordActivity } from '../utils/activityTracker.js';
import { executeCode } from '../utils/judge0Client.js';
import { outputsMatch, sanitizeOutput } from '../utils/sanitizeOutput.js';

const problemCache = new Map();
const PROBLEM_CACHE_TTL = 10 * 60 * 1000;
const MAX_CODE_SIZE = 50000;

const calculateStars = (allPassed, avgTimeMs) => {
  if (!allPassed) return 0;
  if (avgTimeMs < 80) return 3;
  if (avgTimeMs < 200) return 2;
  return 1;
};

const getCachedProblem = async (problemId) => {
  const cacheKey = problemId.toString();
  const cached = problemCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PROBLEM_CACHE_TTL) {
    return cached.problem;
  }

  const problem = await Problem.findById(problemId).select('testCases').lean();
  if (!problem) {
    return null;
  }

  problemCache.set(cacheKey, {
    problem,
    timestamp: Date.now(),
  });

  return problem;
};

const isExecutionErrorVerdict = (verdict) =>
  ['compile_error', 'runtime_error', 'internal_error', 'unknown'].includes(verdict);

const JAVA_MAIN_CLASS_REGEX = /(?:public\s+)?class\s+Main\b/;
const JAVA_MAIN_METHOD_REGEX = /public\s+static\s+void\s+main\s*\(\s*(?:final\s+)?String\s*(?:(?:\[\s*\]\s*\w+)|(?:\w+\s*\[\s*\])|(?:\.\.\.\s*\w+))\s*\)/;

const buildFailureMessage = ({ verdict, stderr }) => {
  if (verdict === 'tle') return 'Time Limit Exceeded';
  if (verdict === 'compile_error') return stderr || 'Compilation Error';
  if (verdict === 'runtime_error') return stderr || 'Runtime Error';
  if (verdict === 'internal_error') return stderr || 'Execution Engine Error';
  if (verdict === 'wrong_answer') return 'Wrong Answer';
  return stderr || 'Execution Error';
};

const getExecutionValidationError = (language, code) => {
  if (language !== 'java') {
    return null;
  }

  const hasMainClass = JAVA_MAIN_CLASS_REGEX.test(code);
  const hasMainMethod = JAVA_MAIN_METHOD_REGEX.test(code);

  if (hasMainClass && hasMainMethod) {
    return null;
  }

  return "CodeArena runs Java in Standard I/O mode. Please submit a full executable program with `public class Main` and `public static void main(String[] args)`, including input parsing, helper methods, and output.";
};

export const runCode = async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: 'Language and Code are required' });
  }

  if (code.length > MAX_CODE_SIZE) {
    return res.status(400).json({ message: `Code exceeds maximum length (${MAX_CODE_SIZE / 1000}KB)` });
  }

  const validationError = getExecutionValidationError(language, code);
  if (validationError) {
    return res.json({
      success: false,
      ok: false,
      verdict: 'compile_error',
      status: { description: 'Compile Error' },
      output: '',
      stdout: '',
      stderr: validationError,
      error: validationError,
      executionTime: 0,
      memoryKb: 0,
    });
  }

  try {
    if (req.user?._id) {
      recordActivity(req.user._id);
    }

    const result = await executeCode(language, code, stdin ?? '');

    return res.json({
      success: true,
      ok: result.verdict === 'accepted',
      verdict: result.verdict,
      status: result.status,
      output: result.run.output,
      stdout: result.run.stdout,
      stderr: result.run.stderr,
      error: result.errorMessage,
      executionTime: result.run.millis,
      memoryKb: result.run.memoryKb,
    });
  } catch (error) {
    console.error('Run Code Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Execution failed.',
    });
  }
};

export const submitCode = async (req, res) => {
  const { language, code, problemId } = req.body;

  try {
    if (!language || !code || !problemId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (code.length > MAX_CODE_SIZE) {
      return res.status(400).json({ message: `Code exceeds maximum length (${MAX_CODE_SIZE / 1000}KB)` });
    }

    const validationError = getExecutionValidationError(language, code);
    if (validationError) {
      return res.json({
        success: false,
        allPassed: false,
        isCorrect: false,
        passedCount: 0,
        totalTestCases: 0,
        avgTimeMs: 0,
        starsAwarded: 0,
        results: [{
          input: 'Hidden',
          expected: 'Hidden',
          actual: '',
          passed: false,
          timeMs: 0,
          verdict: 'compile_error',
          status: 'Compile Error',
          error: validationError,
          stderr: validationError,
        }],
      });
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ message: 'Invalid Problem ID' });
    }

    const problem = await getCachedProblem(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    let passedCount = 0;
    let totalTime = 0;
    let allPassed = true;
    const results = [];

    for (const testCase of problem.testCases) {
      try {
        const result = await executeCode(language, code, testCase.input ?? '');
        const verdict = result.verdict;
        const stdout = sanitizeOutput(result.run.stdout);
        const stderr = sanitizeOutput(result.run.stderr);
        const expected = sanitizeOutput(testCase.output);
        const timeMs = result.run.millis || 0;
        const hasExecutionError = isExecutionErrorVerdict(verdict);
        const isTLE = verdict === 'tle';
        const passed = !hasExecutionError && !isTLE && outputsMatch(stdout, expected);

        totalTime += timeMs;

        if (passed) {
          passedCount += 1;
        } else {
          allPassed = false;
        }

        results.push({
          input: testCase.isPublic ? (testCase.input ?? '') : 'Hidden',
          expected: testCase.isPublic ? expected : 'Hidden',
          actual: stdout,
          passed,
          timeMs,
          verdict,
          status: result.status?.description || null,
          error: buildFailureMessage({ verdict, stderr }),
          stderr,
        });

        if (!passed) {
          break;
        }
      } catch (error) {
        allPassed = false;

        results.push({
          input: testCase.isPublic ? (testCase.input ?? '') : 'Hidden',
          expected: testCase.isPublic ? sanitizeOutput(testCase.output) : 'Hidden',
          actual: '',
          passed: false,
          timeMs: 0,
          verdict: 'internal_error',
          status: 'Execution Error',
          error: error.message || 'Execution failed.',
          stderr: error.message || 'Execution failed.',
        });

        break;
      }
    }

    const avgTimeMs = passedCount > 0 ? Math.round(totalTime / passedCount) : 0;
    const starsAwarded = calculateStars(allPassed, avgTimeMs);

    return res.json({
      success: true,
      allPassed,
      isCorrect: allPassed,
      passedCount,
      totalTestCases: problem.testCases.length,
      avgTimeMs,
      starsAwarded,
      results,
    });
  } catch (error) {
    console.error('Submit Code Error:', error);
    return res.status(500).json({
      message: error.message || 'Server Error',
    });
  }
};
