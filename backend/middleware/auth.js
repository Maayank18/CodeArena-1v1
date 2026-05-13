import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const AUTH_DEBUG_ENABLED = process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === 'true';

const maskToken = (token) => {
    if (typeof token !== 'string' || token.length < 12) return 'missing';
    return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

const buildAuthDebug = (req, token, extra = {}) => ({
    method: req.method,
    path: req.originalUrl,
    tokenHint: maskToken(token),
    cookiePresent: Boolean(req.cookies?.codearena_access_token),
    authHeaderPresent: Boolean(req.headers.authorization || req.headers.Authorization),
    ...extra,
});

const sendAuthFailure = (req, res, status, code, message, token, extra = {}) => {
    const debug = buildAuthDebug(req, token, extra);
    console.warn(`[AUTH] ${code} ${req.method} ${req.originalUrl}`, debug);

    return res.status(status).json({
        success: false,
        message,
        code,
        ...(AUTH_DEBUG_ENABLED ? { debug } : {}),
    });
};

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1].trim();
    }

    if (req.cookies?.codearena_access_token) {
        return String(req.cookies.codearena_access_token).trim();
    }

    return null;
};

export const verifyToken = async (req, res, next) => {
    const token = getTokenFromRequest(req);

    try {
        if (!token) {
            return sendAuthFailure(req, res, 401, 'AUTH_TOKEN_MISSING', 'Unauthorized', token);
        }

        if (!process.env.JWT_SECRET) {
            return sendAuthFailure(req, res, 500, 'AUTH_SERVER_MISCONFIGURED', 'Server auth misconfigured', token);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return sendAuthFailure(req, res, 401, 'AUTH_TOKEN_INVALID', 'Invalid token', token);
        }

        const user = await User.findById(decoded.id)
            .select('_id username passwordChangedAt subscriptionPlan role hasUsedVisualizerTrial')
            .lean();
        if (!user) {
            return sendAuthFailure(req, res, 401, 'AUTH_USER_NOT_FOUND', 'Invalid token', token, {
                decodedUserId: decoded.id,
            });
        }

        if (user.passwordChangedAt && decoded.iat) {
            const passwordChangedAtMs = new Date(user.passwordChangedAt).getTime();
            const tokenIssuedAtMs = decoded.iat * 1000;

            if (tokenIssuedAtMs < passwordChangedAtMs - 1000) {
                return sendAuthFailure(
                    req,
                    res,
                    401,
                    'AUTH_TOKEN_STALE',
                    'Token expired after password reset',
                    token,
                    {
                        username: user.username,
                        decodedUserId: decoded.id,
                    }
                );
            }
        }

        req.user = { 
            id: decoded.id,
            _id: decoded.id,
            username: user.username,
            subscriptionPlan: user.subscriptionPlan || 'free',
            role: user.role || 'user',
            hasUsedVisualizerTrial: !!user.hasUsedVisualizerTrial
        };
        return next();
    } catch (err) {
        const code = err?.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID';
        const message = err?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid or expired token';
        return sendAuthFailure(req, res, 401, code, message, token, {
            jwtError: err?.message,
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            req.user = null;
            return next();
        }

        if (!process.env.JWT_SECRET) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id) {
            req.user = null;
            return next();
        }

        const user = await User.findById(decoded.id).select('_id passwordChangedAt subscriptionPlan role hasUsedVisualizerTrial').lean();
        if (!user) {
            req.user = null;
            return next();
        }

        req.user = { 
            id: decoded.id,
            _id: decoded.id,
            subscriptionPlan: user.subscriptionPlan || 'free',
            role: user.role || 'user',
            hasUsedVisualizerTrial: !!user.hasUsedVisualizerTrial
        };
        return next();
    } catch (err) {
        req.user = null;
        return next();
    }
};
