// import axios from 'axios';

// // 1. DYNAMIC BASE URL LOGIC
// // We ensure it always uses Render if we are not on our local machine.
// const getBaseURL = () => {
//     const envURL = import.meta.env.VITE_API_URL;
    
//     // If we have an ENV var and it's not localhost, use it.
//     if (envURL && !envURL.includes('localhost')) return `${envURL}/api`;
    
//     // If we are running the deployed site (on Vercel), force the Render URL.
//     if (window.location.hostname !== 'localhost') {
//         return 'https://codearena-1v1.onrender.com/api';
//     }

//     // Default for local development
//     return 'http://localhost:5000/api';
// };

// const api = axios.create({
//     baseURL: getBaseURL(),
//     timeout: 15000, // 15s is better for Render's "Cold Starts"
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

// // 3. ROBUSTNESS: RESPONSE INTERCEPTOR
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         // Handle 401 (Expired/Invalid Token)
//         if (error.response && error.response.status === 401) {
//             localStorage.removeItem('codearena_user');
//             // Force redirect to login if the user is not already there
//             if (!window.location.pathname.includes('/login')) {
//                 window.location.href = '/login';
//             }
//         }
//         return Promise.reject(error);
//     }
// );

// export default api;






import axios from 'axios';

// 1. DYNAMIC BASE URL LOGIC
const getBaseURL = () => {
    const envURL = import.meta.env.VITE_API_URL;
    
    if (envURL && !envURL.includes('localhost')) return `${envURL}/api`;
    
    if (window.location.hostname !== 'localhost') {
        return 'https://codearena-1v1.onrender.com/api';
    }

    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. SECURITY: REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('codearena_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (e) {
                console.error("Token parse error", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. ROBUSTNESS: RESPONSE INTERCEPTOR WITH RETRY LOGIC
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Handle 401 (Expired/Invalid Token)
        if (error.response?.status === 401) {
            localStorage.removeItem('codearena_user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // Retry logic for network errors and 5xx errors (max 2 retries)
        if (!config._retryCount) {
            config._retryCount = 0;
        }

        const shouldRetry = (
            (!error.response || error.response.status >= 500) && 
            config._retryCount < 2 &&
            config.method === 'get' // Only retry safe GET requests
        );

        if (shouldRetry) {
            config._retryCount += 1;
            
            // Exponential backoff: 1s, 2s
            const delay = 1000 * config._retryCount;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;