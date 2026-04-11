// import axios from 'axios';

// const LANGUAGE_MAP = {
//     javascript: { language: 'javascript', version: '*' },
//     python: { language: 'python', version: '*' },
//     cpp: { language: 'c++', version: '*' },
//     "c++": { language: 'c++', version: '*' }, 
//     java: { language: 'java', version: '*' }
// };

// // ✅ REQUEST QUEUE: Prevents overwhelming Piston API
// class ExecutionQueue {
//     constructor(maxConcurrent = 3, delayBetweenRequests = 500) {
//         this.queue = [];
//         this.active = 0;
//         this.maxConcurrent = maxConcurrent;
//         this.delayBetweenRequests = delayBetweenRequests;
//         this.lastRequestTime = 0;
//     }

//     async add(fn) {
//         return new Promise((resolve, reject) => {
//             this.queue.push({ fn, resolve, reject });
//             this.process();
//         });
//     }

//     async process() {
//         if (this.active >= this.maxConcurrent || this.queue.length === 0) {
//             return;
//         }

//         const now = Date.now();
//         const timeSinceLastRequest = now - this.lastRequestTime;
//         if (timeSinceLastRequest < this.delayBetweenRequests) {
//             setTimeout(() => this.process(), this.delayBetweenRequests - timeSinceLastRequest);
//             return;
//         }

//         const { fn, resolve, reject } = this.queue.shift();
//         this.active++;
//         this.lastRequestTime = Date.now();

//         try {
//             const result = await fn();
//             resolve(result);
//         } catch (error) {
//             reject(error);
//         } finally {
//             this.active--;
//             this.process();
//         }
//     }
// }

// const executionQueue = new ExecutionQueue(3, 500);

// // ✅ CIRCUIT BREAKER: Stops requests if Piston is down
// let circuitBreakerOpen = false;
// let failureCount = 0;
// const MAX_FAILURES = 5;
// const CIRCUIT_RESET_TIME = 60000;

// function recordFailure() {
//     failureCount++;
//     if (failureCount >= MAX_FAILURES) {
//         circuitBreakerOpen = true;
//         console.error(`[CIRCUIT BREAKER] Piston API down. Blocking requests for ${CIRCUIT_RESET_TIME}ms`);
//         setTimeout(() => {
//             circuitBreakerOpen = false;
//             failureCount = 0;
//             console.log('[CIRCUIT BREAKER] Reset. Resuming requests.');
//         }, CIRCUIT_RESET_TIME);
//     }
// }

// function recordSuccess() {
//     failureCount = Math.max(0, failureCount - 1);
// }

// // ✅ RETRY LOGIC: Exponential backoff
// async function executeWithRetry(fn, maxRetries = 2) {
//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//         try {
//             const result = await fn();
//             recordSuccess();
//             return result;
//         } catch (error) {
//             if (attempt === maxRetries) {
//                 recordFailure();
//                 throw error;
//             }
//             const delay = Math.pow(2, attempt) * 1000;
//             console.log(`[RETRY] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
//             await new Promise(resolve => setTimeout(resolve, delay));
//         }
//     }
// }

// export const executeCode = async (language, sourceCode, stdin = "", timeLimit = 2000) => {
//     // Circuit breaker check
//     if (circuitBreakerOpen) {
//         throw new Error("Execution service is temporarily unavailable. Please try again in a minute.");
//     }

//     // Validate language
//     const config = LANGUAGE_MAP[language.toLowerCase()];
//     if (!config) {
//         throw new Error(`Unsupported language: ${language}`);
//     }

//     // Add to queue with retry
//     return executionQueue.add(() => executeWithRetry(async () => {
//         const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
//             language: config.language,
//             version: config.version,
//             files: [{ content: sourceCode }],
//             stdin: stdin,
//             run_timeout: timeLimit,
//             compile_timeout: 10000,
//         }, {
//             timeout: timeLimit + 5000,
//         });

//         if (!response.data || !response.data.run) {
//             throw new Error("Piston API returned invalid response");
//         }

//         return response.data;
//     }, 2));
// };

// // ✅ HEALTH CHECK: Every 5 minutes
// setInterval(async () => {
//     try {
//         const testCode = "console.log('health')";
//         await axios.post('https://emkc.org/api/v2/piston/execute', {
//             language: 'javascript',
//             version: '*',
//             files: [{ content: testCode }],
//         }, { timeout: 5000 });
//         console.log('[PISTON HEALTH] ✅ API responsive');
//     } catch (error) {
//         console.error('[PISTON HEALTH] ⚠️ API check failed:', error.message);
//     }
// }, 5 * 60 * 1000);
// V 1.5
