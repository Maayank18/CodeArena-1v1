import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import {
    forgotPassword,
    resetPasswordWithOtp,
    verifyPasswordResetOtp,
} from '../controllers/passwordResetController.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const loginLimiter = createRateLimiter({
    keyPrefix: 'auth-login',
    limit: 12,
    windowMs: 60 * 1000,
    message: 'Too many login attempts. Please wait a moment and try again.',
});

const registerLimiter = createRateLimiter({
    keyPrefix: 'auth-register',
    limit: 8,
    windowMs: 5 * 60 * 1000,
    message: 'Too many sign up attempts. Please wait a few minutes and try again.',
});

const forgotPasswordLimiter = createRateLimiter({
    keyPrefix: 'auth-forgot-password',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many password reset requests. Please try again later.',
});

const verifyOtpLimiter = createRateLimiter({
    keyPrefix: 'auth-verify-otp',
    limit: 10,
    windowMs: 15 * 60 * 1000,
    message: 'Too many verification attempts. Please request a new code.',
});

const resetPasswordLimiter = createRateLimiter({
    keyPrefix: 'auth-reset-password',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many password reset attempts. Please request a new code.',
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, verifyPasswordResetOtp);
router.post('/reset-password', resetPasswordLimiter, resetPasswordWithOtp);

export default router;
