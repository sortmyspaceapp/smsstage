import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Get all malls with pagination
export const getMalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [malls, total] = await Promise.all([
      prisma.mall.findMany({
        skip,
        take: limit,
        include: {
          city: true,
          sector: true,
          manager: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          floors: {
            select: {
              id: true,
              floorNumber: true,
              name: true,
              spaces: {
                select: {
                  id: true,
                  availabilityStatus: true,
                },
              },
            },
          },
          _count: {
            select: {
              floors: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.mall.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Calculate spaces count for each mall
    const mallsWithSpacesCount = malls.map(mall => ({
      ...mall,
      spacesCount: mall.floors.reduce((total, floor) => total + floor.spaces.length, 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        malls: mallsWithSpacesCount,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
        },
      },
    });
    return;
  } catch (error) {
    logger.error('Error fetching malls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch malls',
    });
    return;
  }
};

// Get mall by ID
export const getMallById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mall = await prisma.mall.findUnique({
      where: { id },
      include: {
        city: true,
        sector: true,
        manager: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        floors: {
          include: {
            spaces: {
              select: {
                id: true,
                name: true,
                type: true,
                availabilityStatus: true,
                sizeSqft: true,
                priceMonthly: true,
              },
            },
          },
          orderBy: {
            floorNumber: 'asc',
          },
        },
      },
    });

    if (!mall) {
      res.status(404).json({
        success: false,
        error: 'Mall not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { mall },
    });
    return;
  } catch (error) {
    logger.error('Error fetching mall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mall',
    });
    return;
  }
};

// Create new mall
export const createMall = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      cityId,
      sectorId,
      address,
      coordinates,
      rating,
      images,
      managerId,
    } = req.body;

    // Validate required fields
    if (!name || !cityId || !sectorId || !address) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, cityId, sectorId, address',
      });
      return;
    }

    const mall = await prisma.mall.create({
      data: {
        name,
        cityId,
        sectorId,
        address,
        coordinates: coordinates || null,
        rating: rating || 0,
        images: images || [],
        managerId: managerId || null,
      },
      include: {
        city: true,
        sector: true,
        manager: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { mall },
    });
    return;
  } catch (error) {
    logger.error('Error creating mall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mall',
    });
    return;
  }
};

// Update mall
export const updateMall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const mall = await prisma.mall.update({
      where: { id },
      data: updateData,
      include: {
        city: true,
        sector: true,
        manager: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { mall },
    });
    return;
  } catch (error) {
    logger.error('Error updating mall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mall',
    });
    return;
  }
};

// Delete mall
export const deleteMall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if mall has floors/spaces
    const mallWithSpaces = await prisma.mall.findUnique({
      where: { id },
      include: {
        floors: {
          include: {
            spaces: true,
          },
        },
      },
    });

    if (!mallWithSpaces) {
      res.status(404).json({
        success: false,
        error: 'Mall not found',
      });
      return;
    }

    // Check if mall has spaces
    const hasSpaces = mallWithSpaces.floors.some(floor => floor.spaces.length > 0);
    if (hasSpaces) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete mall with existing spaces. Please delete all spaces first.',
      });
      return;
    }

    await prisma.mall.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Mall deleted successfully',
    });
    return;
  } catch (error) {
    logger.error('Error deleting mall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete mall',
    });
    return;
  }
};

// Get mall analytics
export const getMallAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mall = await prisma.mall.findUnique({
      where: { id },
      include: {
        floors: {
          include: {
            spaces: {
              include: {
                recentViews: true,
                inquiries: true,
                interestedSpaces: true,
              },
            },
          },
        },
        analytics: {
          orderBy: {
            date: 'desc',
          },
          take: 30, // Last 30 days
        },
      },
    });

    if (!mall) {
      res.status(404).json({
        success: false,
        error: 'Mall not found',
      });
      return;
    }

    // Calculate analytics
    const totalSpaces = mall.floors.reduce((sum, floor) => sum + floor.spaces.length, 0);
    const availableSpaces = mall.floors.reduce(
      (sum, floor) => sum + floor.spaces.filter(space => space.availabilityStatus === 'AVAILABLE').length,
      0
    );
    const totalViews = mall.floors.reduce(
      (sum, floor) => sum + floor.spaces.reduce((floorSum, space) => floorSum + space.recentViews.length, 0),
      0
    );
    const totalInquiries = mall.floors.reduce(
      (sum, floor) => sum + floor.spaces.reduce((floorSum, space) => floorSum + space.inquiries.length, 0),
      0
    );
    const totalInterested = mall.floors.reduce(
      (sum, floor) => sum + floor.spaces.reduce((floorSum, space) => floorSum + space.interestedSpaces.length, 0),
      0
    );

    const analytics = {
      totalSpaces,
      availableSpaces,
      occupiedSpaces: totalSpaces - availableSpaces,
      totalViews,
      totalInquiries,
      totalInterested,
      conversionRate: totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0,
      historicalData: mall.analytics,
    };

    res.status(200).json({
      success: true,
      data: { analytics },
    });
    return;
  } catch (error) {
    logger.error('Error fetching mall analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mall analytics',
    });
    return;
  }
};
