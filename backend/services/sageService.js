// backend/services/sageService.js
// Isolated AI service layer for The Sage mentor feature.
// Keeping prompt engineering and API calls out of the controller
// makes it trivially testable and swappable (Groq → Gemini etc.).

import axios from 'axios';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192'; // Fast + cheap. Swap for llama3-70b for deeper hints.

// ─────────────────────────────────────────────────────────────────────────────
// buildSageMessages
// Returns the messages array for the chat completion call.
// Deliberately minimal context to keep token costs low.
// ─────────────────────────────────────────────────────────────────────────────
export const buildSageMessages = ({ title, description, userCode, language, errorMessage }) => {
    // Keep description under 400 chars so we don't blast the context window
    const shortDesc = (description || '').substring(0, 400);

    // Keep user code under 900 chars — if longer, take the first 900
    const shortCode = (userCode || '').substring(0, 900);

    // Sanitise error message
    const shortError = (errorMessage || 'Wrong answer on a hidden test case').substring(0, 250);

    const systemPrompt =
`You are "The Sage", a stern but wise algorithm mentor on CodeArena.
Your ONLY job is to expose the logical flaw in the student's thinking — not to fix it for them.

ABSOLUTE RULES (violation = bad response):
1. NEVER write code, pseudo-code, variable names, or algorithmic steps.
2. NEVER give the answer or hint at the correct algorithm by name.
3. Identify the SINGLE most important conceptual gap in the student's approach.
4. Ask ONE short Socratic question (≤ 25 words) that guides them toward the insight.
5. Your ENTIRE response must be ≤ 55 words.
6. Tone: calm, cryptic, ancient-sage-like. No exclamation marks.`;

    const userPrompt =
`Problem: "${title}"
Description: ${shortDesc}

Student's ${language} code:
${shortCode}

Failure reason: ${shortError}

Give your Socratic hint as The Sage.`;

    return [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
    ];
};

// ─────────────────────────────────────────────────────────────────────────────
// callSageAI
// Sends the messages to Groq and returns the hint string.
// Throws on hard network errors — caller should handle gracefully.
// ─────────────────────────────────────────────────────────────────────────────
export const callSageAI = async (messages) => {
    if (!process.env.GROQ_API_KEY) {
        // Graceful fallback so the feature degrades cleanly in dev/test
        console.warn('[SAGE] GROQ_API_KEY not set — returning fallback hint');
        return 'Consider what happens when your loop reaches the boundary of the input.';
    }

    const response = await axios.post(
        GROQ_URL,
        {
            model:       GROQ_MODEL,
            messages,
            max_tokens:  120,
            temperature: 0.35, // low temperature = focused, consistent hints
            stream:      false,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 18000,
        }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
        throw new Error('Groq returned an empty response');
    }

    return content;
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE FALLBACK HINTS
// Used when the AI call fails completely. Rotating hints prevent repetition.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_HINTS = [
    'What does your code do when the input contains only one element?',
    'Trace through your loop with the smallest possible valid input.',
    'Where in your logic do you handle the edge case of an empty result?',
    'Does your answer change if the same value appears more than once?',
    'Think about the difference between < and ≤ in your boundary condition.',
];

let fallbackIdx = 0;

export const getFallbackHint = () => {
    const hint = FALLBACK_HINTS[fallbackIdx % FALLBACK_HINTS.length];
    fallbackIdx++;
    return hint;
};