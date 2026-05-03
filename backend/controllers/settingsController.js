import User from '../models/User.js';
import { sendSettingsOtpEmail } from '../services/authEmailService.js';
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
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const MAX_OTP_ATTEMPTS = 5;
const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

const sanitizeString = (value) => typeof value === 'string' ? value.trim() : '';

const normalizeEmail = (value) => sanitizeString(value).toLowerCase();

const normalizePhone = (value) => sanitizeString(value).replace(/\s+/g, '');

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
    emailVerified: Boolean(user.email),
    phoneVerified: Boolean(user.phone),
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

const buildRequestedChanges = ({ email, phone, password }) => {
    const items = [];

    if (email) {
        items.push(`Email change to ${email}`);
    }

    if (phone) {
        items.push(`Phone number change to ${phone}`);
    }

    if (password) {
        items.push('Password update');
    }

    return items;
};

export const getSettingsProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('username fullName email phone avatar bio preferences rating seasonScore stats')
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
        ).select('username fullName email phone avatar bio preferences rating seasonScore stats');

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
        const newEmail = req.body.email === undefined ? '' : normalizeEmail(req.body.email);
        const newPhone = req.body.phone === undefined ? '' : normalizePhone(req.body.phone);
        const newPassword = req.body.password === undefined ? '' : String(req.body.password);

        if (!newEmail && !newPhone && !newPassword) {
            return res.status(400).json({ success: false, message: 'Choose at least one sensitive field to update' });
        }

        const user = await User.findById(req.user._id).select('+otpCode +otpExpiry +otpAttemptCount +pendingUpdates username fullName email phone');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const pendingUpdates = {};

        if (newEmail) {
            if (!EMAIL_REGEX.test(newEmail)) {
                return res.status(400).json({ success: false, message: 'Enter a valid email address' });
            }

            if (newEmail === user.email) {
                return res.status(400).json({ success: false, message: 'That email is already on your account' });
            }

            const existingEmail = await User.findOne({ email: newEmail }).select('_id').lean();
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'That email is already registered' });
            }

            pendingUpdates.email = newEmail;
        }

        if (newPhone) {
            if (!PHONE_REGEX.test(newPhone)) {
                return res.status(400).json({ success: false, message: 'Enter a valid phone number' });
            }

            if (newPhone === user.phone) {
                return res.status(400).json({ success: false, message: 'That phone number is already on your account' });
            }

            pendingUpdates.phone = newPhone;
        }

        if (newPassword) {
            const passwordError = validatePasswordStrength(newPassword);
            if (passwordError) {
                return res.status(400).json({ success: false, message: passwordError });
            }

            pendingUpdates.password = newPassword;
        }

        const otp = generateOtp();
        user.otpCode = hashOtp(otp);
        user.otpExpiry = minutesFromNow(AUTH_LIMITS.otpExpiryMinutes);
        user.otpAttemptCount = 0;
        user.pendingUpdates = {
            ...pendingUpdates,
            requestedAt: new Date(),
        };
        await user.save();

        const emailResult = await sendSettingsOtpEmail({
            to: user.email,
            otp,
            name: user.fullName || user.username,
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
            requestedChanges: buildRequestedChanges(pendingUpdates),
        });

        return res.json({
            success: true,
            message: 'Verification code sent to your registered email address.',
            expiresInMinutes: AUTH_LIMITS.otpExpiryMinutes,
            ...(emailResult.debug && process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
        });
    } catch (error) {
        console.error('REQUEST SETTINGS OTP ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to send a verification code right now.' });
    }
};

export const verifySettingsOtp = async (req, res) => {
    try {
        const otp = sanitizeString(req.body.otp);

        if (!otp || otp.length !== 6) {
            return res.status(400).json({ success: false, message: 'Enter the 6 digit verification code' });
        }

        const user = await User.findById(req.user._id).select(
            '+otpCode +otpExpiry +otpAttemptCount +pendingUpdates username fullName email phone avatar bio preferences rating seasonScore stats passwordChangedAt failedLoginAttempts lockUntil'
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hasPendingChanges = Boolean(
            user.pendingUpdates?.email || user.pendingUpdates?.phone || user.pendingUpdates?.password
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

        const pendingEmail = user.pendingUpdates?.email;
        const pendingPhone = user.pendingUpdates?.phone;
        const pendingPassword = user.pendingUpdates?.password;

        if (pendingEmail) {
            const existingEmail = await User.findOne({ email: pendingEmail, _id: { $ne: user._id } }).select('_id').lean();
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'That email is already registered' });
            }

            user.email = pendingEmail;
        }

        if (pendingPhone) {
            user.phone = pendingPhone;
        }

        if (pendingPassword) {
            const passwordError = validatePasswordStrength(pendingPassword);
            if (passwordError) {
                return res.status(400).json({ success: false, message: passwordError });
            }

            user.password = pendingPassword;
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
            requiresReauth: Boolean(pendingPassword),
            user: buildSettingsPayload(user),
        });
    } catch (error) {
        console.error('VERIFY SETTINGS OTP ERROR:', error.message);

        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'That email is already registered' });
        }

        return res.status(500).json({ success: false, message: 'Unable to verify your code right now.' });
    }
};
