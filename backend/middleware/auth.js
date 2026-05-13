import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    if (req.cookies?.codearena_access_token) {
        return req.cookies.codearena_access_token;
    }

    return null;
};

export const verifyToken = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth misconfigured' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        const user = await User.findById(decoded.id).select('_id passwordChangedAt subscriptionPlan role hasUsedVisualizerTrial').lean();
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        if (user.passwordChangedAt && decoded.iat) {
            const passwordChangedAtMs = new Date(user.passwordChangedAt).getTime();
            const tokenIssuedAtMs = decoded.iat * 1000;

            if (tokenIssuedAtMs < passwordChangedAtMs - 1000) {
                return res.status(401).json({ success: false, message: 'Token expired after password reset' });
            }
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
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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
