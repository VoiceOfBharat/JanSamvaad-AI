require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAuthority = async () => {
  try {
    // Connect to MongoDB (without deprecated options)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if authority user already exists
    const existingAuthority = await User.findOne({ role: 'authority' });
    if (existingAuthority) {
      console.log('⚠️  Authority user already exists:');
      console.log('   Email:', existingAuthority.email);
      console.log('   Mobile:', existingAuthority.mobile);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create authority user
    const authority = await User.create({
      name: 'Authority Admin',
      email: 'authority@jansamvaad.gov.in',
      mobile: '9876543210',
      password: 'Authority@123',
      role: 'authority',
      languagePreference: 'en'
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Authority User Created Successfully!');
    console.log('='.repeat(50));
    console.log('📧 Email: authority@jansamvaad.gov.in');
    console.log('📱 Mobile: 9876543210');
    console.log('🔐 Password: Authority@123');
    console.log('='.repeat(50) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating authority:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAuthority();