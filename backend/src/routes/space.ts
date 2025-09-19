import express from 'express';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import {
  searchSpaces,
  getSpaceById,
  trackSpaceView,
  submitInquiry,
  getSpaceInquiries,
  createSpace,
  updateSpace,
  deleteSpace,
  updateSpaceAvailability
} from '../controllers/spaceController';

const router = express.Router();

// Public routes (with optional auth for tracking)
router.get('/search', optionalAuth, searchSpaces);
router.get('/:id', optionalAuth, getSpaceById);
router.post('/:id/view', optionalAuth, trackSpaceView);

// Protected routes
router.post('/:id/inquiry', authenticate, submitInquiry);
router.get('/:id/inquiries', authenticate, getSpaceInquiries);

// Admin and Mall Manager routes
router.post('/', authenticate, authorize('ADMIN', 'MALL_MANAGER'), createSpace);
router.put('/:id', authenticate, authorize('ADMIN', 'MALL_MANAGER'), updateSpace);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSpace);
router.patch('/:id/availability', authenticate, authorize('ADMIN', 'MALL_MANAGER'), updateSpaceAvailability);

export default router;
