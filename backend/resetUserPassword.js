import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { validatePasswordStrength } from './utils/authSecurity.js';

dotenv.config();

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
    console.error('Usage: node resetUserPassword.js <email> <newPassword>');
    process.exit(1);
}

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const email = emailArg.trim().toLowerCase();
    const user = await User.findOne({ email }).select('_id email username').lean();

    if (!user) {
        throw new Error(`User not found for email: ${email}`);
    }

    const passwordValidationError = validatePasswordStrength(passwordArg);
    if (passwordValidationError) {
        throw new Error(passwordValidationError);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordArg, salt);

    await User.collection.updateOne(
        { _id: user._id },
        {
            $set: {
                password: passwordHash,
                passwordChangedAt: new Date(),
                failedLoginAttempts: 0,
                lockUntil: null,
            }
        }
    );

    const verifiedUser = await User.collection.findOne(
        { _id: user._id },
        { projection: { email: 1, username: 1, password: 1 } }
    );

    if (typeof verifiedUser?.password !== 'string' || verifiedUser.password.length < 20) {
        throw new Error('Password hash verification failed after update');
    }

    console.log(`Password reset successfully for ${verifiedUser.email} (${verifiedUser.username})`);
};

run()
    .catch((error) => {
        console.error('[RESET PASSWORD] Failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

// Version-2.0