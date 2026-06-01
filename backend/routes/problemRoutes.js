import express from 'express';
import { getRandomProblem, getProblemById } from '../controllers/problemController.js';

const router = express.Router();

router.get('/random', getRandomProblem);
router.get('/:id', getProblemById);

export default router;
// V 1.5

// Version-2.0