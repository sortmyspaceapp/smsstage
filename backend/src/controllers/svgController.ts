import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { access } from 'fs/promises';
import { promisify } from 'util';

const prisma = new PrismaClient();
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configure multer for SVG file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/svg');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `svg-${uniqueSuffix}.svg`);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/svg+xml' || file.originalname.endsWith('.svg')) {
      cb(null, true);
    } else {
      cb(new Error('Only SVG files are allowed!') as any, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload SVG file and extract path IDs
export const uploadSvg = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mallId, floorId } = req.body;
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No SVG file uploaded'
      });
      return;
    }

    if (!mallId || !floorId) {
      res.status(400).json({
        success: false,
        error: 'mallId and floorId are required'
      });
      return;
    }

    // Read the uploaded SVG file
    const svgPath = req.file.path;
    const svgContent = await readFile(svgPath, 'utf8');

    // Extract path IDs from SVG
    const pathIds = extractPathIds(svgContent);

    // Get current floor to check svgVersion
    const currentFloor = await prisma.floor.findUnique({
      where: { id: floorId }
    });

    // Update floor with SVG file URL
    const updatedFloor = await prisma.floor.update({
      where: { id: floorId },
      data: {
        svgFileUrl: `/uploads/svg/${req.file.filename}`,
        svgVersion: (currentFloor?.svgVersion || 0) + 1
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

    // Create spaces for each path ID if they don't exist
    const spaces = await Promise.all(
      pathIds.map(async (pathId) => {
        const existingSpace = await prisma.space.findFirst({
          where: {
            floorId,
            svgElementId: pathId
          }
        });

        if (!existingSpace) {
          return await prisma.space.create({
            data: {
              floorId,
              svgElementId: pathId,
              name: `Space ${pathId}`,
              type: 'RETAIL',
              sizeSqft: 100, // Default size
              priceMonthly: 10000, // Default price
              availabilityStatus: 'AVAILABLE',
              description: `Auto-generated space for SVG element ${pathId}`,
              frontage: 'Standard',
              adjacentBrands: [],
              contactDetails: undefined
            }
          });
        }
        return existingSpace;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        floor: updatedFloor,
        spaces,
        pathIds,
        svgUrl: `/uploads/svg/${req.file.filename}`
      }
    });
    return;
  } catch (error) {
    logger.error('Error uploading SVG:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload SVG'
    });
    return;
  }
};

// Extract path IDs from SVG content
function extractPathIds(svgContent: string): string[] {
  const pathIds: string[] = [];
  
  // Match path elements with id attributes
  const pathRegex = /<path[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = pathRegex.exec(svgContent)) !== null) {
    pathIds.push(match[1]);
  }

  // Also match other elements with id attributes (rect, circle, etc.)
  const elementRegex = /<(rect|circle|ellipse|polygon|polyline)[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/gi;
  
  while ((match = elementRegex.exec(svgContent)) !== null) {
    pathIds.push(match[2]);
  }

  return [...new Set(pathIds)]; // Remove duplicates
}

// Get SVG content for a floor
export const getSvgContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { floorId } = req.params;

    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        spaces: {
          select: {
            id: true,
            svgElementId: true,
            name: true,
            availabilityStatus: true,
            type: true,
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

    if (!floor.svgFileUrl) {
      res.status(404).json({
        success: false,
        error: 'No SVG file found for this floor'
      });
      return;
    }

    // Read SVG file - handle both URL-encoded and normal paths
    let svgPath: string;
    if (floor.svgFileUrl.startsWith('http')) {
      // If it's a URL, extract the filename
      const url = new URL(floor.svgFileUrl);
      const filename = decodeURIComponent(url.pathname.split('/').pop() || '');
      svgPath = path.join(__dirname, '../../uploads/svg', filename);
    } else {
      // If it's already a file path
      svgPath = path.join(__dirname, '../../uploads/svg', path.basename(floor.svgFileUrl));
    }
    
    // Check if file exists, if not, return a placeholder SVG
    let svgContent: string;
    try {
      await access(svgPath);
      svgContent = await readFile(svgPath, 'utf8');
    } catch (fileError) {
      // File doesn't exist, return a placeholder SVG
      svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
          No SVG file uploaded for this floor
        </text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
          Please upload an SVG file to edit spaces
        </text>
      </svg>`;
    }

    res.status(200).json({
      success: true,
      data: {
        svgContent,
        spaces: floor.spaces,
        floor: {
          id: floor.id,
          name: floor.name,
          floorNumber: floor.floorNumber,
          svgVersion: floor.svgVersion
        }
      }
    });
    return;
  } catch (error) {
    logger.error('Error getting SVG content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SVG content'
    });
    return;
  }
};

// Update space assignment to SVG element
export const updateSpaceSvgAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { spaceId } = req.params;
    const { svgElementId, name, type, sizeSqft, priceMonthly, availabilityStatus, description } = req.body;

    const space = await prisma.space.update({
      where: { id: spaceId },
      data: {
        svgElementId: svgElementId || undefined,
        name: name || undefined,
        type: type || undefined,
        sizeSqft: sizeSqft || undefined,
        priceMonthly: priceMonthly || undefined,
        availabilityStatus: availabilityStatus || undefined,
        description: description || undefined
      },
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
    });

    res.status(200).json({
      success: true,
      data: { space }
    });
    return;
  } catch (error) {
    logger.error('Error updating space SVG assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update space SVG assignment'
    });
    return;
  }
};

// Get available SVG elements for a floor
export const getAvailableSvgElements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { floorId } = req.params;

    const floor = await prisma.floor.findUnique({
      where: { id: floorId }
    });

    if (!floor || !floor.svgFileUrl) {
      res.status(404).json({
        success: false,
        error: 'Floor or SVG file not found'
      });
      return;
    }

    // Read SVG file and extract all elements
    const svgPath = path.join(__dirname, '../../uploads/svg', path.basename(floor.svgFileUrl));
    const svgContent = await readFile(svgPath, 'utf8');
    
    const allElements = extractPathIds(svgContent);
    
    // Get already assigned elements
    const assignedElements = await prisma.space.findMany({
      where: { floorId },
      select: { svgElementId: true }
    });
    
    const assignedIds = assignedElements.map(s => s.svgElementId);
    const availableElements = allElements.filter(id => !assignedIds.includes(id));

    res.status(200).json({
      success: true,
      data: {
        allElements,
        assignedElements: assignedIds,
        availableElements
      }
    });
    return;
  } catch (error) {
    logger.error('Error getting available SVG elements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available SVG elements'
    });
    return;
  }
};
