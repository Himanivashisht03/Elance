const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true
  },
  requiredSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  }],
  timelinePosition: {
    type: Number,
    required: true,
    min: 1
  },
  averageSalary: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

const careerPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  steps: [stepSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CareerPath', careerPathSchema);
