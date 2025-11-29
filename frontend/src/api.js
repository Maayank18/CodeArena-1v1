// import axios from 'axios';

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
// });

// export default api;



// robust secure and effective



import axios from 'axios';

// 1. CREATE INSTANCE
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    
    // ROBUSTNESS: Fail fast if server is down. 
    // Don't let the app hang for 2 minutes. Wait 10 seconds, then error out.
    timeout: 10000, 
    
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. SECURITY: REQUEST INTERCEPTOR
// Automatically attaches the JWT Token to every request.
// You never have to manually write "Bearer token" again.
api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('codearena_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. ROBUSTNESS: RESPONSE INTERCEPTOR
// Global Error Handler. Catches errors before your components see them.
api.interceptors.response.use(
    (response) => response, // Return successful responses directly
    (error) => {
        // SECURITY: Auto-Logout on 401 (Unauthorized)
        // If the token expires or is fake, kick the user out immediately.
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('codearena_user');
            // Optional: Redirect to login page
            window.location.href = '/login'; 
        }

        // Return the error so your specific components (Login.jsx) can show Toast messages
        return Promise.reject(error);
    }
);

export default api;