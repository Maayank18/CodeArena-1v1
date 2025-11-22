import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Route for Sign Up
router.post('/register', registerUser);

// Route for Login
router.post('/login', loginUser);

export default router;