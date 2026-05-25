const fs = require('fs');
const path = require('path');

// 1. Fix settingsController.js
const settingsPath = path.resolve('c:/Users/Mayank Garg/OneDrive/Desktop/Projects/CodeArena 1v1/backend/controllers/settingsController.js');
let settingsContent = fs.readFileSync(settingsPath, 'utf-8');

const settingsTargetStr = `    if (commaIndex === -1) {
        return false;
    }

    if (!USERNAME_REGEX.test(username)) {
        return 'Username must be 3-20 characters and use only letters, numbers, or underscores';
    }

    return null;
};`.replace(/\r\n/g, '\n');

const settingsReplacementStr = `    if (commaIndex === -1) {
        return false;
    }

    const base64Payload = value.slice(commaIndex + 1);
    const payloadSize = Buffer.byteLength(base64Payload, 'base64');
    return payloadSize > 0 && payloadSize <= MAX_AVATAR_SIZE_BYTES;
};

const buildSettingsPayload = async (user) => {
    const payload = {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio || '',
        preferences: {
            emailNotifications: Boolean(user.preferences?.emailNotifications),
            marketingUpdates: Boolean(user.preferences?.marketingUpdates),
        },
        rating: user.rating,
        seasonScore: user.seasonScore,
        stats: user.stats || { wins: 0, losses: 0, matchesPlayed: 0 },
        usageStats: user.usageStats || {
            chatQueriesToday: 0,
            matchesToday: 0,
            customMatchesToday: 0,
            visualizationsToday: 0,
            visualizerTrialUsed: false,
            aiHelpToday: 0,
            lastResetDate: null,
        },
        subscriptionPlan: user.subscriptionPlan || 'free',
        badges: user.badges || [],
        customization: user.customization || { avatarFrame: 'none', tagline: 'Novice', signatureStack: [], entranceBanner: 'default-dark', advancedTheme: '' },
        emailVerified: Boolean(user.emailVerified),
        emailVerifiedAt: user.emailVerifiedAt || null,
    };

    const rank = await User.countDocuments({
        $or: [
            { seasonScore: { $gt: user.seasonScore || 0 } },
            { seasonScore: user.seasonScore || 0, rating: { $gt: user.rating || 1000 } }
        ]
    }) + 1;
    
    payload.stats.rank = rank;
    return payload;
};

const validateUsername = (username) => {
    if (!username) {
        return 'Username is required';
    }

    if (!USERNAME_REGEX.test(username)) {
        return 'Username must be 3-20 characters and use only letters, numbers, or underscores';
    }

    return null;
};`.replace(/\r\n/g, '\n');

let normalizedSettings = settingsContent.replace(/\r\n/g, '\n');
if (normalizedSettings.includes(settingsTargetStr)) {
    normalizedSettings = normalizedSettings.replace(settingsTargetStr, settingsReplacementStr);
    fs.writeFileSync(settingsPath, normalizedSettings, 'utf-8');
    console.log('Successfully fixed settingsController.js');
} else {
    console.log('Target string not found in settingsController.js. Might be already fixed or mangled differently.');
}

// 2. Fix userController.js
const userPath = path.resolve('c:/Users/Mayank Garg/OneDrive/Desktop/Projects/CodeArena 1v1/backend/controllers/userController.js');
let userContent = fs.readFileSync(userPath, 'utf-8');

const userTargetStr = `        if (!user) {
            user = await User.findOne({
                username: { $regex: new RegExp(\`^\${escapeRegex(username)}\$\`, 'i') }
            })
                .select(selectFields)
                .lean();
        }
    }
};`.replace(/\r\n/g, '\n');

const userReplacementStr = `        if (!user) {
            user = await User.findOne({
                username: { $regex: new RegExp(\`^\${escapeRegex(username)}\$\`, 'i') }
            })
                .select(selectFields)
                .lean();
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ SAFETY: Ensure stats exists
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
        user.subscriptionPlan = user.subscriptionPlan || 'free';

        res.json(user);
    } catch (error) {
        console.error("❌ [PROFILE] Sync error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};`.replace(/\r\n/g, '\n');

let normalizedUser = userContent.replace(/\r\n/g, '\n');
if (normalizedUser.includes(userTargetStr)) {
    normalizedUser = normalizedUser.replace(userTargetStr, userReplacementStr);
    fs.writeFileSync(userPath, normalizedUser, 'utf-8');
    console.log('Successfully fixed userController.js');
} else {
    console.log('Target string not found in userController.js. Might be already fixed or mangled differently.');
}
