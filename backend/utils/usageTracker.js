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
        user.usageStats.customMatchesToday = 0; // Reset custom matches too
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
                customMatches: 3 
            };
        case 'pro':
            return { 
                chat: 50, 
                matches: 100, 
                customMatches: Infinity 
            };
        case 'premium':
            return { 
                chat: 100, 
                matches: Infinity, 
                customMatches: Infinity 
            };
        default: // Novice / Free
            return { 
                chat: 7, 
                matches: 3, 
                customMatches: 0 
            };
    }
};
