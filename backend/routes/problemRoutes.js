import express from 'express';
import { getRandomProblem, getProblemById } from '../controllers/problemController.js';

const router = express.Router();

router.get('/random', getRandomProblem);
router.get('/:id', getProblemById);

export default router;