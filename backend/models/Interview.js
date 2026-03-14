// backend/models/Interview.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateId:   { type: String, default: '' },
  applicationId: { type: String, default: '' },
  candidateName: { type: String, required: true },
  role:          { type: String, default: '' },
  initials:      { type: String, default: '' },
  date:          { type: String, required: true }, // "YYYY-MM-DD"
  time:          { type: String, required: true }, // "HH:MM"
  iType:         { type: String, default: 'Video Call' },
  link:          { type: String, default: '' },
  notes:         { type: String, default: '' },
  group:         { type: Number, default: null },
  color:         { type: String, default: '#6366f1' },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
