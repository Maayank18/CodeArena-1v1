// import { executeCode } from '../utils/pistonClient.js';
// import Problem from '../models/Problem.js';

// // @desc    Run code against a specific test case
// // @route   POST /api/run
// // @access  Public (for now)
// export const runCode = async (req, res) => {
//     const { language, code, stdin } = req.body;

//     if (!language || !code) {
//         return res.status(400).json({ message: "Language and Code are required" });
//     }

//     try {
//         const result = await executeCode(language, code, stdin);
        
//         // Piston returns the result in `run` object
//         res.json({
//             success: true,
//             output: result.run.output,
//             stdout: result.run.stdout,
//             stderr: result.run.stderr,
//             executionTime: result.run.millis, // optional metrics
//         });

//     } catch (error) {
//         res.status(500).json({ 
//             success: false, 
//             message: error.message 
//         });
//     }  
// };


// // export const submitCode = async (req, res) => {
// //     const { language, code, problemId } = req.body;

// //     try {
// //         // 1. Get the problem to find Hidden Test Cases
// //         // (Note: We use slug or title to find it, or pass ID from frontend)
// //         // For now, let's assume frontend sends the correct problem ID or we find by title
// //         const problem = await Problem.findOne({ _id: problemId }); 

// //         if (!problem) return res.status(404).json({ message: "Problem not found" });

// //         let passedCount = 0;
// //         let results = [];

// //         // 2. Loop through ALL test cases (Public + Hidden)
// //         for (const testCase of problem.testCases) {
// //             const result = await executeCode(language, code, testCase.input);
            
// //             // 3. Normalize outputs (trim whitespace/newlines) to compare
// //             const actualOutput = (result.run.stdout || "").trim();
// //             const expectedOutput = (testCase.output || "").trim();
            
// //             const passed = actualOutput === expectedOutput;
// //             if (passed) passedCount++;

// //             results.push({
// //                 input: testCase.input,
// //                 expected: expectedOutput,
// //                 actual: actualOutput,
// //                 passed: passed
// //             });
// //         }

// //         // 4. Calculate Score
// //         const isCorrect = passedCount === problem.testCases.length;
// //         const score = isCorrect ? 10 : 0; // Simple +10 or 0 logic

// //         res.json({
// //             success: true,
// //             isCorrect,
// //             passedCount,
// //             totalTestCases: problem.testCases.length,
// //             score,
// //             results // Send back details so user knows what failed
// //         });

// //     } catch (error) {
// //         res.status(500).json({ message: error.message });
// //     }
// // };

// export const submitCode = async (req, res) => {
//     const { language, code, problemId } = req.body;

//     try {
//         // 1. SAFETY CHECK: Validate problemId format
//         if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
//              return res.status(400).json({ message: "Invalid or missing Problem ID" });
//         }

//         // 2. Fetch Problem
//         const problem = await Problem.findById(problemId);
//         if (!problem) return res.status(404).json({ message: "Problem not found" });

//         if (!problem.testCases || problem.testCases.length === 0) {
//             return res.status(400).json({ message: "No test cases found for this problem." });
//         }

//         let passedCount = 0;
//         let results = [];

//         // 3. Loop through test cases
//         for (const testCase of problem.testCases) {
//             // Log what we are sending (for your debugging)
//             console.log(`Running test case input: ${testCase.input}`);

//             try {
//                 const result = await executeCode(language, code, testCase.input);
                
//                 // 4. SAFETY CHECK: Ensure Piston returned a valid 'run' object
//                 if (!result || !result.run) {
//                     console.error("Piston Error Result:", result);
//                     throw new Error("Execution engine failed to return a valid response.");
//                 }

//                 // Handle potential missing stdout (some errors only return stderr)
//                 const actualOutput = (result.run.stdout || "").trim();
//                 const expectedOutput = (testCase.output || "").trim();
//                 const errorOutput = (result.run.stderr || ""); // Capture errors too

//                 // Comparison Logic
//                 // Note: If actual output is empty but there is stderr, it's a fail
//                 const passed = (actualOutput === expectedOutput) && !errorOutput;

//                 if (passed) passedCount++;

//                 results.push({
//                     input: testCase.input,
//                     expected: expectedOutput,
//                     actual: actualOutput,
//                     error: errorOutput, // Send error back to frontend if it failed
//                     passed: passed
//                 });

//             } catch (innerError) {
//                 // If one test case crashes the engine, don't crash the whole server
//                 console.error(`Test Case Failed Execution: ${innerError.message}`);
//                 results.push({
//                     input: testCase.input,
//                     passed: false,
//                     error: "Execution Error: " + innerError.message
//                 });
//             }
//         }

//         // 5. Calculate Score
//         const isCorrect = passedCount === problem.testCases.length;
//         const score = isCorrect ? 10 : 0;

//         res.json({
//             success: true,
//             isCorrect,
//             passedCount,
//             totalTestCases: problem.testCases.length,
//             score,
//             results
//         });

//     } catch (error) {
//         console.error("Submit API Error:", error); // <--- CHECK YOUR TERMINAL FOR THIS
//         res.status(500).json({ message: "Server Error during submission", error: error.message });
//     }
// };









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

// @desc    Submit code against all test cases (Submit Button)
// @route   POST /api/run/submit
export const submitCode = async (req, res) => {
    const { language, code, problemId } = req.body;

    try {
        // 1. SAFETY CHECK: Validate problemId format
        // ✅ NOW THIS WORKS BECAUSE WE IMPORTED MONGOOSE
        if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
             return res.status(400).json({ message: "Invalid or missing Problem ID" });
        }

        // 2. Fetch Problem
        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Problem not found" });

        if (!problem.testCases || problem.testCases.length === 0) {
            return res.status(400).json({ message: "No test cases found for this problem." });
        }

        let passedCount = 0;
        let results = [];

        // 3. Loop through test cases
        for (const testCase of problem.testCases) {
            console.log(`Running test case input: ${testCase.input}`);

            try {
                const result = await executeCode(language, code, testCase.input);
                
                // 4. SAFETY CHECK: Ensure Piston returned a valid 'run' object
                if (!result || !result.run) {
                    throw new Error("Execution engine failed to return a valid response.");
                }

                // IMPROVED COMPARISON LOGIC
                // We replace \r\n with \n to ensure Windows/Linux line endings match
                const normalize = (str) => (str || "").trim().replace(/\r\n/g, "\n");

                const actualOutput = normalize(result.run.stdout);
                const expectedOutput = normalize(testCase.output);
                const errorOutput = result.run.stderr || ""; 

                // Passed if output matches AND no runtime errors
                const passed = (actualOutput === expectedOutput) && !errorOutput;

                if (passed) passedCount++;

                results.push({
                    input: testCase.input,
                    expected: expectedOutput,
                    actual: actualOutput,
                    error: errorOutput,
                    passed: passed
                });

            } catch (innerError) {
                console.error(`Test Case Failed: ${innerError.message}`);
                results.push({
                    input: testCase.input,
                    passed: false,
                    error: "Execution Error: " + innerError.message
                });
            }
        }

        // 5. Calculate Score
        const isCorrect = passedCount === problem.testCases.length;
        const score = isCorrect ? 10 : 0;

        res.json({
            success: true,
            isCorrect, // Frontend looks for this to emit 'level_completed' socket event
            passedCount,
            totalTestCases: problem.testCases.length,
            score,
            results
        });

    } catch (error) {
        console.error("Submit API Error:", error);
        res.status(500).json({ message: "Server Error during submission", error: error.message });
    }
};