import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, filter = 'all', sortBy = 'date' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause based on filter
    const where: any = {};
    
    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'high_interest') {
      // For high interest, we'll filter based on notification data or use a different approach
      // Since SpaceInterestNotification doesn't have interestLevel, we'll show all for now
      // In a real implementation, you might want to add this field to the model
    }

    // Build orderBy clause based on sortBy
    let orderBy: any = { createdAt: 'desc' };
    
    if (sortBy === 'interest') {
      // Since we don't have interestLevel in SpaceInterestNotification, 
      // we'll just sort by creation date for now
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'space') {
      orderBy = [
        { space: { name: 'asc' } },
        { createdAt: 'desc' }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.spaceInterestNotification.findMany({
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
              }
            }
          },
          interestedUser: {
            include: {
              profile: true
            }
          }
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.spaceInterestNotification.count({ where })
    ]);

    // Transform the data for the frontend
    const transformedLeads = leads.map(lead => ({
      id: lead.id,
      spaceId: lead.spaceId,
      spaceName: lead.space.name,
      mallName: lead.space.floor.mall.name,
      city: lead.space.floor.mall.city.name,
      sector: lead.space.floor.mall.sector.name,
      spacePrice: lead.space.priceMonthly,
      spaceSize: lead.space.sizeSqft,
      spaceFloor: lead.space.floor.floorNumber,
      interestedUserId: lead.interestedUserId,
      interestedUserName: lead.interestedUser.profile ? 
        `${lead.interestedUser.profile.firstName} ${lead.interestedUser.profile.lastName}`.trim() : 
        'Unknown User',
      interestedUserEmail: lead.interestedUser.email,
      interestLevel: 'HIGH', // Default since these are notifications
      notes: '',
      createdAt: lead.createdAt,
      isRead: lead.isRead,
      notificationSent: lead.notificationSent
    }));

    res.json({
      success: true,
      data: {
        leads: transformedLeads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getLeadStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalLeads, unreadLeads, recentLeads] = await Promise.all([
      prisma.spaceInterestNotification.count(),
      prisma.spaceInterestNotification.count({ where: { isRead: false } }),
      prisma.spaceInterestNotification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    // For now, we'll set highInterestLeads to 0 since we don't have that field
    const highInterestLeads = 0;

    res.json({
      success: true,
      data: {
        totalLeads,
        unreadLeads,
        highInterestLeads,
        recentLeads
      }
    });
  } catch (error) {
    logger.error('Get lead stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const markLeadAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;

    const updated = await prisma.spaceInterestNotification.updateMany({
      where: {
        id: leadId
      },
      data: {
        isRead: true
      }
    });

    if (updated.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Lead marked as read'
    });
  } catch (error) {
    logger.error('Mark lead as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const markAllLeadsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.spaceInterestNotification.updateMany({
      where: {
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: 'All leads marked as read'
    });
  } catch (error) {
    logger.error('Mark all leads as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
