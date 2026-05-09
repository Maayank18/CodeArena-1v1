// backend/middleware/subscriptionAuth.js

const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };

export const requirePlus = (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const plan = req.user.subscriptionPlan || 'free';
    if (tiers[plan] >= tiers.plus) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade required. This feature requires at least the Plus plan.' 
    });
};

export const requirePro = (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const plan = req.user.subscriptionPlan || 'free';
    if (tiers[plan] >= tiers.pro) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade required. This feature requires at least the Pro plan.' 
    });
};

export const requirePremium = (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const plan = req.user.subscriptionPlan || 'free';
    if (tiers[plan] >= tiers.premium) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade required. This feature requires at least the Premium plan.' 
    });
};

export const requireFullLanguageAccess = (req, res, next) => {
    if (req.user?.role === 'admin') return next();
    
    const { language } = req.body;
    
    // Free users only get javascript
    if (!language || language === 'javascript') {
        return next();
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required for full language access' });
    }

    const plan = req.user.subscriptionPlan || 'free';
    if (tiers[plan] >= tiers.plus) {
        return next();
    }

    return res.status(403).json({ 
        success: false, 
        message: 'Upgrade to Plus to unlock Full Language Access (Python, C++, Java, etc).' 
    });
};
