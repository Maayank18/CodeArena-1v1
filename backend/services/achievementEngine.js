// FILE: backend/services/achievementEngine.js
// Event-Driven Achievement Engine - Tracks real-time progress for all 60 badges

import User from '../models/User.js';
import Match from '../models/Match.js';
import Problem from '../models/Problem.js';
import { BADGES_CATALOG, BADGE_TYPES } from '../config/badgesCatalog.js';

/**
 * Ensures a user has a progress object for a specific badge.
 */
const getOrInitializeProgress = (user, badgeKey) => {
    if (!user.achievementProgress) user.achievementProgress = [];
    let progressObj = user.achievementProgress.find(p => p.badgeKey === badgeKey);
    if (!progressObj) {
        progressObj = {
            badgeKey,
            progress: 0,
            unlocked: false,
            unlockedAt: null,
            updatedAt: new Date(),
            metadata: {}
        };
        user.achievementProgress.push(progressObj);
    }
    // Backward compatibility: If the legacy 'badges' array already has this key,
    // ensure it's marked as unlocked and progress is at required value.
    if (!progressObj.unlocked && user.badges && user.badges.includes(badgeKey)) {
        const badgeDef = BADGES_CATALOG.find(b => b.key === badgeKey);
        progressObj.progress = badgeDef ? badgeDef.requiredValue : 1;
        progressObj.unlocked = true;
        progressObj.unlockedAt = new Date();
    }
    return progressObj;
};

/**
 * Increments progress and checks for unlocks. Returns true if newly unlocked.
 */
const incrementAndCheckUnlock = (progressObj, requiredValue, amount = 1) => {
    if (progressObj.unlocked) return false; // Already unlocked

    progressObj.progress += amount;
    progressObj.updatedAt = new Date();

    if (progressObj.progress >= requiredValue) {
        progressObj.progress = requiredValue;
        progressObj.unlocked = true;
        progressObj.unlockedAt = new Date();
        return true;
    }
    return false;
};

/**
 * Re-evaluates streak logic directly setting the value instead of incrementing.
 */
const setProgressAndCheckUnlock = (progressObj, requiredValue, newValue) => {
    if (progressObj.unlocked) return false;
    
    // Only update if it's a new high score
    if (newValue > progressObj.progress) {
        progressObj.progress = newValue;
        progressObj.updatedAt = new Date();

        if (progressObj.progress >= requiredValue) {
            progressObj.progress = requiredValue;
            progressObj.unlocked = true;
            progressObj.unlockedAt = new Date();
            return true;
        }
    }
    return false;
};

/**
 * Main entry point for events. 
 * eventType can be: 'MATCH_COMPLETED', 'PROBLEM_SOLVED', 'STREAK_UPDATED', 'CAMPAIGN_PROGRESS'
 * eventData contains context (match details, opponent info, time taken, tags etc)
 */
