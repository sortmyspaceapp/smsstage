import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const searchSpaces = async (req: Request, res: Response) => {
  try {
    const {
      city,
      sector,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
      amenities,
      availability,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      isActive: true,
      floor: {
        mall: {
          isActive: true
        }
      }
    };

    if (city) {
      where.floor.mall.city = { name: { contains: city as string, mode: 'insensitive' } };
    }

    if (sector) {
      where.floor.mall.sector = { name: { contains: sector as string, mode: 'insensitive' } };
    }

    if (minPrice || maxPrice) {
      where.priceMonthly = {};
      if (minPrice) where.priceMonthly.gte = Number(minPrice);
      if (maxPrice) where.priceMonthly.lte = Number(maxPrice);
    }

    if (minSize || maxSize) {
      where.sizeSqft = {};
      if (minSize) where.sizeSqft.gte = Number(minSize);
      if (maxSize) where.sizeSqft.lte = Number(maxSize);
    }

    if (availability) {
      where.availabilityStatus = availability;
    }

    if (amenities && Array.isArray(amenities)) {
      where.amenities = {
        some: {
          type: { in: amenities }
        }
      };
    }

    const spaces = await prisma.space.findMany({
      where,
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
        amenities: true,
        images: {
          where: { isPrimary: true },
          take: 1
        },
        _count: {
          select: {
            recentViews: true,
            interestedSpaces: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.space.count({ where });

    res.json({
      success: true,
      data: {
        spaces: spaces.map(space => ({
          id: space.id,
          name: space.name,
          type: space.type,
          size: space.sizeSqft,
          price: space.priceMonthly,
          availability: space.availabilityStatus,
          description: space.description,
          frontage: space.frontage,
          adjacentBrands: space.adjacentBrands,
          mall: {
            id: space.floor.mall.id,
            name: space.floor.mall.name,
            city: space.floor.mall.city.name,
            sector: space.floor.mall.sector.name,
            address: space.floor.mall.address,
            rating: space.floor.mall.rating
          },
          floor: {
            id: space.floor.id,
            name: space.floor.name,
            floorNumber: space.floor.floorNumber
          },
          amenities: space.amenities,
          image: space.images[0]?.imageUrl,
          stats: {
            views: space._count.recentViews,
            interested: space._count.interestedSpaces
          }
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
    logger.error('Search spaces error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSpaceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const space = await prisma.space.findUnique({
      where: { id },
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
        amenities: true,
        images: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: {
            recentViews: true,
            interestedSpaces: true
          }
        }
      }
    });

    if (!space) {
      res.status(404).json({
        success: false,
        error: 'Space not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        space: {
          id: space.id,
          name: space.name,
          type: space.type,
          size: space.sizeSqft,
          price: space.priceMonthly,
          availability: space.availabilityStatus,
          description: space.description,
          frontage: space.frontage,
          adjacentBrands: space.adjacentBrands,
          svgElementId: space.svgElementId,
          mall: {
            id: space.floor.mall.id,
            name: space.floor.mall.name,
            city: space.floor.mall.city.name,
            sector: space.floor.mall.sector.name,
            address: space.floor.mall.address,
            rating: space.floor.mall.rating,
            coordinates: space.floor.mall.coordinates
          },
          floor: {
            id: space.floor.id,
            name: space.floor.name,
            floorNumber: space.floor.floorNumber,
            svgFileUrl: space.floor.svgFileUrl
          },
          amenities: space.amenities,
          images: space.images,
          contactDetails: space.contactDetails,
          stats: {
            views: space._count.recentViews,
            interested: space._count.interestedSpaces
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get space by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const trackSpaceView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.id;
    const { viewDuration = 0 } = req.body;

    // Check if space exists
    const space = await prisma.space.findUnique({
      where: { id }
    });

    if (!space) {
      res.status(404).json({
        success: false,
        error: 'Space not found'
      });
      return;
    }

    // If user is authenticated, track the view
    if (userId) {
      await prisma.recentView.upsert({
        where: {
          userId_spaceId: {
            userId,
            spaceId: id
          }
        },
        update: {
          viewDuration: viewDuration,
          viewedAt: new Date()
        },
        create: {
          userId,
          spaceId: id,
          viewDuration: viewDuration
        }
      });
    }

    res.json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    logger.error('Track space view error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const submitInquiry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { message, contactPreference = 'email' } = req.body;

    // Check if space exists
    const space = await prisma.space.findUnique({
      where: { id }
    });

    if (!space) {
      res.status(404).json({
        success: false,
        error: 'Space not found'
      });
      return;
    }

    const inquiry = await prisma.spaceInquiry.create({
      data: {
        userId,
        spaceId: id,
        message,
        contactPreference
      }
    });

    logger.info(`New space inquiry submitted: ${id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: { inquiry }
    });
  } catch (error) {
    logger.error('Submit inquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSpaceInquiries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Check if user has permission to view inquiries
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MALL_MANAGER'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    const inquiries = await prisma.spaceInquiry.findMany({
      where: { spaceId: id },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.spaceInquiry.count({
      where: { spaceId: id }
    });

    res.json({
      success: true,
      data: {
        inquiries: inquiries.map(inquiry => ({
          id: inquiry.id,
          message: inquiry.message,
          contactPreference: inquiry.contactPreference,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          user: {
            id: inquiry.user.id,
            email: inquiry.user.email,
            profile: inquiry.user.profile
          }
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
    logger.error('Get space inquiries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new space
export const createSpace = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      floorId,
      svgElementId,
      name,
      type,
      sizeSqft,
      priceMonthly,
      availabilityStatus,
      description,
      frontage,
      adjacentBrands,
      contactDetails,
    } = req.body;

    // Validate required fields
    if (!floorId || !svgElementId || !name || !type || !sizeSqft || !priceMonthly) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: floorId, svgElementId, name, type, sizeSqft, priceMonthly',
      });
      return;
    }

    const space = await prisma.space.create({
      data: {
        floorId,
        svgElementId,
        name,
        type,
        sizeSqft,
        priceMonthly,
        availabilityStatus: availabilityStatus || 'AVAILABLE',
        description,
        frontage,
        adjacentBrands: adjacentBrands || [],
        contactDetails: contactDetails || null,
      },
      include: {
        floor: {
          include: {
            mall: {
              include: {
                city: true,
                sector: true,
              },
            },
          },
        },
        amenities: true,
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { space },
    });
    return;
  } catch (error) {
    logger.error('Error creating space:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create space',
    });
    return;
  }
};

// Update space
export const updateSpace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const space = await prisma.space.update({
      where: { id },
      data: updateData,
      include: {
        floor: {
          include: {
            mall: {
              include: {
                city: true,
                sector: true,
              },
            },
          },
        },
        amenities: true,
        images: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { space },
    });
    return;
  } catch (error) {
    logger.error('Error updating space:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update space',
    });
    return;
  }
};

// Delete space
export const deleteSpace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if space has related data
    const spaceWithRelations = await prisma.space.findUnique({
      where: { id },
      include: {
        recentViews: true,
        interestedSpaces: true,
        inquiries: true,
      },
    });

    if (!spaceWithRelations) {
      res.status(404).json({
        success: false,
        error: 'Space not found',
      });
      return;
    }

    // Check if space has inquiries or interested users
    if (spaceWithRelations.inquiries.length > 0 || spaceWithRelations.interestedSpaces.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete space with existing inquiries or interested users. Please handle them first.',
      });
      return;
    }

    await prisma.space.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Space deleted successfully',
    });
    return;
  } catch (error) {
    logger.error('Error deleting space:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete space',
    });
    return;
  }
};

// Update space availability
export const updateSpaceAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    if (!availabilityStatus) {
      res.status(400).json({
        success: false,
        error: 'availabilityStatus is required',
      });
      return;
    }

    // Get current space to log the change
    const currentSpace = await prisma.space.findUnique({
      where: { id },
      select: { availabilityStatus: true },
    });

    if (!currentSpace) {
      res.status(404).json({
        success: false,
        error: 'Space not found',
      });
      return;
    }

    // Update space availability
    const space = await prisma.space.update({
      where: { id },
      data: { availabilityStatus },
      include: {
        floor: {
          include: {
            mall: {
              include: {
                city: true,
                sector: true,
              },
            },
          },
        },
      },
    });

    // Log the availability change
    await prisma.spaceAvailabilityLog.create({
      data: {
        spaceId: id,
        oldStatus: currentSpace.availabilityStatus,
        newStatus: availabilityStatus,
        changedBy: (req as AuthRequest).user?.id || 'system',
      },
    });

    res.status(200).json({
      success: true,
      data: { space },
    });
    return;
  } catch (error) {
    logger.error('Error updating space availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update space availability',
    });
    return;
  }
};
