import { PrismaClient, ActivityType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ActivityData {
  userId: string;
  activityType: ActivityType;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  /**
   * Log user activity
   */
  static async logActivity(data: ActivityData): Promise<void> {
    try {
      await prisma.userActivity.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          description: data.description,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        }
      });

      logger.info(`Activity logged: ${data.activityType} for user ${data.userId}`);
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Log user signup activity
   */
  static async logSignup(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'SIGNUP',
      description: `User registered with email: ${email}`,
      metadata: { email },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user login activity
   */
  static async logLogin(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'LOGIN',
      description: `User logged in with email: ${email}`,
      metadata: { email },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user logout activity
   */
  static async logLogout(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'LOGOUT',
      description: `User logged out with email: ${email}`,
      metadata: { email },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log space interest activity
   */
  static async logSpaceInterest(userId: string, spaceId: string, interestLevel: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'SPACE_INTEREST',
      description: `User expressed interest in space: ${spaceId}`,
      metadata: { spaceId, interestLevel },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log profile update activity
   */
  static async logProfileUpdate(userId: string, updatedFields: string[], ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'PROFILE_UPDATE',
      description: `User updated profile fields: ${updatedFields.join(', ')}`,
      metadata: { updatedFields },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log preference update activity
   */
  static async logPreferenceUpdate(userId: string, preferenceType: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity({
      userId,
      activityType: 'PREFERENCE_UPDATE',
      description: `User updated ${preferenceType} preferences`,
      metadata: { preferenceType },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get user activities with pagination
   */
  static async getUserActivities(
    userId: string,
    page: number = 1,
    limit: number = 20,
    activityType?: ActivityType
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    
    if (activityType) {
      where.activityType = activityType;
    }

    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userActivity.count({ where })
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get activity statistics for a user
   */
  static async getActivityStats(userId: string) {
    const stats = await prisma.userActivity.groupBy({
      by: ['activityType'],
      where: { userId },
      _count: { activityType: true }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.activityType] = stat._count.activityType;
      return acc;
    }, {} as Record<ActivityType, number>);
  }
}
