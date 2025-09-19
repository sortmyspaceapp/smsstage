import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createFloor,
  getFloorsByMall,
  updateFloor,
  deleteFloor,
  getFloorById
} from '../controllers/floorController';

const router = express.Router();

// Create a new floor (Admin and Mall Manager only)
router.post('/', authenticate, authorize('ADMIN', 'MALL_MANAGER'), createFloor);

// Get floors for a specific mall (Public access)
router.get('/mall/:mallId', getFloorsByMall);

// Get floor by ID (Public access)
router.get('/:id', getFloorById);

// Update floor (Admin and Mall Manager only)
router.put('/:id', authenticate, authorize('ADMIN', 'MALL_MANAGER'), updateFloor);

// Delete floor (Admin and Mall Manager only)
router.delete('/:id', authenticate, authorize('ADMIN', 'MALL_MANAGER'), deleteFloor);

export default router;
