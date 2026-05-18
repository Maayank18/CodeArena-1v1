const K_FACTOR = 32;          // How fast ratings change
const CHEATER_PENALTY = 50;   // Immediate Elo drop for cheaters
const EFFORT_MULTIPLIER = 5;  // Elo points awarded per 10 in-game points

/**
 * Helper to calculate base points earned in the season based on result.
 * @param {number} result - 1 for Win, 0.5 for Draw, 0 for Loss
 * @returns {number} base points
 */
const getBasePoints = (result) => {
    if (result === 1) return 25;   // Win
    if (result === 0.5) return 15; // Draw (Better than loss!)
    return 5;                      // Loss
};

/**
 * Calculates match outcomes for ELO ratings, point gains, and game status.
 * Safe for both 1v1 multiplayer and solo/practice matches.
 * 
 * @param {Object} p1 - { username, rating, score, isCheater }
 * @param {Object} p2 - { username, rating, score, isCheater } | null | undefined
 */
export const calculateMatchOutcome = (p1, p2) => {
    // 🛑 1. SOLO GUARD: Prevent crashes if p2 is undefined/null (Practice Match)
    if (!p2) {
        return {
            p1: { 
                newRating: Math.max(0, (p1.rating || 1000) + 5), // +5 ELO for solo practice
                pointsGained: 5, 
                seasonScore: 10 + (p1.score || 0), // Base 10 + effort
                status: "Winner (Solo)" 
            },
            p2: null // Explicitly return null so the DB knows there is no second player
        };
    }

    // 🎮 2. MULTIPLAYER LOGIC (Safe to run because p2 exists)
    const p1Rating = p1.rating || 1000;
    const p2Rating = p2.rating || 1000;

    // Calculate Expected Scores (Probability)
    const expectedP1 = 1 / (1 + Math.pow(10, (p2Rating - p1Rating) / 400));
    const expectedP2 = 1 / (1 + Math.pow(10, (p1Rating - p2Rating) / 400));

    // Scenario: BOTH ARE CHEATERS
    if (p1.isCheater && p2.isCheater) {
        return {
            p1: { newRating: Math.max(0, p1Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" },
            p2: { newRating: Math.max(0, p2Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" }
        };
    }

    // Scenario: ONE CHEATER
    if (p1.isCheater || p2.isCheater) {
        const fair = p1.isCheater ? p2 : p1;
        
        // Fair player gets a "Win" based on their effort
        const fairEloGain = Math.round(K_FACTOR * (1 - (p1.isCheater ? expectedP2 : expectedP1))) + Math.floor(fair.score * 0.5);
        
        return {
            p1: p1.isCheater 
                ? { newRating: Math.max(0, p1Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" }
                : { newRating: p1Rating + fairEloGain, pointsGained: fairEloGain, seasonScore: 20 + p1.score, status: "Winner" },
            p2: p2.isCheater 
                ? { newRating: Math.max(0, p2Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" }
                : { newRating: p2Rating + fairEloGain, pointsGained: fairEloGain, seasonScore: 20 + p2.score, status: "Winner" }
        };
    }

    // Scenario: FAIR PLAY (Dynamic Scoring)
    let p1Actual = 0.5; // Draw
    let p1Status = "Draw";
    let p2Status = "Draw";

    if (p1.score > p2.score) {
        p1Actual = 1;
        p1Status = "Winner";
        p2Status = "Loser";
    } else if (p2.score > p1.score) {
        p1Actual = 0;
        p1Status = "Loser";
        p2Status = "Winner";
    }

    // Base Elo calculation
    let p1Delta = Math.round(K_FACTOR * (p1Actual - expectedP1));
    let p2Delta = Math.round(K_FACTOR * ((1 - p1Actual) - expectedP2));

    // EFFORT BONUS
    const p1EffortBonus = Math.floor((p1.score / 10) * EFFORT_MULTIPLIER);
    const p2EffortBonus = Math.floor((p2.score / 10) * EFFORT_MULTIPLIER);

    const finalP1Delta = p1Delta + p1EffortBonus;
    const finalP2Delta = p2Delta + p2EffortBonus;

    return {
        p1: { 
            newRating: Math.max(0, p1Rating + finalP1Delta), 
            pointsGained: finalP1Delta, 
            seasonScore: getBasePoints(p1Actual) + p1.score,
            status: p1Status 
        },
        p2: { 
            newRating: Math.max(0, p2Rating + finalP2Delta), 
            pointsGained: finalP2Delta, 
            seasonScore: getBasePoints(1 - p1Actual) + p2.score,
            status: p2Status
        }
    };
};
