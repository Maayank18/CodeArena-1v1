import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import Problem from './models/Problem.js';
import CampaignMap from './models/CampaignMap.js';
import campaignMapSeed from './data/campaignMapSeed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROBLEMS_FILE = path.join(__dirname, 'problems.json');

const requiredProblemFields = ['title', 'slug', 'description', 'goldenSolution'];
const requiredCampaignFields = ['nodeId', 'region', 'problemSlug'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const readProblemsFile = () => {
    if (!fs.existsSync(PROBLEMS_FILE)) {
        throw new Error(`Missing problems file at ${PROBLEMS_FILE}`);
    }

    let parsed;
    try {
        parsed = JSON.parse(fs.readFileSync(PROBLEMS_FILE, 'utf-8'));
    } catch (err) {
        throw new Error(`Failed to parse problems.json: ${err.message}`);
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('problems.json must contain a non-empty array');
    }

    return parsed;
};

const validateProblems = (problems) => {
    const seenSlugs = new Set();

    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];

        for (const field of requiredProblemFields) {
            if (!problem || !isNonEmptyString(problem[field])) {
                throw new Error(`Problem at index ${i} is missing required field "${field}"`);
            }
        }

        if (!Array.isArray(problem.testCases) || problem.testCases.length === 0) {
            throw new Error(`Problem at index ${i} is missing required field "testCases"`);
        }

        const normalizedSlug = problem.slug.trim().toLowerCase();
        if (seenSlugs.has(normalizedSlug)) {
            throw new Error(`Duplicate problem slug found: "${normalizedSlug}"`);
        }
        seenSlugs.add(normalizedSlug);

        // testCases presence already validated above.
    }
};

const validateCampaignSeed = (nodes) => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('campaignMapSeed must be a non-empty array');
    }

    const seenNodeIds = new Set();

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        for (const field of requiredCampaignFields) {
            if (!node || !isNonEmptyString(node[field])) {
                throw new Error(`Campaign node at index ${i} is missing required field "${field}"`);
            }
        }

        const normalizedNodeId = node.nodeId.trim();
        if (seenNodeIds.has(normalizedNodeId)) {
            throw new Error(`Duplicate campaign nodeId found: "${normalizedNodeId}"`);
        }
        seenNodeIds.add(normalizedNodeId);

        if (
            !node.mapPosition ||
            !isFiniteNumber(node.mapPosition.x) ||
            !isFiniteNumber(node.mapPosition.y)
        ) {
            throw new Error(`Campaign node "${node.nodeId}" has invalid mapPosition`);
        }

        if (
            !node.starThresholds ||
            !isFiniteNumber(node.starThresholds.twoStarTimeMs) ||
            !isFiniteNumber(node.starThresholds.threeStarTimeMs)
        ) {
            throw new Error(`Campaign node "${node.nodeId}" has invalid starThresholds`);
        }
    }
};

const ensureCampaignSlugsExist = (problems, nodes) => {
    const problemSlugs = new Set(problems.map((p) => p.slug.trim().toLowerCase()));
    const missing = nodes
        .map((n) => n.problemSlug.trim().toLowerCase())
        .filter((slug) => !problemSlugs.has(slug));

    if (missing.length > 0) {
        throw new Error(`Campaign seed references unknown problem slug(s): ${[...new Set(missing)].join(', ')}`);
    }
};

const buildCampaignDocs = (nodes, slugToId) => {
    return nodes.map((node) => {
        const normalizedSlug = node.problemSlug.trim().toLowerCase();
        const problemId = slugToId.get(normalizedSlug);

        if (!problemId) {
            throw new Error(
                `Campaign node "${node.nodeId}" references missing problem slug "${node.problemSlug}"`
            );
        }

        const { problemSlug, ...rest } = node;
        const prerequisites = Array.isArray(node.prerequisites) ? node.prerequisites : [];

        return {
            ...rest,
            problemId,
            prerequisites,
            isEntryNode: prerequisites.length === 0 || node.nodeOrder === 1,
        };
    });
};

const runSeed = async () => {
    let exitCode = 0;

    try {
        console.log('[SEED] Starting seed process');

        const problems = readProblemsFile();
        validateProblems(problems);
        validateCampaignSeed(campaignMapSeed);
        ensureCampaignSlugsExist(problems, campaignMapSeed);

        console.log(`[SEED] Validation passed: ${problems.length} problems, ${campaignMapSeed.length} campaign nodes`);

        await connectDB();

        console.log('[SEED] Clearing old data');
        await CampaignMap.deleteMany({});
        await Problem.deleteMany({});

        console.log('[SEED] Inserting problems');
        const insertedProblems = await Problem.insertMany(problems, { ordered: false });

        const slugToId = new Map(
            insertedProblems.map((problem) => [problem.slug.trim().toLowerCase(), problem._id])
        );

        const campaignDocs = buildCampaignDocs(campaignMapSeed, slugToId);

        console.log('[SEED] Inserting campaign nodes');
        await CampaignMap.insertMany(campaignDocs, { ordered: false });

        console.log('[SEED] Ensuring indexes');
        await Problem.createIndexes();
        await CampaignMap.createIndexes();

        const [problemCount, campaignCount] = await Promise.all([
            Problem.countDocuments(),
            CampaignMap.countDocuments(),
        ]);

        console.log(`[SEED] Success: ${problemCount} problems, ${campaignCount} campaign nodes`);
    } catch (err) {
        exitCode = 1;
        console.error('[SEED] Failed:', err.message);
    } finally {
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                console.log('[SEED] DB connection closed');
            }
        } catch (closeErr) {
            exitCode = 1;
            console.error('[SEED] Failed to close DB connection:', closeErr.message);
        }

        process.exit(exitCode);
    }
};

runSeed();
// V 1.5
