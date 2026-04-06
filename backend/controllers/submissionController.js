// // FILE: backend/controllers/submissionController.js
// // HEAVILY OPTIMIZED VERSION
// // import { executeCode } from '../utils/pistonClient.js';
// import { executeCode } from '../utils/judge0Client.js';
// import Problem from '../models/Problem.js';
// import mongoose from 'mongoose';

// // ✅ PERFORMANCE: Cache problems to avoid repeated DB queries
// const problemCache = new Map();
// const PROBLEM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// // @desc    Run code against a specific test case (Test Button)
// // @route   POST /api/run
// export const runCode = async (req, res) => {
//     const { language, code, stdin } = req.body;

//     // ✅ VALIDATION: Early return for invalid input
//     if (!language || !code) {
//         return res.status(400).json({ message: "Language and Code are required" });
//     }

//     // ✅ SECURITY: Limit code length (prevent abuse)
//     if (code.length > 50000) {
//         return res.status(400).json({ message: "Code exceeds maximum length (50KB)" });
//     }

//     try {
//         const result = await executeCode(language, code, stdin);
        
//         // Safety check if Piston fails
//         if (!result || !result.run) {
//              return res.status(500).json({ success: false, message: "Execution Engine Failed" });
//         }

//         res.json({
//             success: true,
//             output: result.run.output,
//             stdout: result.run.stdout,
//             stderr: result.run.stderr,
//             executionTime: result.run.millis,
//         });

//     } catch (error) {
//         console.error("Run Code Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }  
// };

// // @desc    Submit code against all test cases (Submit Button)
// // @route   POST /api/run/submit
// export const submitCode = async (req, res) => {
//     const { language, code, problemId } = req.body;

//     try {
//         // ✅ VALIDATION: Early returns
//         if (!language || !code || !problemId) {
//             return res.status(400).json({ message: "Missing required fields" });
//         }

//         if (!mongoose.Types.ObjectId.isValid(problemId)) {
//             return res.status(400).json({ message: "Invalid Problem ID" });
//         }

//         // ✅ SECURITY: Limit code length
//         if (code.length > 50000) {
//             return res.status(400).json({ message: "Code exceeds maximum length (50KB)" });
//         }

//         // ✅ CACHE: Check if problem is cached
//         let problem = null;
//         const cacheKey = problemId.toString();
//         const cachedData = problemCache.get(cacheKey);

//         if (cachedData && (Date.now() - cachedData.timestamp) < PROBLEM_CACHE_TTL) {
//             problem = cachedData.problem;
//         } else {
//             // ✅ OPTIMIZED: Fetch only needed fields
//             problem = await Problem.findById(problemId)
//                 .select('testCases')
//                 .lean();

//             if (!problem) {
//                 return res.status(404).json({ message: "Problem not found" });
//             }

//             // Update cache
//             problemCache.set(cacheKey, {
//                 problem,
//                 timestamp: Date.now()
//             });

//             // ✅ MEMORY: Auto-cleanup old cache entries
//             if (problemCache.size > 100) {
//                 const firstKey = problemCache.keys().next().value;
//                 problemCache.delete(firstKey);
//             }
//         }

//         // ✅ OPTIMIZED: Output normalization (moved outside loop)
//         const normalize = (str) => (str || "").toString().trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

//         let passedCount = 0;
//         let finalResults = [];
//         let isCorrect = true;

//         // ✅ OPTIMIZATION: Early exit on first failure
//         for (const testCase of problem.testCases) {
//             try {
//                 const result = await executeCode(language, code, testCase.input);
                
//                 if (!result || !result.run) {
//                     throw new Error("Execution engine timeout");
//                 }

//                 const actualOutput = normalize(result.run.stdout);
//                 const expectedOutput = normalize(testCase.output);
                
//                 const matches = actualOutput === expectedOutput;
                
//                 if (matches) {
//                     passedCount++;
//                     finalResults.push({ input: testCase.input, passed: true });
//                 } else {
//                     isCorrect = false;
//                     finalResults.push({
//                         input: testCase.input,
//                         expected: expectedOutput,
//                         actual: actualOutput,
//                         error: result.run.stderr || "Output Mismatch",
//                         passed: false
//                     });
//                     break; // ✅ Early exit on first failure
//                 }

//             } catch (innerError) {
//                 isCorrect = false;
//                 finalResults.push({ 
//                     input: testCase.input, 
//                     passed: false, 
//                     error: innerError.message 
//                 });
//                 break; // ✅ Early exit on error
//             }
//         }

