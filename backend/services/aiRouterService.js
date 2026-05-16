import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Singletons securely
// Fallback to GROQ_API_KEY if specific ones are missing
const clients = {
  chat: new Groq({ apiKey: process.env.GROQ_API_KEY_CHAT || process.env.GROQ_API_KEY }),
  tier1: new Groq({ apiKey: process.env.GROQ_API_KEY_PLUS || process.env.GROQ_API_KEY }),
  tier2: new Groq({ apiKey: process.env.GROQ_API_KEY_PRO || process.env.GROQ_API_KEY }),
  tier3: new Groq({ apiKey: process.env.GROQ_API_KEY_PREMIUM || process.env.GROQ_API_KEY })
};

/**
 * Enterprise AI Router
 * Routes requests to the appropriate Groq client based on user RBAC tier.
 * 
 * @param {number} userTier - 0: free, 1: plus, 2: pro, 3+: premium
 * @param {string} featureType - 'chatbot' or 'ai-help'
 * @returns {Groq} - Cached Groq client instance
 */
export const getGroqClient = (userTier, featureType) => {
  if (featureType === 'chatbot') return clients.chat;
  
  if (userTier >= 3) return clients.tier3;
  if (userTier === 2) return clients.tier2;
  if (userTier === 1) return clients.tier1;
  
  return clients.chat; // Safe fallback
};
