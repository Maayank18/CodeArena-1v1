import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const usage = `
Usage:
  node sanitizeAuthUsers.js audit
  node sanitizeAuthUsers.js delete <email> --confirm-delete
`;

const isUsablePasswordHash = (value) => (
    typeof value === 'string' && BCRYPT_HASH_REGEX.test(value.trim())
);

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const getPasswordIssue = (password) => {
    if (password === undefined) {
        return 'missing password field';
    }

    if (password === null) {
        return 'password is null';
    }

    if (typeof password !== 'string') {
        return `password has unexpected type: ${typeof password}`;
    }

    if (!password.trim()) {
        return 'password is an empty string';
    }

    if (!isUsablePasswordHash(password)) {
        return 'password is not a valid bcrypt hash';
    }

    return null;
};

const auditUsers = async () => {
    const users = await User.collection.find(
        {},
        { projection: { email: 1, username: 1, password: 1, createdAt: 1 } }
    ).toArray();

    const corruptedUsers = users
        .map((user) => ({
            _id: user._id,
            email: user.email || '(no email)',
            username: user.username || '(no username)',
            createdAt: user.createdAt || null,
            issue: getPasswordIssue(user.password),
        }))
        .filter((user) => user.issue);

    if (corruptedUsers.length === 0) {
        console.log('No corrupted auth users found. Every user has a bcrypt password hash.');
        return;
    }

    console.log(`Found ${corruptedUsers.length} corrupted auth user(s):`);

    for (const user of corruptedUsers) {
        console.log(`- ${user.email} (${user.username}) [${user._id}] -> ${user.issue}`);
    }

    console.log('\nNext step: delete the bad record and re-register through /api/auth/register, or reset the password with the standard flow.');
};

const deleteUser = async (email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        throw new Error('Email is required for delete mode.');
    }

    const user = await User.collection.findOne(
        { email: normalizedEmail },
        { projection: { _id: 1, email: 1, username: 1, password: 1 } }
    );

    if (!user) {
        throw new Error(`User not found for email: ${normalizedEmail}`);
    }

    const issue = getPasswordIssue(user.password);
    if (!issue) {
        console.warn(`Warning: ${normalizedEmail} has a valid bcrypt password hash. Deleting anyway because delete mode was explicitly requested.`);
    } else {
        console.log(`Deleting corrupted user ${normalizedEmail}: ${issue}`);
    }

    const result = await User.collection.deleteOne({ _id: user._id });

    if (result.deletedCount !== 1) {
        throw new Error(`Delete failed for user: ${normalizedEmail}`);
    }

    console.log(`Deleted user ${normalizedEmail} (${user.username}) [${user._id}]`);
    console.log('Re-register this account through the normal register endpoint so the password is hashed by the model hook.');
};

const run = async () => {
    const [, , command, value, confirmFlag] = process.argv;

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing from environment variables.');
    }

    if (!command || !['audit', 'delete'].includes(command)) {
        console.log(usage.trim());
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(process.env.MONGO_URI);

    if (command === 'audit') {
        await auditUsers();
        return;
    }

    if (confirmFlag !== '--confirm-delete') {
        throw new Error('Delete mode requires --confirm-delete to avoid accidental removal.');
    }

    await deleteUser(value);
};

run()
    .catch((error) => {
        console.error('[SANITIZE AUTH USERS] Failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });
