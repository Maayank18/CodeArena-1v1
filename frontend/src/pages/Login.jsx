// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Logo } from '../components/Logo';
// import api from '../api.js'
// import toast from 'react-hot-toast';
// import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

// const Login = () => {
//     const [isRegister, setIsRegister] = useState(false);
//     const navigate = useNavigate();
//     const [isLoading, setIsLoading] = useState(false);

//     const [formData, setFormData] = useState({
//         fullName: '',
//         username: '',
//         email: '',
//         phone: '',
//         password: ''
//     });

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
        
//         // Validation Logic
//         if (isRegister && formData.password.length < 7) {
//             toast.error("Password must be at least 7 characters");
//             setIsLoading(false);
//             return;
//         }

//         const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        
//         try {
//             const { data } = await api.post(endpoint, formData);
//             localStorage.setItem('codearena_user', JSON.stringify(data));
//             toast.success(`Welcome back, ${data.username}!`);
//             navigate('/dashboard');
//         } catch (error) {
//             toast.error(error.response?.data?.message || 'Authentication Failed');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden">
//             {/* Optional: Subtle background glow */}
//             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>
            
//             <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl w-full max-w-md border border-[var(--border-color)] shadow-2xl relative z-10">
//                 {/* FIX: Increased scale to 150% and margin-bottom to 8 */}
//                 <div className="flex justify-center mb-8 scale-150">
//                     <Logo className="text-[var(--text-primary)]" />
//                 </div>
                
