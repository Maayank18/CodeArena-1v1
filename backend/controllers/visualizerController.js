import { traceJavaScript } from '../utils/tracers/jsTracer.js';
import User from '../models/User.js';
import { checkAndResetDailyUsage } from '../utils/usageTracker.js';

export const executeVisualization = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
    }

    const user = req.user;
    if (user) {
        await checkAndResetDailyUsage(user);
    }

    const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };
    const userPlan = req.user?.subscriptionPlan || 'free';
    const userTier = tiers[userPlan];
    const isAdmin = req.user?.role === 'admin';

    // ── Tiered Quota Enforcement ─────────────────────────────────────────
    const usage = user?.usageStats || {};
    
    if (!isAdmin && userTier < 3) {
        if (userTier < 2) {
            // Free & Plus use the one-time trial
            if (usage.visualizerTrialUsed) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Visualizer trial consumed. Upgrade to Pro to unlock 10 visualizations per day!",
                    code: 'TRIAL_EXPIRED'
                });
            }
        } else if (userTier === 2) {
            // Pro tier: 10/day
            if (usage.visualizationsToday >= 10) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Daily visualizer limit reached (10/day). Upgrade to Premium for unlimited access!",
                    code: 'LIMIT_REACHED'
                });
            }
        }
    }

    try {
        let traceData = [];

        if (language === 'javascript') {
            traceData = await traceJavaScript(code);
        } else {
            return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        // Check for hard errors in the trace itself (runtime errors)
        const runtimeError = traceData.find(step => step.type === 'error');
        
        if (user) {
            if (!isAdmin && userTier < 3) {
                if (userTier < 2) {
                    user.usageStats.visualizerTrialUsed = true;
                } else if (userTier === 2) {
                    user.usageStats.visualizationsToday = (user.usageStats.visualizationsToday || 0) + 1;
                }
                await user.save();
            }
        }

        res.json({ 
            success: true, 
            trace: traceData,
            stats: {
                totalSteps: traceData.length,
                hasError: !!runtimeError,
                error: runtimeError?.error
            },
            usage: user?.usageStats || null,
            user: user ? {
                _id: user._id,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                usageStats: user.usageStats,
            } : null,
        });

    } catch (error) {
        console.error(`[VISUALIZER ERROR] ${language}:`, error);
        
        // Categorize errors for the frontend
        const isUserError = 
            error.isUserError ||
            error.name === 'SyntaxError' || 
            error.message.includes("Compilation") || 
            error.message.includes("is not defined") ||
            error.message.includes("is not a function") ||
            error.message.includes("Cannot read property");

        res.status(isUserError ? 400 : 500).json({ 
            success: false, 
            message: isUserError ? ("Code Error: " + error.message) : "Internal System Error", 
            error: error.message 
        });
    }
};

/**
 * Marks the one-time trial for the visualizer as used for free users.
 * Triggered by frontend after successful visualization.
 */
/**
 * Consumes a visualization credit (either marks trial as used or increments daily count).
 * Triggered by frontend after successful visualization.
 */
export const consumeVisualization = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('_id role subscriptionPlan usageStats')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            success: true,
            message: 'Visualizer usage already recorded by /visualize/run',
            usage: user.usageStats || {},
            user,
        });
    } catch (error) {
        console.error('[VISUALIZER] Usage recording error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};























// // FILE: backend/controllers/executeVisualization.js
// import { traceJavaScript } from '../utils/tracers/jsTracer.js';

// // ── Constants (keep in sync with jsTracer.js) ────────────────────────────────
// const MAX_CODE_LEN = 20_000;

// // ── User-facing error patterns ────────────────────────────────────────────────
// // These are mistakes in the user's code, not bugs in our system.
// const USER_ERROR_SIGNALS = [
//     'SyntaxError',
//     'ReferenceError',
//     'TypeError',
//     'is not defined',
//     'is not a function',
//     'Cannot read propert',
//     'Cannot set propert',
//     'Unexpected token',
//     'Maximum call stack',
//     'Compilation',
//     'Syntax Error on line',
//     'Disallowed pattern',
//     'Code too large',
// ];

// function isUserError(error) {
//     if (error.isUserError) return true;
//     const msg = error.message || '';
//     const name = error.name || '';
//     return USER_ERROR_SIGNALS.some(sig => msg.includes(sig) || name.includes(sig));
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CONTROLLER
// // ─────────────────────────────────────────────────────────────────────────────
// export const executeVisualization = async (req, res) => {
//     const { code, language } = req.body;

//     // ── Basic input validation ────────────────────────────────────────────
//     if (!code || typeof code !== 'string' || code.trim().length === 0) {
//         return res.status(400).json({
//             success: false,
//             message: 'Code cannot be empty',
//         });
//     }

//     if (code.length > MAX_CODE_LEN) {
//         return res.status(400).json({
//             success: false,
//             message: `Code too large. Maximum is ${MAX_CODE_LEN / 1000}KB.`,
//         });
//     }

//     if (!language || typeof language !== 'string') {
//         return res.status(400).json({
//             success: false,
//             message: 'Language is required',
//         });
//     }

//     const lang = language.toLowerCase().trim();

//     if (lang !== 'javascript') {
//         return res.status(400).json({
//             success: false,
//             message: `Language "${lang}" is not supported yet. Only JavaScript is available.`,
//         });
//     }

//     // ── Execute ───────────────────────────────────────────────────────────
//     const startTime = Date.now();

//     try {
//         let traceData;

//         if (lang === 'javascript') {
//             traceData = await traceJavaScript(code);
//         }

//         const elapsedMs = Date.now() - startTime;

//         // Stats for debugging (stripped in production if needed)
//         const stats = {
//             steps:     traceData.filter(s => s.variables).length,
//             logs:      traceData.filter(s => s.type === 'log').length,
//             errors:    traceData.filter(s => s.type === 'error').length,
//             elapsedMs,
//         };

//         return res.json({
//             success: true,
//             trace: traceData,
//             stats,
//         });

//     } catch (error) {
//         const elapsed = Date.now() - startTime;
//         console.error(`[VISUALIZER ERROR] lang=${lang} time=${elapsed}ms`, error.message);

//         const userErr = isUserError(error);

//         return res.status(userErr ? 400 : 500).json({
//             success: false,
//             message: userErr
//                 ? 'Code Error: ' + (error.message || 'Check your code and try again.')
//                 : 'Internal Error: The visualizer encountered an unexpected problem.',
//             // Only surface raw error to client when it's their fault
//             ...(userErr ? { error: error.message } : {}),
//         });
//     }
// };
// V 1.5
