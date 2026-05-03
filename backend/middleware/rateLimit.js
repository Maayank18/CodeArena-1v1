const buckets = new Map();

const sweepExpiredBuckets = () => {
    const now = Date.now();

    for (const [key, value] of buckets.entries()) {
        if (value.resetAt <= now) {
            buckets.delete(key);
        }
    }
};

setInterval(sweepExpiredBuckets, 60 * 1000).unref();

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || 'unknown';
};

export const createRateLimiter = ({ keyPrefix, limit, windowMs, message, getKey }) => {
    return (req, res, next) => {
        const now = Date.now();
        const keySource = typeof getKey === 'function'
            ? getKey(req)
            : null;
        const bucketKey = `${keyPrefix}:${keySource || getClientIp(req)}`;
        const existing = buckets.get(bucketKey);

        if (!existing || existing.resetAt <= now) {
            buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
            return next();
        }

        existing.count += 1;

        if (existing.count > limit) {
            const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({
                success: false,
                message,
            });
        }

        return next();
    };
};
