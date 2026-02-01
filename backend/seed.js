require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const City = require('./src/models/City');
const Area = require('./src/models/Area');
const AmbulanceStation = require('./src/models/AmbulanceStation');
const Ambulance = require('./src/models/Ambulance');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await City.deleteMany({});
    await Area.deleteMany({});
    await AmbulanceStation.deleteMany({});
    await Ambulance.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Cities
    const cairo = await City.create({
      name: 'Cairo',
      country: 'Egypt',
      coordinates: { lat: 30.0444, lng: 31.2357 },
      bounds: {
        north: 30.2,
        south: 29.9,
        east: 31.4,
        west: 31.1
      }
    });
    console.log('✅ Created city: Cairo');

    // Create Areas
    const nasrCity = await Area.create({
      name: 'Nasr City',
      cityId: cairo._id,
      coordinates: { lat: 30.0626, lng: 31.3516 }
    });

    const maadi = await Area.create({
      name: 'Maadi',
      cityId: cairo._id,
      coordinates: { lat: 29.9602, lng: 31.2504 }
    });

    const heliopolis = await Area.create({
      name: 'Heliopolis',
      cityId: cairo._id,
      coordinates: { lat: 30.0880, lng: 31.3246 }
    });

    console.log('✅ Created 3 areas');

    // Create Ambulance Stations
    const station1 = await AmbulanceStation.create({
      name: 'Cairo Central Emergency Station',
      stationCode: 'CCE-001',
      cityId: cairo._id,
      areaId: nasrCity._id,
      coordinates: { lat: 30.0626, lng: 31.3516 },
      address: '123 Main Street, Nasr City',
      contactPhone: '+201234567890',
      totalAmbulances: 5,
      availableAmbulances: 5,
      coverageRadius: 15,
      status: 'active'
    });

    const station2 = await AmbulanceStation.create({
      name: 'Maadi Emergency Center',
      stationCode: 'MEC-002',
      cityId: cairo._id,
      areaId: maadi._id,
      coordinates: { lat: 29.9602, lng: 31.2504 },
      address: '456 Corniche Road, Maadi',
      contactPhone: '+201234567891',
      totalAmbulances: 4,
      availableAmbulances: 4,
      coverageRadius: 12,
      status: 'active'
    });

    const station3 = await AmbulanceStation.create({
      name: 'Heliopolis Medical Emergency',
      stationCode: 'HME-003',
      cityId: cairo._id,
      areaId: heliopolis._id,
      coordinates: { lat: 30.0880, lng: 31.3246 },
      address: '789 Airport Road, Heliopolis',
      contactPhone: '+201234567892',
      totalAmbulances: 3,
      availableAmbulances: 3,
      coverageRadius: 10,
      status: 'active'
    });

    console.log('✅ Created 3 ambulance stations');

    // Create Admin Users
    const admin1 = await User.create({
      username: 'admin_cairo',
      passwordHash: await User.hashPassword('admin123'),
      role: 'healthcare_admin',
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@emergency.eg',
      phone: '+201234567890',
      stationId: station1._id,
      isActive: true
    });

    const admin2 = await User.create({
      username: 'admin_maadi',
      passwordHash: await User.hashPassword('admin123'),
      role: 'healthcare_admin',
      fullName: 'Sara Mohamed',
      email: 'sara.mohamed@emergency.eg',
      phone: '+201234567891',
      stationId: station2._id,
      isActive: true
    });

    console.log('✅ Created 2 admin users');

    // Create Driver Users
    const driver1 = await User.create({
      username: 'driver_001',
      passwordHash: await User.hashPassword('driver123'),
      role: 'ambulance_driver',
      fullName: 'Mohamed Ali',
      email: 'mohamed.ali@emergency.eg',
      phone: '+201234567893',
      stationId: station1._id,
      isActive: true
    });

    const driver2 = await User.create({
      username: 'driver_002',
      passwordHash: await User.hashPassword('driver123'),
      role: 'ambulance_driver',
      fullName: 'Omar Khaled',
      email: 'omar.khaled@emergency.eg',
      phone: '+201234567894',
      stationId: station1._id,
      isActive: true
    });

    const driver3 = await User.create({
      username: 'driver_003',
      passwordHash: await User.hashPassword('driver123'),
      role: 'ambulance_driver',
      fullName: 'Fatima Nour',
      email: 'fatima.nour@emergency.eg',
      phone: '+201234567895',
      stationId: station2._id,
      isActive: true
    });

    const driver4 = await User.create({
      username: 'driver_004',
      passwordHash: await User.hashPassword('driver123'),
      role: 'ambulance_driver',
      fullName: 'Heba Salem',
      email: 'heba.salem@emergency.eg',
      phone: '+201234567896',
      stationId: station3._id,
      isActive: true
    });

    console.log('✅ Created 4 driver users');

    // Create Ambulances for Station 1
    await Ambulance.create([
      {
        vehicleNumber: 'AMB-1001',
        stationId: station1._id,
        status: 'available',
        driverId: driver1._id,
        vehicleType: 'advanced',
        equipmentLevel: 5
      },
      {
        vehicleNumber: 'AMB-1002',
        stationId: station1._id,
        status: 'available',
        driverId: driver2._id,
        vehicleType: 'basic',
        equipmentLevel: 3
      },
      {
        vehicleNumber: 'AMB-1003',
        stationId: station1._id,
        status: 'available',
        vehicleType: 'icu',
        equipmentLevel: 5
      },
      {
        vehicleNumber: 'AMB-1004',
        stationId: station1._id,
        status: 'available',
        vehicleType: 'basic',
        equipmentLevel: 3
      },
      {
        vehicleNumber: 'AMB-1005',
        stationId: station1._id,
        status: 'maintenance',
        vehicleType: 'advanced',
        equipmentLevel: 4
      }
    ]);

    // Create Ambulances for Station 2
    await Ambulance.create([
      {
        vehicleNumber: 'AMB-2001',
        stationId: station2._id,
        status: 'available',
        driverId: driver3._id,
        vehicleType: 'advanced',
        equipmentLevel: 4
      },
      {
        vehicleNumber: 'AMB-2002',
        stationId: station2._id,
        status: 'available',
        vehicleType: 'basic',
        equipmentLevel: 3
      },
      {
        vehicleNumber: 'AMB-2003',
        stationId: station2._id,
        status: 'available',
        vehicleType: 'basic',
        equipmentLevel: 3
      },
      {
        vehicleNumber: 'AMB-2004',
        stationId: station2._id,
        status: 'available',
        vehicleType: 'icu',
        equipmentLevel: 5
      }
    ]);

    // Create Ambulances for Station 3
    await Ambulance.create([
      {
        vehicleNumber: 'AMB-3001',
        stationId: station3._id,
        status: 'available',
        driverId: driver4._id,
        vehicleType: 'advanced',
        equipmentLevel: 4
      },
      {
        vehicleNumber: 'AMB-3002',
        stationId: station3._id,
        status: 'available',
        vehicleType: 'basic',
        equipmentLevel: 3
      },
      {
        vehicleNumber: 'AMB-3003',
        stationId: station3._id,
        status: 'available',
        vehicleType: 'basic',
        equipmentLevel: 3
      }
    ]);

    console.log('✅ Created 12 ambulances');

    console.log('\n========================================');
    console.log('✅ Database seeded successfully!');
    console.log('========================================\n');
    
    console.log('📊 Summary:');
    console.log('  - Cities: 1 (Cairo)');
    console.log('  - Areas: 3 (Nasr City, Maadi, Heliopolis)');
    console.log('  - Stations: 3');
    console.log('  - Admins: 2');
    console.log('  - Drivers: 4');
    console.log('  - Ambulances: 12\n');

    console.log('👤 Demo Login Credentials:\n');
    console.log('Healthcare Admin:');
    console.log('  Username: admin_cairo');
    console.log('  Password: admin123\n');
    console.log('  Username: admin_maadi');
    console.log('  Password: admin123\n');
    
    console.log('Ambulance Drivers:');
    console.log('  Username: driver_001 / driver_002 / driver_003 / driver_004');
    console.log('  Password: driver123\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
