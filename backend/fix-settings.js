const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Mayank Garg/OneDrive/Desktop/Projects/CodeArena 1v1/backend/controllers/settingsController.js');
let content = fs.readFileSync(filePath, 'utf-8');

const targetStr = `    if (commaIndex === -1) {
        return false;
    }

    if (!USERNAME_REGEX.test(username)) {
        return 'Username must be 3-20 characters and use only letters, numbers, or underscores';
    }

    return null;
};`.replace(/\r\n/g, '\n');

const replacementStr = `    if (commaIndex === -1) {
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

const normalizedContent = content.replace(/\r\n/g, '\n');
if (normalizedContent.includes(targetStr)) {
    const newContent = normalizedContent.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Successfully replaced content in settingsController.js');
} else {
    console.error('Target string not found in settingsController.js');
}
