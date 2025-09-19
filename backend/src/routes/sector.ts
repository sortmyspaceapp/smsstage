import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSectors,
  getSectorById,
  createSector,
  updateSector,
  deleteSector
} from '../controllers/sectorController';

const router = express.Router();

// Public routes
router.get('/', getSectors);
router.get('/:id', getSectorById);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), createSector);
router.put('/:id', authenticate, authorize('ADMIN'), updateSector);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSector);

export default router;
