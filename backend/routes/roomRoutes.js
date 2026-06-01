import express from 'express';
import { createRoom, getRoom, createCustomRoom, joinCustomRoom, getCustomQuota, registerForContest } from '../controllers/roomController.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePlus, requirePremium } from '../middleware/subscriptionAuth.js';

const router = express.Router();

// Standard room endpoints
router.post('/', createRoom);
router.get('/:roomId', getRoom);

// Custom battle room endpoints (Plus+ required)
router.post('/custom', verifyToken, requirePlus, createCustomRoom);
router.post('/custom/:roomId/join', verifyToken, requirePlus, joinCustomRoom);
router.get('/custom/quota', verifyToken, requirePlus, getCustomQuota);

// Contest endpoints (Premium required)
router.post('/contest/register', verifyToken, requirePremium, registerForContest);

export default router;
// V 2.0

// Version-2.0