import Room from '../models/Room.js';
import { getGroqClient } from '../services/aiRouterService.js';

const SESSION_LIMITS = {
    'free': 0,
    'plus': 1,
    'pro': 3,
    'premium': 7
};

const getUserTier = (plan) => {
    if (plan === 'premium') return 3;
    if (plan === 'pro') return 2;
    if (plan === 'plus') return 1;
    return 0;
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
            throw new Error('RATE_LIMIT_REACHED');
        }
        throw error;
    }
};

export const getHint = async (req, res) => {
    const { roomId, problemTitle } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const plan = user.subscriptionPlan || 'free';
    const limit = SESSION_LIMITS[plan];

    if (limit === 0) {
        return res.status(403).json({ message: 'AI Hints are a Plus+ feature. Please upgrade!' });
    }

    try {
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const userIdStr = user._id.toString();
        const currentUsed = room.aiHelpsUsed?.get(userIdStr) || 0;

        if (currentUsed >= limit) {
            return res.status(403).json({ message: 'Session AI limit reached. You have used all your hints for this match.' });
        }

        const userTier = getUserTier(plan);
        const client = getGroqClient(userTier, 'ai-help');

        const systemPrompt = `You are Cody AI, an elite coding mentor. The user is solving ${problemTitle}. Provide ONE conceptual hint or algorithmic approach. DO NOT write code. DO NOT give the direct answer. Maximum 3 short sentences.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Please give me a hint for this problem." }
        ];

        const reply = await callGroq(client, messages);

        // Update usage
        if (!room.aiHelpsUsed) room.aiHelpsUsed = new Map();
        room.aiHelpsUsed.set(userIdStr, currentUsed + 1);
        await room.save();

        res.json({ reply, helpsUsed: currentUsed + 1 });
    } catch (error) {
        console.error('[AI HINT] Error:', error);
        if (error.message === 'RATE_LIMIT_REACHED') {
            return res.status(500).json({ message: 'Cody AI is currently analyzing too many requests, please try again in a moment.' });
        }
        res.status(500).json({ message: 'Cody AI is unavailable right now.' });
    }
};

export const checkCode = async (req, res) => {
    const { roomId, problemTitle, code } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const plan = user.subscriptionPlan || 'free';
    const limit = SESSION_LIMITS[plan];

    if (limit === 0) {
        return res.status(403).json({ message: 'AI Code Review is a Plus+ feature. Please upgrade!' });
    }

    try {
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const userIdStr = user._id.toString();
        const currentUsed = room.aiHelpsUsed?.get(userIdStr) || 0;

        if (currentUsed >= limit) {
            return res.status(403).json({ message: 'Session AI limit reached. You have used all your helps for this match.' });
        }

        const userTier = getUserTier(plan);
        const client = getGroqClient(userTier, 'ai-help');

        const systemPrompt = `You are Cody AI. The user is solving ${problemTitle}. Analyze their code: \n\n${code}\n\nIdentify logical flaws, syntax errors, or missed edge cases. Give a debugging suggestion. DO NOT write the corrected code for them. Guide them to find the bug themselves.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: "Please check my code for bugs." }
        ];

        const reply = await callGroq(client, messages);

        // Update usage
        if (!room.aiHelpsUsed) room.aiHelpsUsed = new Map();
        room.aiHelpsUsed.set(userIdStr, currentUsed + 1);
        await room.save();

        res.json({ reply, helpsUsed: currentUsed + 1 });
    } catch (error) {
        console.error('[AI CHECK CODE] Error:', error);
        if (error.message === 'RATE_LIMIT_REACHED') {
            return res.status(500).json({ message: 'Cody AI is currently analyzing too many requests, please try again in a moment.' });
        }
        res.status(500).json({ message: 'Cody AI is unavailable right now.' });
    }
};
