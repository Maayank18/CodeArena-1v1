// backend/utils/activityTracker.js
import User from '../models/User.js';

/**
 * Records user activity for consistency tracking and streak calculation.
 * This should be called whenever a user "attempts" a problem in any mode.
 * 
 * @param {string} userId - The ID of the user to track
 */
export const recordActivity = async (userId) => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const user = await User.findById(userId);
        if (!user) return;

        // 1. Update Activity Log (YYYY-MM-DD)
        if (!user.activityLog.includes(todayStr)) {
            user.activityLog.push(todayStr);
            
            // Keep only last 30 days to prevent unbounded growth
            if (user.activityLog.length > 30) {
                user.activityLog.shift();
            }

            // 2. Update Streak Logic
            const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
            
            if (!lastActive) {
                // First ever activity
                user.currentStreak = 1;
            } else {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                const lastActiveStr = lastActive.toISOString().split('T')[0];

                if (lastActiveStr === yesterdayStr) {
                    // Continuous streak
                    user.currentStreak += 1;
                } else if (lastActiveStr !== todayStr) {
                    // Streak broken
                    user.currentStreak = 1;
                }
            }
            
            user.lastActiveDate = today;
            user.markModified('activityLog');
            await user.save();
        }
    } catch (error) {
        console.error('[ACTIVITY_TRACKER] Error recording activity:', error);
    }
};
