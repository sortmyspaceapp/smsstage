import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Create a new floor
export const createFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mallId, floorNumber, name } = req.body;

    if (!mallId || floorNumber === undefined || floorNumber === null || !name) {
      res.status(400).json({
        success: false,
        error: 'mallId, floorNumber, and name are required'
      });
      return;
    }

    // Check if mall exists
    const mall = await prisma.mall.findUnique({
      where: { id: mallId }
    });

    if (!mall) {
      res.status(404).json({
        success: false,
        error: 'Mall not found'
      });
      return;
    }

    // Check if floor number already exists for this mall
    const existingFloor = await prisma.floor.findFirst({
      where: {
        mallId,
        floorNumber
      }
    });

    if (existingFloor) {
      res.status(400).json({
        success: false,
        error: `Floor number ${floorNumber} already exists for this mall`
      });
      return;
    }

    // Create the floor
    const floor = await prisma.floor.create({
      data: {
        mallId,
        floorNumber,
        name: name.trim()
      },
      include: {
        mall: {
          include: {
            city: true,
            sector: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { floor },
      message: 'Floor created successfully'
    });
  } catch (error) {
    logger.error('Error creating floor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create floor'
    });
  }
};

// Get floors for a mall
export const getFloorsByMall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mallId } = req.params;

    const floors = await prisma.floor.findMany({
      where: { 
        mallId,
        isActive: true
      },
      include: {
        spaces: {
          select: {
            id: true,
            name: true,
            type: true,
            availabilityStatus: true,
            sizeSqft: true,
            priceMonthly: true
          }
        }
      },
      orderBy: {
        floorNumber: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: { floors }
    });
  } catch (error) {
    logger.error('Error fetching floors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch floors'
    });
  }
};

// Update a floor
export const updateFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { floorNumber, name } = req.body;

    const floor = await prisma.floor.findUnique({
      where: { id }
    });

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Floor not found'
      });
      return;
    }

    // Check if floor number already exists for this mall (if changing floor number)
    if (floorNumber !== undefined && floorNumber !== null && floorNumber !== floor.floorNumber) {
      const existingFloor = await prisma.floor.findFirst({
        where: {
          mallId: floor.mallId,
          floorNumber,
          id: { not: id }
        }
      });

      if (existingFloor) {
        res.status(400).json({
          success: false,
          error: `Floor number ${floorNumber} already exists for this mall`
        });
        return;
      }
    }

    const updatedFloor = await prisma.floor.update({
      where: { id },
      data: {
        ...(floorNumber !== undefined && floorNumber !== null && { floorNumber }),
        ...(name && { name: name.trim() })
      },
      include: {
        mall: {
          include: {
            city: true,
            sector: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: { floor: updatedFloor },
      message: 'Floor updated successfully'
    });
  } catch (error) {
    logger.error('Error updating floor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update floor'
    });
  }
};

// Delete a floor
export const deleteFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        spaces: true
      }
    });

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Floor not found'
      });
      return;
    }

    // Check if floor has spaces
    if (floor.spaces.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete floor with existing spaces. Please delete all spaces first.'
      });
      return;
    }

    // Soft delete by setting isActive to false
    await prisma.floor.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(200).json({
      success: true,
      message: 'Floor deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting floor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete floor'
    });
  }
};

// Get floor by ID
export const getFloorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        mall: {
          include: {
            city: true,
            sector: true
          }
        },
        spaces: {
          select: {
            id: true,
            name: true,
            type: true,
            availabilityStatus: true,
            sizeSqft: true,
            priceMonthly: true
          }
        }
      }
    });

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Floor not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { floor }
    });
  } catch (error) {
    logger.error('Error fetching floor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch floor'
    });
  }
};
