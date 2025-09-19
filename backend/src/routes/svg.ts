import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  upload,
  uploadSvg,
  getSvgContent,
  updateSpaceSvgAssignment,
  getAvailableSvgElements
} from '../controllers/svgController';

const router = express.Router();

// SVG upload route (Admin and Mall Manager only)
router.post('/upload', authenticate, authorize('ADMIN', 'MALL_MANAGER'), upload.single('svg'), uploadSvg);

// Get SVG content for a floor (public access)
router.get('/floor/:floorId', getSvgContent);

// Update space assignment to SVG element
router.put('/space/:spaceId/assignment', authenticate, authorize('ADMIN', 'MALL_MANAGER'), updateSpaceSvgAssignment);

// Get available SVG elements for assignment
router.get('/floor/:floorId/elements', authenticate, authorize('ADMIN', 'MALL_MANAGER'), getAvailableSvgElements);

export default router;
