import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create cities
  const cities = await Promise.all([
    prisma.city.upsert({
      where: { name: 'Bengaluru' },
      update: {},
      create: {
        name: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        coordinates: { lat: 12.9716, lng: 77.5946 },
      },
    }),
    prisma.city.upsert({
      where: { name: 'Mumbai' },
      update: {},
      create: {
        name: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        coordinates: { lat: 19.0760, lng: 72.8777 },
      },
    }),
    prisma.city.upsert({
      where: { name: 'Delhi-NCR' },
      update: {},
      create: {
        name: 'Delhi-NCR',
        state: 'Delhi',
        country: 'India',
        coordinates: { lat: 28.7041, lng: 77.1025 },
      },
    }),
  ]);

  console.log('✅ Cities created:', cities.length);

  // Create sectors
  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { name: 'Mall Space' },
      update: {},
      create: {
        name: 'Mall Space',
        description: 'Shopping malls and retail spaces',
        icon: 'store',
        color: '#3B82F6',
      },
    }),
    prisma.sector.upsert({
      where: { name: 'Events Space' },
      update: {},
      create: {
        name: 'Events Space',
        description: 'Event venues and spaces',
        icon: 'event',
        color: '#10B981',
      },
    }),
    prisma.sector.upsert({
      where: { name: 'Public Space' },
      update: {},
      create: {
        name: 'Public Space',
        description: 'Public venues and community spaces',
        icon: 'public',
        color: '#F59E0B',
      },
    }),
    prisma.sector.upsert({
      where: { name: 'Apartment' },
      update: {},
      create: {
        name: 'Apartment',
        description: 'Residential and apartment spaces',
        icon: 'apartment',
        color: '#8B5CF6',
      },
    }),
  ]);

  console.log('✅ Sectors created:', sectors.length);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@spacefinder.com' },
    update: {},
    create: {
      email: 'admin@spacefinder.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+91-9876543210',
        },
      },
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create test customer user
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@spacefinder.com' },
    update: {
      passwordHash: customerPassword,
    },
    create: {
      email: 'customer@spacefinder.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      profile: {
        create: {
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
          },
        },
      },
    },
  });

  console.log('✅ Customer user created:', customerUser.email);

  // Create malls
  const malls = await Promise.all([
    prisma.mall.upsert({
      where: { id: 'mall-1' },
      update: {},
      create: {
        id: 'mall-1',
        name: 'Garuda Mall',
        cityId: cities[0].id,
        sectorId: sectors[0].id,
        address: 'Magrath Road, Bengaluru',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        rating: 4.0,
        images: ['https://via.placeholder.com/300x200?text=Garuda+Mall'],
        managerId: adminUser.id,
      },
    }),
    prisma.mall.upsert({
      where: { id: 'mall-2' },
      update: {},
      create: {
        id: 'mall-2',
        name: 'Phoenix MarketCity',
        cityId: cities[0].id,
        sectorId: sectors[0].id,
        address: 'Whitefield, Bengaluru',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        rating: 4.5,
        images: ['https://via.placeholder.com/300x200?text=Phoenix+MarketCity'],
        managerId: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Malls created:', malls.length);

  // Create floors
  const floors = await Promise.all([
    prisma.floor.upsert({
      where: { mallId_floorNumber: { mallId: malls[0].id, floorNumber: 0 } },
      update: {},
      create: {
        mallId: malls[0].id,
        floorNumber: 0,
        name: 'Ground Floor',
        svgFileUrl: 'https://via.placeholder.com/820x523?text=Ground+Floor+SVG',
        svgVersion: 1,
      },
    }),
    prisma.floor.upsert({
      where: { mallId_floorNumber: { mallId: malls[0].id, floorNumber: 1 } },
      update: {},
      create: {
        mallId: malls[0].id,
        floorNumber: 1,
        name: 'First Floor',
        svgFileUrl: 'https://via.placeholder.com/820x523?text=First+Floor+SVG',
        svgVersion: 1,
      },
    }),
  ]);

  console.log('✅ Floors created:', floors.length);

  // Create spaces
  const spaces = await Promise.all([
    prisma.space.upsert({
      where: { id: 'space-1' },
      update: {},
      create: {
        id: 'space-1',
        floorId: floors[0].id,
        svgElementId: 'map_lulu_premium',
        name: 'Lulu Premium Store',
        type: 'RETAIL',
        sizeSqft: 1200,
        priceMonthly: 85000,
        availabilityStatus: 'AVAILABLE',
        description: 'Premium retail space with high visibility',
        frontage: 'Main Entrance',
        adjacentBrands: ['Apple', 'Starbucks'],
      },
    }),
    prisma.space.upsert({
      where: { id: 'space-2' },
      update: {},
      create: {
        id: 'space-2',
        floorId: floors[0].id,
        svgElementId: 'map_apple',
        name: 'Apple Store',
        type: 'RETAIL',
        sizeSqft: 800,
        priceMonthly: 95000,
        availabilityStatus: 'OCCUPIED',
        description: 'Premium electronics retail space',
        frontage: 'Main Corridor',
        adjacentBrands: ['Lulu Premium', 'Starbucks'],
      },
    }),
    prisma.space.upsert({
      where: { id: 'space-3' },
      update: {},
      create: {
        id: 'space-3',
        floorId: floors[0].id,
        svgElementId: 'map_star_bucks',
        name: 'Starbucks',
        type: 'FOOD_COURT',
        sizeSqft: 600,
        priceMonthly: 55000,
        availabilityStatus: 'OCCUPIED',
        description: 'Coffee shop and café space',
        frontage: 'Food Court',
        adjacentBrands: ['Apple', 'Lulu Premium'],
      },
    }),
  ]);

  console.log('✅ Spaces created:', spaces.length);

  // Create space amenities
  await Promise.all([
    prisma.spaceAmenity.create({
      data: {
        spaceId: spaces[0].id,
        type: 'PARKING',
        value: 'Valet Parking Available',
      },
    }),
    prisma.spaceAmenity.create({
      data: {
        spaceId: spaces[0].id,
        type: 'SECURITY',
        value: '24/7 Security',
      },
    }),
    prisma.spaceAmenity.create({
      data: {
        spaceId: spaces[0].id,
        type: 'ELEVATOR',
        value: 'Direct Elevator Access',
      },
    }),
  ]);

  console.log('✅ Space amenities created');

  // Create some recent views for the customer
  await prisma.recentView.create({
    data: {
      userId: customerUser.id,
      spaceId: spaces[0].id,
      viewDuration: 120, // 2 minutes
    },
  });

  await prisma.recentView.create({
    data: {
      userId: customerUser.id,
      spaceId: spaces[1].id,
      viewDuration: 90, // 1.5 minutes
    },
  });

  console.log('✅ Recent views created');

  // Create some interested spaces for the customer
  await prisma.interestedSpace.create({
    data: {
      userId: customerUser.id,
      spaceId: spaces[0].id,
      interestLevel: 'HIGH',
      notes: 'Great location and size. Perfect for our retail store.',
    },
  });

  console.log('✅ Interested spaces created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
