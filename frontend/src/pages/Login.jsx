// FILE: frontend/src/pages/Login.jsx
// PRODUCTION-OPTIMIZED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import api from '../api.js'; 
import toast from 'react-hot-toast';
import { 
    User, Mail, Lock, Phone, ArrowRight, Loader2, 
    Eye, EyeOff, ShieldCheck, AlertCircle 
} from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: ''
    });

    // ✅ OPTIMIZED: Clear form when switching modes
    useEffect(() => {
        setFormData({
            fullName: '',
            username: '',
            email: '',
            phone: '',
            password: ''
        });
        setShowPassword(false);
    }, [isRegister]);

    // ✅ OPTIMIZED: Memoized form validation
    const validation = useMemo(() => {
        const errors = [];
        
        if (isRegister) {
            if (formData.fullName.trim().length < 2) {
                errors.push('Full name must be at least 2 characters');
            }
            if (formData.username.trim().length < 3) {
                errors.push('Username must be at least 3 characters');
            }
            if (formData.phone.trim().length < 10) {
                errors.push('Phone number must be at least 10 digits');
            }
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('Invalid email format');
        }
        
        // Password validation
        if (formData.password.length > 0 && formData.password.length < 7) {
            errors.push('Password must be at least 7 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }, [formData, isRegister]);

    // ✅ OPTIMIZED: Password strength indicator
    const passwordStrength = useMemo(() => {
        if (!formData.password) return { strength: 0, label: '', color: '' };
        
        let strength = 0;
        if (formData.password.length >= 7) strength++;
        if (formData.password.length >= 10) strength++;
        if (/[A-Z]/.test(formData.password)) strength++;
        if (/[0-9]/.test(formData.password)) strength++;
        if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
        
        const levels = [
            { strength: 0, label: '', color: '' },
            { strength: 1, label: 'Weak', color: 'bg-red-500' },
            { strength: 2, label: 'Fair', color: 'bg-orange-500' },
            { strength: 3, label: 'Good', color: 'bg-yellow-500' },
            { strength: 4, label: 'Strong', color: 'bg-green-500' },
            { strength: 5, label: 'Very Strong', color: 'bg-emerald-500' },
        ];
        
        return levels[strength];
    }, [formData.password]);

    // ✅ OPTIMIZED: Memoized handlers
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.email || !formData.password) {
            toast.error("Email and password are required");
            return;
        }

        if (isRegister && (!formData.username || !formData.fullName || !formData.phone)) {
            toast.error("All fields are required for registration");
            return;
        }

        if (!validation.isValid) {
            toast.error(validation.errors[0]);
            return;
        }

        setIsLoading(true);
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        
        try {
            const { data } = await api.post(endpoint, formData);
            
            // ✅ Clear old data
            localStorage.removeItem('codearena_user'); 
            localStorage.removeItem('dashboard_profile_cache');
            localStorage.removeItem('leaderboard_cache');
            localStorage.removeItem('history_cache');
            
            // ✅ Store new data
            localStorage.setItem('codearena_user', JSON.stringify(data));
            
            toast.success(`Welcome, ${data.username}!`, {
                icon: '🎉',
                duration: 3000,
            });

            // Navigate after short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);

        } catch (error) {
            console.error("[AUTH] Error:", error);
            const msg = error.response?.data?.message || 'Authentication failed. Please try again.';
            toast.error(msg, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    }, [formData, isRegister, validation, navigate]);

    // ✅ OPTIMIZED: Toggle mode handler
    const toggleMode = useCallback(() => {
        setIsRegister(prev => !prev);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden transition-colors duration-300">
            
            {/* ✅ Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
            
            {/* ✅ Login Card */}
            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl w-full max-w-[340px] sm:max-w-md border border-[var(--border-color)] shadow-2xl relative z-10 transition-all">
                
                {/* Logo */}
                <div className="flex justify-center mb-6 sm:mb-8 scale-125 sm:scale-150">
                    <Logo />
                </div>
                
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--text-primary)]">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {isRegister 
                            ? 'Join the coding arena today' 
                            : 'Continue your coding journey'
                        }
                    </p>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    
                    {/* Register Fields */}
                    {isRegister && (
                        <>
                            {/* Full Name */}
                            <div className="relative group">
                                <User className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                                <input 
                                    name="fullName" 
                                    type="text" 
                                    placeholder="Full Name" 
                                    required
                                    autoComplete="name"
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                    onChange={handleChange} 
                                    value={formData.fullName}
                                />
                            </div>

                            {/* Username */}
                            <div className="relative group">
                                <ShieldCheck className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                                <input 
                                    name="username" 
                                    type="text" 
                                    placeholder="Username" 
                                    required
                                    autoComplete="username"
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                    onChange={handleChange} 
                                    value={formData.username}
                                />
                            </div>

                            {/* Phone */}
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                                <input 
                                    name="phone" 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    required
                                    autoComplete="tel"
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                    onChange={handleChange} 
                                    value={formData.phone}
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Email */}
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="Email Address" 
                            required
                            autoComplete="email"
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                            onChange={handleChange} 
                            value={formData.email}
                        />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                        <input 
                            name="password" 
                            type={showPassword ? "text" : "password"}
                            placeholder="Password" 
                            required
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                            onChange={handleChange} 
                            value={formData.password}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* ✅ Password Strength Indicator (Register only) */}
                    {isRegister && formData.password && (
                        <div className="space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 flex-1 rounded-full transition-all ${
                                            level <= passwordStrength.strength
                                                ? passwordStrength.color
                                                : 'bg-[var(--border-color)]'
                                        }`}
                                    />
                                ))}
                            </div>
                            {passwordStrength.label && (
                                <p className="text-xs text-[var(--text-secondary)] text-center">
                                    Password strength: <span className="font-semibold">{passwordStrength.label}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* ✅ Validation Errors */}
                    {!validation.isValid && formData.password && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            <div className="text-xs text-red-400">
                                {validation.errors.map((error, idx) => (
                                    <div key={idx}>{error}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={isLoading || (formData.password && !validation.isValid)} 
                        className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isRegister ? 'Sign Up' : 'Login'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <p className="text-center text-[var(--text-secondary)] mt-6 text-sm">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"} {' '}
                    <button 
                        onClick={toggleMode} 
                        className="text-accent font-bold hover:underline transition-all"
                    >
                        {isRegister ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;