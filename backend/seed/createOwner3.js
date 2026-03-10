const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const createOwner3 = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error("MONGO_URL not found in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const username = 'owner3';
    const email = 'owner3@example.com'; 
    const password = 'owner3';

    // Remove existing if any
    await User.deleteOne({ username });
    console.log(`Removed existing user with username: ${username}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
      role: 'owner',
      isVerified: true, // Assuming email is verified so they can login
      kycStatus: 'not_submitted', // "lyc status not verified" -> KYC not verified
      ownerProfile: {}
    });

    await newUser.save();
    console.log(`User '${username}' created successfully.`);
    console.log(`Password: '${password}'`);
    console.log(`KYC Status: '${newUser.kycStatus}'`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

createOwner3();
