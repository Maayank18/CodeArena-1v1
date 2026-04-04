// import axios from 'axios';

// // 1. DYNAMIC BASE URL LOGIC
// const getBaseURL = () => {
//     const envURL = import.meta.env.VITE_API_URL;
    
//     if (envURL && !envURL.includes('localhost')) return `${envURL}/api`;
    
//     if (window.location.hostname !== 'localhost') {
//         return 'https://codearena-1v1.onrender.com/api';
//     }

//     return 'http://localhost:5000/api';
// };

// const api = axios.create({
//     baseURL: getBaseURL(),
//     timeout: 15000,
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // 2. SECURITY: REQUEST INTERCEPTOR
// api.interceptors.request.use(
//     (config) => {
//         const userStr = localStorage.getItem('codearena_user');
//         if (userStr) {
//             try {
//                 const user = JSON.parse(userStr);
//                 if (user?.token) {
//                     config.headers.Authorization = `Bearer ${user.token}`;
//                 }
//             } catch (e) {
//                 console.error("Token parse error", e);
//             }
//         }
//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// // 3. ROBUSTNESS: RESPONSE INTERCEPTOR WITH RETRY LOGIC
// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const config = error.config;

//         // Handle 401 (Expired/Invalid Token)
//         if (error.response?.status === 401) {
//             localStorage.removeItem('codearena_user');
//             if (!window.location.pathname.includes('/login')) {
//                 window.location.href = '/login';
//             }
//             return Promise.reject(error);
//         }

//         // Retry logic for network errors and 5xx errors (max 2 retries)
//         if (!config._retryCount) {
//             config._retryCount = 0;
//         }

//         const shouldRetry = (
//             (!error.response || error.response.status >= 500) && 
//             config._retryCount < 2 &&
//             config.method === 'get' // Only retry safe GET requests
//         );

//         if (shouldRetry) {
//             config._retryCount += 1;
            
//             // Exponential backoff: 1s, 2s
//             const delay = 1000 * config._retryCount;
//             await new Promise(resolve => setTimeout(resolve, delay));
            
//             return api(config);
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;
















// FILE: frontend/src/api.js
// PRODUCTION-OPTIMIZED VERSION
import axios from 'axios';

// ✅ CONFIGURATION
const CONFIG = {
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
};

// ✅ REQUEST CACHE (for GET requests)
const requestCache = new Map();

// ✅ PENDING REQUESTS (prevent duplicate simultaneous requests)
const pendingRequests = new Map();

const normalizeApiBase = (url) => {
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

// ✅ DYNAMIC BASE URL with fallback
const getBaseURL = () => {
    const envURLRaw = import.meta.env.VITE_API_URL;
    
    if (envURLRaw) {
        const isLocalEnvUrl = /localhost|127\.0\.0\.1/i.test(envURLRaw);
        if (!(import.meta.env.PROD && isLocalEnvUrl)) {
            return normalizeApiBase(envURLRaw);
        }
    }
    
    // Production fallback
    if (window.location.hostname !== 'localhost') {
        return 'https://codearena-1v1.onrender.com/api';
    }

    // Local development
    return 'http://localhost:5000/api';
};

// ✅ CREATE AXIOS INSTANCE
const api = axios.create({
    baseURL: getBaseURL(),
    timeout: CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        // 1. Add auth token
        const userStr = localStorage.getItem('codearena_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (e) {
                console.error("[API] Token parse error:", e);
                localStorage.removeItem('codearena_user');
            }
        }

        // 2. ✅ CHECK CACHE for GET requests
        if (config.method === 'get' && CONFIG.cacheEnabled) {
            const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
            const cached = requestCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < CONFIG.cacheDuration) {
                console.log(`[API] Cache HIT: ${config.url}`);
                // Return cached response
                config.adapter = () => Promise.resolve({
                    data: cached.data,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
            }
        }

        // 3. ✅ PREVENT DUPLICATE REQUESTS
        const requestKey = `${config.method}:${config.url}`;
        if (pendingRequests.has(requestKey)) {
            console.log(`[API] Duplicate request prevented: ${config.url}`);
            // Cancel duplicate request
            const source = axios.CancelToken.source();
            config.cancelToken = source.token;
            source.cancel('Duplicate request');
        } else {
            pendingRequests.set(requestKey, true);
        }

        // 4. ✅ LOGGING (dev only)
        if (import.meta.env.DEV) {
            console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error("[API] Request error:", error);
        return Promise.reject(error);
    }
);

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => {
        // 1. ✅ CACHE SUCCESSFUL GET RESPONSES
        if (response.config.method === 'get' && CONFIG.cacheEnabled) {
            const cacheKey = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
            requestCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            
            // Cleanup old cache entries (keep max 50)
            if (requestCache.size > 50) {
                const firstKey = requestCache.keys().next().value;
                requestCache.delete(firstKey);
            }
        }

        // 2. ✅ REMOVE FROM PENDING
        const requestKey = `${response.config.method}:${response.config.url}`;
        pendingRequests.delete(requestKey);

        // 3. ✅ LOGGING (dev only)
        if (import.meta.env.DEV) {
            console.log(`[API] ✅ ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
        }

        return response;
    },
    async (error) => {
        const config = error.config;

        // ✅ REMOVE FROM PENDING
        if (config) {
            const requestKey = `${config.method}:${config.url}`;
            pendingRequests.delete(requestKey);
        }

        // ✅ HANDLE CANCELLED REQUESTS
        if (axios.isCancel(error)) {
            console.log('[API] Request cancelled:', error.message);
            return Promise.reject(error);
        }

        // ✅ HANDLE 401 (Unauthorized)
        if (error.response?.status === 401) {
            console.log('[API] 401 Unauthorized - clearing auth');
            localStorage.removeItem('codearena_user');
            
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // ✅ HANDLE 403 (Forbidden)
        if (error.response?.status === 403) {
            console.error('[API] 403 Forbidden');
            return Promise.reject(error);
        }

        // ✅ RETRY LOGIC (only for safe operations)
        if (!config || !config._retryCount) {
            if (config) config._retryCount = 0;
        }

        const isRetryable = (
            config &&
            config.method === 'get' && // Only retry GET requests
            (!error.response || error.response.status >= 500) && // Network or server errors
            config._retryCount < CONFIG.retryAttempts
        );

        if (isRetryable) {
            config._retryCount += 1;
            
            const delay = CONFIG.retryDelay * config._retryCount;
            console.log(`[API] Retry ${config._retryCount}/${CONFIG.retryAttempts} after ${delay}ms: ${config.url}`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return api(config);
        }

        // ✅ ENHANCED ERROR LOGGING
        if (import.meta.env.DEV) {
            console.error(`[API] ❌ ${config?.method?.toUpperCase()} ${config?.url}`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                data: error.response?.data
            });
        }

        return Promise.reject(error);
    }
);

// ✅ UTILITY: Clear cache manually
api.clearCache = () => {
    requestCache.clear();
    console.log('[API] Cache cleared');
};

// ✅ UTILITY: Get cache size
api.getCacheSize = () => requestCache.size;

// ✅ UTILITY: Health check
api.healthCheck = async () => {
    try {
        const response = await api.get('/health');
        return { healthy: true, data: response.data };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
};

export default api;
