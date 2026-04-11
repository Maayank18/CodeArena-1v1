const K_FACTOR = 32;          // How fast ratings change
const CHEATER_PENALTY = 50;   // Immediate Elo drop for cheaters
const EFFORT_MULTIPLIER = 5; // Elo points awarded per 10 in-game points

/**
 * @param {Object} p1 - { username, rating, score, isCheater }
 * @param {Object} p2 - { username, rating, score, isCheater }
 */
export const calculateMatchOutcome = (p1, p2) => {
    const p1Rating = p1.rating || 1000;
    const p2Rating = p2.rating || 1000;

    // 1. Calculate Expected Scores (Probability)
    const expectedP1 = 1 / (1 + Math.pow(10, (p2Rating - p1Rating) / 400));
    const expectedP2 = 1 / (1 + Math.pow(10, (p1Rating - p2Rating) / 400));

    // 2. Scenario: BOTH ARE CHEATERS
    if (p1.isCheater && p2.isCheater) {
        return {
            p1: { newRating: Math.max(0, p1Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" },
            p2: { newRating: Math.max(0, p2Rating - CHEATER_PENALTY), pointsGained: -CHEATER_PENALTY, seasonScore: 0, status: "Disqualified" }
        };
    }

    // 3. Scenario: ONE CHEATER
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

    // 4. Scenario: FAIR PLAY (Dynamic Scoring)
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

        // ✅ INSERT THIS HELPER FUNCTION
        // updated part 
    const getBasePoints = (result) => {
        if (result === 1) return 25;   // Win
        if (result === 0.5) return 15; // Draw (Better than loss!)
        return 5;                      // Loss
    };

    // ✅ FIX: Added 'status' property to the return objects
    // return {
    //     p1: { 
    //         newRating: Math.max(0, p1Rating + finalP1Delta), 
    //         pointsGained: finalP1Delta, 
    //         seasonScore: (p1Actual === 1 ? 25 : 5) + p1.score,
    //         status: p1Status 
    //     },
    //     p2: { 
    //         newRating: Math.max(0, p2Rating + finalP2Delta), 
    //         pointsGained: finalP2Delta, 
    //         seasonScore: (p1Actual === 0 ? 25 : 5) + p2.score,
    //         status: p2Status
    //     }
    // };
    // ✅ UPDATE THE RETURN OBJECT
    // updated part
    return {
        p1: { 
            newRating: Math.max(0, p1Rating + finalP1Delta), 
            pointsGained: finalP1Delta, 
            
            // 🔴 OLD LINE: seasonScore: (p1Actual === 1 ? 25 : 5) + p1.score,
            // 🟢 NEW LINE:
            seasonScore: getBasePoints(p1Actual) + p1.score,
            
            status: p1Status 
        },
        p2: { 
            newRating: Math.max(0, p2Rating + finalP2Delta), 
            pointsGained: finalP2Delta, 
            
            // 🔴 OLD LINE: seasonScore: (p1Actual === 0 ? 25 : 5) + p2.score,
            // 🟢 NEW LINE:
            seasonScore: getBasePoints(1 - p1Actual) + p2.score,
            
            status: p2Status
        }
    };
};
// V 1.5
