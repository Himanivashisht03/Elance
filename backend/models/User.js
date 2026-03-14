// backend/models/User.js - UPDATED skills structure
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['jobSeeker', 'recruiter'],
      message: 'User type must be either jobSeeker or recruiter'
    }
  },
  
  // Profile fields
  bio:          { type: String, default: '' },
  phone:        { type: String, default: '' },
  location:     { type: String, default: '' },
  profilePhoto: { type: String, default: '' },

  // ── RESUME FIELDS — persist across logout/login ──
  resumeUrl:        { type: String, default: '' },
  resumeName:       { type: String, default: '' },
  resumeUploadedAt: { type: Date,   default: null },

  // Social links
  socialLinks: {
    github:    { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    portfolio: { type: String, default: '' },
  },

  // Skills as simple string array
  skills: {
    type: [String],
    default: []
  },

  // Education
  education: {
    type: [{
      degree: String,
      institution: String,
      startYear: String,
      endYear: String,
      field: String
    }],
    default: []
  },

  careerGoals: {
    currentRole: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    targetTimeline: { type: Number, default: null },
    careerPath: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerPath',
      default: null
    }
  },
  settingsOtp:       { type: String },
settingsOtpExpiry: { type: Number },
settingsOtpAction: { type: String },
isDeactivated:     { type: Boolean, default: false },
deactivatedAt:     { type: Date },
  currentCompany: { type: String, default: '' },
  experience: {
    type: [{
      title: String,
      company: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    default: []
  },
  
  // Saved jobs (for job seekers)
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],

  // Recruiter specific fields
  recruiterProfile: {
    companyName: { type: String, default: '' },
    roleHiringFor: { type: String, default: '' },
    industry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    website: { type: String, default: '' },
    description: { type: String, default: '' }
    
  }
}, {
  timestamps: true,
  minimize: false
});

module.exports = mongoose.model('User', userSchema);