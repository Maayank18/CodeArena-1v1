// FILE: backend/scratch/test_solo_guard.js
import { calculateMatchOutcome } from '../utils/elo.js';

console.log('🚀 Running Unit Tests for ELO Math Utility & Solo Guard...\n');

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

// ----------------------------------------------------
// TEST CASE 1: Solo/Practice Match (p2 is undefined)
// ----------------------------------------------------
try {
    const p1 = { username: 'Maya', rating: 1200, score: 30, isCheater: false };
    const outcome = calculateMatchOutcome(p1, undefined);
    
    assert(outcome !== null, 'Outcome is not null');
    assert(outcome.p2 === null, 'Opponent outcome is explicitly null');
    assert(outcome.p1.newRating === 1205, 'Player 1 gets +5 ELO rating (+5 added to 1200)');
    assert(outcome.p1.pointsGained === 5, 'Player 1 gets 5 points gained');
    assert(outcome.p1.seasonScore === 40, 'Player 1 gets 10 base + 30 score = 40 season score');
    assert(outcome.p1.status === 'Winner (Solo)', 'Player 1 status is Winner (Solo)');
} catch (error) {
    assert(false, `Test Case 1 threw a crash: ${error.stack}`);
}

// ----------------------------------------------------
// TEST CASE 2: Solo/Practice Match (p2 is null)
// ----------------------------------------------------
try {
    const p1 = { username: 'Maya', rating: 1050, score: 0, isCheater: false };
    const outcome = calculateMatchOutcome(p1, null);
    
    assert(outcome !== null, 'Outcome is not null');
    assert(outcome.p2 === null, 'Opponent outcome is explicitly null');
    assert(outcome.p1.newRating === 1055, 'Player 1 gets +5 ELO rating (+5 added to 1050)');
    assert(outcome.p1.seasonScore === 10, 'Player 1 gets 10 base + 0 score = 10 season score');
} catch (error) {
    assert(false, `Test Case 2 threw a crash: ${error.stack}`);
}

// ----------------------------------------------------
// TEST CASE 3: Standard Multiplayer Match (Fair play)
// ----------------------------------------------------
try {
    const p1 = { username: 'Maya', rating: 1000, score: 20, isCheater: false };
    const p2 = { username: 'Alex', rating: 1000, score: 10, isCheater: false };
    const outcome = calculateMatchOutcome(p1, p2);
    
    assert(outcome !== null, 'Outcome is not null');
    assert(outcome.p2 !== null, 'Opponent outcome is present');
    assert(outcome.p1.status === 'Winner', 'Player 1 is the Winner (score 20 vs 10)');
    assert(outcome.p2.status === 'Loser', 'Player 2 is the Loser');
    assert(outcome.p1.newRating > 1000, 'Player 1 ELO increased');
    assert(outcome.p2.newRating < 1000, 'Player 2 ELO decreased');
} catch (error) {
    assert(false, `Test Case 3 threw a crash: ${error.stack}`);
}

// ----------------------------------------------------
// TEST CASE 4: Standard Multiplayer Match (Draw)
// ----------------------------------------------------
try {
    const p1 = { username: 'Maya', rating: 1000, score: 15, isCheater: false };
    const p2 = { username: 'Alex', rating: 1000, score: 15, isCheater: false };
    const outcome = calculateMatchOutcome(p1, p2);
    
    assert(outcome.p1.status === 'Draw', 'Player 1 status is Draw');
    assert(outcome.p2.status === 'Draw', 'Player 2 status is Draw');
    assert(outcome.p1.seasonScore === 15 + 15, 'Player 1 season score includes 15 draw base + 15 score');
} catch (error) {
    assert(false, `Test Case 4 threw a crash: ${error.stack}`);
}

// ----------------------------------------------------
// TEST CASE 5: Cheater Scenario
// ----------------------------------------------------
try {
    const p1 = { username: 'Maya', rating: 1000, score: 20, isCheater: true };
    const p2 = { username: 'Alex', rating: 1000, score: 10, isCheater: false };
    const outcome = calculateMatchOutcome(p1, p2);
    
    assert(outcome.p1.status === 'Disqualified', 'Cheating Player 1 is Disqualified');
    assert(outcome.p1.pointsGained === -50, 'Cheater gets -50 rating points penalty');
    assert(outcome.p2.status === 'Winner', 'Fair Player 2 is awarded Winner');
    assert(outcome.p2.newRating > 1000, 'Fair Player 2 ELO rating increased');
} catch (error) {
    assert(false, `Test Case 5 threw a crash: ${error.stack}`);
}

console.log(`\n📊 Test Suite Completed: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The utility is bulletproof.\n');
} else {
    console.error('❌ SOME TESTS FAILED. Review issues above.\n');
    process.exit(1);
}

// Version-2.0