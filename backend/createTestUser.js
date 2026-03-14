// backend/createTestUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'testuser@example.com';
    const plainPassword = 'Test@1234';

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
    } else {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      user = new User({
        username: 'Test User',
        email,
        password: hashedPassword,
        userType: 'jobSeeker',   // or 'recruiter' if you prefer
        skills: ['JavaScript', 'React'],
        careerGoals: {
          currentRole: 'Junior Developer',
          targetRole: 'Senior Full Stack Developer',
        }
      });

      await user.save();
      console.log('Test user created:', {
        email,
        password: plainPassword,
        id: user._id.toString()
      });
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
}

main();