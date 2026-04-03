// backend/services/campaignExecutor.js
// Wraps Piston execution specifically for Campaign (uses ALL test cases)

import axios from 'axios';

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python:     { language: 'python',     version: '3.10.0'  },
    cpp:        { language: 'c++',        version: '10.2.0'  },
    java:       { language: 'java',       version: '15.0.2'  }
};

export const executeForCampaign = async (code, language, testCases) => {
    const langConfig = LANGUAGE_MAP[language];
    if (!langConfig) throw new Error(`Unsupported language: ${language}`);

    const results = [];
    let totalTimeMs = 0;
    let allPassed = true;

    for (const tc of testCases) {
        const startTime = Date.now();
        
        try {
            const response = await axios.post(`${PISTON_URL}/execute`, {
                language: langConfig.language,
                version:  langConfig.version,
                files:    [{ content: code }],
                stdin:    tc.input
            }, { timeout: 10000 });

            const elapsed = Date.now() - startTime;
            totalTimeMs += elapsed;

            const actualOutput = (response.data.run?.stdout || '').trim();
            const expectedOutput = tc.output.trim();
            const passed = actualOutput === expectedOutput;

            if (!passed) allPassed = false;

            results.push({
                input:    tc.isPublic ? tc.input : 'Hidden',
                expected: tc.isPublic ? expectedOutput : 'Hidden',
                actual:   actualOutput,
                passed,
                timeMs:   elapsed,
                stderr:   response.data.run?.stderr || ''
            });

        } catch (err) {
            allPassed = false;
            results.push({
                input:  tc.isPublic ? tc.input : 'Hidden',
                passed: false,
                error:  err.message,
                timeMs: 0
            });
        }
    }

    return {
        allPassed,
        results,
        totalTimeMs,
        // Average time across test cases (fairer metric than total)
        avgTimeMs: testCases.length > 0 
            ? Math.round(totalTimeMs / testCases.length) 
            : 0
    };
};