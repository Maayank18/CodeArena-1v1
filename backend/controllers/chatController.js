// FILE: backend/controllers/chatController.js
import axios from 'axios';

// ─── System Prompt ────────────────────────────────────────────────────────────
// Kept concise (~280 tokens) to leave maximum room for conversation context
const buildSystemPrompt = (userContext) => {
    const userLine = userContext
        ? `\nCURRENT USER: ${userContext.username} | Rating: ${userContext.rating} | W/L: ${userContext.wins}/${userContext.losses} | Matches: ${userContext.matchesPlayed}`
        : '';

    return `You are Arena AI, the official assistant for CodeArena 1v1 — a real-time competitive coding platform.${userLine}

PLATFORM FEATURES:
- Battle Arena: Create/join rooms, 1v1 coding battles, 2 problems, 30-minute timer
- Languages: C++, Java, Python, JavaScript
- ELO Ranks: Novice(0–1199) → Apprentice(1200–1499) → Specialist(1500–1799) → Expert(1800–2099) → Master(2100–2399) → Grandmaster(2400–2799) → Legendary(2800+)
- Season Score: Separate seasonal leaderboard, resets periodically
- Leaderboard: Top 100 players by season score
- Match History: Full W/L/Draw record with ELO changes per match
- Algorithm Visualizer: Step-by-step JS code execution — arrays, stacks, queues, trees, linked lists, matrices, graphs
- Anti-cheat: Tab switching and large code pastes are monitored

HOW A MATCH WORKS:
1. Create room → share Room ID with opponent
2. Both join → 30-minute countdown begins automatically
3. 2 algorithmic problems assigned (Easy/Medium difficulty)
4. Correct submission = +10 points, advance round
5. Most points at end wins → ELO adjusts accordingly
6. Season points: Win=50, Draw=25, Loss=10

YOUR RULES:
- Helpful, concise, friendly (2–4 sentences for simple questions)
- Only answer questions about CodeArena features, coding concepts, competitive programming
- Off-topic questions: respond "I'm specialized in helping with CodeArena! I can assist with matchmaking, rankings, the visualizer, or any platform feature. What would you like to know?"
- Never fabricate features that don't exist
- Address user by username when available`;
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

    // ✅ PREMIUM BYPASS: Unlimited chat, no increment
    if (userTier < 3) {
        if (user.usageStats.chatQueriesToday >= limits.chat) {
            return res.status(403).json({ 
                success: false, 
                message: `Daily chat limit reached (${limits.chat}/day). Upgrade for more AI assistance!`,
                code: 'LIMIT_REACHED'
            });
        }
    }

    console.log('[CHAT] Key exists:', !!process.env.GROQ_API_KEY);
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

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        console.error('[CHAT] GROQ_API_KEY not set in environment');
        return res.status(500).json({ message: 'AI service is not configured. Please contact support.' });
    }

    try {
        // Build message array: system + last 4 history messages + current user message
        const messages = [
            { role: 'system', content: buildSystemPrompt(user) },
            ...conversationHistory
                .slice(-4)
                .filter(m => m.role && m.content && typeof m.content === 'string')
                .map(m => ({ role: m.role, content: m.content.slice(0, 500) })),
            { role: 'user', content: message.trim() },
        ];

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 250,
                temperature: 0.65,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }
        );

        const reply = response.data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ message: 'Received an empty response. Please try again.' });
        }

        // ✅ INCREMENT USAGE
        user.usageStats.chatQueriesToday += 1;
        await user.save();

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
