// import { runInContext, createContext } from 'vm';

// export const traceJavaScript = async (userCode) => {
//     const trace = [];

//     // 1. INSTRUMENTATION: Inject "Spy" calls safely
//     const instrumentedCode = instrumentJs(userCode);

//     // 2. SANDBOX SETUP
//     const sandbox = {
//         console: { log: () => {} }, // Silence logs
        
//         // The spy function now accepts a 'capturer' function
//         __snapshot: (line, capturer) => {
//             try {
//                 // Execute the capturer to get current scope values
//                 // The capturer returns an array of [key, value] pairs safely
//                 const capturedVars = capturer();
                
//                 const safeVars = {};
                
//                 capturedVars.forEach(([key, val]) => {
//                     // Filter out undefined/null if you want, or keep them
//                     // We keep them to show state accurately
//                     if (val !== undefined) {
//                         try {
//                             // Handle circular references or complex objects
//                             safeVars[key] = JSON.parse(JSON.stringify(val));
//                         } catch (e) {
//                             safeVars[key] = '[Circular/Complex]';
//                         }
//                     }
//                 });

//                 trace.push({
//                     line: line,
//                     variables: safeVars
//                 });
//             } catch (e) { 
//                 console.error("Snapshot error", e);
//             }
//         }
//     };

//     createContext(sandbox);

//     // 3. EXECUTION
//     try {
//         runInContext(instrumentedCode, sandbox, { timeout: 2000 });
//     } catch (e) {
//         trace.push({ 
//             line: 0, 
//             error: e.message, 
//             type: "error" 
//         });
//     }

//     return trace;
// };

// // --- HELPER: AST-free Instrumentation (Robust Version) ---
// function instrumentJs(code) {
//     const lines = code.split('\n');
//     let injectedCode = "";

//     // 1. PRE-SCAN: Find ALL variable names in the entire file first
//     const varRegex = /(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;
//     let allVars = new Set();
    
//     // Also capture 'this' implicitly by adding it to the list check
//     // We don't add it to allVars for regex matching, but we inject it manually later
    
//     lines.forEach(line => {
//         let match;
//         while ((match = varRegex.exec(line)) !== null) {
//             allVars.add(match[1]);
//         }
//     });

//     const varList = Array.from(allVars);

//     // 2. INJECTION
//     lines.forEach((line, index) => {
//         const lineNum = index + 1;
//         const trimmed = line.trim();

//         // Safety checks to avoid breaking syntax
//         const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');
//         const isEmpty = trimmed.length === 0;
//         const isIncomplete = 
//             trimmed.endsWith('[') || 
//             trimmed.endsWith('{') || 
//             trimmed.endsWith('(') || 
//             trimmed.endsWith(',') || 
//             trimmed.endsWith(':') ||
//             trimmed.endsWith('=>') ||
//             trimmed.endsWith('?');
//         const isClosing = trimmed === '}' || trimmed === '];' || trimmed === '});';
//         const isClassProp = trimmed.includes('=') && !trimmed.includes('let ') && !trimmed.includes('const ') && !trimmed.includes('var ') && !trimmed.includes(';'); // Loose check for class fields

//         if (isComment || isEmpty || isIncomplete || isClosing) {
//             injectedCode += line + '\n';
//         } else {
//             // THE MAGIC: 
//             // We construct an array of safe getters: [ ["root", () => root], ["i", () => i] ]
//             // We wrap each variable access in a function so it doesn't crash if the variable is in TDZ (Temporal Dead Zone)
            
//             const captureList = varList.map(v => `["${v}", () => ${v}]`);
//             // Add 'this' capture (wrapped in try-catch logic implicitly by being a function)
//             captureList.push(`["this", () => this]`);

//             const capturerCode = `() => {
//                 const captured = [];
//                 [${captureList.join(',')}].forEach(([name, getter]) => {
//                     try {
//                         captured.push([name, getter()]);
//                     } catch (e) {
//                         // Ignore ReferenceErrors (TDZ)
//                     }
//                 });
//                 return captured;
//             }`;

//             injectedCode += `${line}\n __snapshot(${lineNum}, ${capturerCode});\n`;
//         }
//     });

//     return injectedCode;
// }










import { runInContext, createContext } from 'vm';

export const traceJavaScript = async (userCode) => {
    const trace = [];

    try {
        // 1. INSTRUMENTATION
        const instrumentedCode = instrumentJs(userCode);

        // 2. SANDBOX SETUP
        const sandbox = {
            console: { log: () => {} }, 
            __snapshot: (line, capturer) => {
                try {
                    const capturedVars = capturer();
                    const safeVars = {};
                    capturedVars.forEach(([key, val]) => {
                        if (val !== undefined) {
                            try {
                                safeVars[key] = JSON.parse(JSON.stringify(val));
                            } catch (e) {
                                safeVars[key] = String(val); 
                            }
                        }
                    });
                    trace.push({ line, variables: safeVars });
                } catch (e) { }
            }
        };

        createContext(sandbox);

        // 3. EXECUTION
        runInContext(instrumentedCode, sandbox, { timeout: 2000 });

    } catch (e) {
        trace.push({ line: 0, error: e.message, type: "error" });
    }

    return trace;
};

// --- HELPER: AST-free Instrumentation ---
function instrumentJs(code) {
    const lines = code.split('\n');
    let injectedCode = "";

    // 1. SMART VARIABLE SCANNING
    let allVars = new Set();
    const declRegex = /(?:let|const|var)\s+([^;]+)/g;
    const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    let match;
    while ((match = declRegex.exec(cleanCode)) !== null) {
        const vars = match[1].split(',');
        vars.forEach(v => {
            const varName = v.trim().split('=')[0].trim().split(/\s+/)[0]; 
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(varName)) {
                allVars.add(varName);
            }
        });
    }

    const varList = Array.from(allVars);

    // 2. LINE-BY-LINE INJECTION
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();

        const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');
        const isEmpty = trimmed.length === 0;
        
        // ✅ FIX IS HERE: Added ']' to the incomplete list
        const isIncomplete = 
            trimmed.endsWith('{') || 
            trimmed.endsWith('[') || 
            trimmed.endsWith('(') || 
            trimmed.endsWith(',') || 
            trimmed.endsWith(':') ||
            trimmed.endsWith('=>') ||
            trimmed.endsWith('?') ||
            trimmed.endsWith('.') ||
            trimmed.endsWith(']'); // <--- CRITICAL FIX

        const isClosing = trimmed === '}' || trimmed === '];' || trimmed === '});';

        if (isComment || isEmpty || isIncomplete || isClosing) {
            injectedCode += line + '\n';
        } else {
            const captureList = varList.map(v => `["${v}", () => ${v}]`);
            captureList.push(`["this", () => this]`);

            const capturer = `() => {
                const captured = [];
                [${captureList.join(',')}].forEach(([name, getter]) => {
                    try { captured.push([name, getter()]); } catch (e) {}
                });
                return captured;
            }`;

            injectedCode += `${line}\n __snapshot(${lineNum}, ${capturer});\n`;
        }
    });

    return injectedCode;
}