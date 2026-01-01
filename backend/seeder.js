// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import Problem from './models/Problem.js';
// import connectDB from './config/db.js';

// dotenv.config();
// connectDB();

// // Fix for __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const importData = async () => {
//     try {
//         // 1. Read the JSON file
//         const jsonPath = path.join(__dirname, 'problems.json');
//         const jsonData = fs.readFileSync(jsonPath, 'utf-8');
//         const problems = JSON.parse(jsonData);

//         // 2. Clear existing data
//         await Problem.deleteMany();
//         console.log('Old problems removed...');

//         // 3. Insert new data
//         await Problem.insertMany(problems);
//         console.log(`Success! Imported ${problems.length} problems.`);

//         process.exit();
//     } catch (error) {
//         console.error(`Error: ${error.message}`);
//         process.exit(1);
//     }
// };

// importData();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from './models/Problem.js';
import connectDB from './config/db.js';

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
    try {
        // 1. Connect to Database first
        await connectDB();

        // 2. Read the JSON file
        const jsonPath = path.join(__dirname, 'problems.json');
        
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`problems.json not found at ${jsonPath}`);
        }

        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const problems = JSON.parse(jsonData);

        // 3. Safety Check: Don't delete if JSON is empty or broken
        if (!problems || !Array.isArray(problems) || problems.length === 0) {
            throw new Error("JSON file is empty or not an array. Aborting to save existing data.");
        }

        console.log(`🚀 Starting import of ${problems.length} problems...`);

        // 4. Clear existing data
        await Problem.deleteMany();
        console.log('🗑️  Old problems removed...');

        // 5. Insert new data
        // Using insertMany with ordered: false is faster for large datasets
        await Problem.insertMany(problems);
        console.log(`✅ Success! Imported ${problems.length} problems into CodeArena.`);

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error during Seeding: ${error.message}`);
        process.exit(1);
    }
};

// Start the process
importData();