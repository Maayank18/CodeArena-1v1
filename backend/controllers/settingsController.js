import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { BADGES_CATALOG } from '../config/badgesCatalog.js';
import { sendSettingsOtpEmail, sendEmailVerificationOtp } from '../services/authEmailService.js';
import {
    AUTH_LIMITS,
    generateOtp,
    hashOtp,
    minutesFromNow,
    safeEqualHex,
    validatePasswordStrength,
} from '../utils/authSecurity.js';

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_OTP_ATTEMPTS = 5;
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

const sanitizeString = (value) => typeof value === 'string' ? value.trim() : '';

const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') {
        return value;
    }

    return fallback;
};

const isValidDataImage = (value) => {
    if (typeof value !== 'string' || !value.startsWith('data:image/')) {
        return false;
    }

    const commaIndex = value.indexOf(',');
    if (commaIndex === -1) {
        return false;
    }

    const base64Payload = value.slice(commaIndex + 1);
    const payloadSize = Buffer.byteLength(base64Payload, 'base64');
    return payloadSize > 0 && payloadSize <= MAX_AVATAR_SIZE_BYTES;
};

const buildSettingsPayload = (user) => ({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio || '',
    preferences: {
        emailNotifications: Boolean(user.preferences?.emailNotifications),
        marketingUpdates: Boolean(user.preferences?.marketingUpdates),
    },
    rating: user.rating,
    seasonScore: user.seasonScore,
    stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
    usageStats: user.usageStats || {
        chatQueriesToday: 0,
        matchesToday: 0,
        customMatchesToday: 0,
        visualizationsToday: 0,
        visualizerTrialUsed: false,
        aiHelpToday: 0,
        lastResetDate: null,
    },
    subscriptionPlan: user.subscriptionPlan || 'free',
    badges: user.badges || [],
    customization: user.customization || { avatarFrame: 'none', tagline: 'Novice', signatureStack: [], entranceBanner: 'default-dark', advancedTheme: '' },
    emailVerified: Boolean(user.emailVerified),
    emailVerifiedAt: user.emailVerifiedAt || null,
});

const validateUsername = (username) => {
    if (!username) {
        return 'Username is required';
    }

    if (!USERNAME_REGEX.test(username)) {
        return 'Username must be 3-20 characters and use only letters, numbers, or underscores';
    }

    return null;
};

const validateProfileInput = ({ fullName, username, bio, avatar }) => {
    if (!fullName || fullName.length < 2) {
        return 'Full name must be at least 2 characters';
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
        return usernameError;
    }

    if (bio && bio.length > 240) {
        return 'Bio must be 240 characters or fewer';
    }

    if (avatar && !(avatar.startsWith('http') || isValidDataImage(avatar))) {
        return 'Avatar must be an image URL or an image under 1MB';
    }

    return null;
};

export const getSettingsProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('username fullName email phone avatar bio preferences rating seasonScore stats usageStats subscriptionPlan badges customization emailVerified emailVerifiedAt')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            user: buildSettingsPayload(user),
        });
    } catch (error) {
        console.error('GET SETTINGS PROFILE ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load settings right now.' });
    }
};

export const updateProfileSettings = async (req, res) => {
    try {
        const fullName = sanitizeString(req.body.fullName);
        const username = sanitizeString(req.body.username);
        const bio = sanitizeString(req.body.bio);
        const avatar = typeof req.body.avatar === 'string' ? req.body.avatar.trim() : '';
        const preferences = {
            emailNotifications: parseBoolean(req.body.preferences?.emailNotifications, true),
            marketingUpdates: parseBoolean(req.body.preferences?.marketingUpdates, false),
        };

        const validationError = validateProfileInput({ fullName, username, bio, avatar });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const user = await User.findById(req.user._id).select('_id username');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (username.toLowerCase() !== user.username.toLowerCase()) {
            const existingUsername = await User.findOne({ usernameLower: username.toLowerCase() }).select('_id').lean();
            if (existingUsername) {
                return res.status(400).json({ success: false, message: 'That username is already taken' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                    username,
                    bio,
                    avatar,
                    preferences,
                },
            },
            { new: true, runValidators: true }
        ).select('username fullName email phone avatar bio preferences rating seasonScore stats usageStats subscriptionPlan badges customization emailVerified emailVerifiedAt');
        

        return res.json({
            success: true,
            message: 'Profile settings updated successfully.',
            user: buildSettingsPayload(updatedUser),
        });
    } catch (error) {
        console.error('UPDATE SETTINGS PROFILE ERROR:', error.message);

        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'That username is already taken' });
        }

        return res.status(500).json({ success: false, message: 'Unable to save profile settings right now.' });
    }
};

