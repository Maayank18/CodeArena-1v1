import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import CampaignMap from '../models/CampaignMap.js';

dotenv.config();

const CONFIRM_FLAG = 'YES';

const run = async () => {
    if (process.env.CONFIRM_CAMPAIGN_ENTRY_MIGRATION !== CONFIRM_FLAG) {
        console.error(
            '[MIGRATION] Refusing to run. Set CONFIRM_CAMPAIGN_ENTRY_MIGRATION=YES to proceed.'
        );
        process.exit(1);
    }

    let exitCode = 0;

    try {
        await connectDB();

        const filter = {
            isActive: true,
            $or: [
                { prerequisites: { $exists: false } },
                { prerequisites: { $size: 0 } },
                { nodeOrder: 1 },
            ],
        };

        const preview = await CampaignMap.find(filter)
            .select('nodeId region nodeOrder prerequisites isEntryNode')
            .lean();

        console.log(`[MIGRATION] Found ${preview.length} entry candidate node(s).`);

        const result = await CampaignMap.collection.updateMany(
            filter,
            {
                $set: {
                    isEntryNode: true,
                    isLocked: false,
                },
            }
        );

        console.log(`[MIGRATION] Matched ${result.matchedCount} node(s).`);
        console.log(`[MIGRATION] Updated ${result.modifiedCount} node(s).`);
        console.log('[MIGRATION] Campaign entry nodes backfilled successfully.');
    } catch (error) {
        exitCode = 1;
        console.error('[MIGRATION] Failed to backfill campaign entry nodes:', error.message);
    } finally {
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                console.log('[MIGRATION] DB connection closed');
            }
        } catch (closeError) {
            exitCode = 1;
            console.error('[MIGRATION] Failed to close DB connection:', closeError.message);
        }

        process.exit(exitCode);
    }
};

run();
