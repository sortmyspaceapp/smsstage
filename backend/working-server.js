const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const port = 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    message: 'SpaceFinder backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
    expiresIn: '30d'
  });
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'CUSTOMER',
        profile: {
          create: {
            firstName,
            lastName,
            phone
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get profile endpoint
app.get('/api/user/profile', async (req, res) => {
  try {
    // For now, return the customer profile
    const user = await prisma.user.findUnique({
      where: { email: 'customer@spacefinder.com' },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get recent views endpoint
app.get('/api/user/recent-views', async (req, res) => {
  try {
    const recentViews = await prisma.recentView.findMany({
      include: {
        space: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    city: true,
                    sector: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: 10
    });

    const formattedViews = recentViews.map(view => ({
      id: view.id,
      spaceId: view.spaceId,
      spaceName: view.space.name,
      buildingName: view.space.floor.building.name,
      city: view.space.floor.building.city.name,
      sector: view.space.floor.building.sector.name,
      price: view.space.priceMonthly,
      size: view.space.sizeSqft,
      availability: view.space.availabilityStatus,
      image: view.space.floor.building.images?.[0],
      viewedAt: view.viewedAt,
      viewDuration: view.viewDuration
    }));

    res.json({
      success: true,
      data: {
        recentViews: formattedViews
      }
    });
  } catch (error) {
    console.error('Recent views error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get interested spaces endpoint
app.get('/api/user/interested', async (req, res) => {
  try {
    const interestedSpaces = await prisma.interestedSpace.findMany({
      include: {
        space: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    city: true,
                    sector: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSpaces = interestedSpaces.map(space => ({
      id: space.id,
      spaceId: space.spaceId,
      spaceName: space.space.name,
      buildingName: space.space.floor.building.name,
      city: space.space.floor.building.city.name,
      sector: space.space.floor.building.sector.name,
      price: space.space.priceMonthly,
      size: space.space.sizeSqft,
      availability: space.space.availabilityStatus,
      image: space.space.floor.building.images?.[0],
      interestLevel: space.interestLevel,
      notes: space.notes,
      addedAt: space.createdAt
    }));

    res.json({
      success: true,
      data: {
        interestedSpaces: formattedSpaces
      }
    });
  } catch (error) {
    console.error('Interested spaces error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add to interested spaces
app.post('/api/user/interested', async (req, res) => {
  try {
    const { spaceId, interestLevel = 'MEDIUM', notes } = req.body;

    // Find the customer user
    const user = await prisma.user.findUnique({
      where: { email: 'customer@spacefinder.com' }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already interested
    const existing = await prisma.interestedSpace.findUnique({
      where: {
        userId_spaceId: {
          userId: user.id,
          spaceId: spaceId
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Space already in interested list'
      });
    }

    // Add to interested spaces
    await prisma.interestedSpace.create({
      data: {
        userId: user.id,
        spaceId: spaceId,
        interestLevel: interestLevel,
        notes: notes
      }
    });

    res.json({
      success: true,
      message: 'Space added to interested list'
    });
  } catch (error) {
    console.error('Add interested space error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Remove from interested spaces
app.delete('/api/user/interested/:spaceId', async (req, res) => {
  try {
    const { spaceId } = req.params;

    // Find the customer user
    const user = await prisma.user.findUnique({
      where: { email: 'customer@spacefinder.com' }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove from interested spaces
    await prisma.interestedSpace.deleteMany({
      where: {
        userId: user.id,
        spaceId: spaceId
      }
    });

    res.json({
      success: true,
      message: 'Space removed from interested list'
    });
  } catch (error) {
    console.error('Remove interested space error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update preferences
app.put('/api/user/preferences', async (req, res) => {
  try {
    const preferences = req.body;

    // Find the customer user
    const user = await prisma.user.findUnique({
      where: { email: 'customer@spacefinder.com' },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update preferences
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        preferences: preferences
      }
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 SpaceFinder backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
  console.log(`👤 Profile: GET http://localhost:${port}/api/user/profile`);
  console.log(`📋 Recent Views: GET http://localhost:${port}/api/user/recent-views`);
  console.log(`❤️  Interested Spaces: GET http://localhost:${port}/api/user/interested`);
});
