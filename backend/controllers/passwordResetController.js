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
import { createAuthTrace, normalizeEmail, normalizeOtp } from '../utils/authFlow.js';

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

const genericForgotPasswordResponse = (extra = {}) => ({
    success: true,
    message: 'If that email is registered, a verification code has been sent.',
    ...extra,
});

const restoreOtpRequestState = async (otpRequestId, snapshot) => {
    if (!otpRequestId) {
        return;
    }

    if (!snapshot) {
        await PasswordResetOtp.deleteOne({ _id: otpRequestId });
        return;
    }

    await PasswordResetOtp.updateOne(
        { _id: otpRequestId },
        {
            $set: {
                email: snapshot.email,
                otpHash: snapshot.otpHash,
                expiresAt: snapshot.expiresAt,
                resendAvailableAt: snapshot.resendAvailableAt,
                attemptCount: snapshot.attemptCount || 0,
                verifiedAt: snapshot.verifiedAt || null,
                consumedAt: snapshot.consumedAt || null,
            },
        }
    );
};

export const forgotPassword = async (req, res) => {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const trace = createAuthTrace('forgot-password', req, { email });

    try {
        trace.info('request.received');

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email }).select('_id email fullName username').lean();
        if (!user) {
            trace.info('lookup.user_missing_generic_response');
            return res.json(genericForgotPasswordResponse());
        }

        const now = new Date();
        const existingRequest = await PasswordResetOtp.findOne({ userId: user._id });

        if (existingRequest?.resendAvailableAt && existingRequest.resendAvailableAt > now) {
            const retryInSeconds = Math.max(1, Math.ceil((existingRequest.resendAvailableAt.getTime() - now.getTime()) / 1000));
            trace.warn('cooldown.active', { userId: user._id, retryInSeconds });
            return res.status(429).json({
                success: false,
                message: `Please wait ${retryInSeconds} seconds before requesting another code.`,
            });
        }

        const previousSnapshot = existingRequest ? {
            email: existingRequest.email,
            otpHash: existingRequest.otpHash,
            expiresAt: existingRequest.expiresAt,
            resendAvailableAt: existingRequest.resendAvailableAt,
            attemptCount: existingRequest.attemptCount,
            verifiedAt: existingRequest.verifiedAt,
            consumedAt: existingRequest.consumedAt,
        } : null;

        const otp = generateOtp();
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
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        trace.info('otp.persisted', {
            userId: user._id,
            otpRequestId: otpRequest._id,
            expiresAt: otpRequest.expiresAt,
        });

        try {
            const emailResult = await sendPasswordResetOtpEmail({
                to: user.email,
                otp,
                name: user.fullName || user.username,
                expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
            });

            trace.info('email.sent', {
                userId: user._id,
                otpRequestId: otpRequest._id,
                messageId: emailResult.messageId,
            });

            return res.json(genericForgotPasswordResponse({
                resendAvailableIn: AUTH_LIMITS.otpResendCooldownSeconds,

                requestId: otpRequest._id,
            }));
        } catch (emailError) {
            await restoreOtpRequestState(otpRequest?._id, previousSnapshot);
            
            // Log detailed error for debugging
            console.error('[PASSWORD_RESET] Email sending failed', {
                userId: user._id,
                otpRequestId: otpRequest?._id,
                errorCode: emailError?.code,
                errorMessage: emailError?.message,
                errorStatus: emailError?.status,
                isRetryable: emailError?.retryable,
                errorStack: process.env.NODE_ENV === 'development' ? emailError?.stack : undefined,
            });
            
            trace.error('email.failed_state_restored', emailError, {
                userId: user._id,
                otpRequestId: otpRequest?._id,
            });

            return res.status(emailError?.status || 502).json({
                success: false,
                message: 'Unable to send verification code right now.',
                code: emailError?.code || 'PASSWORD_RESET_EMAIL_FAILED',
                // In development, expose the actual error for debugging
                ...(process.env.NODE_ENV === 'development' && {
                    debugError: emailError?.message,
                    debugCode: emailError?.code,
                }),
            });
        }
    } catch (error) {
        trace.error('request.failed', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to start password reset right now.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

export const verifyPasswordResetOtp = async (req, res) => {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const otp = normalizeOtp(body.otp);
    const trace = createAuthTrace('verify-password-reset-otp', req, { email });

    try {
        trace.info('request.received');

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email }).select('_id email').lean();
        if (!user) {
            trace.warn('lookup.user_not_found');
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        const otpRequest = await PasswordResetOtp.findOne({ userId: user._id });
        if (!otpRequest || otpRequest.consumedAt || otpRequest.expiresAt <= new Date()) {
            trace.warn('otp.invalid_state', { userId: user._id, otpRequestId: otpRequest?._id || null });
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        if ((otpRequest.attemptCount || 0) >= AUTH_LIMITS.otpMaxAttempts) {
            trace.warn('otp.max_attempts', { userId: user._id, otpRequestId: otpRequest._id });
            return res.status(429).json({ success: false, message: 'Too many invalid code attempts. Request a new code.' });
        }

        const otpMatches = safeEqualHex(hashOtp(otp), otpRequest.otpHash);
        if (!otpMatches) {
            otpRequest.attemptCount = (otpRequest.attemptCount || 0) + 1;
            await otpRequest.save();
            trace.warn('otp.mismatch', {
                userId: user._id,
                otpRequestId: otpRequest._id,
                attemptCount: otpRequest.attemptCount,
            });
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        otpRequest.verifiedAt = new Date();
        otpRequest.attemptCount = 0;
        await otpRequest.save();

        trace.info('otp.verified', { userId: user._id, otpRequestId: otpRequest._id });

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
        trace.error('request.failed', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to verify code right now.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

export const resetPasswordWithOtp = async (req, res) => {
    const trace = createAuthTrace('reset-password', req);

    try {
        const body = req.body || {};
        const { resetToken, password } = body;
        trace.info('request.received', {
            hasResetToken: Boolean(resetToken),
            hasPassword: Boolean(password),
        });

        if (!resetToken || !password) {
            return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
        }

        const passwordValidationError = validatePasswordStrength(password);
        if (passwordValidationError) {
            trace.warn('validation.password_failed', { reason: passwordValidationError });
            return res.status(400).json({ success: false, message: passwordValidationError });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded?.purpose !== RESET_TOKEN_PURPOSE || !decoded?.sub || !decoded?.otpRequestId) {
            trace.warn('token.invalid_payload');
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        const [user, otpRequest] = await Promise.all([
            User.findById(decoded.sub).select('_id email username passwordChangedAt failedLoginAttempts lockUntil'),
            PasswordResetOtp.findById(decoded.otpRequestId),
        ]);

        if (!user || !otpRequest) {
            trace.warn('lookup.missing_user_or_request', {
                userId: decoded.sub,
                otpRequestId: decoded.otpRequestId,
            });
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        if (otpRequest.userId.toString() !== user._id.toString()) {
            trace.warn('lookup.request_user_mismatch', { userId: user._id, otpRequestId: otpRequest._id });
            return res.status(400).json({ success: false, message: 'Invalid reset session' });
        }

        if (otpRequest.consumedAt || !otpRequest.verifiedAt || otpRequest.expiresAt <= new Date()) {
            trace.warn('token.session_expired', { userId: user._id, otpRequestId: otpRequest._id });
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

        trace.info('password.reset_completed', { userId: user._id, otpRequestId: otpRequest._id });

        return res.json({
            success: true,
            message: 'Password reset successful. Please sign in again.',
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            trace.warn('token.expired_or_invalid', { jwtError: error.message });
            return res.status(400).json({ success: false, message: 'Reset session expired. Request a new code.' });
        }

        trace.error('request.failed', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to reset password right now.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Version-2.0