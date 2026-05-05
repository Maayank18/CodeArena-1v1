import mongoose from 'mongoose';

const closeConnectionIfOpen = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
};

const run = async () => {
    let exitCode = 0;

    try {
        console.info('[SEED] Legacy seed import is disabled.');
        console.info('[SEED] Problems and campaign content are now managed from the Admin Panel.');
    } catch (error) {
        exitCode = 1;
        console.error('[SEED] Failed to exit cleanly:', error.message);
    } finally {
        try {
            await closeConnectionIfOpen();
        } catch (closeError) {
            exitCode = 1;
            console.error('[SEED] Failed to close DB connection:', closeError.message);
        }

        process.exit(exitCode);
    }
};

run();
