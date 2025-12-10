import express from 'express';
import {
  generateQr,
  getStatus,
  scanQr,
  approveQr,
  rejectQr,
  completeQr,
  streamStatus,
} from '../controllers/qrAuthController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/generate', generateQr);
router.get('/status/:sessionId', getStatus);
router.get('/stream/:sessionId', streamStatus);

// Mobile app routes (requires mobile token in body)
router.post('/scan', scanQr);
router.post('/approve', approveQr);
router.post('/reject', rejectQr);

// Web route (public, status check happens in controller)
router.post('/complete', completeQr);

export default router;

