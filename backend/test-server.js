const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

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

// Test auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'customer@spacefinder.com' && password === 'customer123') {
    res.json({
      success: true,
      data: {
        user: {
          id: 'test-user-id',
          email: email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'CUSTOMER',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+91-9876543211',
            preferences: {
              preferredCities: ['Bengaluru'],
              preferredSectors: ['Mall Space'],
              budgetRange: { min: 0, max: 100000 },
              sizeRange: { min: 0, max: 5000 },
              preferredFloors: ['Ground Floor', 'First Floor'],
              preferredAmenities: ['Parking', 'Security', 'Elevator'],
              adjacentBrandPreferences: ['Apple', 'Starbucks'],
              notificationSettings: {
                email: true,
                push: true,
                sms: false,
              },
            }
          },
          stats: {
            recentViewsCount: 5,
            interestedSpacesCount: 3
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Test profile endpoint
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'test-user-id',
        email: 'customer@spacefinder.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+91-9876543211',
          preferences: {
            preferredCities: ['Bengaluru'],
            preferredSectors: ['Mall Space'],
            budgetRange: { min: 0, max: 100000 },
            sizeRange: { min: 0, max: 5000 },
            preferredFloors: ['Ground Floor', 'First Floor'],
            preferredAmenities: ['Parking', 'Security', 'Elevator'],
            adjacentBrandPreferences: ['Apple', 'Starbucks'],
            notificationSettings: {
              email: true,
              push: true,
              sms: false,
            },
          }
        },
        stats: {
          recentViewsCount: 5,
          interestedSpacesCount: 3
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  });
});

// Test recent views endpoint
app.get('/api/user/recent-views', (req, res) => {
  res.json({
    success: true,
    data: {
      recentViews: [
        {
          id: 'view-1',
          spaceId: 'space-1',
          spaceName: 'Lulu Premium Store',
          buildingName: 'Garuda Mall',
          city: 'Bengaluru',
          sector: 'Mall Space',
          price: 85000,
          size: 1200,
          availability: 'Available',
          image: 'https://via.placeholder.com/300x200?text=Lulu+Premium',
          viewedAt: new Date().toISOString(),
          viewDuration: 120
        },
        {
          id: 'view-2',
          spaceId: 'space-2',
          spaceName: 'Apple Store',
          buildingName: 'Garuda Mall',
          city: 'Bengaluru',
          sector: 'Mall Space',
          price: 95000,
          size: 800,
          availability: 'Occupied',
          image: 'https://via.placeholder.com/300x200?text=Apple+Store',
          viewedAt: new Date(Date.now() - 3600000).toISOString(),
          viewDuration: 90
        }
      ]
    }
  });
});

// Test interested spaces endpoint
app.get('/api/user/interested', (req, res) => {
  res.json({
    success: true,
    data: {
      interestedSpaces: [
        {
          id: 'interest-1',
          spaceId: 'space-1',
          spaceName: 'Lulu Premium Store',
          buildingName: 'Garuda Mall',
          city: 'Bengaluru',
          sector: 'Mall Space',
          price: 85000,
          size: 1200,
          availability: 'Available',
          image: 'https://via.placeholder.com/300x200?text=Lulu+Premium',
          interestLevel: 'HIGH',
          notes: 'Great location and size. Perfect for our retail store.',
          addedAt: new Date().toISOString()
        }
      ]
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Test server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Test login: POST http://localhost:${port}/api/auth/login`);
  console.log(`👤 Test profile: GET http://localhost:${port}/api/user/profile`);
});
