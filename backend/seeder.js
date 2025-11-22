import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from './models/Problem.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
    try {
        // 1. Read the JSON file
        const jsonPath = path.join(__dirname, 'problems.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const problems = JSON.parse(jsonData);

        // 2. Clear existing data
        await Problem.deleteMany();
        console.log('Old problems removed...');

        // 3. Insert new data
        await Problem.insertMany(problems);
        console.log(`Success! Imported ${problems.length} problems.`);

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();