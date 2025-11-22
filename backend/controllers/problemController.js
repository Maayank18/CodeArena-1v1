import Problem from '../models/Problem.js';

// @desc    Get a random problem
// @route   GET /api/problems/random
export const getRandomProblem = async (req, res) => {
    try {
        const count = await Problem.countDocuments();
        const random = Math.floor(Math.random() * count);
        const problem = await Problem.findOne().skip(random);
        
        if (!problem) {
            return res.status(404).json({ message: "No problems found in DB" });
        }

        res.json(problem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get problem by ID
// @route   GET /api/problems/:id
export const getProblemById = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) return res.status(404).json({ message: "Problem not found" });
        res.json(problem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};