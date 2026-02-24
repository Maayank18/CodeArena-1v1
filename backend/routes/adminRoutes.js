// import express from 'express';
// import { adminAuth } from '../middleware/adminAuth.js';
// import {
//     getDashboardStats,
//     getRecentActivity,
//     getActivityByHour,
//     getAllUsers,
//     updateUserStats,
//     deleteUser,
//     resetSeasonScores,
//     resetAllStats,
//     clearMatchHistory,
//     createProblem,
//     updateProblem,
//     deleteProblem,
//     getAllProblems,
//     getProblemById
// } from '../controllers/adminController.js';

// const router = express.Router();

// // ===== ANALYTICS ROUTES =====
// router.post('/stats', adminAuth, getDashboardStats);
// router.post('/activity/recent', adminAuth, getRecentActivity);
// router.post('/activity/hourly', adminAuth, getActivityByHour);

// // ===== USER MANAGEMENT ROUTES =====
// router.post('/users', adminAuth, getAllUsers);
// router.post('/users/:userId', adminAuth, updateUserStats);
// router.post('/users/:userId/delete', adminAuth, deleteUser);

// // ===== LEADERBOARD MANAGEMENT ROUTES =====
// router.post('/leaderboard/reset-season', adminAuth, resetSeasonScores);
// router.post('/leaderboard/reset-all', adminAuth, resetAllStats);
// router.post('/matches/clear', adminAuth, clearMatchHistory);

// // ===== PROBLEM MANAGEMENT ROUTES =====
// // router.post('/problems', adminAuth, getAllProblems);
// // router.post('/problems/:problemId/delete', adminAuth, deleteProblem);
// router.post('/problems', adminAuth, getAllProblems);
// router.post('/problems/create', adminAuth, createProblem);
// router.post('/problems/:problemId', adminAuth, getProblemById);
// router.post('/problems/:problemId/update', adminAuth, updateProblem);
// router.post('/problems/:problemId/delete', adminAuth, deleteProblem);

// //   router.post('/admin/stats',                    getDashboardStats);
// //   router.post('/admin/users',                    getAllUsers);
// //   router.post('/admin/users/:userId/delete',     deleteUser);
// //   router.post('/admin/users/:userId/update-stats', updateUserStats);  
//   router.post('/admin/users/:userId/ban',        banUser);           
//   router.post('/admin/users/:userId',            getUserById);         
//   router.post('/admin/matches',                  getAllMatches);        
// //   router.post('/admin/matches/clear',            clearMatchHistory);
// //   router.post('/admin/activity/recent',          getRecentActivity);
// //   router.post('/admin/activity/hourly',          getActivityByHour);
//   router.post('/admin/system/health',            getSystemHealth);    
// //   router.post('/admin/problems',                 getAllProblems);
// //   router.post('/admin/problems/create',          createProblem);
// //   router.post('/admin/problems/:problemId/update', updateProblem);
// //   router.post('/admin/problems/:problemId/delete', deleteProblem);
// //   router.post('/admin/leaderboard/reset-season', resetSeasonScores);
// //   router.post('/admin/leaderboard/reset-all',    resetAllStats);
// export default router;


// ========================================================================
// FILE: backend/routes/adminRoutes.js
// ========================================================================

import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
    // Dashboard & Analytics
    getDashboardStats,
    getRecentActivity,
    getActivityByHour,
    getSystemHealth,

    // User Management
    getAllUsers,
    getUserById,
    updateUserStats,
    deleteUser,
    banUser,

    // Match Management
    getAllMatches,
    clearMatchHistory,

    // Problem Management
    getAllProblems,
    createProblem,
    updateProblem,
    deleteProblem,

    // Leaderboard Management
    resetSeasonScores,
    resetAllStats,
} from '../controllers/adminController.js';

const router = express.Router();

// ===== ANALYTICS =====
router.post('/stats',              adminAuth, getDashboardStats);
router.post('/activity/recent',    adminAuth, getRecentActivity);
router.post('/activity/hourly',    adminAuth, getActivityByHour);
router.post('/system/health',      adminAuth, getSystemHealth);

// ===== USER MANAGEMENT =====
router.post('/users',                        adminAuth, getAllUsers);
router.post('/users/:userId/delete',         adminAuth, deleteUser);
router.post('/users/:userId/update-stats',   adminAuth, updateUserStats);
router.post('/users/:userId/ban',            adminAuth, banUser);
router.post('/users/:userId',                adminAuth, getUserById);

// ===== MATCH MANAGEMENT =====
router.post('/matches',            adminAuth, getAllMatches);
router.post('/matches/clear',      adminAuth, clearMatchHistory);

// ===== PROBLEM MANAGEMENT =====
// NOTE: /problems/create must be before /problems/:problemId
// to prevent Express matching "create" as a problemId param
router.post('/problems',                           adminAuth, getAllProblems);
router.post('/problems/create',                    adminAuth, createProblem);
router.post('/problems/:problemId/update',         adminAuth, updateProblem);
router.post('/problems/:problemId/delete',         adminAuth, deleteProblem);

// ===== LEADERBOARD MANAGEMENT =====
router.post('/leaderboard/reset-season', adminAuth, resetSeasonScores);
router.post('/leaderboard/reset-all',    adminAuth, resetAllStats);

export default router;