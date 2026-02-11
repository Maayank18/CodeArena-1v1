// import { runInContext, createContext } from 'vm';

// export const traceJavaScript = async (userCode) => {
//     const trace = [];

//     try {
//         // 1. INSTRUMENTATION
//         // Now accurately detects function arguments (r, c) and loop variables
//         const instrumentedCode = instrumentJs(userCode);

//         // 2. SANDBOX SETUP
//         const sandbox = {
//             console: { 
//                 log: (...args) => {} // Silently swallow logs
//             },
            
//             // The snapshot function captures variable states
//             __snapshot: (line, capturer) => {
//                 try {
//                     const capturedVars = capturer();
//                     const safeVars = {};

//                     capturedVars.forEach(([key, val]) => {
//                         if (val !== undefined) {
//                             // Serialize safely (Handle Cycles, Infinity, Maps)
//                             safeVars[key] = safeSerialize(val);
//                         }
//                     });

//                     // Only push if we have valid variables to show (Optimization)
//                     if (Object.keys(safeVars).length > 0) {
//                         trace.push({ line, variables: safeVars });
//                     }
//                 } catch (e) {
//                     // Ignore snapshot errors (e.g., accessing variables in TDZ)
//                 }
//             }
//         };

//         createContext(sandbox);

//         // 3. EXECUTION
//         // 5000ms timeout for heavy recursion
//         runInContext(instrumentedCode, sandbox, { timeout: 5000 });

//     } catch (e) {
//         // Capture Runtime Errors (like "Maximum call stack size exceeded")
//         trace.push({ 
//             line: 0, 
//             error: e.message, 
//             type: "error" 
//         });
//     }

//     return trace;
// };

// // --- HELPER 1: Safe Serializer (Prevents Crashes) ---
// function safeSerialize(value, seen = new WeakMap()) {
//     if (value === null) return null;
    
//     // Handle Numbers (Infinity, NaN)
//     if (typeof value === 'number') {
//         if (Number.isNaN(value)) return 'NaN';
//         if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
//         return value;
//     }
    
//     // Pass primitives through
//     if (typeof value !== 'object' && typeof value !== 'function') return value;
//     if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

//     // Circular Reference Check
//     if (seen.has(value)) return '[Circular]';
    
//     // Handle Arrays
//     if (Array.isArray(value)) {
//         seen.set(value, true);
//         return value.map(item => safeSerialize(item, seen));
//     }

//     // Handle Maps
//     if (value instanceof Map) {
//         seen.set(value, true);
//         return { 
//             type: 'Map', 
//             entries: Array.from(value.entries()).map(([k, v]) => [safeSerialize(k, seen), safeSerialize(v, seen)]) 
//         };
//     }
    
//     // Handle Sets
//     if (value instanceof Set) {
//         seen.set(value, true);
//         return { 
//             type: 'Set', 
//             values: Array.from(value.values()).map(v => safeSerialize(v, seen)) 
//         };
//     }

//     // Handle Objects
//     seen.set(value, true);
//     const copy = {};
//     for (const key in value) {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//             copy[key] = safeSerialize(value[key], seen);
//         }
//     }
//     return copy;
// }

// // --- HELPER 2: Robust Instrumentation (The Fix) ---
// function instrumentJs(code) {
//     const lines = code.split('\n');
//     let injectedCode = "";
    
//     // 1. ADVANCED VARIABLE SCANNING
//     let allVars = new Set();
    
//     // Clean code for regex scanning (Remove comments)
//     const cleanCode = code.replace(/\/\/.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

//     // REGEX SET:
//     // 1. Declarations: let x, const y, var z
//     // 2. Function Args: function solve(r, c)
//     // 3. Arrow Args: (a, b) =>
//     // 4. Catch Clause: catch(err)
    
//     const patterns = [
//         /(?:let|const|var)\s+([a-zA-Z0-9_$]+|\[.*?\]|\{.*?\})/g, // Variables
//         /function\s+\w*\s*\(([^)]*)\)/g, // Function Arguments
//         /\(([^)]*)\)\s*=>/g, // Arrow Function Arguments
//         /catch\s*\(([^)]+)\)/g // Catch block error variable
//     ];

//     patterns.forEach(regex => {
//         let match;
//         while ((match = regex.exec(cleanCode)) !== null) {
//             const raw = match[1]; 
//             if (!raw) continue;

