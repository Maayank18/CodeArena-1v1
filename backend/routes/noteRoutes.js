import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requirePlus } from '../middleware/subscriptionAuth.js';
import { getNotes, getNoteByContext, saveNote, deleteNote } from '../controllers/noteController.js';

const router = express.Router();

// All note routes require authentication and Plus tier (or higher)
router.use(verifyToken);
router.use(requirePlus);

router.get('/', getNotes);
router.get('/context', getNoteByContext);
router.post('/', saveNote);
router.delete('/:id', deleteNote);

export default router;
