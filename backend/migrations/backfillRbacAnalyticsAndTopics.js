import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Room from '../models/Room.js';

dotenv.config();

const sanitizeTopics = (topics) => {
    if (!Array.isArray(topics)) {
        return [];
    }

    return [...new Set(
        topics
            .filter((topic) => typeof topic === 'string')
            .map((topic) => topic.trim().toLowerCase())
            .filter(Boolean)
    )];
};

const run = async () => {
    await connectDB();

    let usersUpdated = 0;
    let problemsUpdated = 0;
    let roomsUpdated = 0;

    const users = await User.find().select(
        'customMatchesPlayedToday lastCustomMatchDate totalTimeSpent totalSolved badges'
    );

    for (const user of users) {
        let changed = false;

        if (typeof user.customMatchesPlayedToday !== 'number') {
            user.customMatchesPlayedToday = 0;
            changed = true;
        }
        if (user.lastCustomMatchDate === undefined) {
            user.lastCustomMatchDate = null;
            changed = true;
        }
        if (typeof user.totalTimeSpent !== 'number') {
            user.totalTimeSpent = 0;
            changed = true;
        }
        if (typeof user.totalSolved !== 'number') {
            user.totalSolved = 0;
            changed = true;
        }
        if (!Array.isArray(user.badges)) {
            user.badges = [];
            changed = true;
        }

        if (changed) {
            await user.save();
            usersUpdated++;
        }
    }

    const problems = await Problem.find().select('topics');
    for (const problem of problems) {
        const normalizedTopics = sanitizeTopics(problem.topics);
        const currentTopics = Array.isArray(problem.topics) ? problem.topics : [];

        if (JSON.stringify(normalizedTopics) !== JSON.stringify(currentTopics)) {
            problem.topics = normalizedTopics;
            await problem.save();
            problemsUpdated++;
        }
    }

    const rooms = await Room.find().select(
        'isCustom customSettings activatedAt quotaChargedAt'
    );
    for (const room of rooms) {
        let changed = false;

        if (typeof room.isCustom !== 'boolean') {
            room.isCustom = false;
            changed = true;
        }

        const currentSettings = room.customSettings || {};
        const normalizedTopics = sanitizeTopics(currentSettings.topics);
        const nextSettings = {
            timeLimit: Number(currentSettings.timeLimit) > 0 ? Number(currentSettings.timeLimit) : 1800,
            numQuestions: Number(currentSettings.numQuestions) > 0 ? Number(currentSettings.numQuestions) : 3,
            topics: normalizedTopics,
            createdBy: currentSettings.createdBy || null,
        };

        if (JSON.stringify(currentSettings.topics || []) !== JSON.stringify(normalizedTopics)) {
            changed = true;
        }
        if ((room.customSettings?.timeLimit ?? 1800) !== nextSettings.timeLimit) {
            changed = true;
        }
        if ((room.customSettings?.numQuestions ?? 3) !== nextSettings.numQuestions) {
            changed = true;
        }

        if (!room.customSettings) {
            changed = true;
        }

        if (room.activatedAt === undefined) {
            room.activatedAt = null;
            changed = true;
        }

        if (room.quotaChargedAt === undefined) {
            room.quotaChargedAt = null;
            changed = true;
        }

        room.customSettings = nextSettings;

        if (changed) {
            await room.save();
            roomsUpdated++;
        }
    }

    console.log('[RBAC BACKFILL] Complete', {
        usersUpdated,
        problemsUpdated,
        roomsUpdated,
    });
};

run()
    .catch((error) => {
        console.error('[RBAC BACKFILL] Failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });
