import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  updatePreferences,
  getRecentViews,
  getInterestedSpaces,
  addToInterested,
  removeFromInterested,
  updateInterestLevel,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);

// Recent views
router.get('/recent-views', getRecentViews);

// Interested spaces
router.get('/interested', getInterestedSpaces);
router.post('/interested', addToInterested);
router.delete('/interested/:spaceId', removeFromInterested);
router.put('/interested/:spaceId', updateInterestLevel);

// Admin routes for user management
router.get('/all', authorize('ADMIN'), getAllUsers);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
