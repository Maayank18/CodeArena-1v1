import express from 'express';
import { runCode, submitCode } from '../controllers/submissionController.js';

const router = express.Router();

router.post('/', runCode);
router.post('/submit', submitCode); // <--- New Route

export default router;