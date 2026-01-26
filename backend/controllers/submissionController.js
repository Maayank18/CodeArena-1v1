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

export const submitCode = async (req, res) => {
    const { language, code, problemId } = req.body;

    try {
        if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
            return res.status(400).json({ message: "Invalid or missing Problem ID" });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Problem not found" });

        // Helper: Robust Normalization
        // Removes whitespace, handles line endings, and ignores invisible characters
        const normalize = (str) => (str || "").toString().trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        let passedCount = 0;
        let finalResults = [];
        let isCorrect = true;

        for (const testCase of problem.testCases) {
            try {
                const result = await executeCode(language, code, testCase.input);
                
                if (!result || !result.run) {
                    throw new Error("Execution engine timeout");
                }

                const actualOutput = normalize(result.run.stdout);
                const expectedOutput = normalize(testCase.output);
                
                // ✅ FIX: Only fail if there is a CRITICAL stderr (not just any warning)
                // We check if actual matches expected.
                const matches = actualOutput === expectedOutput;
                
                if (matches) {
                    passedCount++;
                    finalResults.push({ input: testCase.input, passed: true });
                } else {
                    isCorrect = false;
                    finalResults.push({
                        input: testCase.input,
                        expected: expectedOutput,
                        actual: actualOutput,
                        error: result.run.stderr || "Output Mismatch",
                        passed: false
                    });
                    break; // Short-circuit on first true failure
                }

            } catch (innerError) {
                isCorrect = false;
                finalResults.push({ input: testCase.input, passed: false, error: innerError.message });
                break;
            }
        }

        res.json({
            success: true,
            isCorrect: isCorrect && (passedCount === problem.testCases.length),
            passedCount,
            totalTestCases: problem.testCases.length,
            results: finalResults 
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