export const processAchievementEvent = async (userId, eventType, eventData = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        const newlyUnlocked = [];
        let modified = false;

        // Iterate through all badges in the catalog
        for (const badge of BADGES_CATALOG) {
            let progressObj = getOrInitializeProgress(user, badge.key);
            if (progressObj.unlocked) continue; // Skip if already unlocked

            const beforeState = JSON.stringify(progressObj);
            let justUnlocked = false;

            // ─── STREAK & CALENDAR BADGES ─────────────────────────────────────
            if (badge.unlockType === BADGE_TYPES.ACTIVITY_STREAK && eventType === 'STREAK_UPDATED') {
                const { currentStreak } = eventData;
                
                // Devoted coder requires a solve streak (handled in PROBLEM_SOLVED)
                if (badge.metadata?.condition !== 'solve_streak') {
                    // Regular activity streak
                    justUnlocked = setProgressAndCheckUnlock(progressObj, badge.requiredValue, currentStreak);
                }
            }

            // ─── ELO RATING BADGES ────────────────────────────────────────────
            if (badge.unlockType === BADGE_TYPES.ELO_THRESHOLD && eventType === 'MATCH_COMPLETED') {
                if (user.rating >= badge.requiredValue) {
                    justUnlocked = setProgressAndCheckUnlock(progressObj, badge.requiredValue, user.rating);
                }
            }

            // ─── COMBAT & MATCH COMPLETION BADGES ──────────────────────────────
            if (eventType === 'MATCH_COMPLETED') {
                const { isWin, isSolo, opponentRating, matchDurationSeconds, timeRemainingSeconds, isCustom, myScore } = eventData;
                
                // Rule 3: Battle Arena combat/speed badges require a REAL opponent.
                // Except "Centurion" and "Veteran" which just count total matches played regardless of type.
                const isRealMatch = !isSolo;

                if (badge.unlockType === BADGE_TYPES.COUNT_TOTAL_MATCHES) {
                    justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                }

                if (badge.unlockType === BADGE_TYPES.COUNT_TOTAL_WINS && isWin && isRealMatch) {
                    justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                }

                if (badge.unlockType === BADGE_TYPES.WIN_STREAK && isRealMatch) {
                    // Check if match was a win
                    if (isWin) {
                        justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                    } else {
                        // Reset progress on loss
                        progressObj.progress = 0;
                        progressObj.updatedAt = new Date();
                    }
                }

                if (badge.unlockType === BADGE_TYPES.TIME_BASED_WIN && isWin && isRealMatch) {
                    if (matchDurationSeconds <= badge.metadata.maxDurationSeconds) {
                        justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                    }
                }

                if (badge.unlockType === BADGE_TYPES.MATCH_FINISH_CONDITION && isRealMatch) {
                    const cond = badge.metadata;
                    if (cond.minTimeRemainingSeconds && isWin) {
                        if (timeRemainingSeconds >= cond.minTimeRemainingSeconds) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.maxTimeRemainingSeconds && isWin) {
                        if (timeRemainingSeconds <= cond.maxTimeRemainingSeconds) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.eloDiffRequired && isWin) {
                        if (opponentRating && opponentRating - user.rating >= cond.eloDiffRequired) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.condition === 'consecutive_weekends' && isWin) {
                        // We increment progress by 1 for simplicity here (assume frontend/backend logic feeds weekend event properly)
                        justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                    } else if (cond.condition === 'time_window' && isWin) {
                        // Backend time is UTC, we assume server time or pass local time via eventData
                        const currentHour = new Date().getHours();
                        if (currentHour >= cond.startHour && currentHour < cond.endHour) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.condition === 'win_3_0_custom' && isWin && isCustom) {
                        if (myScore === 3) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.condition === 'solved_before_opponent_submit' && isWin) {
                        if (eventData.opponentSubmissions === 0) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    } else if (cond.condition === 'all_problems_solved' && isWin) {
                        if (eventData.allSolvedCorrectly) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    }
                }
            }

            // ─── PROBLEM SOLVING & SPEED BADGES ──────────────────────────────
            if (eventType === 'PROBLEM_SOLVED') {
                const { solveTimeSeconds, tags, problemId } = eventData;

                // Problem Deduplication
                if (problemId) {
                    if (!progressObj.metadata) progressObj.metadata = {};
                    if (!progressObj.metadata.solvedProblemIds) progressObj.metadata.solvedProblemIds = [];
                    const pidStr = problemId.toString();
                    if (progressObj.metadata.solvedProblemIds.includes(pidStr)) {
                        continue; // Skip deduplicated event
                    }
                    progressObj.metadata.solvedProblemIds.push(pidStr);
                }

                // Solve Streak (e.g. Devoted Coder)
                if (badge.unlockType === BADGE_TYPES.ACTIVITY_STREAK && badge.metadata?.condition === 'solve_streak') {
                    const today = new Date().toDateString();
                    if (!progressObj.metadata) progressObj.metadata = {};
                    const lastSolve = progressObj.metadata.lastSolveDate;
                    if (lastSolve !== today) {
                        const yesterday = new Date(Date.now() - 86400000).toDateString();
                        let solveStreak = progressObj.metadata.solveStreak || 0;
                        if (lastSolve === yesterday) {
                            solveStreak += 1;
                        } else {
                            solveStreak = 1;
                        }
                        progressObj.metadata.lastSolveDate = today;
                        progressObj.metadata.solveStreak = solveStreak;
                        justUnlocked = setProgressAndCheckUnlock(progressObj, badge.requiredValue, solveStreak);
                    }
                }

                if (badge.unlockType === BADGE_TYPES.TIME_BASED_SOLVE) {
                    if (solveTimeSeconds <= badge.metadata.maxSolveTimeSeconds) {
                        justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                    }
                }

                if (badge.unlockType === BADGE_TYPES.COUNT_TAG && tags && Array.isArray(tags)) {
                    // Check if problem tags intersect with badge requirement
                    const hasTag = tags.some(t => badge.metadata?.tags?.includes(t.toLowerCase()));
                    if (hasTag) {
                        justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                    }
                }
            }

            // ─── CAMPAIGN BADGES ────────────────────────────────────────────
            if (eventType === 'CAMPAIGN_PROGRESS') {
                // Rule 6: Campaign badge can only be gotten when user takes premium
                const tier = user.subscriptionPlan;
                const isPremium = tier === 'plus' || tier === 'pro' || tier === 'premium';

                if (isPremium) {
                    const { action, zoneId, nodeId, stars, isFirstSubmission, lootDropRarity } = eventData;

                    if (badge.unlockType === BADGE_TYPES.CAMPAIGN_NODE_PROGRESS) {
                        if (badge.metadata.countType === 'stars' && action === 'earn_stars') {
                            // Accumulate total stars
                            progressObj.progress += stars;
                            if (progressObj.progress >= badge.requiredValue) {
                                progressObj.progress = badge.requiredValue;
                                justUnlocked = true;
                                progressObj.unlocked = true;
                                progressObj.unlockedAt = new Date();
                            }
                        } else if (action === 'clear_node') {
                            // Node deduplication
                            if (!progressObj.metadata) progressObj.metadata = {};
                            if (!progressObj.metadata.clearedNodes) progressObj.metadata.clearedNodes = [];
                            if (!progressObj.metadata.clearedNodes.includes(nodeId)) {
                                progressObj.metadata.clearedNodes.push(nodeId);
                                if (badge.metadata.countType === 'nodes' || badge.metadata.zoneId === zoneId) {
                                    justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                                }
                            }
                        }
                    }

                    if (badge.unlockType === BADGE_TYPES.CAMPAIGN_BOSS_CONDITION && action === 'clear_boss') {
                        const m = badge.metadata;
                        if (m.nodeId && m.nodeId === nodeId) {
                            if (m.minStars && stars >= m.minStars) {
                                justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                            } else if (m.maxTimeMs && eventData.timeMs <= m.maxTimeMs) {
                                justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                            } else if (m.firstSubmission && isFirstSubmission) {
                                justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                            }
                        } else if (!m.nodeId && m.firstSubmission && isFirstSubmission) {
                            // Any boss
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    }

                    if (badge.unlockType === BADGE_TYPES.LOOT_DROP && action === 'loot_drop') {
                        if (badge.metadata.rarity === lootDropRarity) {
                            justUnlocked = incrementAndCheckUnlock(progressObj, badge.requiredValue);
                        }
                    }
                }
            }

            if (justUnlocked) {
                newlyUnlocked.push(badge);
                // Also add to legacy 'badges' array for absolute backwards compatibility
                if (!user.badges.includes(badge.key)) {
                    user.badges.push(badge.key);
                }
            }

            // Detect if progress was changed using stringification (handles resets to 0 and nested metadata updates)
            if (JSON.stringify(progressObj) !== beforeState) {
                modified = true;
            }
        }

        // Secret Meta Badge Logic
        if (eventType === 'CAMPAIGN_PROGRESS' && newlyUnlocked.length > 0) {
            const ultimate = BADGES_CATALOG.find(b => b.key === 'ultimate_guardian');
            let ultimateProg = getOrInitializeProgress(user, 'ultimate_guardian');
            
            // Check if all other campaign nodes/badges are done
            // For simplicity, we just check if progress hits 45 nodes
            if (eventData.action === 'clear_node' && !ultimateProg.unlocked) {
                if (incrementAndCheckUnlock(ultimateProg, ultimate.requiredValue)) {
                    newlyUnlocked.push(ultimate);
                    if (!user.badges.includes(ultimate.key)) user.badges.push(ultimate.key);
                }
            }
        }

        if (modified) {
            user.markModified('achievementProgress');
            await user.save();
        }

        return { newlyUnlocked, progress: user.achievementProgress };
    } catch (error) {
        console.error('[Achievement Engine Error]', error);
        return { newlyUnlocked: [], error: true };
    }
};

// Version-2.0