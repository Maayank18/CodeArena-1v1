import { runInContext, createContext } from 'vm';

export const traceJavaScript = async (userCode) => {
    const trace = [];

    try {
        // 1. INSTRUMENTATION
        // Now accurately detects function arguments (r, c) and loop variables
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

// --- HELPER 2: Robust Instrumentation (The Fix) ---
function instrumentJs(code) {
    const lines = code.split('\n');
    let injectedCode = "";
    
    // 1. ADVANCED VARIABLE SCANNING
    let allVars = new Set();
    
    // Clean code for regex scanning (Remove comments)
    const cleanCode = code.replace(/\/\/.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

    // REGEX SET:
    // 1. Declarations: let x, const y, var z
    // 2. Function Args: function solve(r, c)
    // 3. Arrow Args: (a, b) =>
    // 4. Catch Clause: catch(err)
    
    const patterns = [
        /(?:let|const|var)\s+([a-zA-Z0-9_$]+|\[.*?\]|\{.*?\})/g, // Variables
        /function\s+\w*\s*\(([^)]*)\)/g, // Function Arguments
        /\(([^)]*)\)\s*=>/g, // Arrow Function Arguments
        /catch\s*\(([^)]+)\)/g // Catch block error variable
    ];

    patterns.forEach(regex => {
        let match;
        while ((match = regex.exec(cleanCode)) !== null) {
            const raw = match[1]; 
            if (!raw) continue;

            // Split by comma for args like (r, c)
            raw.split(',').forEach(part => {
                const clean = part.trim().replace(/[\[\]\{\}\.\s]/g, ''); // Naive cleanup for destructured args
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(clean)) {
                    allVars.add(clean);
                }
            });
        }
    });

    // Also scan for simple globals defined without keywords (edge case) or 'this' properties? 
    // No, strictly rely on scoping rules for now to avoid noise.

    const varList = Array.from(allVars);

    // 2. INJECTION
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();

        // Skip empty/comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
            injectedCode += line + '\n';
            return;
        }

        // Logic Continuation Check
        const isIncomplete = 
            trimmed.endsWith('{') || 
            trimmed.endsWith('(') || 
            trimmed.endsWith('[') || 
            trimmed.endsWith(',') || 
            trimmed.endsWith('.') || 
            trimmed.endsWith('=>') || 
            trimmed.endsWith(':') || 
            trimmed.endsWith('?');

        const isBlockEnd = trimmed === '}' || trimmed === '];' || trimmed === '});';

        if (isIncomplete || isBlockEnd) {
            injectedCode += line + '\n';
        } else {
            // Build Capturer
            // Wraps each var access in try/catch to handle Scope/TDZ issues
            const captureList = varList.map(v => `["${v}", () => ${v}]`);
            captureList.push(`["this", () => this]`); // Always capture 'this'

            const capturer = `() => {
                const captured = [];
                [${captureList.join(',')}].forEach(([name, getter]) => {
                    try { 
                        captured.push([name, getter()]); 
                    } catch (e) {
                        // Variable likely not in this scope or TDZ - Ignore
                    }
                });
                return captured;
            }`;

            // Inject AFTER the line
            injectedCode += `${line}\n __snapshot(${lineNum}, ${capturer});\n`;
        }
    });

    return injectedCode;
}













// import { runInContext, createContext } from 'vm';

// export const traceJavaScript = async (userCode) => {
//     const trace = [];

//     try {
//         // 1. INSTRUMENTATION
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
//                             safeVars[key] = safeSerialize(val);
//                         }
//                     });

//                     // Only push if we have valid variables to show
//                     if (Object.keys(safeVars).length > 0) {
//                         trace.push({ line, variables: safeVars });
//                     }
//                 } catch (e) {
//                     // Ignore snapshot errors
//                 }
//             }
//         };

//         createContext(sandbox);

//         // 3. EXECUTION (5s timeout for recursion)
//         runInContext(instrumentedCode, sandbox, { timeout: 5000 });

//     } catch (e) {
//         // Capture runtime errors
//         trace.push({ 
//             line: 0, 
//             error: e.message, 
//             type: "error" 
//         });
//     }

//     return trace;
// };

// // --- HELPER 1: Safe Serializer ---
// function safeSerialize(value, seen = new WeakMap()) {
//     if (value === null) return null;
    
//     // Handle special numbers
//     if (typeof value === 'number') {
//         if (Number.isNaN(value)) return 'NaN';
//         if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
//         return value;
//     }
    
//     // Primitives
//     if (typeof value !== 'object' && typeof value !== 'function') return value;
//     if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

