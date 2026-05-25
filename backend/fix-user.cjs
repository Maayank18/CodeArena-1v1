const fs = require('fs');
const path = require('path');

const userPath = path.resolve('c:/Users/Mayank Garg/OneDrive/Desktop/Projects/CodeArena 1v1/backend/controllers/userController.js');
let userContent = fs.readFileSync(userPath, 'utf-8');

const userTargetStr = `        // ✅ SAFETY: Ensure stats exists
        user.stats = user.stats || { matchesPlayed: 0, wins: 0, losses: 0 };
        
        // Ensure RBAC fields exist
        user.role = user.role || 'user';
        user.subscriptionPlan = user.subscriptionPlan || 'free';`.replace(/\r\n/g, '\n');

const userReplacementStr = `        // ✅ SAFETY: Ensure stats exists
        user.stats = user.stats || { matchesPlayed: 0, wins: 0, losses: 0 };
        
        const rank = await User.countDocuments({
            $or: [
                { seasonScore: { $gt: user.seasonScore || 0 } },
                { seasonScore: user.seasonScore || 0, rating: { $gt: user.rating || 1000 } }
            ]
        }) + 1;
        user.stats.rank = rank;
        
        // Ensure RBAC fields exist
        user.role = user.role || 'user';
        user.subscriptionPlan = user.subscriptionPlan || 'free';`.replace(/\r\n/g, '\n');

let normalizedUser = userContent.replace(/\r\n/g, '\n');
if (normalizedUser.includes(userTargetStr)) {
    normalizedUser = normalizedUser.replace(userTargetStr, userReplacementStr);
    fs.writeFileSync(userPath, normalizedUser, 'utf-8');
    console.log('Successfully fixed userController.js');
} else {
    console.log('Target string not found in userController.js.');
}
