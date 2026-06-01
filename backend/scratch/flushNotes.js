import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

dotenv.config();

const flushNotes = async () => {
    try {
        await connectDB();
        console.log('[FLUSH-NOTES] Connected to database.');
        
        const result = await mongoose.connection.collection('notes').deleteMany({});
        console.log(`[FLUSH-NOTES] Removed ${result.deletedCount} notes.`);
        
        // Also drop the old index if it exists to be safe
        try {
            await mongoose.connection.collection('notes').dropIndex('user_1_type_1_contextTitle_1');
            console.log('[FLUSH-NOTES] Dropped old contextTitle index.');
        } catch (err) {
            console.log('[FLUSH-NOTES] ContextTitle index did not exist or already removed.');
        }

    } catch (error) {
        console.error('[FLUSH-NOTES] Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

flushNotes();

// Version-2.0