//         res.json({
//             success: true,
//             // isCorrect: isCorrect && (passedCount === problem.testCases.length),
//             allPassed: isCorrect && (passedCount === problem.testCases.length),
//             passedCount,
//             totalTestCases: problem.testCases.length,
//             results: finalResults 
//         });

//     } catch (error) {
//         console.error("Submit Code Error:", error);
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };








































// backend/controllers/submissionController.js

import { executeCode } from '../utils/judge0Client.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose';

// Cache
const problemCache = new Map();
const PROBLEM_CACHE_TTL = 10 * 60 * 1000;

// ⭐ Star Calculation (CORRECT LOGIC)
const calculateStars = (allPassed, avgTimeMs) => {
    if (!allPassed) return 0; // ❗ MOST IMPORTANT

    if (avgTimeMs < 80) return 3;
    if (avgTimeMs < 200) return 2;
    return 1;
};

// ---------------- RUN ----------------
export const runCode = async (req, res) => {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
        return res.status(400).json({ message: "Language and Code are required" });
    }

    if (code.length > 50000) {
        return res.status(400).json({ message: "Code too large" });
    }

    try {
        const result = await executeCode(language, code, stdin);

        if (!result || !result.run) {
            return res.status(500).json({ success: false, message: "Execution failed" });
        }

        res.json({
            success: true,
            output: result.run.output,
            stdout: result.run.stdout,
            stderr: result.run.stderr,
            executionTime: result.run.millis,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- SUBMIT ----------------
export const submitCode = async (req, res) => {
    const { language, code, problemId } = req.body;

    try {
        if (!language || !code || !problemId) {
            return res.status(400).json({ message: "Missing fields" });
        }

        if (!mongoose.Types.ObjectId.isValid(problemId)) {
            return res.status(400).json({ message: "Invalid Problem ID" });
        }

        // Fetch Problem (with cache)
        let problem;
        const cacheKey = problemId.toString();
        const cached = problemCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < PROBLEM_CACHE_TTL) {
            problem = cached.problem;
        } else {
            problem = await Problem.findById(problemId).select('testCases').lean();

            if (!problem) {
                return res.status(404).json({ message: "Problem not found" });
            }

            problemCache.set(cacheKey, {
                problem,
                timestamp: Date.now()
            });
        }

        const normalize = (str) =>
            (str || "")
                .toString()
                .trim()
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");

        let passedCount = 0;
        let totalTime = 0;
        let allPassed = true;
        let results = [];

        for (const tc of problem.testCases) {
            try {
                const result = await executeCode(language, code, tc.input);

                if (!result || !result.run) {
                    throw new Error("Execution failed");
                }

                const raw = result.raw || {};

                // ✅ Detect TLE
                const isTLE =
                    raw?.status?.id === 5 ||
                    raw?.status?.description?.toLowerCase().includes("time");

                const stdout = normalize(result.run.stdout);
                const stderr = normalize(result.run.stderr);

                const expected = normalize(tc.output);

                const timeMs = result.run.millis || 0;
                totalTime += timeMs;

                const passed = !isTLE && stdout === expected && !stderr;

                if (passed) {
                    passedCount++;
                } else {
                    allPassed = false;
                }

                results.push({
                    input: tc.isPublic ? tc.input : "Hidden",
                    expected: tc.isPublic ? expected : "Hidden",
                    actual: stdout,
                    passed,
                    timeMs,
                    error: isTLE ? "Time Limit Exceeded" : stderr || "Wrong Answer"
                });

                if (!passed) break; // early exit

            } catch (err) {
                allPassed = false;

                results.push({
                    input: tc.isPublic ? tc.input : "Hidden",
                    expected: tc.isPublic ? normalize(tc.output) : "Hidden",
                    actual: "",
                    passed: false,
                    error: err.message,
                    timeMs: 0
                });

                break;
            }
        }

        const avgTimeMs = passedCount > 0 ? Math.round(totalTime / passedCount) : 0;

        // ⭐ Correct Star Logic
        const starsAwarded = calculateStars(allPassed, avgTimeMs);

        res.json({
            success: true,
            allPassed,
            passedCount,
            totalTestCases: problem.testCases.length,
            avgTimeMs,
            starsAwarded,
            results
        });

    } catch (error) {
        console.error("Submit Error:", error);
        res.status(500).json({ message: error.message });
    }
};