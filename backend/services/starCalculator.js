// backend/services/starCalculator.js
// Pure function — no DB calls, fully testable

export const calculateStars = (attempts) => {
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    if (attempts === 3) return 1;
    return 0;
};

export const calculateKP = (stars) => {
    if (stars === 3) return 15;
    if (stars === 2) return 7;
    if (stars === 1) return 3;
    return -5;
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

// Version-2.0