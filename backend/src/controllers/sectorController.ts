import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getSectors = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const sectors = await prisma.sector.findMany({
      where,
      include: {
        _count: {
          select: {
            malls: true
          }
        }
      },
      skip,
      take: Number(limit)
    });

    // Custom sorting to ensure correct order
    const sectorOrder = ['Mall Space', 'Event Space', 'Apartments', 'Public Space'];
    sectors.sort((a, b) => {
      const aIndex = sectorOrder.indexOf(a.name);
      const bIndex = sectorOrder.indexOf(b.name);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    const total = await prisma.sector.count({ where });

    res.json({
      success: true,
      data: {
        sectors: sectors.map(sector => ({
          id: sector.id,
          name: sector.name,
          description: sector.description,
          icon: sector.icon,
          color: sector.color,
          buildingsCount: sector._count.malls
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
    logger.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getSectorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        malls: {
          where: { isActive: true },
          include: {
            city: true,
            _count: {
              select: {
                floors: true
              }
            }
          }
        }
      }
    });

    if (!sector) {
      res.status(404).json({
        success: false,
        error: 'Sector not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        sector: {
          id: sector.id,
          name: sector.name,
          description: sector.description,
          icon: sector.icon,
          color: sector.color,
          malls: sector.malls.map(mall => ({
            id: mall.id,
            name: mall.name,
            city: mall.city.name,
            floorsCount: mall._count.floors
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Get sector by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createSector = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;

    const sector = await prisma.sector.create({
      data: {
        name,
        description,
        icon,
        color
      }
    });

    logger.info(`Sector created: ${sector.id} by user: ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: { sector }
    });
  } catch (error) {
    logger.error('Create sector error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateSector = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        color
      }
    });

    logger.info(`Sector updated: ${sector.id} by user: ${req.user!.id}`);

    res.json({
      success: true,
      data: { sector }
    });
  } catch (error) {
    logger.error('Update sector error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteSector = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.sector.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Sector deleted: ${id} by user: ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Sector deleted successfully'
    });
  } catch (error) {
    logger.error('Delete sector error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
