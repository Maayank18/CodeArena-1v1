/**
 * Utility to track and enforce daily usage limits for Free Tier users.
 */

export const checkAndResetDailyUsage = async (user) => {
    if (!user) return;
    
    // Ensure usageStats exists
    if (!user.usageStats) {
        user.usageStats = {
            chatQueriesToday: 0,
            matchesToday: 0,
            customMatchesToday: 0,
            visualizationsToday: 0,
            visualizerTrialUsed: false,
            lastResetDate: new Date()
        };
    }

    // ✅ ADMIN BYPASS: Admins don't need their usage stats tracked/reset
    if (user.role === 'admin') return;

    const now = new Date();
    const lastReset = new Date(user.usageStats.lastResetDate);

    // Check if it's a different day (ignoring time)
    const isNewDay = 
        now.getFullYear() !== lastReset.getFullYear() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getDate() !== lastReset.getDate();

    if (isNewDay) {
        user.usageStats.chatQueriesToday = 0;
        user.usageStats.matchesToday = 0;
        user.usageStats.customMatchesToday = 0;
        user.usageStats.visualizationsToday = 0;
        user.usageStats.lastResetDate = now;
        
        if (typeof user.customMatchesPlayedToday === 'number') {
            user.customMatchesPlayedToday = 0;
        }

        // ✅ SAFETY: Ensure we have a real Mongoose document before saving
        if (typeof user.save === 'function') {
            await user.save();
            console.log(`[USAGE] Reset daily stats for user: ${user.username}`);
        } else {
            console.warn(`[USAGE] Cannot save daily reset: user object for ${user.username} is not a Mongoose document.`);
        }
    }
};

export const getUsageLimits = (plan) => {
    switch (plan) {
        case 'plus':
            return { 
                chat: 10, 
                matches: 5, 
                customMatches: 3,
                visualizations: 0 // Plus users still use the 1-time trial logic
            };
        case 'pro':
            return { 
                chat: 50, 
                matches: Infinity, 
                customMatches: 15,
                visualizations: 10 
            };
        case 'premium':
            return { 
                chat: Infinity, 
                matches: Infinity, 
                customMatches: Infinity,
                visualizations: Infinity
            };
        default: // Novice / Free
            return { 
                chat: 7, 
                matches: 3, 
                customMatches: 0,
                visualizations: 0 // Free users use the 1-time trial logic
            };
    }
};