export const requestSettingsOtp = async (req, res) => {
    try {
        const newPassword = req.body.password === undefined ? '' : String(req.body.password);

        console.log('[SETTINGS OTP] Request started', {
            userId: req.user?._id,
            hasPasswordChange: Boolean(newPassword),
        });

        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'Provide a new password before requesting a verification code' });
        }

        const user = await User.findById(req.user._id).select('+otpCode +otpExpiry +otpAttemptCount +pendingUpdates username fullName email phone');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.email || !EMAIL_REGEX.test(user.email)) {
            return res.status(400).json({
                success: false,
                message: 'Your account does not have a valid email address for OTP delivery.',
                code: 'SETTINGS_OTP_EMAIL_INVALID',
            });
        }

        const passwordError = validatePasswordStrength(newPassword);
        if (passwordError) {
            return res.status(400).json({ success: false, message: passwordError });
        }

        const pendingUpdates = {
            passwordHash: await bcrypt.hash(newPassword, 10),
        };

        const otp = generateOtp();
        user.otpCode = hashOtp(otp);
        user.otpExpiry = minutesFromNow(AUTH_LIMITS.otpExpiryMinutes);
        user.otpAttemptCount = 0;
        user.pendingUpdates = {
            ...pendingUpdates,
            requestedAt: new Date(),
        };
        await user.save();

        console.log('[SETTINGS OTP] OTP persisted', {
            userId: req.user?._id,
            deliveryTarget: user.email,
            expiresAt: user.otpExpiry,
        });

        let emailResult;
        try {
            emailResult = await sendSettingsOtpEmail({
                to: user.email,
                otp,
                name: user.fullName || user.username,
                expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
            });
        } catch (emailError) {
            user.otpCode = null;
            user.otpExpiry = null;
            user.otpAttemptCount = 0;
            user.pendingUpdates = {};
            await user.save();

            console.error('[SETTINGS OTP] Email delivery failed; OTP rolled back', {
                userId: req.user?._id,
                code: emailError?.code,
                message: emailError?.message,
            });

            return res.status(emailError?.status || 500).json({
                success: false,
                message: emailError.message || 'Unable to send verification code.',
                code: emailError?.code || 'SETTINGS_OTP_SEND_FAILED',
            });
        }

        console.log('[SETTINGS OTP] Verification email sent', {
            userId: req.user?._id,
            delivered: emailResult?.delivered,
        });

        return res.json({
            success: true,
            message: 'Verification code sent to your registered email address.',
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,

        });
    } catch (error) {
        console.error('REQUEST SETTINGS OTP ERROR:', error);
        
        const message = process.env.NODE_ENV === 'production' 
            ? 'Unable to send verification code. Please contact support or try again later.'
            : `Email Error: ${error.message}`;

        return res.status(error?.status || 500).json({
            success: false,
            message,
            code: error?.code || 'SETTINGS_OTP_REQUEST_FAILED',
        });
    }
};

