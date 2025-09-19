import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationCount,
  deleteNotification
} from '../controllers/notificationController';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', getNotifications);

// Get notification count
router.get('/count', getNotificationCount);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;
