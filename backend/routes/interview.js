// backend/routes/interview.js
const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const sendInterviewEmail = require('../utils/sendInterviewEmail');
const mongoose  = require('mongoose');
const Interview = require('../models/Interview');

// ─────────────────────────────────────────────
// GET /api/interview/scheduled
// Load all interviews for this recruiter
// ─────────────────────────────────────────────
router.get('/scheduled', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.user._id })
      .sort({ date: 1, time: 1 })
      .lean();
    res.json({ interviews });
  } catch (err) {
    console.error('Failed to load interviews:', err);
    res.status(500).json({ message: 'Failed to load interviews' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/interview/:id
// Delete a single interview
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Interview.findOneAndDelete({
      _id: req.params.id,
      recruiterId: req.user._id  // only own interviews
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete' });
  }
});

// ─────────────────────────────────────────────
// POST /api/interview/send-email
// Save interviews to DB + send emails
// ─────────────────────────────────────────────
router.post('/send-email', auth, async (req, res) => {
  const { slots, iType, link, notes, date, recruiterName, companyName } = req.body;

  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ message: 'slots array required' });
  }

  const User        = mongoose.model('User');
  const Application = mongoose.model('Application');
  let sent = 0, failed = [];

  // ✅ Save all slots to DB first
  const ACCENTS = ['#6366f1','#0891b2','#059669','#db2777','#d97706','#7c3aed','#0d9488'];
  const savedInterviews = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    try {
      const interview = await Interview.create({
        recruiterId:   req.user._id,
        candidateId:   slot.candidateId   || '',
        applicationId: slot.applicationId || '',
        candidateName: slot.candidateName || 'Candidate',
        role:          slot.role          || '',
        initials:      slot.initials      || '',
        date:          slot.date          || date,
        time:          slot.time,
        iType:         iType              || 'Video Call',
        link:          link               || '',
        notes:         notes              || '',
        group:         slot.group         || null,
        color:         ACCENTS[i % ACCENTS.length],
      });
      savedInterviews.push(interview);
    } catch (err) {
      console.error('Failed to save interview:', err.message);
    }
  }

  console.log(`✅ Saved ${savedInterviews.length} interviews to DB`);

  // ✅ Send emails
  for (const slot of slots) {
    try {
      let toEmail       = null;
      let candidateName = slot.candidateName || 'Candidate';

      // 1st try: applicationId
      if (slot.applicationId && mongoose.isValidObjectId(slot.applicationId)) {
        const app = await Application.findById(slot.applicationId)
          .populate('applicantId', 'email username').lean();
        if (app?.applicantId?.email) {
          toEmail       = app.applicantId.email;
          candidateName = app.applicantId.username || candidateName;
        }
      }

      // 2nd try: candidateId → Application
      if (!toEmail && slot.candidateId && mongoose.isValidObjectId(slot.candidateId)) {
        const app = await Application.findOne({ applicantId: slot.candidateId })
          .populate('applicantId', 'email username').lean();
        if (app?.applicantId?.email) {
          toEmail       = app.applicantId.email;
          candidateName = app.applicantId.username || candidateName;
        }
      }

      // 3rd try: User.findById
      if (!toEmail && slot.candidateId && mongoose.isValidObjectId(slot.candidateId)) {
        const user = await User.findById(slot.candidateId).lean();
        if (user?.email) {
          toEmail       = user.email;
          candidateName = user.username || candidateName;
        }
      }

      // 4th try: username match
      if (!toEmail && slot.candidateName) {
        const user = await User.findOne({
          username: { $regex: new RegExp(`^${slot.candidateName.trim()}$`, 'i') }
        }).lean();
        if (user?.email) {
          toEmail       = user.email;
          candidateName = user.username || candidateName;
        }
      }

      if (!toEmail) {
        failed.push({ name: candidateName, reason: 'Email not found in DB' });
        continue;
      }

      await sendInterviewEmail({
        toEmail, candidateName,
        role:          slot.role          || 'Position',
        date:          slot.date          || date,
        time:          slot.time,
        iType:         iType              || 'Interview',
        link:          link               || '',
        notes:         notes              || '',
        group:         slot.group         || null,
        recruiterName: recruiterName      || req.user?.username || 'Recruiter',
        companyName:   companyName        || '',
      });

      sent++;
      console.log(`📧 Email sent → ${toEmail}`);

    } catch (err) {
      console.error(`❌ Email failed for "${slot.candidateName}":`, err.message);
      failed.push({ name: slot.candidateName, reason: err.message });
    }
  }

  res.json({
    sent,
    failed:       failed.length,
    failedList:   failed,
    savedCount:   savedInterviews.length,
    interviews:   savedInterviews, // ✅ return saved interviews to frontend
    message: `${sent} email${sent !== 1 ? 's' : ''} sent`,
  });
});

module.exports = router;
