import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import CampaignMap from '../models/CampaignMap.js';
import { DEFAULT_ENTRY_NODE_ID } from '../utils/campaignProgressBootstrap.js';

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

        const rootFilter = {
            isActive: true,
            $or: [
                { nodeId: DEFAULT_ENTRY_NODE_ID },
                { regionOrder: 1, nodeOrder: 1 },
            ],
        };
        const nonRootEntryFilter = {
            isActive: true,
            nodeId: { $ne: DEFAULT_ENTRY_NODE_ID },
            $or: [
                { isEntryNode: true },
                { nodeOrder: 1, regionOrder: { $gt: 1 } },
            ],
        };

        const [rootPreview, nonRootPreview] = await Promise.all([
            CampaignMap.find(rootFilter)
                .select('nodeId region regionOrder nodeOrder prerequisites isEntryNode')
                .lean(),
            CampaignMap.find(nonRootEntryFilter)
                .select('nodeId region regionOrder nodeOrder prerequisites isEntryNode')
                .lean(),
        ]);

        console.log(`[MIGRATION] Found ${rootPreview.length} absolute root node(s).`);
        console.log(`[MIGRATION] Found ${nonRootPreview.length} non-root entry candidate node(s) to normalize.`);

        const [clearResult, rootResult] = await Promise.all([
            CampaignMap.collection.updateMany(
                nonRootEntryFilter,
                {
                    $set: { isEntryNode: false },
                    $unset: { isLocked: '' },
                }
            ),
            CampaignMap.collection.updateMany(
                rootFilter,
                {
                    $set: {
                        isEntryNode: true,
                        isLocked: false,
                    },
                }
            ),
        ]);

        console.log(`[MIGRATION] Normalized ${clearResult.modifiedCount} non-root entry node(s).`);
        console.log(`[MIGRATION] Confirmed ${rootResult.modifiedCount} root node(s) as unlocked.`);
        console.log('[MIGRATION] Campaign root normalization completed successfully.');
    } catch (error) {
        exitCode = 1;
        console.error('[MIGRATION] Failed to normalize campaign root nodes:', error.message);
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

// Version-2.0