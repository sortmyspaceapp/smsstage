import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ActivityService } from '../services/activityService';

const prisma = new PrismaClient();

export const getUserActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, activityType } = req.query;

    const result = await ActivityService.getUserActivities(
      userId,
      Number(page),
      Number(limit),
      activityType as any
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getActivityStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const stats = await ActivityService.getActivityStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Admin only - Get all activities
export const getAllActivities = async (req: any, res: any): Promise<void> => {
  try {
    const { page = 1, limit = 50, userId, activityType, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (activityType) {
      where.activityType = activityType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.userActivity.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        activities: activities.map(activity => ({
          id: activity.id,
          userId: activity.userId,
          userEmail: activity.user.email,
          userName: activity.user.profile ? 
            `${activity.user.profile.firstName} ${activity.user.profile.lastName}` : 
            'Unknown User',
          activityType: activity.activityType,
          description: activity.description,
          metadata: activity.metadata,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          createdAt: activity.createdAt
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
    logger.error('Get all activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Admin only - Get analytics
export const getAnalytics = async (req: any, res: any): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const daysNumber = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    // Get daily stats for views, interests, and inquiries
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(ua.created_at) as date,
        COUNT(CASE WHEN ua."activityType" = 'SPACE_VIEW' THEN 1 END) as "totalViews",
        COUNT(CASE WHEN ua."activityType" = 'SPACE_INTEREST' THEN 1 END) as "totalClicks",
        COUNT(CASE WHEN ua."activityType" = 'SPACE_INQUIRY' THEN 1 END) as "totalInquiries",
        ARRAY_AGG(DISTINCT m.name) as malls
      FROM user_activities ua
      LEFT JOIN spaces s ON ua.metadata->>'spaceId' = s.id
      LEFT JOIN floors f ON s.floor_id = f.id
      LEFT JOIN malls m ON f.mall_id = m.id
      WHERE ua.created_at >= ${startDate}
        AND ua."activityType" IN ('SPACE_VIEW', 'SPACE_INTEREST', 'SPACE_INQUIRY')
      GROUP BY DATE(ua.created_at)
      ORDER BY date DESC
    `;

    // Get top performing spaces
    const topSpaces = await prisma.$queryRaw`
      SELECT 
        ua.metadata->>'spaceId' as "spaceId",
        COUNT(CASE WHEN ua."activityType" = 'SPACE_VIEW' THEN 1 END) as "viewCount",
        s.id,
        s.name,
        s.type,
        f.name as floor_name,
        m.name as mall_name,
        c.name as city_name,
        c.state
      FROM user_activities ua
      LEFT JOIN spaces s ON ua.metadata->>'spaceId' = s.id
      LEFT JOIN floors f ON s.floor_id = f.id
      LEFT JOIN malls m ON f.mall_id = m.id
      LEFT JOIN cities c ON m.city_id = c.id
      WHERE ua.created_at >= ${startDate}
        AND ua."activityType" = 'SPACE_VIEW'
        AND ua.metadata->>'spaceId' IS NOT NULL
      GROUP BY ua.metadata->>'spaceId', s.id, s.name, s.type, f.name, m.name, c.name, c.state
      ORDER BY "viewCount" DESC
      LIMIT 10
    `;

    // Calculate summary stats
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN ua."activityType" = 'SPACE_VIEW' THEN 1 END) as "totalViews",
        COUNT(CASE WHEN ua."activityType" = 'SPACE_INTEREST' THEN 1 END) as "totalClicks",
        COUNT(CASE WHEN ua."activityType" = 'SPACE_INQUIRY' THEN 1 END) as "totalInquiries"
      FROM user_activities ua
      WHERE ua.created_at >= ${startDate}
        AND ua."activityType" IN ('SPACE_VIEW', 'SPACE_INTEREST', 'SPACE_INQUIRY')
    `;

    // Get login statistics
    const loginStats = await prisma.$queryRaw`
      SELECT 
        DATE(ua.created_at) as date,
        COUNT(CASE WHEN ua."activityType" = 'LOGIN' THEN 1 END) as "totalLogins",
        0 as "totalFailedLogins",
        COUNT(DISTINCT ua.user_id) as "uniqueUsers"
      FROM user_activities ua
      WHERE ua.created_at >= ${startDate}
        AND ua."activityType" = 'LOGIN'
      GROUP BY DATE(ua.created_at)
      ORDER BY date DESC
    `;

    const summaryData = (summary as any[])[0] || {};
    const loginSummary = await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN ua."activityType" = 'LOGIN' THEN 1 END) as "totalLogins",
        0 as "totalFailedLogins",
        COUNT(DISTINCT CASE WHEN ua."activityType" = 'LOGIN' THEN ua.user_id END) as "uniqueUsers"
      FROM user_activities ua
      WHERE ua.created_at >= ${startDate}
        AND ua."activityType" = 'LOGIN'
    `;

    const loginSummaryData = (loginSummary as any[])[0] || {};

    // Convert BigInt values to numbers for JSON serialization
    const processedDailyStats = (dailyStats as any[]).map(stat => ({
      ...stat,
      totalViews: Number(stat.totalViews),
      totalClicks: Number(stat.totalClicks),
      totalInquiries: Number(stat.totalInquiries)
    }));

    const processedTopSpaces = (topSpaces as any[]).map(space => ({
      ...space,
      viewCount: Number(space.viewCount)
    }));

    const processedLoginStats = (loginStats as any[]).map(stat => ({
      ...stat,
      totalLogins: Number(stat.totalLogins),
      totalFailedLogins: Number(stat.totalFailedLogins),
      uniqueUsers: Number(stat.uniqueUsers)
    }));

    res.json({
      success: true,
      data: {
        dailyStats: processedDailyStats || [],
        topSpaces: processedTopSpaces || [],
        summary: {
          totalDays: daysNumber,
          totalViews: Number(summaryData?.totalViews || 0),
          totalClicks: Number(summaryData?.totalClicks || 0),
          totalInquiries: Number(summaryData?.totalInquiries || 0),
          totalLogins: Number(loginSummaryData?.totalLogins || 0),
          totalFailedLogins: Number(loginSummaryData?.totalFailedLogins || 0),
          uniqueUsers: Number(loginSummaryData?.uniqueUsers || 0)
        },
        loginStats: processedLoginStats || []
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};