// backend/services/starCalculator.js
// Pure function — no DB calls, fully testable

export const calculateStars = (executionTimeMs, thresholds) => {
    const { twoStarTimeMs, threeStarTimeMs } = thresholds;

    if (executionTimeMs <= threeStarTimeMs) return 3;
    if (executionTimeMs <= twoStarTimeMs)   return 2;
    return 1;
};

export const calculateKP = (stars, rewards) => {
    if (stars === 3) return rewards.threeStarKP;
    if (stars === 2) return rewards.twoStarKP;
    return rewards.oneStarKP;
};

// Called when a node is re-attempted (user already has stars)
// Only updates if improvement
export const shouldUpdateNode = (newStars, newTimeMs, existingNode) => {
    if (!existingNode) return true;
    if (newStars > existingNode.starsAwarded) return true;
    if (newStars === existingNode.starsAwarded && newTimeMs < existingNode.bestTimeMs) return true;
    return false;
};
// V 1.5
