import express from 'express';
import { runCode, submitCode } from '../controllers/submissionController.js';

import { optionalAuth } from '../middleware/auth.js';
import { requireFullLanguageAccess } from '../middleware/subscriptionAuth.js';

const router = express.Router();

router.post('/', optionalAuth, requireFullLanguageAccess, runCode);
router.post('/submit', optionalAuth, requireFullLanguageAccess, submitCode); // <--- New Route

export default router;
// V 1.5

// Version-2.0