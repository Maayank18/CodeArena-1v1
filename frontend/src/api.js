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
import {
    clearStoredUser,
    readStoredUser,
} from './utils/authSessionStorage.js';

// ✅ CONFIGURATION
const CONFIG = {
    timeout: 60000,
    retryAttempts: 2,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
};

// ✅ REQUEST CACHE (for GET requests)
const requestCache = new Map();

// ✅ PENDING REQUESTS (opt-in dedupe only)
const pendingRequests = new Map();
const pendingGetRequests = new Map();
const DEFAULT_PRODUCTION_API_ORIGIN = 'https://codearena-1v1.onrender.com';

const AUTH_FLOW_ENDPOINTS = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/verify-account',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/verify-otp',
    '/auth/reset-password',
]);

const isLocalhostLike = (value = '') => /localhost|127\.0\.0\.1/i.test(String(value));

const normalizeBackendOrigin = (url) => (url || '').trim().replace(/\/+$/, '').replace(/\/api$/i, '');

export const getStoredAuthToken = () => {
    const user = readStoredUser() || {};
    return typeof user?.token === 'string' ? user.token.trim() : '';
};

export const resolveBackendOrigin = () => {
    const explicitBackend = normalizeBackendOrigin(import.meta.env.VITE_BACKEND_URL);
    if (explicitBackend) {
        if (import.meta.env.PROD && isLocalhostLike(explicitBackend)) {
            console.warn('[API] Ignoring localhost VITE_BACKEND_URL in production.', explicitBackend);
        } else {
            return explicitBackend;
        }
    }

    const apiOrigin = normalizeBackendOrigin(import.meta.env.VITE_API_URL);
    if (apiOrigin) {
        if (import.meta.env.PROD && isLocalhostLike(apiOrigin)) {
            console.warn('[API] Ignoring localhost VITE_API_URL in production.', apiOrigin);
        } else {
            return apiOrigin;
        }
    }

    if (!import.meta.env.PROD) {
        return 'http://localhost:5000';
    }

    return DEFAULT_PRODUCTION_API_ORIGIN;
};

const stableStringify = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return String(value);
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    return `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
        .join(',')}}`;
};

const buildRequestKey = (config) => {
    const method = (config?.method || 'get').toLowerCase();
    const url = config?.url || '';
    const params = stableStringify(config?.params || {});
    const data = stableStringify(config?.data || {});
    return `${method}:${url}:${params}:${data}`;
};

