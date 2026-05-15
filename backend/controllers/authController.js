import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_LIMITS, validatePasswordStrength } from '../utils/authSecurity.js';
import { buildAuthUserPayload, createAuthTrace, normalizeEmail } from '../utils/authFlow.js';

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const isUsablePasswordHash = (value) => (
    typeof value === 'string' && BCRYPT_HASH_REGEX.test(value.trim())
);

const generateToken = (id, options = {}) => {
    if (!process.env.JWT_SECRET) {
        console.error('CRITICAL: JWT_SECRET is missing from environment variables');
        throw new Error('FATAL ERROR: JWT_SECRET is not defined in .env file');
    }

    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: options.rememberMe === false ? '1d' : '30d' }
    );
};

const attachAccessCookie = (res, token, options = {}) => {
    if (process.env.AUTH_USE_HTTP_ONLY_COOKIES !== 'true') {
        return;
    }

    res.cookie('codearena_access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: (options.rememberMe === false ? 1 : 30) * 24 * 60 * 60 * 1000,
        path: '/',
    });
};

const getRawPasswordHash = async (userId) => {
    const rawUser = await User.collection.findOne(
        { _id: userId },
        { projection: { password: 1 } }
    );

    return typeof rawUser?.password === 'string' ? rawUser.password.trim() : null;
};

const buildLockoutMessage = (lockUntil) => {
    const retryInSeconds = Math.max(1, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
    return `Account temporarily locked. Try again in ${retryInSeconds} seconds.`;
};

const buildVerificationDeliveryPayload = (delivery = {}) => ({
    delivered: Boolean(delivery.delivered),
    messageId: delivery.messageId || null,
    retryable: delivery.retryable !== false,
    code: delivery.code || null,
});

export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;
    const trace = createAuthTrace('register', req, { username, email });

    try {
        trace.info('request.received', {
            hasFullName: Boolean(fullName),
            hasUsername: Boolean(username),
            hasEmail: Boolean(email),
            hasPhone: Boolean(phone),
            hasPassword: Boolean(password),
        });

        if (!fullName || !username || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all fields (Name, User, Email, Phone, Password)',
            });
        }

        const trimmedFullName = fullName.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = normalizeEmail(email);
        const trimmedPhone = phone.trim();

        const passwordValidationError = validatePasswordStrength(password);
        if (passwordValidationError) {
            trace.warn('validation.password_failed', { reason: passwordValidationError });
            return res.status(400).json({ success: false, message: passwordValidationError });
        }

        const [emailExists, userExists] = await Promise.all([
            User.findOne({ email: trimmedEmail }).select('_id emailVerified').lean(),
            User.findByUsername(trimmedUsername),
        ]);

        if (emailExists) {
            trace.warn('validation.email_exists', {
                existingUserId: emailExists._id,
                emailVerified: emailExists.emailVerified,
            });
            return res.status(400).json({ success: false, message: 'This Email is already registered' });
        }

        if (userExists) {
            trace.warn('validation.username_exists', { existingUserId: userExists._id });
            return res.status(400).json({ success: false, message: 'This Username is already taken' });
        }

        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`;

        const user = await User.create({
            fullName: trimmedFullName,
            username: trimmedUsername,
            email: trimmedEmail,
            phone: trimmedPhone,
            password,
            avatar,
            emailVerified: true, 
            phoneVerified: true, 
        });

        trace.info('user.created', {
            userId: user._id,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
        });

        // Seamless Auto-login after registration
        const token = generateToken(user._id);
        attachAccessCookie(res, token);
        
        trace.info('login.success', { userId: user._id });

        return res.status(201).json(buildAuthUserPayload(user, token, {
            message: 'Registration successful! You are now logged in.',
        }));
    } catch (error) {
        trace.error('request.failed', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return res.status(400).json({ success: false, message: `This ${field} is already registered` });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: `Validation error: ${error.message}` });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

export const loginUser = async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const trace = createAuthTrace('login', req, { email });

    try {
        trace.info('request.received');

        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const trimmedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: trimmedEmail })
            .select('+password username fullName email phone avatar bio preferences isPro role planId subscriptionPlan proActivatedAt subscriptionExpiry rating seasonScore stats badges customization usernameLower failedLoginAttempts lockUntil emailVerified phoneVerified createdAt');

        if (!user) {
            trace.warn('lookup.user_not_found');
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        trace.info('lookup.user_found', { userId: user._id, username: user.username });

        if (user.lockUntil && user.lockUntil > new Date()) {
            trace.warn('login.locked', { userId: user._id, lockUntil: user.lockUntil });
            return res.status(423).json({ success: false, message: buildLockoutMessage(user.lockUntil) });
        }

        if (!isUsablePasswordHash(user.password)) {
            const rawPasswordHash = await getRawPasswordHash(user._id);

            if (isUsablePasswordHash(rawPasswordHash)) {
                user.password = rawPasswordHash;
                trace.warn('password.recovered_from_raw', { userId: user._id });
            } else {
                trace.warn('password.invalid_hash', { userId: user._id });
                return res.status(401).json({
                    success: false,
                    message: 'Account error: No valid password is set for this user. Please reset your password or register again.',
                });
            }
        }

        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            const update = { $set: { failedLoginAttempts } };

            if (failedLoginAttempts >= AUTH_LIMITS.loginMaxFailures) {
                update.$set.lockUntil = new Date(Date.now() + AUTH_LIMITS.lockMinutes * 60 * 1000);
                update.$set.failedLoginAttempts = 0;
            }

            await User.updateOne({ _id: user._id }, update);
            trace.warn('password.mismatch', {
                userId: user._id,
                failedLoginAttempts,
                accountLocked: Boolean(update.$set.lockUntil),
            });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        let token;
        try {
            token = generateToken(user._id, { rememberMe });
        } catch (tokenError) {
            trace.error('token.generation_failed', tokenError, { userId: user._id });
            return res.status(500).json({
                success: false,
                message: 'Authentication service configuration error',
                error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined,
            });
        }

        try {
            const update = { $set: { failedLoginAttempts: 0, lockUntil: null } };
            if (!user.usernameLower) update.$set.usernameLower = user.username.toLowerCase();
            await User.updateOne({ _id: user._id }, update);
        } catch (updateError) {
            trace.error('post_login_update.failed', updateError, { userId: user._id });
        }

        attachAccessCookie(res, token, { rememberMe });
        trace.info('login.succeeded', { userId: user._id });

        return res.json(buildAuthUserPayload(user, token, {
            message: `Welcome, ${user.username}!`,
        }));
    } catch (error) {
        trace.error('request.failed', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};


