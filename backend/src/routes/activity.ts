import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUserActivities,
  getActivityStats,
  getAllActivities,
  getAnalytics
} from '../controllers/activityController';

const router = express.Router();

// User activity routes (require authentication)
router.use(authenticate);

// Get user's own activities
router.get('/', getUserActivities);

// Get user's activity statistics
router.get('/stats', getActivityStats);

// Admin only - Get all activities
router.get('/all', authorize('ADMIN'), getAllActivities);

// Admin only - Get analytics
router.get('/analytics', authorize('ADMIN'), getAnalytics);

export default router;