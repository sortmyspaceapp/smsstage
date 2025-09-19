import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ActivityService } from '../services/activityService';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

// Generate JWT token
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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, firstName, lastName, phone, role } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
      return;
    }

    // Check if username is provided and already exists
    if (username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUserByUsername) {
        res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
        return;
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: role || 'CUSTOMER',
        profile: {
          create: {
            firstName,
            lastName,
            phone
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Log signup activity
    await ActivityService.logSignup(user.id, email, ipAddress, userAgent);

    // Create welcome notification
    await NotificationService.createAccountCreatedNotification(user.id, email);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        },
        token,
        refreshToken
      }
    });
    return;
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Determine if emailOrUsername is an email or username
    const isEmail = emailOrUsername.includes('@');
    
    // Find user with profile
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: emailOrUsername } : { username: emailOrUsername },
      include: {
        profile: true
      }
    });

    if (!user || !user.isActive) {
      // Log failed login attempt
      if (user) {
        await NotificationService.createLoginFailedNotification(user.id, user.email, ipAddress);
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await NotificationService.createLoginFailedNotification(user.id, user.email, ipAddress);
      
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Log login activity
    await ActivityService.logLogin(user.id, user.email, ipAddress, userAgent);

    // Create login success notification
    await NotificationService.createLoginSuccessNotification(user.id, ipAddress);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        },
        token,
        refreshToken
      }
    });
    return;
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    // Check if session exists and is valid
    const session = await prisma.userSession.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.id,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!session || !session.user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
      return;
    }

    // Generate new tokens
    const newToken = generateToken(session.user.id);
    const newRefreshToken = generateRefreshToken(session.user.id);

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
          role: session.user.role,
          profile: session.user.profile
        },
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
    return;
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
    return;
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (refreshToken) {
      // Get user info before deleting session
      const session = await prisma.userSession.findFirst({
        where: { token: refreshToken },
        include: { user: true }
      });

      // Delete the session
      await prisma.userSession.deleteMany({
        where: { token: refreshToken }
      });

      // Log logout activity if user found
      if (session) {
        await ActivityService.logLogout(session.user.id, session.user.email, ipAddress, userAgent);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    return;
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, type: 'password_reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // For now, just log the token (in production, send via email)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
    return;
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.type !== 'password_reset') {
      res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash }
    });

    // Delete all user sessions to force re-login
    await prisma.userSession.deleteMany({
      where: { userId: decoded.id }
    });

    logger.info(`Password reset for user: ${decoded.id}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
    return;
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
    return;
  }
};
