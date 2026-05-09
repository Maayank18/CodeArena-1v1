import { traceJavaScript } from '../utils/tracers/jsTracer.js';
import User from '../models/User.js';

export const executeVisualization = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
    }

    const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };
    const userPlan = req.user?.subscriptionPlan || 'free';
    const isPremium = tiers[userPlan] >= 3;
    const isAdmin = req.user?.role === 'admin';

    // Trial enforcement for non-premium
    if (!isPremium && !isAdmin) {
        if (req.user.hasUsedVisualizerTrial) {
            return res.status(403).json({ 
                success: false, 
                message: "Trial Expired: You've used your free visualization. Upgrade to Premium to unlock unlimited visualizations!",
                code: 'TRIAL_EXPIRED'
            });
        }
        
        // First time use -> flag it
        try {
            await User.findByIdAndUpdate(req.user._id, { hasUsedVisualizerTrial: true });
        } catch (err) {
            console.error("[VISUALIZER] Failed to update trial flag:", err);
        }
    }

    try {
        let traceData = [];

        if (language === 'javascript') {
            traceData = await traceJavaScript(code);
        } else {
            return res.status(400).json({ success: false, message: "Unsupported language" });
        }

        res.json({ success: true, trace: traceData });

    } catch (error) {
        console.error(`[VISUALIZER ERROR] ${language}:`, error);
        
        // Categorize errors for the frontend
        const isUserError = 
            error.name === 'SyntaxError' || 
            error.message.includes("Compilation") || 
            error.message.includes("is not defined");

        res.status(isUserError ? 400 : 500).json({ 
            success: false, 
            message: isUserError ? "Execution Error" : "Internal System Error", 
            error: error.message 
        });
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
