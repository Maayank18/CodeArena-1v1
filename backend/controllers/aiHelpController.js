import Room from '../models/Room.js';
import User from '../models/User.js';
import { getGroqClient } from '../services/aiRouterService.js';
import { AI_DAILY_LIMITS, AI_TIER_MAP, AI_RESPONSE_MESSAGES } from '../config/aiConfig.js';
import { getUsageLimits } from '../utils/usageTracker.js';

const callGroq = async (client, messages) => {
    try {
        const completion = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 300,
            temperature: 0.2,
        });
        return completion.choices[0]?.message?.content;
    } catch (error) {
        if (error.status === 429) {
            throw new Error('GROQ_RATE_LIMIT');
        }
        throw error;
    }
};

/**
 * Enterprise-grade AI Rate Limiter & Assistance Logic
 * Implements atomic updates to prevent bypass via simultaneous requests.
 */
const handleAIHelpUsage = async (req, problemTitle, type, code = null) => {
    const userId = req.user._id;
    
    // 1. Initial Fetch for verification and daily reset check
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const plan = user.subscriptionPlan || 'free';
    const limits = getUsageLimits(user);
    const dailyLimit = limits.aiHelp;

    // 2. Perform Daily Reset if needed (Atomic via middleware or direct check)
    if (typeof user.checkAndResetDailyStats === 'function') {
        await user.checkAndResetDailyStats();
    } else {
        // Defensive bulletproof fallback in case instance method is not loaded on this document
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (!user.usageStats) {
            user.usageStats = {
                chatQueriesToday: 0,
                matchesToday: 0,
                customMatchesToday: 0,
                visualizationsToday: 0,
                visualizerTrialUsed: false,
                aiHelpToday: 0,
                lastResetDate: today
            };
        }
        const lastReset = user.usageStats.lastResetDate ? new Date(user.usageStats.lastResetDate) : today;
        const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
        if (today.getTime() > lastResetDay.getTime()) {
            user.usageStats.chatQueriesToday = 0;
            user.usageStats.matchesToday = 0;
            user.usageStats.customMatchesToday = 0;
            user.usageStats.visualizationsToday = 0;
            user.usageStats.aiHelpToday = 0;
            user.usageStats.lastResetDate = today;
            await User.updateOne({ _id: user._id }, { $set: { usageStats: user.usageStats } });
        }
    }

    // 3. ATOMIC CHECK AND INCREMENT
    // Using findOneAndUpdate ensures that even with rapid simultaneous requests,
    // the count never exceeds the dailyLimit.
    let updatedUser;
    if (dailyLimit === Infinity) {
        updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { "usageStats.aiHelpToday": 1 } },
            { new: true }
        );
    } else {
        updatedUser = await User.findOneAndUpdate(
            { 
                _id: userId, 
                "usageStats.aiHelpToday": { $lt: dailyLimit } 
            },
            { 
                $inc: { "usageStats.aiHelpToday": 1 } 
            },
            { 
                new: true, // Return the updated document
                runValidators: true 
            }
        );
    }

    if (!updatedUser) {
        // If findOneAndUpdate returns null, it means the count already >= dailyLimit
        const error = new Error(AI_RESPONSE_MESSAGES.LIMIT_REACHED);
        error.statusCode = 429;
        throw error;
    }

    // 4. Generate AI Content
    const userTier = AI_TIER_MAP[plan];
    const client = getGroqClient(userTier, 'ai-help');

    let systemPrompt = "";
    if (type === 'hint') {
        systemPrompt = `You are Cody AI, an elite coding mentor. The user is solving ${problemTitle}. Provide ONE conceptual hint or algorithmic approach. DO NOT write code. DO NOT give the direct answer. Maximum 3 short sentences.`;
    } else {
        systemPrompt = `You are Cody AI. The user is solving ${problemTitle}. Analyze their code: \n\n${code}\n\nIdentify logical flaws, syntax errors, or missed edge cases. Give a debugging suggestion. DO NOT write the corrected code for them. Guide them to find the bug themselves.`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: type === 'hint' ? "Please give me a hint for this problem." : "Please check my code for bugs." }
    ];

    try {
        const reply = await callGroq(client, messages);
        
        const currentUsed = updatedUser.usageStats.aiHelpToday;
        const remaining = Math.max(0, dailyLimit - currentUsed);

        return { 
            reply, 
            helpsUsedToday: currentUsed, 
            dailyLimit, 
            remainingCount: remaining 
        };
    } catch (error) {
        // ROLLBACK: If AI generation fails, we should ideally decrement the count
        // to be fair to the user, although Groq failures are rare.
        await User.findByIdAndUpdate(userId, { $inc: { "usageStats.aiHelpToday": -1 } });
        throw error;
    }
};

export const getHint = async (req, res) => {
    const { problemTitle } = req.body;
    try {
        const result = await handleAIHelpUsage(req, problemTitle, 'hint');
        res.json(result);
    } catch (error) {
        if (error.statusCode === 429) {
            return res.status(429).json({ 
                success: false,
                message: error.message,
                code: 'LIMIT_REACHED',
                remainingCount: 0
            });
        }
        
        console.error('[AI HINT] Error:', error);
        const status = error.message === 'GROQ_RATE_LIMIT' ? 429 : 500;
        const message = error.message === 'GROQ_RATE_LIMIT' ? AI_RESPONSE_MESSAGES.RATE_LIMIT_ERROR : AI_RESPONSE_MESSAGES.UNAVAILABLE;
        
        res.status(status).json({ success: false, message });
    }
};

export const checkCode = async (req, res) => {
    const { problemTitle, code } = req.body;
    try {
        const result = await handleAIHelpUsage(req, problemTitle, 'check', code);
        res.json(result);
    } catch (error) {
        if (error.statusCode === 429) {
            return res.status(429).json({ 
                success: false,
                message: error.message,
                code: 'LIMIT_REACHED',
                remainingCount: 0
            });
        }
        
        console.error('[AI CHECK CODE] Error:', error);
        const status = error.message === 'GROQ_RATE_LIMIT' ? 429 : 500;
        const message = error.message === 'GROQ_RATE_LIMIT' ? AI_RESPONSE_MESSAGES.RATE_LIMIT_ERROR : AI_RESPONSE_MESSAGES.UNAVAILABLE;
        
        res.status(status).json({ success: false, message });
    }
};
