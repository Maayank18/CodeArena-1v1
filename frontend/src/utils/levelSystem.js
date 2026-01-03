// // src/utils/levelSystem.js

// export const getLevelInfo = (rating) => {
//     // Default to 1200 if rating is missing
//     const currentRating = rating || 1000; 

//     if (currentRating < 1200) {
//         return { level: 1, title: "Novice", color: "text-gray-400", nextThreshold: 1200 };
//     }
//     if (currentRating < 1500) {
//         return { level: 2, title: "Apprentice", color: "text-green-500", nextThreshold: 1400 };
//     }
//     if (currentRating < 1800) {
//         return { level: 3, title: "Specialist", color: "text-cyan-500", nextThreshold: 1600 };
//     }
//     if (currentRating < 2100) {
//         return { level: 4, title: "Expert", color: "text-blue-500", nextThreshold: 1800 };
//     }
//     if (currentRating < 2500) {
//         return { level: 5, title: "Master", color: "text-purple-500", nextThreshold: 2000 };
//     }
//     if (currentRating > 2500) {
//         return { level: 6, title: "Grandmaster", color: "text-orange-500", nextThreshold: 2400 };
//     }
    
//     // 2400+
//     return { level: 7, title: "Legendary", color: "text-red-600 shadow-glow", nextThreshold: "MAX" }; 
// };


/**
 * Professional Level & Ranking System
 * Handles rank mapping and progress calculation for the Dashboard UI.
 */

export const getLevelInfo = (rating) => {
    const r = rating || 1000; // Standard fallback

    // Define Rank Brackets
    const thresholds = [
        { min: 0,    max: 1199, level: 1, title: "Novice",      color: "text-gray-400",   hex: "#9ca3af" },
        { min: 1200, max: 1499, level: 2, title: "Apprentice",  color: "text-green-500",  hex: "#22c55e" },
        { min: 1500, max: 1799, level: 3, title: "Specialist",  color: "text-cyan-500",   hex: "#06b6d4" },
        { min: 1800, max: 2099, level: 4, title: "Expert",      color: "text-blue-500",   hex: "#3b82f6" },
        { min: 2100, max: 2399, level: 5, title: "Master",      color: "text-purple-500", hex: "#a855f7" },
        { min: 2400, max: 2799, level: 6, title: "Grandmaster", color: "text-orange-500", hex: "#f97316" },
        { min: 2800, max: 9999, level: 7, title: "Legendary",   color: "text-red-500 shadow-glow", hex: "#ef4444" }
    ];

    // Find the current rank object
    const currentRank = thresholds.find(t => r >= t.min && r <= t.max) || thresholds[0];

    // Calculate Progress Percentage to next rank
    let progress = 0;
    if (currentRank.level < 7) {
        const range = currentRank.max - currentRank.min;
        const earned = r - currentRank.min;
        progress = Math.min(100, Math.max(0, Math.floor((earned / range) * 100)));
    } else {
        progress = 100; // Max level reached
    }

    return {
        ...currentRank,
        currentRating: r,
        nextThreshold: currentRank.level < 7 ? currentRank.max + 1 : "MAX",
        progressPercentage: progress
    };
};