import crypto from 'crypto';

const maskEmail = (value) => {
    if (typeof value !== 'string' || !value.includes('@')) {
        return null;
    }

    const [local, domain] = value.split('@');
    const visibleLocal = local.slice(0, 2);
    return `${visibleLocal}${'*'.repeat(Math.max(1, local.length - visibleLocal.length))}@${domain}`;
};

const maskPhone = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (trimmed.length < 4) {
        return '***';
    }

    return `${'*'.repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
};

const isPlainObject = (v) =>
    v !== null && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

const sanitizeValue = (value, depth = 0) => {
    if (depth > 6) return '[nested]';

    if (Array.isArray(value)) {
        return value.map((v) => sanitizeValue(v, depth + 1));
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    // Don't recurse into non-plain objects (ObjectId, Buffer, etc.)
    if (!isPlainObject(value)) {
        if (typeof value.toString === 'function') return value.toString();
        return '[object]';
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => {
            if (/email/i.test(key)) {
                return [key, maskEmail(nestedValue)];
            }

            if (/phone/i.test(key)) {
                return [key, maskPhone(nestedValue)];
            }

            if (/password|token/i.test(key) || /(^otp$|otpCode|devOtp)/i.test(key)) {
                return [key, '[redacted]'];
            }

            return [key, sanitizeValue(nestedValue, depth + 1)];
        })
    );
};

const getClientIp = (req) => {
    const forwarded = req?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }

    return req?.ip || req?.socket?.remoteAddress || 'unknown';
};

export const normalizeEmail = (value) => (
    typeof value === 'string' ? value.trim().toLowerCase() : ''
);

export const normalizeOtp = (value) => (
    typeof value === 'string' ? value.trim() : ''
);

export const createAuthTrace = (scope, req, baseMeta = {}) => {
    const requestId = (
        req?.headers?.['x-request-id']
        || req?.headers?.['x-correlation-id']
        || crypto.randomUUID().slice(0, 8)
    );

    const commonMeta = sanitizeValue({
        requestId,
        method: req?.method,
        path: req?.originalUrl,
        ip: getClientIp(req),
        ...baseMeta,
    });

    const log = (level, stage, meta = {}) => {
        const payload = sanitizeValue({
            ...commonMeta,
            stage,
            ...meta,
        });

        console[level](`[AUTH:${scope}] ${stage}`, payload);
    };

    return {
        requestId,
        info: (stage, meta) => log('log', stage, meta),
        warn: (stage, meta) => log('warn', stage, meta),
        error: (stage, error, meta = {}) => log('error', stage, {
            ...meta,
            errorName: error?.name,
            errorCode: error?.code,
            errorMessage: error?.message,
            errorStatus: error?.status,
        }),
    };
};

export const buildAuthUserPayload = (user, token, extra = {}) => ({
    success: true,
    ...extra,
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio || '',
    preferences: user.preferences || { emailNotifications: true, marketingUpdates: false },
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    isPro: Boolean(user.isPro),
    role: user.role || 'user',
    planId: user.planId || null,
    subscriptionPlan: user.subscriptionPlan || 'free',
    proActivatedAt: user.proActivatedAt || null,
    subscriptionExpiry: user.subscriptionExpiry || null,
    rating: user.rating ?? 1000,
    seasonScore: user.seasonScore ?? 0,
    stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
    badges: user.badges || [],
    customization: user.customization || {
        avatarFrame: 'none',
        tagline: 'Novice',
        signatureStack: [],
        entranceBanner: 'default-dark',
    },
    createdAt: user.createdAt || null,
    token,
});
