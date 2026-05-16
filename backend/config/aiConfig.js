/**
 * Centralized AI Configuration for CodeArena 1v1
 * Defines limits and routing logic for enterprise-grade AI assistance.
 */

export const AI_DAILY_LIMITS = {
    'free': 1,
    'plus': 3,
    'pro': 6,
    'premium': 15
};

export const AI_TIER_MAP = {
    'free': 0,
    'plus': 1,
    'pro': 2,
    'premium': 3
};

export const AI_RESPONSE_MESSAGES = {
    LIMIT_REACHED: "Daily AI assist limit reached. Upgrade your plan for more AI help.",
    RATE_LIMIT_ERROR: "Cody AI is currently analyzing too many requests. Please try again in a moment.",
    UNAVAILABLE: "Cody AI is currently resting. Please try again later."
};
