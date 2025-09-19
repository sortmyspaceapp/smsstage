import express from 'express';
import {
  getMalls,
  getMallById,
  createMall,
  updateMall,
  deleteMall,
  getMallAnalytics,
} from '../controllers/mallController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getMalls);
router.get('/:id', getMallById);

// Protected routes (require authentication)
router.use(authenticate);

// Admin and Mall Manager routes
router.post('/', authorize('ADMIN', 'MALL_MANAGER'), createMall);
router.put('/:id', authorize('ADMIN', 'MALL_MANAGER'), updateMall);
router.delete('/:id', authorize('ADMIN'), deleteMall);

// Analytics route
router.get('/:id/analytics', authorize('ADMIN', 'MALL_MANAGER'), getMallAnalytics);

export default router;