//             // Split by comma for args like (r, c)
//             raw.split(',').forEach(part => {
//                 const clean = part.trim().replace(/[\[\]\{\}\.\s]/g, ''); // Naive cleanup for destructured args
//                 if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(clean)) {
//                     allVars.add(clean);
//                 }
//             });
//         }
//     });

//     // Also scan for simple globals defined without keywords (edge case) or 'this' properties? 
//     // No, strictly rely on scoping rules for now to avoid noise.

//     const varList = Array.from(allVars);

//     // 2. INJECTION
//     lines.forEach((line, index) => {
//         const lineNum = index + 1;
//         const trimmed = line.trim();

//         // Skip empty/comments
//         if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
//             injectedCode += line + '\n';
//             return;
//         }

//         // Logic Continuation Check
//         const isIncomplete = 
//             trimmed.endsWith('{') || 
//             trimmed.endsWith('(') || 
//             trimmed.endsWith('[') || 
//             trimmed.endsWith(',') || 
//             trimmed.endsWith('.') || 
//             trimmed.endsWith('=>') || 
//             trimmed.endsWith(':') || 
//             trimmed.endsWith('?');

//         const isBlockEnd = trimmed === '}' || trimmed === '];' || trimmed === '});';

//         if (isIncomplete || isBlockEnd) {
//             injectedCode += line + '\n';
//         } else {
//             // Build Capturer
//             // Wraps each var access in try/catch to handle Scope/TDZ issues
//             const captureList = varList.map(v => `["${v}", () => ${v}]`);
//             captureList.push(`["this", () => this]`); // Always capture 'this'

//             const capturer = `() => {
//                 const captured = [];
//                 [${captureList.join(',')}].forEach(([name, getter]) => {
//                     try { 
//                         captured.push([name, getter()]); 
//                     } catch (e) {
//                         // Variable likely not in this scope or TDZ - Ignore
//                     }
//                 });
//                 return captured;
//             }`;

//             // Inject AFTER the line
//             injectedCode += `${line}\n __snapshot(${lineNum}, ${capturer});\n`;
//         }
//     });

//     return injectedCode;
// }






// upar wala theek thak tha 

//  neeche wala optmised hai 






// import { runInContext, createContext } from 'vm';
// import * as acorn from 'acorn';

// export const traceJavaScript = async (userCode) => {
//     const trace = [];

//     try {
//         // 1. INSTRUMENTATION (Now using AST)
//         const instrumentedCode = instrumentJs(userCode);

//         // 2. SANDBOX SETUP
//         const sandbox = {
//             console: { 
//                 log: (...args) => {} // Silently swallow logs
//             },
            
//             // The snapshot function captures variable states
//             __snapshot: (line, capturer) => {
//                 try {
//                     const capturedVars = capturer();
//                     const safeVars = {};

//                     capturedVars.forEach(([key, val]) => {
//                         if (val !== undefined) {
//                             // Serialize safely (Handle Cycles, Infinity, Maps)
//                             safeVars[key] = safeSerialize(val);
//                         }
//                     });

//                     // Only push if we have valid variables to show (Optimization)
//                     if (Object.keys(safeVars).length > 0) {
//                         trace.push({ line, variables: safeVars });
//                     }
//                 } catch (e) {
//                     // Ignore snapshot errors (e.g., accessing variables in TDZ)
//                 }
//             }
//         };

//         createContext(sandbox);

//         // 3. EXECUTION
//         // 5000ms timeout for heavy recursion
//         runInContext(instrumentedCode, sandbox, { timeout: 5000 });

//     } catch (e) {
//         // Capture Runtime Errors (like "Maximum call stack size exceeded")
//         trace.push({ 
//             line: 0, 
//             error: e.message, 
//             type: "error" 
//         });
//     }

//     return trace;
// };

// // --- HELPER 1: Safe Serializer (Prevents Crashes) ---
// function safeSerialize(value, seen = new WeakMap()) {
//     if (value === null) return null;
    
//     // Handle Numbers (Infinity, NaN)
//     if (typeof value === 'number') {
//         if (Number.isNaN(value)) return 'NaN';
//         if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
//         return value;
//     }
    
//     // Pass primitives through
//     if (typeof value !== 'object' && typeof value !== 'function') return value;
//     if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

//     // Circular Reference Check
//     if (seen.has(value)) return '[Circular]';
    
//     // Handle Arrays
//     if (Array.isArray(value)) {
//         seen.set(value, true);
//         return value.map(item => safeSerialize(item, seen));
//     }

