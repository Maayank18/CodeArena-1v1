// import axios from 'axios';

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
// });

// export default api;



// robust secure and effective



// import axios from 'axios';

// // 1. CREATE INSTANCE
// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    
//     // ROBUSTNESS: Fail fast if server is down. 
//     // Don't let the app hang for 2 minutes. Wait 10 seconds, then error out.
//     timeout: 10000, 
    
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // 2. SECURITY: REQUEST INTERCEPTOR
// // Automatically attaches the JWT Token to every request.
// // You never have to manually write "Bearer token" again.
// api.interceptors.request.use(
//     (config) => {
//         const userStr = localStorage.getItem('codearena_user');
//         if (userStr) {
//             const user = JSON.parse(userStr);
//             if (user.token) {
//                 config.headers.Authorization = `Bearer ${user.token}`;
//             }
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// // 3. ROBUSTNESS: RESPONSE INTERCEPTOR
// // Global Error Handler. Catches errors before your components see them.
// api.interceptors.response.use(
//     (response) => response, // Return successful responses directly
//     (error) => {
//         // SECURITY: Auto-Logout on 401 (Unauthorized)
//         // If the token expires or is fake, kick the user out immediately.
//         if (error.response && error.response.status === 401) {
//             localStorage.removeItem('codearena_user');
//             // Optional: Redirect to login page
//             window.location.href = '/login'; 
//         }

//         // Return the error so your specific components (Login.jsx) can show Toast messages
//         return Promise.reject(error);
//     }
// );

// export default api;







import axios from 'axios';

// 1. DYNAMIC BASE URL LOGIC
// We ensure it always uses Render if we are not on our local machine.
const getBaseURL = () => {
    const envURL = import.meta.env.VITE_API_URL;
    
    // If we have an ENV var and it's not localhost, use it.
    if (envURL && !envURL.includes('localhost')) return `${envURL}/api`;
    
    // If we are running the deployed site (on Vercel), force the Render URL.
    if (window.location.hostname !== 'localhost') {
        return 'https://codearena-1v1.onrender.com/api';
    }

    // Default for local development
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000, // 15s is better for Render's "Cold Starts"
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

// 3. ROBUSTNESS: RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Expired/Invalid Token)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('codearena_user');
            // Force redirect to login if the user is not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;