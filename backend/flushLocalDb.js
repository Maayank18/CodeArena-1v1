import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import CampaignMap from './models/CampaignMap.js';
import CampaignProgress from './models/CampaignProgress.js';
import Problem from './models/Problem.js';

dotenv.config();

const run = async () => {
    if (process.env.NODE_ENV === 'production') {
        console.error('[FLUSH] Refusing to run in production.');
        process.exit(1);
    }

    let exitCode = 0;

    try {
        await connectDB();

        const [campaignResult, problemResult, progressResult] = await Promise.all([
            CampaignMap.deleteMany({}),
            Problem.deleteMany({}),
            CampaignProgress.deleteMany({}),
        ]);

        console.log(`[FLUSH] Campaign nodes removed: ${campaignResult.deletedCount}`);
        console.log(`[FLUSH] Problems removed: ${problemResult.deletedCount}`);
        console.log(`[FLUSH] Campaign progress removed: ${progressResult.deletedCount}`);
        console.log('[FLUSH] Local campaign database cleared.');
    } catch (error) {
        exitCode = 1;
        console.error('[FLUSH] Failed to clear local database:', error.message);
    } finally {
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                console.log('[FLUSH] DB connection closed');
            }
        } catch (closeError) {
            exitCode = 1;
            console.error('[FLUSH] Failed to close DB connection:', closeError.message);
        }

        process.exit(exitCode);
    }
};

run();

// Version-2.0