// backend/services/campaignExecutor.js
import axios from 'axios';
import { sanitizeOutput } from '../utils/sanitizeOutput.js';

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python:     { language: 'python',     version: '3.10.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
};

export const executeForCampaign = async (code, language, testCases) => {
  const langConfig = LANGUAGE_MAP[language];
  if (!langConfig) throw new Error(`Unsupported language: ${language}`);

  const results   = [];
  let totalTimeMs = 0;
  let allPassed   = true;

  for (const tc of testCases) {
    const t0 = Date.now();
    try {
      const res = await axios.post(
        `${PISTON_URL}/execute`,
        { language: langConfig.language, version: langConfig.version,
          files: [{ content: code }], stdin: tc.input },
        { timeout: 12000 }
      );
      const elapsed   = Date.now() - t0;
      totalTimeMs    += elapsed;
      const run        = res.data.run;
      const compileErr = res.data.compile?.stderr ?? '';
      const stderr     = compileErr || (run?.stderr ?? '');
      const actual     = sanitizeOutput(run?.stdout ?? '');
      const expected   = sanitizeOutput(tc.output);
      const passed     = (run?.code === 0) && (actual === expected);
      if (!passed) allPassed = false;
      results.push({ input: tc.isPublic ? tc.input : 'Hidden',
        expected: tc.isPublic ? expected : 'Hidden',
        actual, passed, timeMs: elapsed, stderr, isPublic: tc.isPublic });
    } catch (err) {
      allPassed = false;
      const msg = err.response?.data?.message || err.message || 'Execution error';
      results.push({ input: tc.isPublic ? tc.input : 'Hidden',
        expected: tc.isPublic ? sanitizeOutput(tc.output) : 'Hidden',
        actual: '', passed: false, error: msg, stderr: msg,
        timeMs: 0, isPublic: tc.isPublic });
    }
  }

  return { allPassed, results, totalTimeMs,
    avgTimeMs: testCases.length ? Math.round(totalTimeMs / testCases.length) : 0 };
};