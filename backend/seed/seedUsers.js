require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/UserModel.js');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/taxitera';

async function seedUsers() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB for User Seeding');

  try {
    const driverUsernames = ['driver1', 'driver2', 'driver3', 'driver4', 'driver5'];
    const ownerUsernames = ['owner1', 'owner2'];
    const allUsernames = [...driverUsernames, ...ownerUsernames];

    console.log('Cleaning up old test users...');
    await User.deleteMany({ username: { $in: allUsernames } });

    // 1. Seed 5 Drivers
    for (let i = 1; i <= 5; i++) {
        const username = `driver${i}`;
        const password = `driver${i}`; // Plaintext password
        const email = `driver${i}@example.com`;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'taxiDriver',
            isVerified: true, // EMAIL VERIFIED
            kycStatus: 'not_submitted', // KYC NOT VERIFIED
            driverDetails: {
                licenseText: `LIC-${1000 + i}`,
                carPlate: `AA-${2000 + i}`,
                carType: 'Toyota Corolla',
                verificationStatus: 'unverified'
            }
        });
        console.log(`Created Driver: ${username} / ${password} (Email Verified, KYC Not Submitted)`);
    }

    // 2. Seed 2 Owners
    for (let i = 1; i <= 2; i++) {
        const username = `owner${i}`;
        const password = `owner${i}`;
        const email = `owner${i}@example.com`;

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'owner',
            isVerified: true, // EMAIL VERIFIED
            kycStatus: 'not_submitted', // KYC NOT VERIFIED
            ownerProfile: {}
        });
        console.log(`Created Owner: ${username} / ${password} (Email Verified, KYC Not Submitted)`);
    }

    console.log('User seeding complete.');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
