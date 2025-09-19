import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLeads,
  getLeadStats,
  markLeadAsRead,
  markAllLeadsAsRead
} from '../controllers/leadsController';

const router = express.Router();

// All leads routes require authentication
router.use(authenticate);

// Get leads with filtering and pagination
router.get('/', getLeads);

// Get lead statistics
router.get('/stats', getLeadStats);

// Mark specific lead as read
router.patch('/:leadId/read', markLeadAsRead);

// Mark all leads as read
router.patch('/read-all', markAllLeadsAsRead);

export default router;
