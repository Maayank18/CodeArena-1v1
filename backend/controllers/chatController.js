// FILE: backend/controllers/chatController.js
import axios from 'axios';

// ─── System Prompt ────────────────────────────────────────────────────────────
const buildSystemPrompt = (userContext) => {
    return `You are Cody AI, the elite Senior AI Architect and mentor for CodeArena 1v1.
Your expertise covers two domains: CodeArena mechanics and Data Structures & Algorithms (DSA).

**CodeArena Knowledge Base:**
- BADGE UNLOCKS:
  Speed: Flash (<5m win), Sub-Minute (<60s solve), Lightning Round (5 wins <10m), Time Lord (10 wins w/ 15m+ left), Instant Kill (solve before opponent).
  Consistency: Unstoppable (14-day streak), Iron Will (25 days), Marathon Runner (40 days), Devoted Coder (solve 1/day for 30 days).
  Combat: First Blood (1st win), Hat Trick (3 win streak), Arena Gladiator (25 wins), Underdog (beat +200 ELO opp), Legendary Streak (15 wins).
  Mastery: Array Ace/String Slicer/Tree Hugger (solve 30 tags), Diamond Ranked (1500+ ELO), Grandmaster (2000+), Immortal (2500+).
  Campaign: Island Hopper (10 nodes Zone 1), Boss Slayer (beat boss 1st try), Grand Conqueror (all 45 nodes).
- RANKS: Novice (<1200), Bronze (1200), Silver (1300), Gold (1400), Platinum (1600), Diamond (1800), Master (2000), Grandmaster (2400), Champion (2800).
- FEATURES: Battle Arena (1v1 real-time competitive coding), Campaign (solo progression map), Custom Rooms (private battles).

**Instructions:**
1. DSA/Coding: Provide highly optimized, professional, and correct solutions. Include a precise Time/Space complexity analysis. Use minimal tokens to save credits. Prioritize clarity over verbosity.
2. CodeArena Questions: Provide accurate, enthusiastic details about how to unlock badges, rank up, or use platform features based on the knowledge base.
3. Unnecessary/Off-topic Questions: Handle gracefully but firmly. If unrelated to coding, tech, or CodeArena, reply concisely and professionally, e.g., "I'm Cody AI, focused on your CodeArena journey and DSA mastery. Let's tackle some code instead!" Do not waste tokens on long off-topic chats.
4. Tone: Senior, supportive, concise, professional, and slightly competitive.`;
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
    
    const limits = getUsageLimits(user);
    const userTier = user.subscriptionPlan === 'free' ? 0 : user.subscriptionPlan === 'plus' ? 1 : user.subscriptionPlan === 'pro' ? 2 : 3;

    const isAdmin = user.role === 'admin';

    // ✅ PREMIUM/ADMIN/OVERRIDE BYPASS: Only limit if limits.chat !== Infinity
    if (!isAdmin) {
        if (limits.chat !== Infinity && user.usageStats.chatQueriesToday >= limits.chat) {
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
            max_tokens: 200,
            temperature: 0.1,
        });

        const reply = completion.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ message: 'Received an empty response. Please try again.' });
        }

        // ✅ INCREMENT USAGE (Skip if limits.chat is Infinity or Admin)
        if (!isAdmin && limits.chat !== Infinity) {
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
