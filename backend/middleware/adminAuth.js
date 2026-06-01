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

export const isAdmin = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Server auth misconfigured',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        const user = await User.findById(decoded.id)
            .select('_id username usernameLower email role')
            .lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        const adminUsername = (process.env.ADMIN_USERNAME || 'Maya').trim().toLowerCase();
        const currentUsername = (user.usernameLower || user.username || '').trim().toLowerCase();
        const isRoleAdmin = user.role === 'admin';
        const isLegacyAdmin = currentUsername === adminUsername;

        if (!isRoleAdmin && !isLegacyAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: admin privileges required',
            });
        }

        req.user = {
            ...(req.user || {}),
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isAdmin: true,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

export const adminAuth = isAdmin;

// Version-2.0