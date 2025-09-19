import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getCities = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const cities = await prisma.city.findMany({
      where,
      include: {
        _count: {
          select: {
            malls: true
          }
        }
      },
      orderBy: { name: 'asc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.city.count({ where });

    res.json({
      success: true,
      data: {
        cities: cities.map(city => ({
          id: city.id,
          name: city.name,
          state: city.state,
          country: city.country,
          coordinates: city.coordinates,
          mallsCount: city._count.malls
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
    logger.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        malls: {
          where: { isActive: true },
          include: {
            sector: true,
            _count: {
              select: {
                floors: true
              }
            }
          }
        }
      }
    });

    if (!city) {
      res.status(404).json({
        success: false,
        error: 'City not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        city: {
          id: city.id,
          name: city.name,
          state: city.state,
          country: city.country,
          coordinates: city.coordinates,
          malls: city.malls.map(mall => ({
            id: mall.id,
            name: mall.name,
            sector: mall.sector.name,
            floorsCount: mall._count.floors
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Get city by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createCity = async (req: AuthRequest, res: Response) => {
  try {
    const { name, state, country, coordinates } = req.body;

    const city = await prisma.city.create({
      data: {
        name,
        state,
        country,
        coordinates
      }
    });

    logger.info(`City created: ${city.id} by user: ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: { city }
    });
  } catch (error) {
    logger.error('Create city error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateCity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, state, country, coordinates } = req.body;

    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        state,
        country,
        coordinates
      }
    });

    logger.info(`City updated: ${city.id} by user: ${req.user!.id}`);

    res.json({
      success: true,
      data: { city }
    });
  } catch (error) {
    logger.error('Update city error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteCity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.city.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`City deleted: ${id} by user: ${req.user!.id}`);

    res.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    logger.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
