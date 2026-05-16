import express from 'express';
import { getHint, checkCode } from '../controllers/aiHelpController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/hint', verifyToken, getHint);
router.post('/check-code', verifyToken, checkCode);

export default router;
