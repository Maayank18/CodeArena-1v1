// import mongoose from 'mongoose';

// const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGO_URI);
//         console.log(`MongoDB Connected: ${conn.connection.host}`);
//     } catch (error) {
//         console.error(`Error: ${error.message}`);
//         process.exit(1);
//     }
// };

// export default connectDB;
















// FILE: backend/config/db.js
// PRODUCTION-OPTIMIZED VERSION
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // ✅ CRITICAL: Mongoose connection options for production
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Connection pooling (handles concurrent requests efficiently)
            maxPoolSize: 10,        // Max 10 connections in pool
            minPoolSize: 2,         // Keep 2 connections alive
            
            // Timeout settings
            serverSelectionTimeoutMS: 5000,  // 5 second timeout
            socketTimeoutMS: 45000,          // 45 second socket timeout
            
            // Performance optimizations
            autoIndex: false,       // ✅ Don't build indexes on every connection (use migration scripts)
            autoCreate: false,      // ✅ Don't auto-create collections
        });

        console.log(`[DB] ✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`[DB] 📊 Connection Pool Size: ${conn.connection.client.s.options.maxPoolSize}`);

        // ✅ Connection event listeners for monitoring
        mongoose.connection.on('connected', () => {
            console.log('[DB] 🔗 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('[DB] ❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] ⚠️ Mongoose disconnected from MongoDB');
        });

        // ✅ Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('[DB] 🛑 MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return conn;

    } catch (error) {
        console.error(`[DB] 💥 Connection Error: ${error.message}`);
        console.error('[DB] Stack:', error.stack);
        throw error;
    }
};

export default connectDB;
// V 1.5