//     // Handle Maps
//     if (value instanceof Map) {
//         seen.set(value, true);
//         return { 
//             type: 'Map', 
//             entries: Array.from(value.entries()).map(([k, v]) => [safeSerialize(k, seen), safeSerialize(v, seen)]) 
//         };
//     }
    
//     // Handle Sets
//     if (value instanceof Set) {
//         seen.set(value, true);
//         return { 
//             type: 'Set', 
//             values: Array.from(value.values()).map(v => safeSerialize(v, seen)) 
//         };
//     }

//     // Handle Objects
//     seen.set(value, true);
//     const copy = {};
//     for (const key in value) {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//             copy[key] = safeSerialize(value[key], seen);
//         }
//     }
//     return copy;
// }

// // --- HELPER 2: AST-Based Instrumentation (Optimized) ---
// function instrumentJs(code) {
//     try {
//         // Parse into AST (Abstract Syntax Tree) with locations
//         const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
        
//         const inserts = [];
//         const vars = new Set();

//         // Recursive walker to find Variables and Statements
//         const walk = (node) => {
//             if (!node || typeof node !== 'object') return;

//             // 1. Capture Variable Names
//             // Handles: let i=0, j=0 (VariableDeclarator catches both)
//             if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
//                 vars.add(node.id.name);
//             }
//             // Handles: function foo(a, b)
//             if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') && node.params) {
//                 node.params.forEach(param => {
//                     if (param.type === 'Identifier') vars.add(param.name);
//                 });
//             }

//             // 2. Identify Injection Points (Statement Ends)
//             // We inject snapshots after these statement types to capture state
//             if (['VariableDeclaration', 'ExpressionStatement', 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'ForStatement', 'WhileStatement', 'DoWhileStatement'].includes(node.type)) {
//                 if (node.loc && node.end) {
//                     inserts.push({
//                         line: node.loc.end.line,
//                         pos: node.end
//                     });
//                 }
//             }

//             // Recurse into children
//             Object.keys(node).forEach(key => {
//                 const child = node[key];
//                 if (Array.isArray(child)) {
//                     child.forEach(c => walk(c));
//                 } else if (child && typeof child === 'object' && key !== 'loc') {
//                     walk(child);
//                 }
//             });
//         };

//         walk(ast);

//         // Always capture 'this' context
//         vars.add('this');

//         const varList = Array.from(vars);
        
//         // Sort insertions in reverse order to prevent index shifting during string manipulation
//         inserts.sort((a, b) => b.pos - a.pos);

//         let output = code;
//         const processedPositions = new Set();

//         inserts.forEach(({ line, pos }) => {
//             // Deduplicate positions (e.g. ForStatement might overlap with its internal logic)
//             if (processedPositions.has(pos)) return;
//             processedPositions.add(pos);

//             // Generate snapshot code
//             // We use 'typeof check' to safely access variables that might be in TDZ or not defined in current scope
//             const captureList = varList.map(v => `["${v}", typeof ${v} !== 'undefined' ? ${v} : undefined]`).join(',');
//             const snippet = `;__snapshot(${line}, () => [${captureList}]);`;
            
//             output = output.slice(0, pos) + snippet + output.slice(pos);
//         });

//         return output;

//     } catch (e) {
//         // Fallback: If AST parsing fails (e.g. user syntax error), return original code 
//         // so the runtime can throw the actual syntax error to the user
//         return code;
//     }
// }





// ab jo niche wala hai wo optmised hai more refined version 

import { runInContext, createContext } from 'vm';
import * as acorn from 'acorn';

export const traceJavaScript = async (userCode) => {
    const trace = [];

    try {
        // 1. INSTRUMENTATION (AST-Based)
        const instrumentedCode = instrumentJs(userCode);

        // 2. SANDBOX SETUP
        const sandbox = {
            console: { 
                log: (...args) => {} // Silently swallow logs
            },
            
            // The snapshot function captures variable states
            __snapshot: (line, capturer) => {
                try {
                    const capturedVars = capturer();
                    const safeVars = {};

                    capturedVars.forEach(([key, val]) => {
                        if (val !== undefined) {
                            // Serialize safely (Handle Cycles, Infinity, Maps)
                            safeVars[key] = safeSerialize(val);
                        }
                    });

                    // Only push if we have valid variables to show (Optimization)
                    if (Object.keys(safeVars).length > 0) {
                        trace.push({ line, variables: safeVars });
                    }
                } catch (e) {
                    // Ignore snapshot errors (e.g., accessing variables in TDZ)
                }
            }
        };

        createContext(sandbox);

        // 3. EXECUTION
        // 5000ms timeout for heavy recursion
        runInContext(instrumentedCode, sandbox, { timeout: 5000 });

    } catch (e) {
        // Capture Runtime Errors (like "Maximum call stack size exceeded")
        trace.push({ 
            line: 0, 
            error: e.message, 
            type: "error" 
        });
    }

    return trace;
};