const createDeferred = () => {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

const shouldDedupeRequest = (config) => (
    Boolean(config?.meta?.dedupe) && config?.method && config.method !== 'get'
);

const shouldUseGetCache = (config) => (
    config?.method === 'get' &&
    CONFIG.cacheEnabled &&
    !config?.meta?.skipCache
);

const invalidateCache = (predicate) => {
    for (const key of requestCache.keys()) {
        if (predicate(key)) {
            requestCache.delete(key);
        }
    }
};

const getMutationInvalidationMatcher = (url = '') => {
    if (url.startsWith('/settings')) {
        return (key) => key.includes('/settings') || key.includes('/users/profile') || key.includes('/payments/mine');
    }

    if (url.startsWith('/payments')) {
        return (key) => key.includes('/payments/mine') || key.includes('/settings/profile') || key.includes('/users/profile');
    }

    if (url.startsWith('/users/profile')) {
        return (key) => key.includes('/users/profile') || key.includes('/settings/profile');
    }

    if (url.startsWith('/notes')) {
        return (key) => key.includes('/notes');
    }

    if (url.startsWith('/rooms')) {
        return (key) => key.includes('/rooms');
    }

    return () => false;
};

const normalizeApiBase = (url) => {
    const trimmed = (url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

// ✅ DYNAMIC BASE URL with fallback
const getBaseURL = () => {
    // In local development, use relative path to leverage Vite proxy
    // This perfectly solves CORS errors and works across any local IP/port
    if (!import.meta.env.PROD) {
        return '/api';
    }

    return normalizeApiBase(resolveBackendOrigin());
};

const isAuthFlowRequest = (config) => {
    const url = config?.url || '';
    return AUTH_FLOW_ENDPOINTS.has(url);
};

// ✅ CREATE AXIOS INSTANCE
const api = axios.create({
    baseURL: getBaseURL(),
    timeout: CONFIG.timeout,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        // 1. Add auth token
        const token = getStoredAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if ((config.url || '').startsWith('/settings')) {
            console.warn('[API] Missing auth token for protected settings request.', {
                url: config.url,
            });
        }

        // 2. ✅ CHECK CACHE for GET requests
        if (shouldUseGetCache(config)) {
            const cacheKey = `${config.url}?${stableStringify(config.params || {})}`;
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

        if (config.method === 'get' && !config.adapter) {
            const requestKey = buildRequestKey(config);
            config.meta = { ...(config.meta || {}), requestKey };

            const pendingGet = pendingGetRequests.get(requestKey);
            if (pendingGet) {
                config.adapter = () => pendingGet.promise.then((response) => ({
                    data: response.data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    config,
                    request: response.request,
                }));
                return config;
            }

            const deferred = createDeferred();
            pendingGetRequests.set(requestKey, deferred);
            config.meta.ownsGetRequest = true;
        }

        // 3. ✅ PREVENT DUPLICATE NON-GET REQUESTS ONLY WHEN A CALLER OPTS IN
        const requestKey = buildRequestKey(config);

        if (shouldDedupeRequest(config) && pendingRequests.has(requestKey)) {
            console.log(`[API] Duplicate request prevented: ${config.url}`);
            const source = axios.CancelToken.source();
            config.cancelToken = source.token;
            source.cancel('Duplicate request');
        } else if (shouldDedupeRequest(config)) {
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
        if (shouldUseGetCache(response.config)) {
            const cacheKey = `${response.config.url}?${stableStringify(response.config.params || {})}`;
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
        if (shouldDedupeRequest(response.config)) {
            const requestKey = buildRequestKey(response.config);
            pendingRequests.delete(requestKey);
        }

        if (response.config.method !== 'get') {
            invalidateCache(getMutationInvalidationMatcher(response.config.url));
        }

        if (response.config.meta?.ownsGetRequest) {
            const deferred = pendingGetRequests.get(response.config.meta.requestKey);
            deferred?.resolve(response);
            pendingGetRequests.delete(response.config.meta.requestKey);
        }

        // 3. ✅ LOGGING (dev only)
        if (import.meta.env.DEV) {
            console.log(`[API] ✅ ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
        }

        return response;
    },
    async (error) => {
        const config = error.config;

        // ✅ REMOVE FROM PENDING
        if (config && shouldDedupeRequest(config)) {
            const requestKey = buildRequestKey(config);
            pendingRequests.delete(requestKey);
        }

        if (config?.meta?.ownsGetRequest) {
            const deferred = pendingGetRequests.get(config.meta.requestKey);
            deferred?.reject(error);
            pendingGetRequests.delete(config.meta.requestKey);
        }

        // ✅ HANDLE CANCELLED REQUESTS
        if (axios.isCancel(error)) {
            console.log('[API] Request cancelled:', error.message);
            return Promise.reject(error);
        }

        // ✅ HANDLE 401 (Unauthorized)
        if (error.response?.status === 401) {
            console.warn('[API] 401 Unauthorized response', {
                url: config?.url,
                code: error.response?.data?.code,
                message: error.response?.data?.message,
            });
            if (!isAuthFlowRequest(config)) {
                console.log('[API] 401 Unauthorized - clearing auth');
                clearStoredUser({
                    clearDerived: true,
                    dispatch: true,
                    eventDetail: {
                        redirectTo: '/login',
                        replace: true,
                        state: { sessionExpired: true },
                    },
                });
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
        const backendOrigin = resolveBackendOrigin();
        const response = await axios.get(`${backendOrigin}/health`, {
            timeout: CONFIG.timeout,
            withCredentials: true,
        });
        return { healthy: true, data: response.data };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
};

export const isApiRequestCancelled = (error) => axios.isCancel(error);

export default api;
// V 1.5
