import express from 'express';
import { createRoom, getRoom, createCustomRoom, joinCustomRoom, getCustomQuota } from '../controllers/roomController.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePlus } from '../middleware/subscriptionAuth.js';

const router = express.Router();

// Standard room endpoints
router.post('/', createRoom);
router.get('/:roomId', getRoom);

// Custom battle room endpoints (Plus+ required)
router.post('/custom', verifyToken, requirePlus, createCustomRoom);
router.post('/custom/:roomId/join', verifyToken, requirePlus, joinCustomRoom);
router.get('/custom/quota', verifyToken, requirePlus, getCustomQuota);

export default router;
// V 2.0
