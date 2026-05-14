/**
 * Utility to track and enforce daily usage limits for Free Tier users.
 */

export const checkAndResetDailyUsage = async (user) => {
    if (!user || !user.usageStats) return;

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
        user.usageStats.visualizationsToday = 0; // Reset visualizations
        user.usageStats.lastResetDate = now;
        
        // Also reset customMatchesPlayedToday if it exists for legacy consistency
        if (typeof user.customMatchesPlayedToday === 'number') {
            user.customMatchesPlayedToday = 0;
        }

        await user.save();
        console.log(`[USAGE] Reset daily stats for user: ${user.username}`);
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
                matches: 100, 
                customMatches: Infinity,
                visualizations: 10 
            };
        case 'premium':
            return { 
                chat: 100, 
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
