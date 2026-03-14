// backend/createTestRecruiter.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'recruiter@example.com';
    const plainPassword = 'Recruiter@123';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Recruiter already exists:', email);
    } else {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      user = new User({
        username: 'Test Recruiter',
        email,
        password: hashedPassword,
        userType: 'recruiter',
        recruiterProfile: {
          companyName: 'Demo Company',
          roleHiringFor: 'Senior Software Engineer',
          industry: 'Technology',
          companySize: '51-200',
          website: 'https://example.com',
          description: 'Test recruiter account for ELance.'
        }
      });

      await user.save();
      console.log('Recruiter user created:', {
        email,
        password: plainPassword,
        id: user._id.toString()
      });
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating recruiter user:', err);
    process.exit(1);
  }
}

main();