// --- HELPER 1: Safe Serializer (Prevents Crashes) ---
function safeSerialize(value, seen = new WeakMap()) {
    if (value === null) return null;
    
    // Handle Numbers (Infinity, NaN)
    if (typeof value === 'number') {
        if (Number.isNaN(value)) return 'NaN';
        if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
        return value;
    }
    
    // Pass primitives through
    if (typeof value !== 'object' && typeof value !== 'function') return value;
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

    // Circular Reference Check
    if (seen.has(value)) return '[Circular]';
    
    // Handle Arrays
    if (Array.isArray(value)) {
        seen.set(value, true);
        return value.map(item => safeSerialize(item, seen));
    }

    // Handle Maps
    if (value instanceof Map) {
        seen.set(value, true);
        return { 
            type: 'Map', 
            entries: Array.from(value.entries()).map(([k, v]) => [safeSerialize(k, seen), safeSerialize(v, seen)]) 
        };
    }
    
    // Handle Sets
    if (value instanceof Set) {
        seen.set(value, true);
        return { 
            type: 'Set', 
            values: Array.from(value.values()).map(v => safeSerialize(v, seen)) 
        };
    }

    // Handle Objects
    seen.set(value, true);
    const copy = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            copy[key] = safeSerialize(value[key], seen);
        }
    }
    return copy;
}

// --- HELPER 2: AST-Based Instrumentation (Optimized) ---
function instrumentJs(code) {
    try {
        // Parse into AST with locations
        const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
        
        const inserts = [];
        const vars = new Set();

        // Recursive walker to find Variables and Statements
        // Added 'parent' parameter to detect context (like loops)
        const walk = (node, parent) => {
            if (!node || typeof node !== 'object') return;

            // 1. Capture Variable Names
            // Handles: let i=0, j=0 (VariableDeclarator catches both)
            if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
                vars.add(node.id.name);
            }
            // Handles: function foo(a, b)
            if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') && node.params) {
                node.params.forEach(param => {
                    if (param.type === 'Identifier') vars.add(param.name);
                });
            }

            // 2. Identify Injection Points (Statement Ends)
            // We inject snapshots after these statement types to capture state
            if (['VariableDeclaration', 'ExpressionStatement', 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'DoWhileStatement'].includes(node.type)) {
                
                // 🛑 CRITICAL FIX: Do NOT inject inside loop headers
                const isLoopHeader = parent && (
                    parent.type === 'ForStatement' || 
                    parent.type === 'ForInStatement' || 
                    parent.type === 'ForOfStatement'
                );

                if (!isLoopHeader && node.loc && node.end) {
                    inserts.push({
                        line: node.loc.end.line,
                        pos: node.end
                    });
                }
            }

            // 3. Handle Block Statements (Loops/Ifs) separately to capture start/end
            // This ensures we capture 'i' inside the loop body, not the header
            if (node.type === 'BlockStatement') {
                // We don't inject here directly, the children processing handles it
            }

            // Recurse into children, passing current node as parent
            Object.keys(node).forEach(key => {
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(c => walk(c, node));
                } else if (child && typeof child === 'object' && key !== 'loc') {
                    walk(child, node);
                }
            });
        };

        walk(ast, null);

        // Always capture 'this' context
        vars.add('this');

        const varList = Array.from(vars);
        
        // Sort insertions in reverse order to prevent index shifting during string manipulation
        inserts.sort((a, b) => b.pos - a.pos);

        let output = code;
        const processedPositions = new Set();

        inserts.forEach(({ line, pos }) => {
            // Deduplicate positions
            if (processedPositions.has(pos)) return;
            processedPositions.add(pos);

            // Generate snapshot code
            // We use 'typeof check' to safely access variables that might be in TDZ or not defined in current scope
            const captureList = varList.map(v => `["${v}", typeof ${v} !== 'undefined' ? ${v} : undefined]`).join(',');
            const snippet = `;__snapshot(${line}, () => [${captureList}]);`;
            
            output = output.slice(0, pos) + snippet + output.slice(pos);
        });

        return output;

    } catch (e) {
        console.error("Instrumentation Failed:", e);
        // Fallback: Return original code so the runtime throws the actual user syntax error
        return code;
    }
}