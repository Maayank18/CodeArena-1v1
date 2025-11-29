// src/utils/levelSystem.js

export const getLevelInfo = (rating) => {
    // Default to 1200 if rating is missing
    const currentRating = rating || 1000; 

    if (currentRating < 1200) {
        return { level: 1, title: "Novice", color: "text-gray-400", nextThreshold: 1200 };
    }
    if (currentRating < 1500) {
        return { level: 2, title: "Apprentice", color: "text-green-500", nextThreshold: 1400 };
    }
    if (currentRating < 1800) {
        return { level: 3, title: "Specialist", color: "text-cyan-500", nextThreshold: 1600 };
    }
    if (currentRating < 2100) {
        return { level: 4, title: "Expert", color: "text-blue-500", nextThreshold: 1800 };
    }
    if (currentRating < 2500) {
        return { level: 5, title: "Master", color: "text-purple-500", nextThreshold: 2000 };
    }
    if (currentRating > 2500) {
        return { level: 6, title: "Grandmaster", color: "text-orange-500", nextThreshold: 2400 };
    }
    
    // 2400+
    return { level: 7, title: "Legendary", color: "text-red-600 shadow-glow", nextThreshold: "MAX" }; 
};