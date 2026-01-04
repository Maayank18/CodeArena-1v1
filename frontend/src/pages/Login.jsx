// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import api from '../api.js'; 
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: ''
    });

    // ✅ FIX: Clear form when switching between Login and Register
    // This prevents "Login" from sending "fullName" strings to the server
    useEffect(() => {
        setFormData({
            fullName: '',
            username: '',
            email: '',
            phone: '',
            password: ''
        });
    }, [isRegister]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation before hitting API
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (isRegister && (!formData.username || !formData.fullName)) {
            toast.error("Username and Full Name are required for registration");
            return;
        }

        setIsLoading(true);
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        
        try {
            const { data } = await api.post(endpoint, formData);
            
            // ✅ STORAGE: Ensure old data is fully overwritten
            localStorage.removeItem('codearena_user'); 
            localStorage.setItem('codearena_user', JSON.stringify(data));
            
            toast.success(`Welcome, ${data.username}!`, {
                duration: 4000,
                position: 'top-center',
            });

            // ✅ TIMING FIX: Delay navigation slightly to allow toast to be seen
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);

        } catch (error) {
            console.error("Auth Error:", error);
            const msg = error.response?.data?.message || 'Connection Refused by Server';
            toast.error(msg, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl w-full max-w-[340px] sm:max-w-md border border-[var(--border-color)] shadow-2xl relative z-10 transition-all">
                
                <div className="flex justify-center mb-6 sm:mb-8 scale-125 sm:scale-150">
                    <Logo className="text-[var(--text-primary)]" />
                </div>
                
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--text-primary)]">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {isRegister && (
                        <>
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="fullName" 
                                    type="text" 
                                    placeholder="Full Name" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent transition-all"
                                    onChange={handleChange} 
                                    value={formData.fullName}
                                />
                            </div>

                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="phone" 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
                                    onChange={handleChange} 
                                    value={formData.phone}
                                />
                            </div>

                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                                <input 
                                    name="username" 
                                    type="text" 
                                    placeholder="Username" 
                                    required
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
                                    onChange={handleChange} 
                                    value={formData.username}
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="Email Address" 
                            required
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
                            onChange={handleChange} 
                            value={formData.email}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-gray-500 h-5 w-5 group-focus-within:text-accent transition-colors" />
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="Password" 
                            required 
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
                            onChange={handleChange} 
                            value={formData.password}
                        />
                    </div>
                    
                    <button 
                        disabled={isLoading} 
                        className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Sign Up' : 'Login')} 
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p className="text-center text-[var(--text-secondary)] mt-6 text-sm">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
                    <button 
                        onClick={() => setIsRegister(!isRegister)} 
                        className="text-accent font-bold hover:underline"
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;