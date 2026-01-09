import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    getDashboardStats,
    getRecentActivity,
    getActivityByHour,
    getAllUsers,
    updateUserStats,
    deleteUser,
    resetSeasonScores,
    resetAllStats,
    clearMatchHistory,
    createProblem,
    updateProblem,
    deleteProblem,
    getAllProblems,
    getProblemById
} from '../controllers/adminController.js';

const router = express.Router();

// ===== ANALYTICS ROUTES =====
router.post('/stats', adminAuth, getDashboardStats);
router.post('/activity/recent', adminAuth, getRecentActivity);
router.post('/activity/hourly', adminAuth, getActivityByHour);

// ===== USER MANAGEMENT ROUTES =====
router.post('/users', adminAuth, getAllUsers);
router.post('/users/:userId', adminAuth, updateUserStats);
router.post('/users/:userId/delete', adminAuth, deleteUser);

// ===== LEADERBOARD MANAGEMENT ROUTES =====
router.post('/leaderboard/reset-season', adminAuth, resetSeasonScores);
router.post('/leaderboard/reset-all', adminAuth, resetAllStats);
router.post('/matches/clear', adminAuth, clearMatchHistory);

// ===== PROBLEM MANAGEMENT ROUTES =====
// router.post('/problems', adminAuth, getAllProblems);
// router.post('/problems/:problemId/delete', adminAuth, deleteProblem);
router.post('/problems', adminAuth, getAllProblems);
router.post('/problems/create', adminAuth, createProblem);
router.post('/problems/:problemId', adminAuth, getProblemById);
router.post('/problems/:problemId/update', adminAuth, updateProblem);
router.post('/problems/:problemId/delete', adminAuth, deleteProblem);


export default router;