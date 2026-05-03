import jwt from 'jsonwebtoken';
import PasswordResetOtp from '../models/PasswordResetOtp.js';
import User from '../models/User.js';
import { sendPasswordResetOtpEmail } from '../services/authEmailService.js';
import {
    AUTH_LIMITS,
    generateOtp,
    hashOtp,
    minutesFromNow,
    safeEqualHex,
    secondsFromNow,
    validatePasswordStrength,
} from '../utils/authSecurity.js';

const RESET_TOKEN_PURPOSE = 'password-reset';

const generateResetToken = ({ userId, otpRequestId, email }) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required for reset tokens');
    }

    return jwt.sign(
        {
            sub: userId.toString(),
            otpRequestId: otpRequestId.toString(),
            email,
            purpose: RESET_TOKEN_PURPOSE,
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const genericForgotPasswordResponse = (extra = {}) => ({
    success: true,
    message: 'If that email is registered, a verification code has been sent.',
    ...extra,
});

export const forgotPassword = async (req, res) => {
    try {
        const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : '';

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email }).select('_id email fullName username').lean();
        if (!user) {
            return res.json(genericForgotPasswordResponse());
        }

        const now = new Date();
        const existingRequest = await PasswordResetOtp.findOne({ userId: user._id });

        if (existingRequest?.resendAvailableAt && existingRequest.resendAvailableAt > now) {
            const retryInSeconds = Math.max(1, Math.ceil((existingRequest.resendAvailableAt.getTime() - now.getTime()) / 1000));
            return res.status(429).json({
                success: false,
                message: `Please wait ${retryInSeconds} seconds before requesting another code.`,
            });
        }

        const otp = generateOtp();
        const emailResult = await sendPasswordResetOtpEmail({
            to: user.email,
            otp,
            name: user.fullName || user.username,
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
        });

        const otpHash = hashOtp(otp);
        const otpRequest = await PasswordResetOtp.findOneAndUpdate(
            { userId: user._id },
            {
                $set: {
                    email: user.email,
                    otpHash,
                    expiresAt: minutesFromNow(AUTH_LIMITS.otpExpiryMinutes),
                    resendAvailableAt: secondsFromNow(AUTH_LIMITS.otpResendCooldownSeconds),
                    attemptCount: 0,
                    verifiedAt: null,
                    consumedAt: null,
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json(genericForgotPasswordResponse({
            resendAvailableIn: AUTH_LIMITS.otpResendCooldownSeconds,
            ...(emailResult.debug && process.env.NODE_ENV !== 'production'
                ? { devOtp: otp, devHint: 'OTP logged in backend console for local development.' }
                : {}),
            requestId: otpRequest._id,
        }));
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error.message);
        console.error(error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Unable to start password reset right now.',
            error: error.message 
        });
    }
};

export const verifyPasswordResetOtp = async (req, res) => {
    try {
        const email = typeof req.body.email === 'string' ? normalizeEmail(req.body.email) : '';
        const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email }).select('_id email').lean();
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        const otpRequest = await PasswordResetOtp.findOne({ userId: user._id });
        if (!otpRequest || otpRequest.consumedAt || otpRequest.expiresAt <= new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        if ((otpRequest.attemptCount || 0) >= AUTH_LIMITS.otpMaxAttempts) {
            return res.status(429).json({ success: false, message: 'Too many invalid code attempts. Request a new code.' });
        }

        const otpMatches = safeEqualHex(hashOtp(otp), otpRequest.otpHash);
        if (!otpMatches) {
            otpRequest.attemptCount = (otpRequest.attemptCount || 0) + 1;
            await otpRequest.save();
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        otpRequest.verifiedAt = new Date();
        otpRequest.attemptCount = 0;
        await otpRequest.save();

        return res.json({
            success: true,
            message: 'Verification successful',
            resetToken: generateResetToken({
                userId: user._id,
                otpRequestId: otpRequest._id,
                email: user.email,
            }),
        });
    } catch (error) {
        console.error('VERIFY OTP ERROR:', error.message);
        console.error(error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Unable to verify code right now.',
            error: error.message 
        });
    }
};

export const resetPasswordWithOtp = async (req, res) => {
    try {
        const { resetToken, password } = req.body;

        if (!resetToken || !password) {
            return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
        }

        const passwordValidationError = validatePasswordStrength(password);
        if (passwordValidationError) {
            return res.status(400).json({ success: false, message: passwordValidationError });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded?.purpose !== RESET_TOKEN_PURPOSE || !decoded?.sub || !decoded?.otpRequestId) {
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        const [user, otpRequest] = await Promise.all([
            User.findById(decoded.sub).select('_id email username passwordChangedAt failedLoginAttempts lockUntil'),
            PasswordResetOtp.findById(decoded.otpRequestId),
        ]);

        if (!user || !otpRequest) {
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        if (otpRequest.userId.toString() !== user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        if (otpRequest.consumedAt || !otpRequest.verifiedAt || otpRequest.expiresAt <= new Date()) {
            return res.status(400).json({ success: false, message: 'Reset session expired. Request a new code.' });
        }

        user.password = password;
        user.passwordChangedAt = new Date();
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        otpRequest.consumedAt = new Date();
        otpRequest.otpHash = hashOtp(generateOtp());
        await otpRequest.save();

        return res.json({
            success: true,
            message: 'Password reset successful. Please sign in again.',
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ success: false, message: 'Reset session expired. Request a new code.' });
        }

        console.error('RESET PASSWORD ERROR:', error.message);
        console.error(error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Unable to reset password right now.',
            error: error.message 
        });
    }
};
