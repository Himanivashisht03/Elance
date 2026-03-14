//backend/controllers/auth.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendOTP = require('../utils/sendOTP');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const otpStore = {};

// ============================================================
// GOOGLE OAUTH LOGIN/SIGNUP
// ============================================================
const googleAuth = async (req, res) => {
  try {
    const { credential, userType } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const token = jwt.sign(
        { userId: user._id, userType: user.userType },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user._id, username: user.username, email: user.email, userType: user.userType, profilePicture: picture }
      });
    } else {
      const randomPassword = Math.random().toString(36).slice(-10) + 'G1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const newUser = new User({
        username: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        userType: userType || 'jobSeeker',
        skills: [],
        careerGoals: { currentRole: '', targetRole: '' }
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, userType: newUser.userType },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Account created successfully with Google',
        token,
        user: { id: newUser._id, username: newUser.username, email: newUser.email, userType: newUser.userType, profilePicture: picture },
        isNewUser: true
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
};

// ============================================================
// SIGNUP
// ============================================================
const signup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, userType, ...additionalFields } = req.body;

    if (!username || !email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const userData = { username: username.trim(), email: email.toLowerCase().trim(), password, userType };

    if (userType === 'recruiter') {
      userData.companyName = additionalFields.companyName?.trim() || '';
      userData.roleHiringFor = additionalFields.roleHiringFor?.trim() || '';
      userData.industry = additionalFields.industry?.trim() || '';
      userData.companySize = additionalFields.companySize?.trim() || '';
      userData.website = additionalFields.website?.trim() || '';
      userData.description = additionalFields.description?.trim() || '';
    } else {
      userData.currentRole = additionalFields.currentRole?.trim() || '';
      userData.targetRole = additionalFields.targetRole?.trim() || '';
      if (additionalFields.skills) {
        userData.skills = Array.isArray(additionalFields.skills)
          ? additionalFields.skills.map(s => s.trim()).filter(Boolean)
          : additionalFields.skills.split(',').map(s => s.trim()).filter(Boolean);
      } else { userData.skills = []; }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, userData, createdAt: Date.now() };

    try {
      await sendOTP(email, otp);
      res.status(200).json({ message: 'OTP sent to your email', email });
    } catch (error) {
      delete otpStore[email];
      res.status(500).json({ message: 'Error sending OTP' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ============================================================
// VERIFY OTP
// ============================================================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!otpStore[email]) return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });

    const storedOTP = otpStore[email];
    if (Date.now() - storedOTP.createdAt > 5 * 60 * 1000) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }
    if (storedOTP.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });

    const { username, password, userType, ...additionalFields } = storedOTP.userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { username: username?.trim() || '', email: email?.toLowerCase().trim() || '', password: hashedPassword, userType: userType || 'jobSeeker' };

    if (userType === 'recruiter') {
      userData.recruiterProfile = {
        companyName: additionalFields.companyName?.trim() || '',
        roleHiringFor: additionalFields.roleHiringFor?.trim() || '',
        industry: additionalFields.industry?.trim() || '',
        companySize: additionalFields.companySize?.trim() || '',
        website: additionalFields.website?.trim() || '',
        description: additionalFields.description?.trim() || ''
      };
    } else {
      userData.careerGoals = { currentRole: additionalFields.currentRole?.trim() || '', targetRole: additionalFields.targetRole?.trim() || '' };
      userData.skills = Array.isArray(additionalFields.skills)
        ? additionalFields.skills.map(s => s.trim()).filter(Boolean)
        : (additionalFields.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    const newUser = new User(userData);
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, userType: newUser.userType }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    delete otpStore[email];

    res.status(201).json({ message: 'User registered successfully', token, user: { id: newUser._id, username: newUser.username, email: newUser.email, userType: newUser.userType, skills: newUser.skills } });
  } catch (error) {
    console.error('OTP verification error:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'User already exists with this email' });
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user._id, username: user.username, email: user.email, userType: user.userType } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ============================================================
// RESEND OTP
// ============================================================
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!otpStore[email]) return res.status(400).json({ message: 'No signup request found for this email' });

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp: newOtp, userData: otpStore[email].userData, createdAt: Date.now() };
    await sendOTP(email, newOtp);
    res.status(200).json({ message: 'New OTP sent to your email', email });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

module.exports = { signup, verifyOTP, login, resendOTP, googleAuth };
