import { PrismaClient, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(data: NotificationData): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
        }
      });

      logger.info(`Notification created for user ${data.userId}: ${data.title}`);
    } catch (error) {
      logger.error('Failed to create notification:', error);
    }
  }

  /**
   * Create space interest notification for mall managers
   */
  static async createSpaceInterestNotification(
    spaceId: string,
    interestedUserId: string,
    mallManagerId?: string
  ): Promise<void> {
    try {
      // Get space details
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: {
          floor: {
            include: {
              mall: {
                include: {
                  city: true,
                  sector: true,
                  manager: true
                }
              }
            }
          }
        }
      });

      if (!space) {
        logger.error(`Space not found: ${spaceId}`);
        return;
      }

      // Get interested user details
      const interestedUser = await prisma.user.findUnique({
        where: { id: interestedUserId },
        include: { profile: true }
      });

      if (!interestedUser) {
        logger.error(`Interested user not found: ${interestedUserId}`);
        return;
      }

      const mallManagerIdToUse = mallManagerId || space.floor.mall.managerId;
      
      if (!mallManagerIdToUse) {
        logger.warn(`No mall manager found for space ${spaceId}`);
        return;
      }

      // Create space interest notification record
      await prisma.spaceInterestNotification.upsert({
        where: {
          spaceId_interestedUserId: {
            spaceId,
            interestedUserId
          }
        },
        update: {
          notificationSent: true,
          updatedAt: new Date()
        },
        create: {
          spaceId,
          interestedUserId,
          mallManagerId: mallManagerIdToUse,
          notificationSent: true
        }
      });

      // Create notification for mall manager
      await this.createNotification({
        userId: mallManagerIdToUse,
        type: 'SPACE_INTEREST',
        title: 'New Space Interest',
        message: `${interestedUser.profile?.firstName || 'A user'} ${interestedUser.profile?.lastName || ''} is interested in space "${space.name}" in ${space.floor.mall.name}`,
        data: {
          spaceId,
          spaceName: space.name,
          mallName: space.floor.mall.name,
          city: space.floor.mall.city.name,
          sector: space.floor.mall.sector.name,
          interestedUserId,
          interestedUserName: `${interestedUser.profile?.firstName || ''} ${interestedUser.profile?.lastName || ''}`.trim(),
          interestedUserEmail: interestedUser.email,
          spacePrice: space.priceMonthly,
          spaceSize: space.sizeSqft,
          spaceFloor: space.floor.floorNumber
        }
      });

      // Create notification for interested user
      await this.createNotification({
        userId: interestedUserId,
        type: 'SPACE_INTEREST',
        title: 'Interest Recorded',
        message: `Your interest in space "${space.name}" has been recorded. The mall manager will contact you soon.`,
        data: {
          spaceId,
          spaceName: space.name,
          mallName: space.floor.mall.name,
          city: space.floor.mall.city.name,
          sector: space.floor.mall.sector.name
        }
      });

      logger.info(`Space interest notifications created for space ${spaceId} and user ${interestedUserId}`);
    } catch (error) {
      logger.error('Failed to create space interest notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
    filterType?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }

    // Filter by notification type if specified
    if (filterType) {
      where.type = filterType;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true
        }
      });

      logger.info(`Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      logger.info(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Get notification count for user
   */
  static async getNotificationCount(userId: string, unreadOnly: boolean = true, filterType?: string): Promise<number> {
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }

    // Filter by notification type if specified
    if (filterType) {
      where.type = filterType;
    }

    return await prisma.notification.count({ where });
  }

  /**
   * Create account creation notification
   */
  static async createAccountCreatedNotification(userId: string, email: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'ACCOUNT_CREATED',
      title: 'Welcome to SpaceFinder!',
      message: `Your account has been successfully created with email ${email}. Start exploring amazing spaces!`,
      data: { email }
    });
  }

  /**
   * Create login success notification
   */
  static async createLoginSuccessNotification(userId: string, ipAddress?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'LOGIN_SUCCESS',
      title: 'Login Successful',
      message: `You have successfully logged in to your SpaceFinder account.`,
      data: { ipAddress, loginTime: new Date().toISOString() }
    });
  }

  /**
   * Create login failed notification
   */
  static async createLoginFailedNotification(userId: string, email: string, ipAddress?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'LOGIN_FAILED',
      title: 'Failed Login Attempt',
      message: `There was a failed login attempt for your account with email ${email}. If this wasn't you, please secure your account.`,
      data: { email, ipAddress, attemptTime: new Date().toISOString() }
    });
  }
}
