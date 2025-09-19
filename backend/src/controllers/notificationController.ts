import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    const result = await NotificationService.getUserNotifications(
      userId,
      Number(page),
      Number(limit),
      unreadOnly === 'true',
      type as string
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    await NotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getNotificationCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { unreadOnly = true, type } = req.query;

    const count = await NotificationService.getNotificationCount(
      userId,
      unreadOnly === 'true',
      type as string
    );

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const deleted = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });

    if (deleted.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