export const verifySettingsOtp = async (req, res) => {
    try {
        const otp = sanitizeString(req.body.otp);

        if (!otp || otp.length !== 6) {
            return res.status(400).json({ success: false, message: 'Enter the 6 digit verification code' });
        }

        const user = await User.findById(req.user._id).select(
            '+otpCode +otpExpiry +otpAttemptCount +pendingUpdates username fullName email phone avatar bio preferences rating seasonScore stats usageStats passwordChangedAt failedLoginAttempts lockUntil emailVerified emailVerifiedAt'
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hasPendingChanges = Boolean(
            user.pendingUpdates?.passwordHash ||
            user.pendingUpdates?.password
        );

        if (!user.otpCode || !user.otpExpiry || !hasPendingChanges) {
            return res.status(400).json({ success: false, message: 'No pending verified change request was found' });
        }

        if (user.otpExpiry <= new Date()) {
            user.otpCode = null;
            user.otpExpiry = null;
            user.otpAttemptCount = 0;
            user.pendingUpdates = {};
            await user.save();
            return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
        }

        if ((user.otpAttemptCount || 0) >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new code.' });
        }

        const otpMatches = safeEqualHex(hashOtp(otp), user.otpCode);
        if (!otpMatches) {
            user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
            await user.save();
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        const pendingPasswordHash = user.pendingUpdates?.passwordHash;
        const legacyPendingPassword = user.pendingUpdates?.password;

        if (legacyPendingPassword) {
            const passwordError = validatePasswordStrength(legacyPendingPassword);
            if (passwordError) {
                return res.status(400).json({ success: false, message: passwordError });
            }
        }

        if (pendingPasswordHash) {
            user.password = pendingPasswordHash;
            user.passwordChangedAt = new Date();
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
        } else if (legacyPendingPassword) {
            user.password = legacyPendingPassword;
            user.passwordChangedAt = new Date();
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
        }

        user.otpCode = null;
        user.otpExpiry = null;
        user.otpAttemptCount = 0;
        user.pendingUpdates = {};
        await user.save();

        return res.json({
            success: true,
            message: 'Sensitive settings updated successfully.',
            requiresReauth: Boolean(pendingPasswordHash || legacyPendingPassword),
            user: buildSettingsPayload(user),
        });
    } catch (error) {
        console.error('VERIFY SETTINGS OTP ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to verify your code right now.' });
    }
};

export const requestEmailVerificationOtp = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const user = await User.findById(req.user._id).select('+otpCode +otpExpiry +otpAttemptCount username fullName email');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let targetEmail = user.email;

        if (newEmail) {
            const sanitizedEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';
            if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
                return res.status(400).json({ success: false, message: 'Provide a valid email address' });
            }

            if (sanitizedEmail === user.email.toLowerCase()) {
                return res.status(400).json({ success: false, message: 'New email must be different from your current email' });
            }

            const existingEmailUser = await User.findOne({ email: sanitizedEmail }).select('_id').lean();
            if (existingEmailUser) {
                return res.status(400).json({ success: false, message: 'This email is already registered to another account' });
            }

            targetEmail = sanitizedEmail;
        } else {
            if (user.emailVerified) {
                return res.status(400).json({ success: false, message: 'Email is already verified' });
            }
        }

        const otp = generateOtp();
        user.otpCode = hashOtp(otp);
        user.otpExpiry = minutesFromNow(AUTH_LIMITS.otpExpiryMinutes);
        user.otpAttemptCount = 0;
        user.pendingUpdates = {
            type: newEmail ? 'email_change' : 'email_verification',
            email: newEmail ? targetEmail : undefined,
            requestedAt: new Date(),
        };
        await user.save();

        await sendEmailVerificationOtp(
            targetEmail,
            user.fullName || user.username,
            otp
        );

        return res.json({
            success: true,
            message: `Verification code sent to ${targetEmail}.`,
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
        });
    } catch (error) {
        console.error('REQUEST EMAIL VERIFICATION ERROR:', error);
        return res.status(500).json({ success: false, message: 'Unable to send verification code.' });
    }
};

