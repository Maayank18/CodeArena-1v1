// backend/middleware/subscriptionAuth.js

export const requirePlus = (req, res, next) => {
    // If there's no user, we can't check
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'admin') return next();

    const plan = req.user.subscriptionPlan || 'free';
    
    // Plus includes 'plus', 'pro', 'premium'
    if (['plus', 'pro', 'premium'].includes(plan)) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade required. This feature requires at least the Plus plan.' 
    });
};

export const requirePro = (req, res, next) => {
    // If there's no user, we can't check
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'admin') return next();

    const plan = req.user.subscriptionPlan || 'free';
    
    // Pro includes 'pro', 'premium'
    if (['pro', 'premium'].includes(plan)) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade required. This feature requires at least the Pro plan.' 
    });
};

export const requireFullLanguageAccess = (req, res, next) => {
    const { language } = req.body;
    
    // Free users only get javascript
    if (!language || language === 'javascript') {
        return next();
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required for full language access' });
    }

    if (req.user.role === 'admin') return next();

    const plan = req.user.subscriptionPlan || 'free';
    if (['plus', 'pro', 'premium'].includes(plan)) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade to Plus to unlock Full Language Access (Python, C++, Java, etc).' 
    });
};