//                 <div className="text-center mb-8">
//                     <h2 className="text-2xl font-bold mb-2">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
//                     <p className="text-sm text-[var(--text-secondary)]">
//                         {isRegister ? 'Join the elite coding community' : 'Enter your credentials to access your account'}
//                     </p>
//                 </div>
                
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     {isRegister && (
//                         <>
//                             <div className="relative">
//                                 <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5" />
//                                 <input name="fullName" type="text" placeholder="Full Name" required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
//                                     onChange={handleChange} />
//                             </div>
//                             <div className="relative">
//                                 <Phone className="absolute left-3 top-3.5 text-gray-500 h-5 w-5" />
//                                 <input name="phone" type="tel" placeholder="Phone Number" required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
//                                     onChange={handleChange} />
//                             </div>
//                             <div className="relative">
//                                 <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5" />
//                                 <input name="username" type="text" placeholder="Username" required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
//                                     onChange={handleChange} />
//                             </div>
//                         </>
//                     )}
                    
//                     <div className="relative">
//                         <Mail className="absolute left-3 top-3.5 text-gray-500 h-5 w-5" />
//                         <input name="email" type="email" placeholder="Email Address" required
//                             className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
//                             onChange={handleChange} />
//                     </div>

//                     <div className="relative">
//                         <Lock className="absolute left-3 top-3.5 text-gray-500 h-5 w-5" />
//                         <input name="password" type="password" placeholder="Password (Min 7 chars)" required minLength={7}
//                             className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
//                             onChange={handleChange} />
//                     </div>
                    
//                     <button disabled={isLoading} className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2">
//                         {isLoading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Login')} 
//                         {!isLoading && <ArrowRight size={18} />}
//                     </button>
//                 </form>

//                 <p className="text-center text-[var(--text-secondary)] mt-6 text-sm">
//                     {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
//                     <button onClick={() => setIsRegister(!isRegister)} className="text-accent font-bold hover:underline">
//                         {isRegister ? 'Login' : 'Register'}
//                     </button>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Login;





// updated for advanced features
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// // explicit extension .jsx to ensure resolution
// import { Logo } from '../components/Logo.jsx';
// // explicit path to utils based on your project structure

// import toast from 'react-hot-toast';
// import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

// const Login = () => {
//     const [isRegister, setIsRegister] = useState(false);
//     const navigate = useNavigate();
//     const [isLoading, setIsLoading] = useState(false);

//     // State keys must match input 'name' attributes exactly!
//     const [formData, setFormData] = useState({
//         fullName: '',
//         username: '',
//         email: '',
//         phone: '',
//         password: ''
//     });

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
        
//         // Validation Logic
//         if (isRegister && formData.password.length < 7) {
//             toast.error("Password must be at least 7 characters");
//             setIsLoading(false);
//             return;
//         }

//         // Endpoint: Matches your User Controller routes
//         // isRegister ? '/users/register' : '/users/login' based on standard REST practices
//         // If your backend uses /api/auth/register, change this line accordingly.
//         const endpoint = isRegister ? '/users/register' : '/users/login';
        
//         try {
//             const { data } = await api.post(endpoint, formData);
            
//             // Save user data (Now includes rating & seasonScore from backend)
//             localStorage.setItem('codearena_user', JSON.stringify(data));
            
//             toast.success(`Welcome back, ${data.username}!`);
//             navigate('/dashboard');
//         } catch (error) {
//             const msg = error.response?.data?.message || 'Authentication Failed';
//             toast.error(msg);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden transition-colors duration-300">
//             {/* Background Glow Effect - Responsive sizing */}
//             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"></div>
            
//             {/* Login Card - Responsive width and padding */}
//             <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl w-full max-w-[340px] sm:max-w-md border border-[var(--border-color)] shadow-2xl relative z-10 transition-all">
                
//                 {/* Logo Section - Responsive Scale */}
//                 <div className="flex justify-center mb-6 sm:mb-8 scale-125 sm:scale-150">
//                     <Logo className="text-[var(--text-primary)]" />
//                 </div>
                
//                 {/* Header Text */}
//                 <div className="text-center mb-6 sm:mb-8">
//                     <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--text-primary)]">
//                         {isRegister ? 'Create Account' : 'Welcome Back'}
//                     </h2>
//                     <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
//                         {isRegister ? 'Join the elite coding community' : 'Enter your credentials to access your account'}
//                     </p>
//                 </div>
                
//                 {/* Form */}
//                 <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
//                     {isRegister && (
//                         <>
//                             {/* Full Name */}
//                             <div className="relative group">
//                                 <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
//                                 <input 
//                                     name="fullName" 
//                                     type="text" 
//                                     placeholder="Full Name" 
//                                     required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
//                                     onChange={handleChange} 
//                                     value={formData.fullName}
//                                 />
//                             </div>

//                             {/* Phone Number */}
//                             <div className="relative group">
//                                 <Phone className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
//                                 <input 
//                                     name="phone" 
//                                     type="tel" 
//                                     placeholder="Phone Number" 
//                                     required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
//                                     onChange={handleChange} 
//                                     value={formData.phone}
//                                 />
//                             </div>

//                             {/* Username */}
//                             <div className="relative group">
//                                 <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
//                                 <input 
//                                     name="username" 
//                                     type="text" 
//                                     placeholder="Username" 
//                                     required
//                                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
//                                     onChange={handleChange} 
//                                     value={formData.username}
//                                 />
//                             </div>
//                         </>
//                     )}
                    
//                     {/* Email */}
//                     <div className="relative group">
//                         <Mail className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
//                         <input 
//                             name="email" 
//                             type="email" 
//                             placeholder="Email Address" 
//                             required
//                             className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
//                             onChange={handleChange} 
//                             value={formData.email}
//                         />
//                     </div>

//                     {/* Password */}
//                     <div className="relative group">
//                         <Lock className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
//                         <input 
//                             name="password" 
//                             type="password" 
//                             placeholder="Password (Min 7 chars)" 
//                             required 
//                             minLength={7}
//                             className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
//                             onChange={handleChange} 
//                             value={formData.password}
//                         />
//                     </div>
                    
//                     {/* Submit Button */}
//                     <button 
//                         disabled={isLoading} 
//                         className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {isLoading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Login')} 
//                         {!isLoading && <ArrowRight size={18} />}
//                     </button>
//                 </form>

//                 {/* Toggle Mode */}
//                 <p className="text-center text-[var(--text-secondary)] mt-6 text-sm">
//                     {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
//                     <button 
//                         onClick={() => {
//                             setIsRegister(!isRegister);
//                             // Optional: clear form errors here if needed
//                         }} 
//                         className="text-accent font-bold hover:underline focus:outline-none"
//                     >
//                         {isRegister ? 'Login' : 'Register'}
//                     </button>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Login;







// RESPONSIVE UPDATE FOR LOGIN
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// explicit extension .jsx to ensure resolution
import { Logo } from '../components/Logo.jsx';
// explicit path to utils based on your project structure
import api from '../api.js'; 
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // State keys must match input 'name' attributes exactly!
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Validation Logic
        if (isRegister && formData.password.length < 7) {
            toast.error("Password must be at least 7 characters");
            setIsLoading(false);
            return;
        }

        // ✅ CRITICAL FIX: Updated routes to match server.js ('/api/auth')
        // Your backend mounts authRoutes at '/api/auth', not '/api/users'
        // debugged changes for the /api
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        
        try {
            const { data } = await api.post(endpoint, formData);
            
            // Save user data (Now includes rating & seasonScore from backend)
            localStorage.setItem('codearena_user', JSON.stringify(data));
            
            toast.success(`Welcome back, ${data.username}!`);
            navigate('/dashboard');
        } catch (error) {
            const msg = error.response?.data?.message || 'Authentication Failed';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Glow Effect - Responsive sizing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"></div>
            
            {/* Login Card - Responsive width and padding */}
            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl w-full max-w-[340px] sm:max-w-md border border-[var(--border-color)] shadow-2xl relative z-10 transition-all">
                
                {/* Logo Section - Responsive Scale */}
                <div className="flex justify-center mb-6 sm:mb-8 scale-125 sm:scale-150">
                    <Logo className="text-[var(--text-primary)]" />
                </div>
                
                {/* Header Text */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--text-primary)]">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        {isRegister ? 'Join the elite coding community' : 'Enter your credentials to access your account'}
                    </p>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {isRegister && (
                        <>
                            {/* Full Name */}
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="fullName" 
                                    type="text" 
                                    placeholder="Full Name" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
                                    onChange={handleChange} 
                                    value={formData.fullName}
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="phone" 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
                                    onChange={handleChange} 
                                    value={formData.phone}
                                />
                            </div>

                            {/* Username */}
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="username" 
                                    type="text" 
                                    placeholder="Username" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
                                    onChange={handleChange} 
                                    value={formData.username}
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Email */}
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="Email Address" 
                            required
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
                            onChange={handleChange} 
                            value={formData.email}
                        />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="Password (Min 7 chars)" 
                            required 
                            minLength={7}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
                            onChange={handleChange} 
                            value={formData.password}
                        />
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                        disabled={isLoading} 
                        className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Login')} 
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>

                {/* Toggle Mode */}
                <p className="text-center text-[var(--text-secondary)] mt-6 text-sm">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
                    <button 
                        onClick={() => {
                            setIsRegister(!isRegister);
                            // Optional: clear form errors here if needed
                        }} 
                        className="text-accent font-bold hover:underline focus:outline-none"
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;