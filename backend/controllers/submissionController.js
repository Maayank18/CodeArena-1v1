// UPDATED THE SUBMISSION CONTROLLER
import { executeCode } from '../utils/pistonClient.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose'; // <--- ADDED MISSING IMPORT

// @desc    Run code against a specific test case (Test Button)
// @route   POST /api/run
export const runCode = async (req, res) => {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
        return res.status(400).json({ message: "Language and Code are required" });
    }

    try {
        const result = await executeCode(language, code, stdin);
        
        // Safety check if Piston fails
        if (!result || !result.run) {
             return res.status(500).json({ success: false, message: "Execution Engine Failed" });
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





// Helper: Robust Normalization
// Removes extra whitespace/newlines to ensure "4" equals "4\n"
const normalize = (str) => {
    return (str || "")
        .toString()
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
};

export const submitCode = async (req, res) => {
    const { language, code, problemId } = req.body;

    try {
        // 1. Validate Input
        if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
            return res.status(400).json({ message: "Invalid or missing Problem ID" });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Problem not found" });

        let passedCount = 0;
        let finalResults = [];
        let isCorrect = true;

        // 2. Iterate through ALL test cases (Public + Hidden)
        for (const testCase of problem.testCases) {
            try {
                // ✅ PASS TIME LIMIT: Prevents infinite loops (default 2s if not set)
                const result = await executeCode(language, code, testCase.input, problem.timeLimit || 2000);
                
                // Check if Piston failed entirely
                if (!result || !result.run) {
                    throw new Error("Execution engine failed");
                }

                // Check for Piston Runtime Errors (SIGKILL = Timeout)
                if (result.run.signal === 'SIGKILL' || result.run.code === 143) {
                    throw new Error("Time Limit Exceeded");
                }

                const actualOutput = normalize(result.run.stdout);
                const expectedOutput = normalize(testCase.output);
                
                // ✅ STRICT COMPARISON
                const matches = actualOutput === expectedOutput;

                // ✅ SECURITY MASKING: Hide data for hidden test cases
                // If it's public, show actual values. If hidden, show "Hidden".
                const resultObj = {
                    passed: matches,
                    input: testCase.isPublic ? testCase.input : "Hidden Test Case",
                    expected: testCase.isPublic ? expectedOutput : "Hidden",
                    actual: testCase.isPublic ? actualOutput : "Hidden",
                    error: matches ? null : (testCase.isPublic ? (result.run.stderr || "Output mismatch") : "Failed hidden case")
                };

                finalResults.push(resultObj);

                if (matches) {
                    passedCount++;
                } else {
                    isCorrect = false;
                    // Optional: Break on first failure to save resources?
                    // We typically continue so user sees "Passed 3/20" instead of just "Failed"
                    // But if you want to stop early, uncomment the next line:
                    // break; 
                }

            } catch (innerError) {
                isCorrect = false;
                finalResults.push({
                    passed: false,
                    // Mask input on error too if hidden
                    input: testCase.isPublic ? testCase.input : "Hidden Test Case",
                    error: innerError.message || "Runtime Error"
                });
                // Usually good to break on runtime errors (like timeouts)
                break; 
            }
        }

        // 3. Send Final Response
        res.json({
            success: true,
            isCorrect: isCorrect && (passedCount === problem.testCases.length),
            passedCount,
            totalTestCases: problem.testCases.length,
            results: finalResults 
        });

    } catch (error) {
        console.error("Submit Code Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// export const submitCode = async (req, res) => {
//     const { language, code, problemId } = req.body;

//     try {
//         if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
//             return res.status(400).json({ message: "Invalid or missing Problem ID" });
//         }

//         const problem = await Problem.findById(problemId);
//         if (!problem) return res.status(404).json({ message: "Problem not found" });

//         // Helper: Robust Normalization
//         // Removes whitespace, handles line endings, and ignores invisible characters
//         const normalize = (str) => (str || "").toString().trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

//         let passedCount = 0;
//         let finalResults = [];
//         let isCorrect = true;

//         for (const testCase of problem.testCases) {
//             try {
//                 const result = await executeCode(language, code, testCase.input);
                
//                 if (!result || !result.run) {
//                     throw new Error("Execution engine timeout");
//                 }

//                 const actualOutput = normalize(result.run.stdout);
//                 const expectedOutput = normalize(testCase.output);
                
//                 // ✅ FIX: Only fail if there is a CRITICAL stderr (not just any warning)
//                 // We check if actual matches expected.
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
//                     break; // Short-circuit on first true failure
//                 }

//             } catch (innerError) {
//                 isCorrect = false;
//                 finalResults.push({ input: testCase.input, passed: false, error: innerError.message });
//                 break;
//             }
//         }

//         res.json({
//             success: true,
//             isCorrect: isCorrect && (passedCount === problem.testCases.length),
//             passedCount,
//             totalTestCases: problem.testCases.length,
//             results: finalResults 
//         });

//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };