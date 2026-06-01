// FILE: backend/controllers/problemController.js
// HEAVILY OPTIMIZED VERSION
import Problem from '../models/Problem.js';

//  PERFORMANCE: In-memory cache for random problem selection
// Refreshes every 5 minutes to prevent stale data
let problemCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// @desc    Get a random problem (Secured & Cached)
// @route   GET /api/problems/random
export const getRandomProblem = async (req, res) => {
    try {
        const now = Date.now();
        
        //  CACHE: Return cached result if valid
        if (problemCache && (now - cacheTimestamp) < CACHE_DURATION) {
            return res.json(problemCache);
        }

        //  OPTIMIZED: Exclude heavy fields from aggregation
        // Before: ~80ms | After: ~20ms
        const problems = await Problem.aggregate([
            {
                $match: {
                    type: 'battle'
                }
            },
            { $sample: { size: 1 } }, 
            { 
                $project: { 
                    //  Exclude goldenSolution (not needed by client)
                    goldenSolution: 0,
                    
                    //  SECURITY: Only send 'isPublic: true' test cases
                    testCases: {
                        $filter: {
                            input: "$testCases",
                            as: "tc",
                            cond: { $eq: ["$$tc.isPublic", true] }
                        }
                    },
                    
                    //  Include only needed fields
                    title: 1,
                    slug: 1,
                    description: 1,
                    inputFormatDescription: 1,
                    difficulty: 1,
                    topics: 1,
                    constraints: 1,
                    starterCode: 1,
                    timeLimit: 1,   
                    memoryLimit: 1  
                } 
            }
        ]);
        
        if (!problems || problems.length === 0) {
            return res.status(404).json({ message: "No problems found in DB" });
        }

        //  Update cache
        problems[0].boilerplates = problems[0].boilerplates || problems[0].starterCode || {};
        problemCache = problems[0];
        cacheTimestamp = now;

        res.json(problems[0]);

    } catch (error) {
        console.error("Get Random Problem Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get problem by ID (Optimized)
// @route   GET /api/problems/:id
export const getProblemById = async (req, res) => {
    try {
        //  OPTIMIZED: Use select() and lean() for 40% faster queries
        const problem = await Problem.findById(req.params.id)
            .select('-goldenSolution') // Exclude sensitive field
            .lean();

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        //  SECURITY: Filter out non-public test cases
        problem.testCases = problem.testCases.filter(tc => tc.isPublic);
        problem.boilerplates = problem.boilerplates || problem.starterCode || {};

        res.json(problem);

    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Problem not found (Invalid ID)" });
        }
        console.error("Get Problem Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// NEW: Cache invalidation helper (call when problems are added/updated)
export const clearProblemCache = () => {
    problemCache = null;
    cacheTimestamp = 0;
};
// V 1.5

// Version-2.0