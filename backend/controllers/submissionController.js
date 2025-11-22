import { executeCode } from '../utils/pistonClient.js';
import Problem from '../models/Problem.js';

// @desc    Run code against a specific test case
// @route   POST /api/run
// @access  Public (for now)
export const runCode = async (req, res) => {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
        return res.status(400).json({ message: "Language and Code are required" });
    }

    try {
        const result = await executeCode(language, code, stdin);
        
        // Piston returns the result in `run` object
        res.json({
            success: true,
            output: result.run.output,
            stdout: result.run.stdout,
            stderr: result.run.stderr,
            executionTime: result.run.millis, // optional metrics
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }  
};


export const submitCode = async (req, res) => {
    const { language, code, problemId } = req.body;

    try {
        // 1. Get the problem to find Hidden Test Cases
        // (Note: We use slug or title to find it, or pass ID from frontend)
        // For now, let's assume frontend sends the correct problem ID or we find by title
        const problem = await Problem.findOne({ _id: problemId }); 

        if (!problem) return res.status(404).json({ message: "Problem not found" });

        let passedCount = 0;
        let results = [];

        // 2. Loop through ALL test cases (Public + Hidden)
        for (const testCase of problem.testCases) {
            const result = await executeCode(language, code, testCase.input);
            
            // 3. Normalize outputs (trim whitespace/newlines) to compare
            const actualOutput = (result.run.stdout || "").trim();
            const expectedOutput = (testCase.output || "").trim();
            
            const passed = actualOutput === expectedOutput;
            if (passed) passedCount++;

            results.push({
                input: testCase.input,
                expected: expectedOutput,
                actual: actualOutput,
                passed: passed
            });
        }

        // 4. Calculate Score
        const isCorrect = passedCount === problem.testCases.length;
        const score = isCorrect ? 10 : 0; // Simple +10 or 0 logic

        res.json({
            success: true,
            isCorrect,
            passedCount,
            totalTestCases: problem.testCases.length,
            score,
            results // Send back details so user knows what failed
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};