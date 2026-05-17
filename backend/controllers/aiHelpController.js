import User from '../models/User.js';
import { getGroqClient } from '../services/aiRouterService.js';
import { AI_TIER_MAP, AI_RESPONSE_MESSAGES } from '../config/aiConfig.js';

const PLAN_AI_DAILY_LIMITS = {
    free: 0,
    plus: 1,
    pro: 3,
    premium: 7,
};

const ensureUsageStats = (userDoc) => {
    if (!userDoc.usageStats) {
        userDoc.usageStats = {
            chatQueriesToday: 0,
            matchesToday: 0,
            customMatchesToday: 0,
            visualizationsToday: 0,
            visualizerTrialUsed: false,
            aiHelpToday: 0,
            lastResetDate: new Date(),
        };
    }
};

const getDailyAiHelpLimit = (userDoc) => {
    const plan = userDoc.subscriptionPlan || 'free';
    if (
        userDoc.customLimits?.hasCustomLimits &&
        userDoc.customLimits.aiHelpLimit !== null &&
        userDoc.customLimits.aiHelpLimit !== undefined
    ) {
        return Number(userDoc.customLimits.aiHelpLimit);
    }

    return PLAN_AI_DAILY_LIMITS[plan] ?? PLAN_AI_DAILY_LIMITS.free;
};

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
    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error('USER_NOT_FOUND');

    ensureUsageStats(userDoc);
    if (typeof userDoc.checkAndResetDailyStats === 'function') {
        await userDoc.checkAndResetDailyStats();
    }
    ensureUsageStats(userDoc);

    const plan = userDoc.subscriptionPlan || 'free';
    const dailyLimit = getDailyAiHelpLimit(userDoc);

    if (userDoc.usageStats.aiHelpToday >= dailyLimit) {
        const error = new Error('Daily AI Help limit reached. Upgrade for more!');
        error.statusCode = 403;
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

        userDoc.usageStats.aiHelpToday += 1;
        userDoc.markModified('usageStats');
        await userDoc.save();

        const currentUsed = userDoc.usageStats.aiHelpToday;
        const remaining = Math.max(0, dailyLimit - currentUsed);

        return { 
            reply, 
            helpsUsedToday: currentUsed, 
            dailyLimit, 
            remainingCount: remaining 
        };
    } catch (error) {
        throw error;
    }
};

export const getHint = async (req, res) => {
    const { problemTitle } = req.body;
    try {
        const result = await handleAIHelpUsage(req, problemTitle, 'hint');
        res.json(result);
    } catch (error) {
        if (error.statusCode === 403) {
            return res.status(403).json({ 
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
        if (error.statusCode === 403) {
            return res.status(403).json({ 
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
