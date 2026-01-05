// import axios from 'axios';

// // Map frontend language names to Piston's identifiers
// // Using version: '*' ensures we always use the latest supported version
// // so the code doesn't break if Piston updates their runtimes.
// const LANGUAGE_MAP = {
//     javascript: { language: 'javascript', version: '*' },
//     python: { language: 'python', version: '*' },
//     cpp: { language: 'c++', version: '*' },
//     "c++": { language: 'c++', version: '*' }, 
//     java: { language: 'java', version: '*' }
// };

// export const executeCode = async (language, sourceCode, stdin = "") => {
//     // 1. Validate Language
//     const config = LANGUAGE_MAP[language.toLowerCase()];
//     if (!config) {
//         throw new Error(`Unsupported language: ${language}`);
//     }

//     try {
//         // 2. Call Piston API
//         const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
//             language: config.language,
//             version: config.version,
//             files: [
//                 {
//                     content: sourceCode
//                 }
//             ],
//             stdin: stdin // Inputs for the problem test cases
//         });

//         // 3. Return the data directly
//         return response.data; 

//     } catch (error) {
//         // 4. IMPROVED ERROR HANDLING
//         // Axios creates specific error objects. We need to parse them to know WHY it failed.
        
//         if (error.response) {
//             // The server responded with a status code outside the 2xx range (e.g., 400, 429, 500)
//             console.error("Piston Error Response:", error.response.data);
            
//             // Extract the actual message from Piston (often contains rate limit info or compile errors)
//             const pistonMessage = error.response.data?.message || "Execution Service Error";
//             throw new Error(pistonMessage);
//         } 
//         else if (error.request) {
//             // The request was made but no response was received (Timeout or Network down)
//             console.error("Piston No Response:", error.request);
//             throw new Error("Execution timed out or network is down.");
//         } 
//         else {
//             // Something happened in setting up the request
//             console.error("Piston Request Setup Error:", error.message);
//             throw new Error("Failed to prepare execution request.");
//         }
//     }
// };




import axios from 'axios';

// Map frontend language names to Piston's identifiers
const LANGUAGE_MAP = {
    javascript: { language: 'javascript', version: '*' },
    python: { language: 'python', version: '*' },
    cpp: { language: 'c++', version: '*' },
    "c++": { language: 'c++', version: '*' }, 
    java: { language: 'java', version: '*' }
};

// ✅ UPDATED: Now accepts timeLimit (default 2000ms)
export const executeCode = async (language, sourceCode, stdin = "", timeLimit = 2000) => {
    // 1. Validate Language
    const config = LANGUAGE_MAP[language.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }

    try {
        // 2. Call Piston API with Constraints
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: config.language,
            version: config.version,
            files: [
                {
                    content: sourceCode
                }
            ],
            stdin: stdin,
            
            // ✅ ROBUSTNESS FIX: Enforce Timeouts
            // This kills infinite loops immediately on the execution server
            run_timeout: timeLimit,     
            compile_timeout: 10000, // 10s max for compilation (Java/C++ needs this)
        });

        return response.data; 

    } catch (error) {
        // 4. IMPROVED ERROR HANDLING
        if (error.response) {
            console.error("Piston Error Response:", error.response.data);
            const pistonMessage = error.response.data?.message || "Execution Service Error";
            throw new Error(pistonMessage);
        } 
        else if (error.request) {
            console.error("Piston No Response:", error.request);
            throw new Error("Execution timed out or network is down.");
        } 
        else {
            console.error("Piston Request Setup Error:", error.message);
            throw new Error("Failed to prepare execution request.");
        }
    }
};