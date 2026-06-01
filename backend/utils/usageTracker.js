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

export const getUsageLimits = (planOrUser) => {
    let plan = 'free';
    let user = null;
    if (planOrUser && typeof planOrUser === 'object') {
        plan = planOrUser.subscriptionPlan || 'free';
        user = planOrUser;
    } else if (typeof planOrUser === 'string') {
        plan = planOrUser;
    }

    // Get default limits based on plan
    let limits = {
        chat: 7,
        matches: 3,
        customMatches: 0,
        visualizations: 0,
        aiHelp: 0
    };

    switch (plan) {
        case 'plus':
            limits = { 
                chat: 3, 
                matches: 7, 
                customMatches: 3,
                visualizations: 0,
                aiHelp: 3
            };
            break;
        case 'pro':
            limits = { 
                chat: 8, 
                matches: 14, 
                customMatches: 6,
                visualizations: 5,
                aiHelp: 7
            };
            break;
        case 'premium':
            limits = { 
                chat: 20, 
                matches: Infinity, 
                customMatches: Infinity,
                visualizations: Infinity,
                aiHelp: 15
            };
            break;
        default: // Novice / Free
            limits = { 
                chat: 2, 
                matches: 3, 
                customMatches: 0,
                visualizations: 0,
                aiHelp: 0
            };
            break;
    }

    // Apply custom overrides if enabled for this user
    if (user && user.customLimits && user.customLimits.hasCustomLimits) {
        if (user.customLimits.chatQueriesLimit !== null && user.customLimits.chatQueriesLimit !== undefined) {
            limits.chat = user.customLimits.chatQueriesLimit;
        }
        if (user.customLimits.matchesLimit !== null && user.customLimits.matchesLimit !== undefined) {
            limits.matches = user.customLimits.matchesLimit;
        }
        if (user.customLimits.customMatchesLimit !== null && user.customLimits.customMatchesLimit !== undefined) {
            limits.customMatches = user.customLimits.customMatchesLimit;
        }
        if (user.customLimits.visualizationsLimit !== null && user.customLimits.visualizationsLimit !== undefined) {
            limits.visualizations = user.customLimits.visualizationsLimit;
        }
        if (user.customLimits.aiHelpLimit !== null && user.customLimits.aiHelpLimit !== undefined) {
            limits.aiHelp = user.customLimits.aiHelpLimit;
        }
    }

    return limits;
};

// Version-2.0