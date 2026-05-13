import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_LIMITS, validatePasswordStrength } from '../utils/authSecurity.js';
import { sendAccountVerificationEmail } from '../services/authEmailService.js';
import { generateOtp, hashOtp, minutesFromNow, safeEqualHex } from '../utils/authSecurity.js';

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

export const registerUser = async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    try {
        console.log('Registration attempt for:', { username, email });

        if (!fullName || !username || !email || !phone || !password) {
            return res.status(400).json({ message: 'Please fill in all fields (Name, User, Email, Phone, Password)' });
        }

        const trimmedFullName = fullName.trim();
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        const passwordValidationError = validatePasswordStrength(password);
        if (passwordValidationError) {
            return res.status(400).json({ message: passwordValidationError });
        }

        const [emailExists, userExists] = await Promise.all([
            User.findOne({ email: trimmedEmail }).select('_id').lean(),
            User.findByUsername(trimmedUsername)
        ]);

        if (emailExists) {
            return res.status(400).json({ message: 'This Email is already registered' });
        }

        if (userExists) {
            return res.status(400).json({ message: 'This Username is already taken' });
        }

        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`;

        const otp = generateOtp();
        const otpExpiry = minutesFromNow(AUTH_LIMITS.otpExpiryMinutes);

        const user = await User.create({
            fullName: trimmedFullName,
            username: trimmedUsername,
            email: trimmedEmail,
            phone: trimmedPhone,
            password,
            avatar,
            otpCode: hashOtp(otp),
            otpExpiry,
        });

        const emailResult = await sendAccountVerificationEmail({
            to: user.email,
            otp,
            name: user.fullName || user.username,
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
        });

        return res.status(201).json({
            message: 'Registration successful. Please verify your email with the code sent.',
            email: user.email,
            requiresVerification: true,
            ...(emailResult.debug && process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
        });
    } catch (error) {
        console.error('REGISTRATION ERROR:', error.message);
        console.error(error.stack);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return res.status(400).json({ message: `This ${field} is already registered` });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Validation error: ${error.message}` });
        }

        return res.status(500).json({
            message: 'Server Error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const loginUser = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        console.log(`[AUTH] Login attempt started: ${email}`);

        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail })
            .select('+password username fullName email phone avatar bio preferences isPro role planId subscriptionPlan proActivatedAt subscriptionExpiry rating seasonScore stats badges customization usernameLower failedLoginAttempts lockUntil');

        if (!user) {
            console.log(`[AUTH] User not found: ${trimmedEmail}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log(`[AUTH] User found: ${user.username} (ID: ${user._id})`);

        if (user.lockUntil && user.lockUntil > new Date()) {
            console.log(`[AUTH] Account locked: ${user.username}`);
            return res.status(423).json({ message: buildLockoutMessage(user.lockUntil) });
        }

        if (!isUsablePasswordHash(user.password)) {
            const rawPasswordHash = await getRawPasswordHash(user._id);

            if (isUsablePasswordHash(rawPasswordHash)) {
                user.password = rawPasswordHash;
                console.warn(`[AUTH] Recovered password hash from raw user document for: ${trimmedEmail}`);
            } else {
                console.error(`[AUTH] Account data error for ${trimmedEmail}: missing or invalid password hash.`);
                return res.status(401).json({
                    message: 'Account error: No valid password is set for this user. Please reset your password or register again.'
                });
            }
        }

        console.log('[AUTH] Verifying password...');
        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            console.warn(`[AUTH] Password mismatch for: ${trimmedEmail}`);

            const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            const update = { $set: { failedLoginAttempts } };

            if (failedLoginAttempts >= AUTH_LIMITS.loginMaxFailures) {
                update.$set.lockUntil = new Date(Date.now() + AUTH_LIMITS.lockMinutes * 60 * 1000);
                update.$set.failedLoginAttempts = 0;
                console.log(`[AUTH] Max attempts reached. Locking ${user.username}`);
            }

            await User.updateOne({ _id: user._id }, update);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log(`[AUTH] Password verified for: ${user.username}`);

        let token;
        try {
            token = generateToken(user._id, { rememberMe });
        } catch (tokenError) {
            console.error('[AUTH] Token generation error:', tokenError.message);
            return res.status(500).json({
                message: 'Authentication service configuration error',
                error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
            });
        }

        try {
            const update = { $set: { failedLoginAttempts: 0, lockUntil: null } };
            if (!user.usernameLower) update.$set.usernameLower = user.username.toLowerCase();
            await User.updateOne({ _id: user._id }, update);
        } catch (updateError) {
            console.error('[AUTH] Post-login update failed (non-critical):', updateError.message);
        }

        attachAccessCookie(res, token, { rememberMe });

        console.log(`[AUTH] Login successful: ${user.username}`);

        const safeRole = user.role || 'user';
        const safePlan = user.subscriptionPlan || 'free';

        return res.json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            bio: user.bio || '',
            preferences: user.preferences || { emailNotifications: true, marketingUpdates: false },
            isPro: user.isPro || false,
            role: safeRole,
            planId: user.planId || null,
            subscriptionPlan: safePlan,
            proActivatedAt: user.proActivatedAt || null,
            subscriptionExpiry: user.subscriptionExpiry || null,
            rating: user.rating,
            seasonScore: user.seasonScore,
            stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
            badges: user.badges || [],
            customization: user.customization || { avatarFrame: 'none', tagline: 'Novice', signatureStack: [], entranceBanner: 'default-dark' },
            token,
        });
    } catch (error) {
        console.error('[AUTH] LOGIN ERROR:', error.message);
        console.error('Error Stack:', error.stack);
        return res.status(500).json({
            message: 'An internal server error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const verifyAccountOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+otpCode +otpExpiry +otpAttemptCount');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpCode || !user.otpExpiry) {
            return res.status(400).json({ message: 'No verification request found' });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        const isMatch = safeEqualHex(hashOtp(otp), user.otpCode);

        if (!isMatch) {
            user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
            await user.save();
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.emailVerified = true;
        user.phoneVerified = true; // For now, we verify both via email as requested
        user.otpCode = null;
        user.otpExpiry = null;
        user.otpAttemptCount = 0;
        await user.save();

        const token = generateToken(user._id);
        attachAccessCookie(res, token);

        return res.json({
            message: 'Email verified successfully',
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            bio: user.bio || '',
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            isPro: user.isPro || false,
            role: user.role || 'user',
            subscriptionPlan: user.subscriptionPlan || 'free',
            token,
        });
    } catch (error) {
        console.error('VERIFY ACCOUNT ERROR:', error.message);
        return res.status(500).json({ message: 'Server error during verification' });
    }
};

export const resendVerificationOtp = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        const otp = generateOtp();
        user.otpCode = hashOtp(otp);
        user.otpExpiry = minutesFromNow(AUTH_LIMITS.otpExpiryMinutes);
        user.otpAttemptCount = 0;
        await user.save();

        const emailResult = await sendAccountVerificationEmail({
            to: user.email,
            otp,
            name: user.fullName || user.username,
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
        });

        return res.json({
            message: 'Verification code resent',
            ...(emailResult.debug && process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
        });
    } catch (error) {
        console.error('RESEND VERIFICATION ERROR:', error.message);
        return res.status(500).json({ message: 'Server error during resend' });
    }
};
