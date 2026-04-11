// FILE: backend/routes/chatRoutes.js
import express from 'express';
import { chat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat
router.post('/', chat);

export default router;
// V 1.5
