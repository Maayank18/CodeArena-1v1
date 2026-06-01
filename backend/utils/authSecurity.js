import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'codearena-otp-secret';

export const AUTH_LIMITS = {
    loginMaxFailures: Number(process.env.AUTH_MAX_FAILED_LOGINS || 5),
    lockMinutes: Number(process.env.AUTH_LOCK_MINUTES || 15),
    otpExpiryMinutes: Number(process.env.AUTH_OTP_EXPIRY_MINUTES || 10),
    otpResendCooldownSeconds: Number(process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS || 60),
    otpMaxAttempts: Number(process.env.AUTH_OTP_MAX_ATTEMPTS || 5),
};

export const generateOtp = () => {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
};

export const hashOtp = (otp) => {
    return crypto.createHmac('sha256', OTP_SECRET).update(String(otp)).digest('hex');
};

export const safeEqualHex = (left, right) => {
    if (typeof left !== 'string' || typeof right !== 'string') {
        return false;
    }

    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');

    if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const validatePasswordStrength = (password) => {
    if (typeof password !== 'string' || password.length < 8) {
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

export const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

export const secondsFromNow = (seconds) => new Date(Date.now() + seconds * 1000);

// Version-2.0