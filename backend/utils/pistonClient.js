// import axios from 'axios';

// // Map our frontend language names to Piston's expected versions
// // Piston API: https://emkc.org/api/v2/piston/runtimes
// // const LANGUAGE_MAP = {
// //     javascript: { language: 'javascript', version: '18.15.0' },
// //     python: { language: 'python', version: '3.10.0' },
// //     java: { language: 'java', version: '15.0.2' },
// //     cpp: { language: 'c++', version: '10.2.0' }
// // };
// const LANGUAGE_MAP = {
//     javascript: { language: 'javascript', version: '18.15.0' },
//     python: { language: 'python', version: '3.10.0' },
//     // Ensure both 'cpp' and 'c++' keys work
//     cpp: { language: 'c++', version: '10.2.0' },
//     "c++": { language: 'c++', version: '10.2.0' }, 
//     java: { language: 'java', version: '15.0.2' }
// };

// export const executeCode = async (language, sourceCode, stdin = "") => {
//     try {
//         const config = LANGUAGE_MAP[language.toLowerCase()];

//         if (!config) {
//             throw new Error(`Unsupported language: ${language}`);
//         }

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

//         return response.data; // Returns { run: { stdout, stderr, output, code, ... } }

//     } catch (error) {
//         console.error("Piston Execution Error:", error.message);
//         throw new Error("Code execution service failed");
//     }
// };


import axios from 'axios';

// Map frontend language names to Piston's identifiers
// Using version: '*' ensures we always use the latest supported version
// so the code doesn't break if Piston updates their runtimes.
const LANGUAGE_MAP = {
    javascript: { language: 'javascript', version: '*' },
    python: { language: 'python', version: '*' },
    cpp: { language: 'c++', version: '*' },
    "c++": { language: 'c++', version: '*' }, 
    java: { language: 'java', version: '*' }
};

export const executeCode = async (language, sourceCode, stdin = "") => {
    // 1. Validate Language
    const config = LANGUAGE_MAP[language.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }

    try {
        // 2. Call Piston API
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: config.language,
            version: config.version,
            files: [
                {
                    content: sourceCode
                }
            ],
            stdin: stdin // Inputs for the problem test cases
        });

        // 3. Return the data directly
        return response.data; 

    } catch (error) {
        // 4. IMPROVED ERROR HANDLING
        // Axios creates specific error objects. We need to parse them to know WHY it failed.
        
        if (error.response) {
            // The server responded with a status code outside the 2xx range (e.g., 400, 429, 500)
            console.error("Piston Error Response:", error.response.data);
            
            // Extract the actual message from Piston (often contains rate limit info or compile errors)
            const pistonMessage = error.response.data?.message || "Execution Service Error";
            throw new Error(pistonMessage);
        } 
        else if (error.request) {
            // The request was made but no response was received (Timeout or Network down)
            console.error("Piston No Response:", error.request);
            throw new Error("Execution timed out or network is down.");
        } 
        else {
            // Something happened in setting up the request
            console.error("Piston Request Setup Error:", error.message);
            throw new Error("Failed to prepare execution request.");
        }
    }
};