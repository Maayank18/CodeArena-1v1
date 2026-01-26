import express from 'express';
import { executeVisualization } from '../controllers/visualizerController.js';

const router = express.Router();

// POST /api/visualize/run
// Body: { code: string, language: "javascript" | "cpp" }
router.post('/run', executeVisualization);

export default router;



// import express from 'express';
// const router = express.Router();

// /**
//  * POST /api/visualize/run
//  * Executes JavaScript code with execution tracing
//  */
// router.post('/run', async (req, res) => {
//     const { code, language } = req.body;

//     if (language !== 'javascript') {
//         return res.status(400).json({
//             success: false,
//             message: 'Only JavaScript is supported'
//         });
//     }

//     if (!code || code.trim().length === 0) {
//         return res.status(400).json({
//             success: false,
//             message: 'Code cannot be empty'
//         });
//     }

//     try {
//         // Create a Function that executes code and returns variables
//         const captureVariables = new Function(`
//             const trace = [];
//             let __line = 1;
            
//             const __capture = () => {
//                 const vars = {};
//                 try {
//                     ${extractVariableNames(code).map(name => 
//                         `if (typeof ${name} !== 'undefined') vars.${name} = ${name};`
//                     ).join('\n')}
//                 } catch(e) {}
                
//                 trace.push({ line: __line, variables: vars });
//             };
            
//             // User's code with periodic captures
//             ${instrumentCodeWithCaptures(code)}
            
//             __capture(); // Final capture
//             return trace;
//         `);

//         const result = captureVariables();
        
//         res.json({
//             success: true,
//             trace: result,
//             message: `Captured ${result.length} execution steps`
//         });

//     } catch (error) {
//         console.error('Execution error:', error);
//         // Distinguish syntax errors from runtime errors
//         const isSyntax = error instanceof SyntaxError;
//         res.status(isSyntax ? 400 : 500).json({
//             success: false,
//             message: isSyntax ? 'Syntax Error in Code' : (error.message || 'Execution failed'),
//             error: error.stack
//         });
//     }
// });

// /**
//  * Extract variable names from code
//  */
// function extractVariableNames(code) {
//     // Regex to find variable names. 
//     // Note: This simple regex might miss "j" in "let i=0, j=0;"
//     const varRegex = /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
//     const vars = new Set();
//     let match;
    
//     while ((match = varRegex.exec(code)) !== null) {
//         vars.add(match[1]);
//     }
    
//     // Add manual support for common loop variables usually declared in comma lists
//     // (A hacky fix for the specific matrix traversal case)
//     if (code.includes('j =')) vars.add('j');
//     if (code.includes('k =')) vars.add('k');
    
//     return Array.from(vars);
// }

// /**
//  * Instrument code to add capture points
//  * ✅ UPDATED to handle multi-line arrays/objects safely
//  */
// function instrumentCodeWithCaptures(code) {
//     const lines = code.split('\n');
//     const instrumented = [];
    
//     lines.forEach((line, idx) => {
//         // Track line numbers
//         instrumented.push(`__line = ${idx + 1};`);
//         instrumented.push(line);
        
//         const trimmed = line.trim();
        
//         // Skip comments and empty lines
//         if (trimmed.startsWith('//') || trimmed.length === 0) return;

//         // Check if the line likely modifies state
//         const isStateChange = 
//             line.includes('let ') || 
//             line.includes('const ') || 
//             line.includes('var ') || 
//             line.includes('=') ||
//             line.includes('++') ||
//             line.includes('--') ||
//             trimmed.endsWith('}');

//         // ✅ CRITICAL FIX: Check if the statement is likely incomplete
//         // If it ends with [ { ( , or operators, it continues to next line.
//         const isIncomplete = 
//             trimmed.endsWith('[') || 
//             trimmed.endsWith('{') || 
//             trimmed.endsWith('(') || 
//             trimmed.endsWith(',') ||
//             trimmed.endsWith(':') || 
//             trimmed.endsWith('=>') ||
//             trimmed.endsWith('?');

//         if (isStateChange && !isIncomplete) {
//             instrumented.push('__capture();');
//         }
//     });
    
//     return instrumented.join('\n');
// }

// export default router;