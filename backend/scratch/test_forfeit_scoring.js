// FILE: backend/scratch/test_forfeit_scoring.js

const DEFAULT_PLAYER_RATING = 1000;
const FORFEIT_ELO_K = 32;

const calculateExpectedScore = (playerRating, opponentRating) =>
    1 / (1 + Math.pow(10, ((opponentRating || DEFAULT_PLAYER_RATING) - (playerRating || DEFAULT_PLAYER_RATING)) / 400));

// Copy of the function from server.js for testing ELO math and points allocation
const buildForfeitOutcome = (p1Data, p2Data, winnerUsername, matchDurationSeconds = 60) => {
    const p1Rating = p1Data?.rating || 1000;
    const p2Rating = p2Data?.rating || 1000;
    const expectedP1 = calculateExpectedScore(p1Rating, p2Rating);
    const expectedP2 = calculateExpectedScore(p2Rating, p1Rating);
    const p1IsWinner = p1Data?.username === winnerUsername;
    const p1Actual = p1IsWinner ? 1 : 0;
    const p2Actual = 1 - p1Actual;

    const p1IsCheater = Boolean(p1Data?.isCheater);
    const p2IsCheater = Boolean(p2Data?.isCheater);

    // Scenario A: BOTH ARE CHEATERS
    if (p1IsCheater && p2IsCheater) {
        return {
            p1: { newRating: Math.max(0, p1Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" },
            p2: { newRating: Math.max(0, p2Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
        };
    }

    // Scenario B: ONE IS CHEATER
    if (p1IsCheater || p2IsCheater) {
        const fairRating = p1IsCheater ? p2Rating : p1Rating;
        const cheaterRating = p1IsCheater ? p1Rating : p2Rating;
        const bounty = 40 + Math.min(20, Math.max(0, Math.round(cheaterRating / 100)));
        const ratingGain = 15 + Math.min(15, Math.max(0, Math.round((cheaterRating - fairRating) / 20)));

        return {
            p1: p1IsCheater
                ? { newRating: Math.max(0, p1Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
                : { newRating: p1Rating + ratingGain, pointsGained: ratingGain, seasonScore: bounty, status: "Winner" },
            p2: p2IsCheater
                ? { newRating: Math.max(0, p2Rating - 50), pointsGained: -50, seasonScore: -25, status: "Disqualified" }
                : { newRating: p2Rating + ratingGain, pointsGained: ratingGain, seasonScore: bounty, status: "Winner" }
        };
    }

    // Scenario C: STANDARD FORFEIT / DISCONNECT
    let p1Delta = Math.round(FORFEIT_ELO_K * (p1Actual - expectedP1));
    let p2Delta = Math.round(FORFEIT_ELO_K * (p2Actual - expectedP2));

    // Lobby Dodge check: if left in under 20 seconds
    const isLobbyDodge = matchDurationSeconds < 20;

    // Check if the winner made any submission attempts
    const p1Attempted = Boolean(p1Data?.hasSubmitted);
    const p2Attempted = Boolean(p2Data?.hasSubmitted);
    const winnerAttempted = p1IsWinner ? p1Attempted : p2Attempted;

    // Scale down points and ELO gain if the winner did not even try to attempt the question
    let winnerPoints = isLobbyDodge ? 25 : 30;
    if (!winnerAttempted) {
        winnerPoints = isLobbyDodge ? 5 : 10;
    }

    let p1SeasonPoints = 0;
    let p2SeasonPoints = 0;

    if (p1IsWinner) {
        p1SeasonPoints = winnerPoints;
        p2SeasonPoints = isLobbyDodge ? -10 : 5; // -10 for dodge, +5 for benefit of doubt

        if (!p1Attempted) {
            // Winner p1 did not attempt: scale down their ELO gain by 50%
            p1Delta = Math.round(p1Delta * 0.5);
        }

        if (isLobbyDodge) {
            p2Delta = Math.min(p2Delta, -15); // Stiffer Elo drop for dodging
        }
    } else {
        p2SeasonPoints = winnerPoints;
        p1SeasonPoints = isLobbyDodge ? -10 : 5;

        if (!p2Attempted) {
            // Winner p2 did not attempt: scale down their ELO gain by 50%
            p2Delta = Math.round(p2Delta * 0.5);
        }

        if (isLobbyDodge) {
            p1Delta = Math.min(p1Delta, -15);
        }
    }

    return {
        p1: {
            newRating: Math.max(0, p1Rating + p1Delta),
            pointsGained: p1Delta,
            seasonScore: p1SeasonPoints,
            status: p1IsWinner ? 'Winner' : 'Loser',
        },
        p2: {
            newRating: Math.max(0, p2Rating + p2Delta),
            pointsGained: p2Delta,
            seasonScore: p2SeasonPoints,
            status: p1IsWinner ? 'Loser' : 'Winner',
        }
    };
};

console.log('🚀 Running Unit Tests for Forfeit Scoring & Elo Scaling...');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message}`);
    }
}

// TEST CASE 1: Standard Forfeit, Winner ATTEMPTED, Normal duration (>= 20s)
try {
    const p1 = { username: 'Maya', rating: 1000, hasSubmitted: true, isCheater: false };
    const p2 = { username: 'tester', rating: 1000, hasSubmitted: false, isCheater: false };
    
    const outcome = buildForfeitOutcome(p1, p2, 'Maya', 60);
    
    assert(outcome.p1.seasonScore === 30, 'Winner who attempted gets +30 season points');
    assert(outcome.p1.pointsGained === 16, 'Winner who attempted gets full Elo gain (+16)');
    assert(outcome.p2.seasonScore === 5, 'Loser gets standard +5 points');
    assert(outcome.p2.pointsGained === -16, 'Loser loses full Elo (-16)');
} catch (error) {
    assert(false, `Test Case 1 failed: ${error.stack}`);
}

// TEST CASE 2: Standard Forfeit, Winner DID NOT ATTEMPT, Normal duration (>= 20s)
try {
    const p1 = { username: 'Maya', rating: 1000, hasSubmitted: false, isCheater: false };
    const p2 = { username: 'tester', rating: 1000, hasSubmitted: false, isCheater: false };
    
    const outcome = buildForfeitOutcome(p1, p2, 'Maya', 60);
    
    assert(outcome.p1.seasonScore === 10, 'Winner who did not attempt gets reduced +10 season points');
    assert(outcome.p1.pointsGained === 8, 'Winner who did not attempt gets scaled down Elo gain (16 * 0.5 = 8)');
    assert(outcome.p2.seasonScore === 5, 'Loser still gets standard +5 points');
    assert(outcome.p2.pointsGained === -16, 'Loser still loses full Elo (-16)');
} catch (error) {
    assert(false, `Test Case 2 failed: ${error.stack}`);
}

// TEST CASE 3: Lobby Dodge, Winner ATTEMPTED, short duration (< 20s)
try {
    const p1 = { username: 'Maya', rating: 1000, hasSubmitted: true, isCheater: false };
    const p2 = { username: 'tester', rating: 1000, hasSubmitted: false, isCheater: false };
    
    const outcome = buildForfeitOutcome(p1, p2, 'Maya', 10);
    
    assert(outcome.p1.seasonScore === 25, 'Winner gets lobby dodge base win points (25)');
    assert(outcome.p1.pointsGained === 16, 'Winner gets full ELO gain (+16)');
    assert(outcome.p2.seasonScore === -10, 'Loser is penalized -10 season points for dodging');
    assert(outcome.p2.pointsGained <= -15, `Loser is penalized stiffer Elo drop for dodging (${outcome.p2.pointsGained})`);
} catch (error) {
    assert(false, `Test Case 3 failed: ${error.stack}`);
}

// TEST CASE 4: Lobby Dodge, Winner DID NOT ATTEMPT, short duration (< 20s)
try {
    const p1 = { username: 'Maya', rating: 1000, hasSubmitted: false, isCheater: false };
    const p2 = { username: 'tester', rating: 1000, hasSubmitted: false, isCheater: false };
    
    const outcome = buildForfeitOutcome(p1, p2, 'Maya', 10);
    
    assert(outcome.p1.seasonScore === 5, 'Winner who did not attempt gets reduced +5 season points (lobby dodge)');
    assert(outcome.p1.pointsGained === 8, 'Winner gets scaled down Elo gain (16 * 0.5 = 8)');
    assert(outcome.p2.seasonScore === -10, 'Loser still penalized -10 season points for dodging');
    assert(outcome.p2.pointsGained <= -15, 'Loser still gets stiffer Elo drop for dodging');
} catch (error) {
    assert(false, `Test Case 4 failed: ${error.stack}`);
}

console.log(`\n📊 Test Suite Completed: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
    console.log('🎉 ALL FORFEIT SCORING TESTS PASSED!');
} else {
    console.error('❌ SOME TESTS FAILED. Review issues above.');
    process.exit(1);
}
