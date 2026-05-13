import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    User,
} from 'lucide-react';
import api, { isApiRequestCancelled } from '../api.js';
import { Logo } from '../components/Logo.jsx';

const initialFormData = {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    rememberMe: true,
};

const initialRecoveryData = {
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
    resetToken: '',
    resendAvailableIn: 0,
    devOtp: '',
};

const getResetPasswordError = (password) => {
    if (!password) {
        return null;
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must include at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must include at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must include at least one number';
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must include at least one special character';
    }

    return null;
};

const clearClientAuthState = () => {
    localStorage.removeItem('codearena_user');
    localStorage.removeItem('dashboard_profile_cache');
    localStorage.removeItem('leaderboard_cache');
    localStorage.removeItem('history_cache');
};

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [recoveryData, setRecoveryData] = useState(initialRecoveryData);
    const navigate = useNavigate();

    const isRecoveryMode = recoveryStep !== '';

    useEffect(() => {
        if (!isRecoveryMode) {
            setFormData((prev) => ({
                ...prev,
                fullName: '',
                username: '',
                phone: '',
                password: '',
            }));
            setShowPassword(false);
        }
    }, [isRegister, isRecoveryMode]);

    useEffect(() => {
        if (!recoveryData.resendAvailableIn) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setRecoveryData((prev) => ({
                ...prev,
                resendAvailableIn: prev.resendAvailableIn > 0 ? prev.resendAvailableIn - 1 : 0,
            }));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [recoveryData.resendAvailableIn]);

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('Invalid email format');
        }

        if (formData.password.length > 0 && formData.password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }, [formData, isRegister]);

    const passwordStrength = useMemo(() => {
        const password = isRecoveryMode ? recoveryData.password : formData.password;

        if (!password) {
            return { strength: 0, label: '', color: '' };
        }

        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 10) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        const levels = [
            { strength: 0, label: '', color: '' },
            { strength: 1, label: 'Weak', color: 'bg-red-500' },
            { strength: 2, label: 'Fair', color: 'bg-orange-500' },
            { strength: 3, label: 'Good', color: 'bg-yellow-500' },
            { strength: 4, label: 'Strong', color: 'bg-green-500' },
            { strength: 5, label: 'Very Strong', color: 'bg-emerald-500' },
        ];

        return levels[strength];
    }, [formData.password, isRecoveryMode, recoveryData.password]);

    const recoveryPasswordError = useMemo(
        () => getResetPasswordError(recoveryData.password),
        [recoveryData.password]
    );

    const handleChange = useCallback((e) => {
        const { name, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleRecoveryChange = useCallback((e) => {
        const { name, value } = e.target;
        setRecoveryData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const resetRecoveryState = useCallback((email = '') => {
        setRecoveryStep('');
        setRecoveryData({
            ...initialRecoveryData,
            email,
        });
        setShowRecoveryPassword(false);
    }, []);

    const toggleMode = useCallback(() => {
        resetRecoveryState(formData.email);
        setIsRegister((prev) => !prev);
    }, [formData.email, resetRecoveryState]);

    const openForgotPassword = useCallback(() => {
        setIsRegister(false);
        setRecoveryStep('request');
        setRecoveryData((prev) => ({
            ...initialRecoveryData,
            email: formData.email.trim() || prev.email,
        }));
    }, [formData.email]);

    const goBackToLogin = useCallback(() => {
        resetRecoveryState(recoveryData.email || formData.email);
    }, [formData.email, recoveryData.email, resetRecoveryState]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Email and password are required');
            return;
        }

        if (isRegister && (!formData.username || !formData.fullName || !formData.phone)) {
            toast.error('All fields are required for registration');
            return;
        }

        if (!validation.isValid) {
            toast.error(validation.errors[0]);
            return;
        }

        setIsLoading(true);
        const endpoint = isRegister ? '/auth/register' : '/auth/login';

        try {
            const payload = isRegister ? formData : {
                email: formData.email,
                password: formData.password,
                rememberMe: formData.rememberMe,
            };

            const { data } = await api.post(endpoint, payload);

            if (import.meta.env.DEV) {
                console.log('[AUTH UI] submit response', {
                    endpoint,
                    status: isRegister ? 'register' : 'login',
                    data,
                });
            }


            clearClientAuthState();
            localStorage.setItem('codearena_user', JSON.stringify(data));

            toast.success(data.message || `Welcome, ${data.username}!`, { duration: 3000 });
            window.setTimeout(() => navigate('/dashboard'), 500);
        } catch (error) {
            if (isApiRequestCancelled(error)) {
                if (import.meta.env.DEV) {
                    console.log('[AUTH UI] submit request cancelled', { endpoint });
                }
                return;
            }

            const errorData = error.response?.data;
            const message = errorData?.error || errorData?.message || 'Authentication failed. Please try again.';
            toast.error(message, { duration: 6000 });
        } finally {
            setIsLoading(false);
        }
    }, [formData, isRegister, navigate, validation]);

    const handleForgotPassword = useCallback(async (e) => {
        e.preventDefault();

        if (!recoveryData.email) {
            toast.error('Email is required');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', {
                email: recoveryData.email,
            });

            if (import.meta.env.DEV) {
                console.log('[AUTH UI] forgot-password response', data);
            }

            setRecoveryData((prev) => ({
                ...prev,
                resendAvailableIn: data.resendAvailableIn || 0,
                devOtp: data.devOtp || '',
            }));
            setRecoveryStep('verify');
            toast.success(data.message || 'Verification code sent');
        } catch (error) {
            if (isApiRequestCancelled(error)) return;
            toast.error(error.response?.data?.message || 'Unable to send verification code');
        } finally {
            setIsLoading(false);
        }
    }, [recoveryData.email]);

    const handleVerifyOtp = useCallback(async (e) => {
        e.preventDefault();

        if (!recoveryData.email || !recoveryData.otp) {
            toast.error('Email and code are required');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', {
                email: recoveryData.email,
                otp: recoveryData.otp,
            });

            if (import.meta.env.DEV) {
                console.log('[AUTH UI] verify-otp response', data);
            }

            setRecoveryData((prev) => ({
                ...prev,
                resetToken: data.resetToken,
                otp: '',
            }));
            setRecoveryStep('reset');
            toast.success(data.message || 'Verification successful');
        } catch (error) {
            if (isApiRequestCancelled(error)) return;
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    }, [recoveryData.email, recoveryData.otp]);

    const handleResetPassword = useCallback(async (e) => {
        e.preventDefault();

        if (!recoveryData.password || !recoveryData.confirmPassword) {
            toast.error('Please fill in both password fields');
            return;
        }

        if (recoveryPasswordError) {
            toast.error(recoveryPasswordError);
            return;
        }

        if (recoveryData.password !== recoveryData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', {
                resetToken: recoveryData.resetToken,
                password: recoveryData.password,
            });

            if (import.meta.env.DEV) {
                console.log('[AUTH UI] reset-password response', data);
            }

            clearClientAuthState();
            resetRecoveryState(recoveryData.email);
            setFormData((prev) => ({
                ...prev,
                email: recoveryData.email,
                password: '',
            }));
            toast.success(data.message || 'Password reset successful');
        } catch (error) {
            if (isApiRequestCancelled(error)) return;
            toast.error(error.response?.data?.message || 'Unable to reset password');
        } finally {
            setIsLoading(false);
        }
    }, [recoveryData, recoveryPasswordError, resetRecoveryState]);

    const handleResendOtp = useCallback(async () => {
        if (recoveryData.resendAvailableIn > 0) {
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', {
                email: recoveryData.email,
            });

            if (import.meta.env.DEV) {
                console.log('[AUTH UI] resend forgot-password response', data);
            }

            setRecoveryData((prev) => ({
                ...prev,
                resendAvailableIn: data.resendAvailableIn || 0,
                devOtp: data.devOtp || prev.devOtp,
            }));
            toast.success(data.message || 'Verification code resent');
        } catch (error) {
            if (isApiRequestCancelled(error)) return;
            toast.error(error.response?.data?.message || 'Unable to resend verification code');
        } finally {
            setIsLoading(false);
        }
    }, [recoveryData.email, recoveryData.resendAvailableIn]);

    const headerTitle = isRecoveryMode
        ? recoveryStep === 'request'
            ? 'Reset Password'
            : recoveryStep === 'verify'
                ? 'Verify Code'
                : 'Choose New Password'
        : isRegister
            ? 'Create Account'
            : 'Welcome Back';

    const headerDescription = isRecoveryMode
        ? recoveryStep === 'request'
            ? 'We will send a verification code to your email'
            : recoveryStep === 'verify'
                ? 'Enter the 6 digit code to continue'
                : 'Set a new password for your account'
        : isRegister
            ? 'Join the coding arena today'
            : 'Continue your coding journey';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

            <div className="bg-[var(--bg-secondary)] p-6 sm:p-8 rounded-2xl w-full max-w-[340px] sm:max-w-md border border-[var(--border-color)] shadow-2xl relative z-10 transition-all">
                <div className="flex justify-center mb-6 sm:mb-8 scale-125 sm:scale-150">
                    <Logo />
                </div>

                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--text-primary)]">
                        {headerTitle}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {headerDescription}
                    </p>
                </div>

                {!isRecoveryMode && (
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {isRegister && (
                            <>
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

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                required
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                onChange={handleChange}
                                value={formData.password}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {!isRegister && (
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="accent-emerald-400"
                                    />
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    onClick={openForgotPassword}
                                    className="text-accent font-semibold hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {isRegister && formData.password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                level <= passwordStrength.strength ? passwordStrength.color : 'bg-[var(--border-color)]'
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
                )}


                {recoveryStep === 'request' && (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 group-focus-within:text-accent transition-colors pointer-events-none" />
                            <input
                                name="email"
                                type="email"
                                placeholder="Email Address"
                                required
                                autoComplete="email"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                onChange={handleRecoveryChange}
                                value={recoveryData.email}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Send Code <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                {recoveryStep === 'verify' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 pointer-events-none" />
                            <input
                                name="email"
                                type="email"
                                disabled
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl pl-10 pr-4 py-3 text-sm"
                                value={recoveryData.email}
                            />
                        </div>

                        <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 pointer-events-none" />
                            <input
                                name="otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="6 digit verification code"
                                required
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm tracking-[0.3em] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                onChange={handleRecoveryChange}
                                value={recoveryData.otp}
                            />
                        </div>

                        {recoveryData.devOtp && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300">
                                Development OTP: <span className="font-semibold tracking-[0.2em]">{recoveryData.devOtp}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isLoading || recoveryData.resendAvailableIn > 0}
                                className="text-accent font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                {recoveryData.resendAvailableIn > 0
                                    ? `Resend in ${recoveryData.resendAvailableIn}s`
                                    : 'Resend code'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Code <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                {recoveryStep === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 pointer-events-none" />
                            <input
                                name="password"
                                type={showRecoveryPassword ? 'text' : 'password'}
                                placeholder="New Password"
                                required
                                autoComplete="new-password"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                onChange={handleRecoveryChange}
                                value={recoveryData.password}
                            />
                            <button
                                type="button"
                                onClick={() => setShowRecoveryPassword((prev) => !prev)}
                                className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label={showRecoveryPassword ? 'Hide password' : 'Show password'}
                            >
                                {showRecoveryPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-[var(--text-secondary)] h-5 w-5 pointer-events-none" />
                            <input
                                name="confirmPassword"
                                type={showRecoveryPassword ? 'text' : 'password'}
                                placeholder="Confirm New Password"
                                required
                                autoComplete="new-password"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-[var(--text-secondary)]"
                                onChange={handleRecoveryChange}
                                value={recoveryData.confirmPassword}
                            />
                        </div>

                        {recoveryData.password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                level <= passwordStrength.strength ? passwordStrength.color : 'bg-[var(--border-color)]'
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

                        {(recoveryPasswordError || (recoveryData.confirmPassword && recoveryData.password !== recoveryData.confirmPassword)) && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                <div className="text-xs text-red-400">
                                    <div>{recoveryPasswordError || 'Passwords do not match'}</div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || Boolean(recoveryPasswordError)}
                            className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Reset Password <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                <div className="text-center text-[var(--text-secondary)] mt-6 text-sm">
                    {isRecoveryMode ? (
                        <button
                            type="button"
                            onClick={goBackToLogin}
                            className="inline-flex items-center gap-2 text-accent font-bold hover:underline"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    ) : (
                        <>
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-accent font-bold hover:underline transition-all"
                            >
                                {isRegister ? 'Login' : 'Register'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
