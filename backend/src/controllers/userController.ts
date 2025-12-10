import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { ActivityService } from '../services/activityService';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            recentViews: true,
            interestedSpaces: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          stats: {
            recentViewsCount: user._count.recentViews,
            interestedSpacesCount: user._count.interestedSpaces
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, phone, avatarUrl } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Get current profile to track changes
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            firstName,
            lastName,
            phone,
            avatarUrl
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Track which fields were updated
    const updatedFields = [];
    if (currentProfile) {
      if (currentProfile.firstName !== firstName) updatedFields.push('firstName');
      if (currentProfile.lastName !== lastName) updatedFields.push('lastName');
      if (currentProfile.phone !== phone) updatedFields.push('phone');
      if (currentProfile.avatarUrl !== avatarUrl) updatedFields.push('avatarUrl');
    }

    // Log profile update activity
    if (updatedFields.length > 0) {
      await ActivityService.logProfileUpdate(userId, updatedFields, ipAddress, userAgent);
    }

    logger.info(`Profile updated for user: ${userId}`);

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          profile: updatedUser.profile
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const updatedUser = await prisma.userProfile.update({
      where: { userId },
      data: { preferences }
    });

    // Log preference update activity
    const preferenceTypes = Object.keys(preferences);
    if (preferenceTypes.length > 0) {
      await ActivityService.logPreferenceUpdate(userId, preferenceTypes.join(', '), ipAddress, userAgent);
    }

    logger.info(`Preferences updated for user: ${userId}`);

    res.json({
      success: true,
      data: {
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getRecentViews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const recentViews = await prisma.recentView.findMany({
      where: { userId },
      include: {
        space: {
          include: {
            floor: {
              include: {
                mall: {
                  include: {
                    city: true,
                    sector: true
                  }
                }
              }
            },
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.recentView.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        recentViews: recentViews.map(view => ({
          id: view.id,
          spaceId: view.spaceId,
          spaceName: view.space.name,
          mallName: view.space.floor.mall.name,
          city: view.space.floor.mall.city.name,
          sector: view.space.floor.mall.sector.name,
          price: view.space.priceMonthly,
          size: view.space.sizeSqft,
          availability: view.space.availabilityStatus,
          image: view.space.images[0]?.imageUrl,
          viewedAt: view.viewedAt,
          viewDuration: view.viewDuration
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get recent views error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getInterestedSpaces = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, interestLevel } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (interestLevel) {
      where.interestLevel = interestLevel;
    }

    const interestedSpaces = await prisma.interestedSpace.findMany({
      where,
      include: {
        space: {
          include: {
            floor: {
              include: {
                mall: {
                  include: {
                    city: true,
                    sector: true
                  }
                }
              }
            },
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.interestedSpace.count({ where });

    res.json({
      success: true,
      data: {
        interestedSpaces: interestedSpaces.map(item => ({
          id: item.id,
          spaceId: item.spaceId,
          spaceName: item.space.name,
          buildingName: item.space.floor.mall.name, // Changed from mallName to buildingName
          city: item.space.floor.mall.city.name,
          sector: item.space.floor.mall.sector.name,
          price: item.space.priceMonthly,
          size: item.space.sizeSqft,
          availability: item.space.availabilityStatus,
          image: item.space.images[0]?.imageUrl,
          interestLevel: item.interestLevel,
          notes: item.notes,
          addedAt: item.createdAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get interested spaces error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const addToInterested = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { spaceId, interestLevel = 'MEDIUM', notes } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check if space exists
    const space = await prisma.space.findUnique({
      where: { id: spaceId }
    });

    if (!space) {
      res.status(404).json({
        success: false,
        error: 'Space not found'
      });
      return;
    }

    // Check if already interested
    const existing = await prisma.interestedSpace.findUnique({
      where: {
        userId_spaceId: {
          userId,
          spaceId
        }
      }
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Space already in interested list'
      });
      return;
    }

    const interestedSpace = await prisma.interestedSpace.create({
      data: {
        userId,
        spaceId,
        interestLevel,
        notes
      }
    });

    // Log space interest activity
    await ActivityService.logSpaceInterest(userId, spaceId, interestLevel, ipAddress, userAgent);

    // Create space interest notifications
    await NotificationService.createSpaceInterestNotification(spaceId, userId);

    logger.info(`Space added to interested list: ${spaceId} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: { interestedSpace }
    });
  } catch (error) {
    logger.error('Add to interested error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const removeFromInterested = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { spaceId } = req.params;

    const deleted = await prisma.interestedSpace.deleteMany({
      where: {
        userId,
        spaceId
      }
    });

    if (deleted.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Space not found in interested list'
      });
    }

    logger.info(`Space removed from interested list: ${spaceId} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Space removed from interested list'
    });
  } catch (error) {
    logger.error('Remove from interested error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateInterestLevel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { spaceId } = req.params;
    const { interestLevel, notes } = req.body;

    const updated = await prisma.interestedSpace.updateMany({
      where: {
        userId,
        spaceId
      },
      data: {
        interestLevel,
        notes
      }
    });

    if (updated.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Space not found in interested list'
      });
    }

    logger.info(`Interest level updated for space: ${spaceId} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Interest level updated successfully'
    });
  } catch (error) {
    logger.error('Update interest level error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req: any, res: any): Promise<void> => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    if (role) {
      where.role = role as string;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        _count: {
          select: {
            recentViews: true,
            interestedSpaces: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    });

    const total = await prisma.user.count({ where });

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.profile,
          createdAt: user.createdAt,
          _count: user._count
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
    return;
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
    return;
  }
};

// Create user (Admin only)
export const createUser = async (req: any, res: any): Promise<void> => {
  try {
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        profile: profile ? {
          create: profile
        } : undefined
      },
      include: {
        profile: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.profile,
          createdAt: user.createdAt
        }
      }
    });
    return;
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
    return;
  }
};

// Update user (Admin only)
export const updateUser = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role, profile, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: email || undefined,
        role: role || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        profile: profile ? {
          upsert: {
            create: profile,
            update: profile
          }
        } : undefined
      },
      include: {
        profile: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.profile,
          createdAt: user.createdAt
        }
      }
    });
    return;
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
    return;
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Prevent deletion of admin users
    if (user.role === 'ADMIN') {
      res.status(400).json({ success: false, error: 'Cannot delete admin users' });
      return;
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
    return;
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
    return;
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ success: false, error: 'New password is required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashedPassword
      }
    });

    logger.info(`Password reset for user: ${id} by admin: ${req.user?.id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
    return;
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
    return;
  }
};

// Change own password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new passwords are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }

    // Get user to verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      res.status(400).json({ success: false, error: 'Incorrect current password' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword
      }
    });

    // Log password change activity
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await ActivityService.logPasswordChange(userId, ipAddress, userAgent);

    logger.info(`Password changed for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    return;
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
    return;
  }
};
