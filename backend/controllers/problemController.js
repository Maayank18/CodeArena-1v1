// // MORE SECURE AND ROBUST FUNCTION FOR PROBLEM 
// import Problem from '../models/Problem.js';

// // @desc    Get a random problem
// // @route   GET /api/problems/random
// export const getRandomProblem = async (req, res) => {
//     try {
//         // 1. Use Aggregation for native random sampling (Faster than count + skip)
//         const problems = await Problem.aggregate([
//             { $sample: { size: 1 } }, // Pick 1 random document
            
//             // 2. SECURITY: Exclude fields you don't want users to see (e.g., hidden test cases)
//             // If your 'testCases' field contains the answers, you might want to hide it
//             // or only show a specific 'examples' field.
//             // { $project: { hiddenTestCases: 0, solution: 0 } } 
//         ]);
        
//         if (!problems || problems.length === 0) {
//             return res.status(404).json({ message: "No problems found in DB" });
//         }

//         // Aggregate returns an array, so we pick the first item
//         res.json(problems[0]);

//     } catch (error) {
//         console.error("Get Random Problem Error:", error);
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// // @desc    Get problem by ID
// // @route   GET /api/problems/:id
// export const getProblemById = async (req, res) => {
//     try {
//         // 1. Find by ID
//         // .select('-testCases') <- Use this if you want to hide hidden tests from the frontend!
//         const problem = await Problem.findById(req.params.id);

//         if (!problem) {
//             return res.status(404).json({ message: "Problem not found" });
//         }

//         res.json(problem);

//     } catch (error) {
//         // 2. Handle Invalid ID format (e.g., user types "123" instead of ObjectId)
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: "Problem not found (Invalid ID)" });
//         }
        
//         res.status(500).json({ message: error.message });
//     }
// };




// backend/controllers/problemController.js
import Problem from '../models/Problem.js';

// @desc    Get a random problem (Secured)
// @route   GET /api/problems/random
export const getRandomProblem = async (req, res) => {
    try {
        // 1. Use Aggregation for native random sampling
        const problems = await Problem.aggregate([
            { $sample: { size: 1 } }, 
            { 
                $project: { 
                    // 🛡️ SECURITY: Only send 'isPublic: true' test cases to the frontend
                    testCases: {
                        $filter: {
                            input: "$testCases",
                            as: "tc",
                            cond: { $eq: ["$$tc.isPublic", true] }
                        }
                    },
                    title: 1,
                    slug: 1,
                    description: 1,
                    difficulty: 1,
                    constraints: 1,
                    starterCode: 1
                } 
            }
        ]);
        
        if (!problems || problems.length === 0) {
            return res.status(404).json({ message: "No problems found in DB" });
        }

        res.json(problems[0]);

    } catch (error) {
        console.error("Get Random Problem Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get problem by ID (Secured)
// @route   GET /api/problems/:id
export const getProblemById = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // 🛡️ SECURITY: Filter out non-public test cases manually
        const securedProblem = problem.toObject();
        securedProblem.testCases = securedProblem.testCases.filter(tc => tc.isPublic);

        res.json(securedProblem);

    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Problem not found (Invalid ID)" });
        }
        res.status(500).json({ message: error.message });
    }
};