//     // Circular reference check
//     if (seen.has(value)) return '[Circular]';
    
//     // Arrays
//     if (Array.isArray(value)) {
//         seen.set(value, true);
//         return value.map(item => safeSerialize(item, seen));
//     }

//     // Maps
//     if (value instanceof Map) {
//         seen.set(value, true);
//         return { 
//             type: 'Map', 
//             entries: Array.from(value.entries()).map(([k, v]) => [
//                 safeSerialize(k, seen), 
//                 safeSerialize(v, seen)
//             ]) 
//         };
//     }
    
//     // Sets
//     if (value instanceof Set) {
//         seen.set(value, true);
//         return { 
//             type: 'Set', 
//             values: Array.from(value.values()).map(v => safeSerialize(v, seen)) 
//         };
//     }

//     // Objects
//     seen.set(value, true);
//     const copy = {};
//     for (const key in value) {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//             copy[key] = safeSerialize(value[key], seen);
//         }
//     }
//     return copy;
// }

// // --- HELPER 2: ✅ FIXED INSTRUMENTATION ---
// function instrumentJs(code) {
//     const lines = code.split('\n');
//     let injectedCode = "";
    
//     // 1. VARIABLE SCANNING
//     let allVars = new Set();
//     const cleanCode = code.replace(/\/\/.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

//     const patterns = [
//         /(?:let|const|var)\s+([a-zA-Z0-9_$]+|\[.*?\]|\{.*?\})/g,
//         /function\s+\w*\s*\(([^)]*)\)/g,
//         /\(([^)]*)\)\s*=>/g,
//         /catch\s*\(([^)]+)\)/g
//     ];

//     patterns.forEach(regex => {
//         let match;
//         while ((match = regex.exec(cleanCode)) !== null) {
//             const raw = match[1]; 
//             if (!raw) continue;

//             raw.split(',').forEach(part => {
//                 const clean = part.trim().replace(/[\[\]\{\}\.\s]/g, '');
//                 if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(clean)) {
//                     allVars.add(clean);
//                 }
//             });
//         }
//     });

//     const varList = Array.from(allVars);

//     // 2. ✅ FIXED: Track loops but NOT functions
//     let insideLoop = false;
//     let loopDepth = 0;

//     // 3. INJECTION
//     lines.forEach((line, index) => {
//         const lineNum = index + 1;
//         const trimmed = line.trim();

//         // Skip empty/comments
//         if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
//             injectedCode += line + '\n';
//             return;
//         }

//         // ✅ Track loops (for, while, do)
//         if (trimmed.match(/^(for|while|do)\s*\(/)) {
//             insideLoop = true;
//             loopDepth++;
//         }

//         // ✅ Track block endings
//         if (trimmed === '}' || trimmed === '};' || trimmed === '});') {
//             if (loopDepth > 0) {
//                 loopDepth--;
//                 if (loopDepth === 0) {
//                     insideLoop = false;
//                 }
//             }
//         }

//         // ✅ CRITICAL FIX: Removed insideFunction check entirely
//         // Now we capture inside function bodies too!

//         // Detect incomplete lines
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

//         // Skip capturing on incomplete/block-end lines
//         if (isIncomplete || isBlockEnd) {
//             injectedCode += line + '\n';
//             return;
//         }

//         // ✅ AGGRESSIVE CAPTURING
//         const shouldCapture = (
//             // Variable mutations
//             trimmed.includes('=') ||
            
//             // Array/object mutations
//             trimmed.match(/\[.*\]\s*=/) ||
//             trimmed.match(/\.\w+\s*=/) ||
            
//             // Function calls (including recursive)
//             trimmed.match(/\w+\s*\(/) ||
            
//             // Return statements (capture before returning)
//             trimmed.startsWith('return') ||
            
//             // Always capture inside loops
//             insideLoop
//         );

//         if (shouldCapture) {
//             // Build capturer
//             const captureList = varList.map(v => `["${v}", () => ${v}]`);
//             captureList.push(`["this", () => this]`);

//             const capturer = `() => {
//                 const captured = [];
//                 [${captureList.join(',')}].forEach(([name, getter]) => {
//                     try { 
//                         captured.push([name, getter()]); 
//                     } catch (e) {
//                         // Variable not in scope
//                     }
//                 });
//                 return captured;
//             }`;

//             // Inject AFTER the line
//             injectedCode += `${line}\n __snapshot(${lineNum}, ${capturer});\n`;
//         } else {
//             injectedCode += line + '\n';
//         }
//     });

//     return injectedCode;
// }