export const verifyEmailAddress = async (req, res) => {
    try {
        const otp = sanitizeString(req.body.otp);
        if (!otp || otp.length !== 6) {
            return res.status(400).json({ success: false, message: 'Enter the 6 digit verification code' });
        }

        const user = await User.findById(req.user._id).select(
            '+otpCode +otpExpiry +otpAttemptCount +pendingUpdates username fullName email phone avatar bio preferences rating seasonScore stats usageStats subscriptionPlan badges customization emailVerified emailVerifiedAt'
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const pendingEmail = typeof user.pendingUpdates?.email === 'string'
            ? user.pendingUpdates.email.trim().toLowerCase()
            : '';
        const pendingType = user.pendingUpdates?.type
            || (pendingEmail && pendingEmail !== user.email.toLowerCase() ? 'email_change' : 'email_verification');

        if (!user.otpCode || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'No pending verification request found' });
        }

        if (pendingType !== 'email_verification' && pendingType !== 'email_change') {
            return res.status(400).json({ success: false, message: 'No pending verification request found' });
        }

        if (user.otpExpiry <= new Date()) {
            user.otpCode = null;
            user.otpExpiry = null;
            user.otpAttemptCount = 0;
            user.pendingUpdates = {};
            await user.save();
            return res.status(400).json({ success: false, message: 'Code expired. Request a new one.' });
        }

        if ((user.otpAttemptCount || 0) >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new code.' });
        }

        const otpMatches = safeEqualHex(hashOtp(otp), user.otpCode);
        if (!otpMatches) {
            user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
            await user.save();
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        if (pendingType === 'email_change') {
            const newEmail = pendingEmail;
            if (!newEmail || !EMAIL_REGEX.test(newEmail)) {
                return res.status(400).json({ success: false, message: 'Invalid pending email update' });
            }

            const existingEmailUser = await User.findOne({ email: newEmail }).select('_id').lean();
            if (existingEmailUser && existingEmailUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ success: false, message: 'This email is already registered to another account' });
            }

            user.email = newEmail;
            user._bypassEmailVerificationInvalidation = true;
        }

        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.otpCode = null;
        user.otpExpiry = null;
        user.otpAttemptCount = 0;
        user.pendingUpdates = {};
        await user.save();

        return res.json({
            success: true,
            message: pendingType === 'email_change' 
                ? 'Email changed and verified successfully.' 
                : 'Email verified successfully.',
            user: buildSettingsPayload(user),
        });
    } catch (error) {
        console.error('VERIFY EMAIL ERROR:', error);
        return res.status(500).json({ success: false, message: 'Unable to verify email.' });
    }
};

// ── Pro Feature: Customization ────────────────────────────────

const VALID_AVATAR_FRAMES = ['none', 'neon-cyan', 'gold-hexagon', 'pulse-ring', 'emerald-glow', 'crimson-edge'];
const VALID_ENTRANCE_BANNERS = ['default-dark', 'aurora-borealis', 'cyber-grid', 'gradient-sunset', 'deep-ocean', 'neon-tokyo'];
const VALID_STACK_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
    'go', 'rust', 'ruby', 'swift', 'kotlin', 'php', 'scala', 'dart',
];
const VALID_ADVANCED_THEMES = ['', 'frostbyte', 'matrix', 'cyberpunk', 'inferno', 'samurai'];

