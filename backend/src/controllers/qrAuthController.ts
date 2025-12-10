import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const QR_TOKEN_EXPIRY_MINUTES = 5;

// Generate JWT token (using same pattern as authController)
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d'
  });
};

// Generate QR code for login
export const generateQr = async (req: Request, res: Response): Promise<void> => {
  try {
    // Generate cryptographically secure random token
    const qrToken = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + QR_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Get IP and User-Agent from request
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Create QR login session
    const session = await prisma.qrLoginSession.create({
      data: {
        id: sessionId,
        qrToken,
        status: 'PENDING',
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Create QR code data payload
    const qrData = JSON.stringify({
      type: 'SPACEFINDER_LOGIN',
      token: qrToken,
      sessionId,
      timestamp: Date.now(),
    });

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 300,
    });

    res.json({
      success: true,
      data: {
        sessionId,
        qrToken,
        qrDataUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
    return;
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code',
    });
    return;
  }
};

// Get QR login session status
export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.qrLoginSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt && session.status === 'PENDING') {
      await prisma.qrLoginSession.update({
        where: { id: sessionId },
        data: { status: 'EXPIRED' },
      });
      session.status = 'EXPIRED';
    }

    res.json({
      success: true,
      data: {
        status: session.status,
        user: session.user
          ? {
              id: session.user.id,
              email: session.user.email,
              username: session.user.username,
              role: session.user.role,
              profile: session.user.profile,
            }
          : null,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
    return;
  } catch (error) {
    logger.error('Error getting QR status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get QR status',
    });
    return;
  }
};

// Mobile app: Scan QR code
export const scanQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken, mobileToken } = req.body;

    if (!qrToken || !mobileToken) {
      res.status(400).json({
        success: false,
        error: 'qrToken and mobileToken are required',
      });
      return;
    }

    // Verify mobile token and get user
    let decoded: any;
    try {
      decoded = jwt.verify(mobileToken, process.env.JWT_SECRET!);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid mobile token',
      });
      return;
    }

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
      return;
    }

    // Find QR session
    const session = await prisma.qrLoginSession.findUnique({
      where: { qrToken },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'QR session not found',
      });
      return;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await prisma.qrLoginSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      res.status(400).json({
        success: false,
        error: 'QR session has expired',
      });
      return;
    }

    // Check if session is already used
    if (session.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: `QR session is already ${session.status}`,
      });
      return;
    }

    // Update session to SCANNED
    await prisma.qrLoginSession.update({
      where: { id: session.id },
      data: {
        status: 'SCANNED',
        mobileToken,
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
        },
        deviceInfo: {
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        },
      },
    });
    return;
  } catch (error) {
    logger.error('Error scanning QR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan QR code',
    });
    return;
  }
};

// Mobile app: Approve QR login
export const approveQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken, mobileToken } = req.body;

    if (!qrToken || !mobileToken) {
      res.status(400).json({
        success: false,
        error: 'qrToken and mobileToken are required',
      });
      return;
    }

    // Verify mobile token
    let decoded: any;
    try {
      decoded = jwt.verify(mobileToken, process.env.JWT_SECRET!);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid mobile token',
      });
      return;
    }

    // Find QR session
    const session = await prisma.qrLoginSession.findUnique({
      where: { qrToken },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'QR session not found',
      });
      return;
    }

    // Verify mobile token matches
    if (session.mobileToken !== mobileToken) {
      res.status(403).json({
        success: false,
        error: 'Mobile token mismatch',
      });
      return;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await prisma.qrLoginSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      res.status(400).json({
        success: false,
        error: 'QR session has expired',
      });
      return;
    }

    // Check if session is in valid state
    if (session.status !== 'SCANNED') {
      res.status(400).json({
        success: false,
        error: `Cannot approve session with status ${session.status}`,
      });
      return;
    }

    // Update session to APPROVED and link user
    await prisma.qrLoginSession.update({
      where: { id: session.id },
      data: {
        status: 'APPROVED',
        userId: decoded.id,
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        message: 'QR login approved',
      },
    });
    return;
  } catch (error) {
    logger.error('Error approving QR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve QR login',
    });
    return;
  }
};

// Mobile app: Reject QR login
export const rejectQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken, mobileToken } = req.body;

    if (!qrToken || !mobileToken) {
      res.status(400).json({
        success: false,
        error: 'qrToken and mobileToken are required',
      });
      return;
    }

    // Verify mobile token
    try {
      jwt.verify(mobileToken, process.env.JWT_SECRET!);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid mobile token',
      });
      return;
    }

    // Find QR session
    const session = await prisma.qrLoginSession.findUnique({
      where: { qrToken },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'QR session not found',
      });
      return;
    }

    // Check if session is in valid state
    if (!['PENDING', 'SCANNED'].includes(session.status)) {
      res.status(400).json({
        success: false,
        error: `Cannot reject session with status ${session.status}`,
      });
      return;
    }

    // Update session to REJECTED
    await prisma.qrLoginSession.update({
      where: { id: session.id },
      data: {
        status: 'REJECTED',
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        message: 'QR login rejected',
      },
    });
    return;
  } catch (error) {
    logger.error('Error rejecting QR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject QR login',
    });
    return;
  }
};

// Web: Complete QR login and get tokens
export const completeQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
      return;
    }

    // Find QR session
    const session = await prisma.qrLoginSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    // Check if session is approved
    if (session.status !== 'APPROVED') {
      res.status(400).json({
        success: false,
        error: `Session status is ${session.status}, expected APPROVED`,
      });
      return;
    }

    if (!session.user) {
      res.status(400).json({
        success: false,
        error: 'Session has no associated user',
      });
      return;
    }

    // Generate JWT tokens
    const token = generateToken(session.user.id);
    const refreshToken = generateRefreshToken(session.user.id);

    // Save refresh token to user session
    await prisma.userSession.create({
      data: {
        userId: session.user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Mark QR session as completed
    await prisma.qrLoginSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
          role: session.user.role,
          profile: session.user.profile,
        },
        token,
        refreshToken,
      },
    });
    return;
  } catch (error) {
    logger.error('Error completing QR login:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete QR login',
    });
    return;
  }
};

// SSE endpoint for real-time status updates
export const streamStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    // Send initial connection confirmation
    res.write(`: connected\n\n`);

    // Poll for status updates every 1 second
    const interval = setInterval(async () => {
      try {
        const session = await prisma.qrLoginSession.findUnique({
          where: { id: sessionId },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        });

        if (!session) {
          res.write(`data: ${JSON.stringify({ error: 'Session not found' })}\n\n`);
          clearInterval(interval);
          res.end();
          return;
        }

        // Check if session has expired
        if (new Date() > session.expiresAt && session.status === 'PENDING') {
          await prisma.qrLoginSession.update({
            where: { id: sessionId },
            data: { status: 'EXPIRED' },
          });
        }

        // Send status update
        const statusData = {
          status: session.status,
          user: session.user
            ? {
                id: session.user.id,
                email: session.user.email,
                username: session.user.username,
                role: session.user.role,
                profile: session.user.profile,
              }
            : null,
          expiresAt: session.expiresAt.toISOString(),
        };

        res.write(`data: ${JSON.stringify(statusData)}\n\n`);

        // Close connection if session is in terminal state
        if (['APPROVED', 'REJECTED', 'EXPIRED', 'COMPLETED'].includes(session.status)) {
          clearInterval(interval);
          setTimeout(() => res.end(), 1000); // Give time for final message to send
        }
      } catch (error) {
        logger.error('Error in SSE stream:', error);
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    logger.error('Error setting up SSE stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup status stream',
    });
    return;
  }
};

