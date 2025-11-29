/**
 * Calculates the new ELO ratings for two players after a match.
 * * @param {number} winnerRating - Current rating of the winner (e.g., 1200)
 * @param {number} loserRating - Current rating of the loser (e.g., 1350)
 * @param {number} kFactor - The volatility factor (default 32). 
 * - Higher K (32) = Ratings change fast (Good for new players/ladders)
 * - Lower K (10-20) = Ratings are more stable (Good for Grandmasters)
 * * @returns {object} Object containing new ratings and the points exchanged.
 */
export const calculateElo = (winnerRating, loserRating, kFactor = 32) => {
    // 1. Calculate the Expected Score (Probability of winning)
    // Formula: 1 / (1 + 10 ^ ((OpponentRating - MyRating) / 400))
    // Example: If ratings are equal, probability is 0.5 (50%)
    const expectedScoreWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedScoreLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // 2. Define Actual Scores
    const actualScoreWinner = 1; // Winner gets 1 point
    const actualScoreLoser = 0;  // Loser gets 0 points

    // 3. Calculate New Ratings
    // Formula: NewRating = OldRating + K * (ActualScore - ExpectedScore)
    const newWinnerRating = Math.round(winnerRating + kFactor * (actualScoreWinner - expectedScoreWinner));
    const newLoserRating = Math.round(loserRating + kFactor * (actualScoreLoser - expectedScoreLoser));

    // 4. Calculate the Points Exchanged (Delta)
    // This value is useful to send to the frontend (e.g., "You gained +24 points!")
    const pointsExchanged = newWinnerRating - winnerRating;

    return {
        // Ensure ratings never drop below 0
        newWinnerRating: Math.max(0, newWinnerRating), 
        newLoserRating: Math.max(0, newLoserRating),
        pointsExchanged
    };
};