export const updateCustomization = async (req, res) => {
    try {
        const userId = req.user._id;
        const { avatarFrame, tagline, signatureStack, entranceBanner, equippedBadge, advancedTheme } = req.body;

        const update = {};
        let userDoc = null;

        if (avatarFrame !== undefined) {
            if (!VALID_AVATAR_FRAMES.includes(avatarFrame)) {
                return res.status(400).json({ success: false, message: 'Invalid avatar frame' });
            }
            update['customization.avatarFrame'] = avatarFrame;
        }

        if (tagline !== undefined) {
            const sanitized = typeof tagline === 'string' ? tagline.trim().slice(0, 30) : '';
            update['customization.tagline'] = sanitized || 'Novice';
        }

        if (signatureStack !== undefined) {
            if (!Array.isArray(signatureStack) || signatureStack.length > 3) {
                return res.status(400).json({ success: false, message: 'Signature stack must be an array of max 3 languages' });
            }
            const validatedStack = signatureStack.filter(lang => VALID_STACK_LANGUAGES.includes(lang));
            update['customization.signatureStack'] = validatedStack;
        }

        if (entranceBanner !== undefined) {
            if (!VALID_ENTRANCE_BANNERS.includes(entranceBanner)) {
                return res.status(400).json({ success: false, message: 'Invalid entrance banner' });
            }
            update['customization.entranceBanner'] = entranceBanner;
        }

        if (equippedBadge !== undefined) {
            const sanitized = typeof equippedBadge === 'string' ? equippedBadge.trim() : '';
            if (sanitized !== '') {
                userDoc = await User.findById(userId)
                    .select('badges role')
                    .lean();

                if (!userDoc) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                const earnedBadges = userDoc.badges || [];
                const isAdmin = userDoc.role === 'admin';
                if (!earnedBadges.includes(sanitized) && !isAdmin) {
                    return res.status(400).json({ success: false, message: 'You must earn this badge before you can equip it' });
                }
            }
            update['customization.equippedBadge'] = sanitized;
        }

        if (advancedTheme !== undefined) {
            const sanitizedAdvancedTheme = typeof advancedTheme === 'string' ? advancedTheme.trim() : '';
            if (!VALID_ADVANCED_THEMES.includes(sanitizedAdvancedTheme)) {
                return res.status(400).json({ success: false, message: 'Invalid advanced theme' });
            }
            update['customization.advancedTheme'] = sanitizedAdvancedTheme;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid customization fields provided' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true, runValidators: true }
        ).select('username fullName email phone avatar bio preferences rating seasonScore stats usageStats subscriptionPlan badges customization emailVerified emailVerifiedAt').lean();

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            message: 'Customization saved.',
            customization: updatedUser.customization,
            user: buildSettingsPayload(updatedUser),
        });
    } catch (error) {
        console.error('UPDATE CUSTOMIZATION ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save customization.' });
    }
};

export const getUserBadges = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('badges achievementProgress stats')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const earnedBadges = user.badges || [];
        const achievementProgress = user.achievementProgress || [];
        const earnedBadgeSet = new Set(earnedBadges);
        const progressByBadgeKey = new Map(
            achievementProgress
                .filter((entry) => entry?.badgeKey)
                .map((entry) => [entry.badgeKey, entry])
        );
        
        const byCategory = BADGES_CATALOG.reduce((acc, badge) => {
            if (!acc[badge.category]) {
                acc[badge.category] = { earned: 0, total: 0 };
            }

            acc[badge.category].total += 1;
            const prog = progressByBadgeKey.get(badge.key);
            if ((prog && prog.unlocked) || earnedBadgeSet.has(badge.key)) {
                acc[badge.category].earned += 1;
            }

            return acc;
        }, {});

        return res.json({
            success: true,
            catalog: BADGES_CATALOG,
            earned: earnedBadges,
            badges: earnedBadges, // backwards compat
            achievementProgress: achievementProgress,
            stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
            progress: {
                earnedCount: Object.values(byCategory).reduce((sum, cat) => sum + cat.earned, 0),
                totalCount: BADGES_CATALOG.length,
                byCategory,
            },
        });
    } catch (error) {
        console.error('GET BADGES ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to fetch badges.' });
    }
};

export const getUserCustomization = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('customization badges')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            customization: user.customization || {
                avatarFrame: 'none',
                tagline: 'Novice',
                signatureStack: [],
                entranceBanner: 'default-dark',
                advancedTheme: '',
            },
            badges: user.badges || [],
        });
    } catch (error) {
        console.error('GET CUSTOMIZATION ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load customization.' });
    }
};
