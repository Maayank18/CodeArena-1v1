import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getNotes, getNoteByContext, saveNote, deleteNote } from '../controllers/noteController.js';

const router = express.Router();

// Notes are available to all authenticated users.
router.use(verifyToken);

router.get('/', getNotes);
router.get('/context', getNoteByContext);
router.post('/', saveNote);
router.delete('/:id', deleteNote);

export default router;
