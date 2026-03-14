// backend/models/Skill.js - UPDATED
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'AI/ML', 'Analytics', 'Version Control', 'API', 'Soft Skills', 'Design', 'Product', 'General'], // Added 'General' and other categories
    default: 'General',
    trim: true
  },
  demandScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 1
  },
  trending: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Skill', skillSchema);