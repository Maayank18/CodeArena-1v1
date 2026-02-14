// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Problem from './models/Problem.js';
// import connectDB from './config/db.js';

// dotenv.config();

// // Fix for __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const importData = async () => {
//     try {
//         // 1. Connect to Database first
//         await connectDB();

//         // 2. Read the JSON file
//         const jsonPath = path.join(__dirname, 'problems.json');
        
//         if (!fs.existsSync(jsonPath)) {
//             throw new Error(`problems.json not found at ${jsonPath}`);
//         }

//         const jsonData = fs.readFileSync(jsonPath, 'utf-8');
//         const problems = JSON.parse(jsonData);

//         // 3. Safety Check: Don't delete if JSON is empty or broken
//         if (!problems || !Array.isArray(problems) || problems.length === 0) {
//             throw new Error("JSON file is empty or not an array. Aborting to save existing data.");
//         }

//         console.log(`🚀 Starting import of ${problems.length} problems...`);

//         // 4. Clear existing data
//         await Problem.deleteMany();
//         console.log('🗑️  Old problems removed...');

//         // 5. Insert new data
//         // Using insertMany with ordered: false is faster for large datasets
//         await Problem.insertMany(problems);
//         console.log(`✅ Success! Imported ${problems.length} problems into CodeArena.`);

//         process.exit(0);
//     } catch (error) {
//         console.error(`❌ Error during Seeding: ${error.message}`);
//         process.exit(1);
//     }
// };

// // Start the process
// importData();















// FILE: backend/importData.js
// PRODUCTION-OPTIMIZED SEEDING SCRIPT
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from './models/Problem.js';
import connectDB from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
    try {
        console.log('[SEEDER] 🚀 Starting import process...\n');

        // 1. Connect to Database
        await connectDB();

        // 2. Read JSON file
        const jsonPath = path.join(__dirname, 'problems.json');
        
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`❌ problems.json not found at ${jsonPath}`);
        }

        console.log(`[SEEDER] 📖 Reading file: ${jsonPath}`);
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const problems = JSON.parse(jsonData);

        // 3. ✅ VALIDATION: Check data integrity
        if (!problems || !Array.isArray(problems) || problems.length === 0) {
            throw new Error("❌ JSON file is empty or not an array. Aborting.");
        }

        // ✅ VALIDATION: Check each problem has required fields
        const requiredFields = ['title', 'slug', 'description', 'goldenSolution', 'testCases'];
        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            for (const field of requiredFields) {
                if (!problem[field]) {
                    throw new Error(`❌ Problem at index ${i} missing required field: ${field}`);
                }
            }
            
            // Validate test cases
            if (!Array.isArray(problem.testCases) || problem.testCases.length === 0) {
                throw new Error(`❌ Problem "${problem.title}" has no test cases`);
            }
        }

        console.log(`[SEEDER] ✅ Validation passed for ${problems.length} problems\n`);

        // 4. ✅ START TRANSACTION (all-or-nothing import)
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 5. Clear existing data
            console.log('[SEEDER] 🗑️  Removing old problems...');
            const deleteResult = await Problem.deleteMany({}, { session });
            console.log(`[SEEDER] 🗑️  Deleted ${deleteResult.deletedCount} old problems\n`);

            // 6. ✅ OPTIMIZED INSERT: ordered: false = parallel inserts
            console.log('[SEEDER] 📥 Inserting new problems...');
            const startTime = Date.now();
            
            const insertResult = await Problem.insertMany(problems, { 
                session,
                ordered: false,  // ✅ Don't stop on duplicate key errors
                lean: true       // ✅ Skip hydration for faster inserts
            });

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`[SEEDER] ✅ Inserted ${insertResult.length} problems in ${duration}s\n`);

            // 7. ✅ COMMIT TRANSACTION
            await session.commitTransaction();
            console.log('[SEEDER] ✅ Transaction committed successfully\n');

            // 8. ✅ VERIFY: Count problems in DB
            const finalCount = await Problem.countDocuments();
            console.log(`[SEEDER] 📊 Final count: ${finalCount} problems in database`);

            // 9. ✅ CREATE INDEXES (if not exist)
            console.log('[SEEDER] 🔧 Ensuring indexes...');
            await Problem.createIndexes();
            console.log('[SEEDER] ✅ Indexes created/verified\n');

            console.log('═══════════════════════════════════════');
            console.log('✅ SEEDING COMPLETED SUCCESSFULLY! 🎉');
            console.log('═══════════════════════════════════════\n');

        } catch (error) {
            // ✅ ROLLBACK on error
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        process.exit(0);

    } catch (error) {
        console.error('\n═══════════════════════════════════════');
        console.error('❌ SEEDING FAILED');
        console.error('═══════════════════════════════════════');
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
        process.exit(1);
    }
};

// Start the process
importData();