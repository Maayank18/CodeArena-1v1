// backend/services/campaignExecutor.js
// V2 — Uses sanitizeOutput so Python trailing \n, Java \r\n, C++ trailing
// spaces never cause a correct solution to fail.

import axios from 'axios';
import { outputsMatch } from '../utils/sanitizeOutput.js'; // ← THE FIX

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

    const results  = [];
    let totalTimeMs = 0;
    let allPassed   = true;

    for (const tc of testCases) {
        const startTime = Date.now();

        try {
            const response = await axios.post(
                `${PISTON_URL}/execute`,
                {
                    language: langConfig.language,
                    version:  langConfig.version,
                    files:    [{ content: code }],
                    stdin:    tc.input,
                },
                { timeout: 12000 }
            );

            const elapsed = Date.now() - startTime;
            totalTimeMs  += elapsed;

            const rawActual   = response.data.run?.stdout || '';
            const rawExpected = tc.output;

            // ── THE KEY FIX ──────────────────────────────────────────────
            // Both sides normalised before comparison.
            // Python adds \n, Java adds \r\n, C++ may add trailing spaces.
            // outputsMatch() trims everything on both sides.
            const passed = outputsMatch(rawActual, rawExpected);
            // ─────────────────────────────────────────────────────────────

            if (!passed) allPassed = false;

            results.push({
                input:    tc.isPublic ? tc.input    : 'Hidden',
                expected: tc.isPublic ? rawExpected : 'Hidden',
                actual:   rawActual,
                passed,
                timeMs:   elapsed,
                stderr:   response.data.run?.stderr || '',
                isPublic: tc.isPublic,
            });

        } catch (err) {
            allPassed = false;
            results.push({
                input:    tc.isPublic ? tc.input : 'Hidden',
                expected: tc.isPublic ? tc.output : 'Hidden',
                passed:   false,
                error:    err.message,
                actual:   '',
                timeMs:   0,
                isPublic: tc.isPublic,
            });
        }
    }

    return {
        allPassed,
        results,
        totalTimeMs,
        avgTimeMs: testCases.length > 0
            ? Math.round(totalTimeMs / testCases.length)
            : 0,
    };
};