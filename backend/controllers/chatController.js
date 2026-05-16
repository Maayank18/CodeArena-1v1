// FILE: backend/controllers/chatController.js
import axios from 'axios';

// ─── System Prompt ────────────────────────────────────────────────────────────
// Kept concise (~280 tokens) to leave maximum room for conversation context
const buildSystemPrompt = (userContext) => {
    return `You are Sage, the elite AI mentor for 'CodeArena 1v1'. 
Your domain is STRICTLY limited to:
1. Data Structures and Algorithms (DSA) and debugging code.
2. Competitive Programming concepts.
3. CodeArena platform features (Battle Arena, Campaign, Code Visualizer, etc.).

CRITICAL RULE: If the user asks ANY question outside of this exact domain (e.g., general knowledge, math unrelated to code, pop culture, history, casual chit-chat), you MUST refuse to answer. You are forbidden from answering off-topic questions.
If a question is off-topic, you MUST reply EXACTLY with this string and nothing else:
"Hey bro why dont you explore code arena more so you can ask something meaningful 😉"

Do not apologize. Do not explain yourself. Just output the exact fallback string.`;
};

// ─── Rate limiting (simple in-memory, per IP) ─────────────────────────────────
const ipRequestLog = new Map();
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_MAX_REQUESTS = 100;           // generous server-side limit; frontend enforces 7

const checkIpRateLimit = (ip) => {
    const now = Date.now();
    const entry = ipRequestLog.get(ip) || { count: 0, windowStart: now };

    if (now - entry.windowStart > IP_WINDOW_MS) {
        // Reset window
        ipRequestLog.set(ip, { count: 1, windowStart: now });
        return true;
    }

    if (entry.count >= IP_MAX_REQUESTS) return false;

    entry.count++;
    ipRequestLog.set(ip, entry);
    return true;
};

// Cleanup old entries every hour
setInterval(() => {
    const cutoff = Date.now() - IP_WINDOW_MS;
    for (const [ip, entry] of ipRequestLog.entries()) {
        if (entry.windowStart < cutoff) ipRequestLog.delete(ip);
    }
}, IP_WINDOW_MS);

// ─── Controller ───────────────────────────────────────────────────────────────
import { getGroqClient } from '../services/aiRouterService.js';
import { checkAndResetDailyUsage, getUsageLimits } from '../utils/usageTracker.js';

export const chat = async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    // ✅ DAILY RESET & LIMIT CHECK
    await checkAndResetDailyUsage(user);
    
    const limits = getUsageLimits(user.subscriptionPlan);
    const userTier = user.subscriptionPlan === 'free' ? 0 : user.subscriptionPlan === 'plus' ? 1 : user.subscriptionPlan === 'pro' ? 2 : 3;

    const isAdmin = user.role === 'admin';

    // ✅ PREMIUM/ADMIN BYPASS: Unlimited chat, no increment
    if (!isAdmin && userTier < 3) {
        if (user.usageStats.chatQueriesToday >= limits.chat) {
            return res.status(403).json({ 
                success: false, 
                message: `Daily chat limit reached (${limits.chat}/day). Upgrade for more AI assistance!`,
                code: 'LIMIT_REACHED'
            });
        }
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // IP-level rate limit (server protection)
    if (!checkIpRateLimit(ip)) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const { message, conversationHistory = [] } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ message: 'Message is required.' });
    }
    if (message.length > 300) {
        return res.status(400).json({ message: 'Message too long (max 300 characters).' });
    }

    try {
        const client = getGroqClient(userTier, 'chatbot');

        // Build message array: system + last 4 history messages + current user message
        const messages = [
            { role: 'system', content: buildSystemPrompt(user) },
            ...conversationHistory
                .slice(-4)
                .filter(m => m.role && m.content && typeof m.content === 'string')
                .map(m => ({ role: m.role, content: m.content.slice(0, 500) })),
            { role: 'user', content: message.trim() },
        ];

        const completion = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 250,
            temperature: 0.2,
        });

        const reply = completion.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ message: 'Received an empty response. Please try again.' });
        }

        // ✅ INCREMENT USAGE (Skip for Premium/Admin)
        if (!isAdmin && userTier < 3) {
            user.usageStats.chatQueriesToday += 1;
            await user.save();
        }

        return res.json({ reply: reply.trim() });

    } catch (error) {
        const status = error.response?.status;
        console.error(`[CHAT] Groq API error (${status}):`, error.response?.data?.error?.message || error.message);

        if (status === 429) {
            return res.status(429).json({ message: "I'm a bit overloaded right now. Try again in a moment!" });
        }
        if (status === 401) {
            return res.status(500).json({ message: 'AI service configuration error. Please contact support.' });
        }

        return res.status(500).json({ message: "Sorry, I couldn't connect right now. Please try again!" });
    }
};
// V 1.5
