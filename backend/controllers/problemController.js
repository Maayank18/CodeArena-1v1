// import Problem from '../models/Problem.js';

// // @desc    Get a random problem
// // @route   GET /api/problems/random
// export const getRandomProblem = async (req, res) => {
//     try {
//         const count = await Problem.countDocuments();
//         const random = Math.floor(Math.random() * count);
//         const problem = await Problem.findOne().skip(random);
        
//         if (!problem) {
//             return res.status(404).json({ message: "No problems found in DB" });
//         }

//         res.json(problem);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Get problem by ID
// // @route   GET /api/problems/:id
// export const getProblemById = async (req, res) => {
//     try {
//         const problem = await Problem.findById(req.params.id);
//         if (!problem) return res.status(404).json({ message: "Problem not found" });
//         res.json(problem);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };




// MORE SECURE AND ROBUST FUNCTION FOR PROBLEM 
import Problem from '../models/Problem.js';

// @desc    Get a random problem
// @route   GET /api/problems/random
export const getRandomProblem = async (req, res) => {
    try {
        // 1. Use Aggregation for native random sampling (Faster than count + skip)
        const problems = await Problem.aggregate([
            { $sample: { size: 1 } }, // Pick 1 random document
            
            // 2. SECURITY: Exclude fields you don't want users to see (e.g., hidden test cases)
            // If your 'testCases' field contains the answers, you might want to hide it
            // or only show a specific 'examples' field.
            // { $project: { hiddenTestCases: 0, solution: 0 } } 
        ]);
        
        if (!problems || problems.length === 0) {
            return res.status(404).json({ message: "No problems found in DB" });
        }

        // Aggregate returns an array, so we pick the first item
        res.json(problems[0]);

    } catch (error) {
        console.error("Get Random Problem Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get problem by ID
// @route   GET /api/problems/:id
export const getProblemById = async (req, res) => {
    try {
        // 1. Find by ID
        // .select('-testCases') <- Use this if you want to hide hidden tests from the frontend!
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(problem);

    } catch (error) {
        // 2. Handle Invalid ID format (e.g., user types "123" instead of ObjectId)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Problem not found (Invalid ID)" });
        }
        
        res.status(500).json({ message: error.message });
    }
};