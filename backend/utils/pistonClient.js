import axios from 'axios';

// Map our frontend language names to Piston's expected versions
// Piston API: https://emkc.org/api/v2/piston/runtimes
// const LANGUAGE_MAP = {
//     javascript: { language: 'javascript', version: '18.15.0' },
//     python: { language: 'python', version: '3.10.0' },
//     java: { language: 'java', version: '15.0.2' },
//     cpp: { language: 'c++', version: '10.2.0' }
// };
const LANGUAGE_MAP = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python: { language: 'python', version: '3.10.0' },
    // Ensure both 'cpp' and 'c++' keys work
    cpp: { language: 'c++', version: '10.2.0' },
    "c++": { language: 'c++', version: '10.2.0' }, 
    java: { language: 'java', version: '15.0.2' }
};

export const executeCode = async (language, sourceCode, stdin = "") => {
    try {
        const config = LANGUAGE_MAP[language.toLowerCase()];

        if (!config) {
            throw new Error(`Unsupported language: ${language}`);
        }

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

        return response.data; // Returns { run: { stdout, stderr, output, code, ... } }

    } catch (error) {
        console.error("Piston Execution Error:", error.message);
        throw new Error("Code execution service failed");
    }
};