import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity
} from '../controllers/cityController';

const router = express.Router();

// Public routes
router.get('/', getCities);
router.get('/:id', getCityById);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), createCity);
router.put('/:id', authenticate, authorize('ADMIN'), updateCity);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCity);

export default router;
