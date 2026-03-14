//backend/routes/auth.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const nodemailer = require('nodemailer');
const authController = require('../controllers/auth');
const auth     = require('../middleware/auth');
const User     = require('../models/User');
const Job      = require('../models/Job');

// ── Multer config for resume uploads ──
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumeDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `resume-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  },
});

// ── Email transporter helper ──
function makeTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

router.post('/google', authController.googleAuth);
router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/resend-otp', authController.resendOTP);

// GET /api/auth/me — get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('savedJobs', 'title company location type salaryRange status createdAt');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/upload-resume
router.post('/upload-resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const resumeUrl  = `/uploads/resumes/${req.file.filename}`;
    const resumeName = req.file.originalname;
    const existing = await User.findById(req.user._id).select('resumeUrl');
    if (existing?.resumeUrl) {
      const oldPath = path.join(__dirname, '..', existing.resumeUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { resumeUrl, resumeName, resumeUploadedAt: new Date() } },
      { new: true }
    ).select('-password');
    res.json({ message: 'Resume uploaded successfully', resumeUrl, resumeName, resumeUploadedAt: user.resumeUploadedAt, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/resume
router.delete('/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resumeUrl');
    if (user?.resumeUrl) {
      const filePath = path.join(__dirname, '..', user.resumeUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await User.findByIdAndUpdate(req.user._id, {
      $set: { resumeUrl: '', resumeName: '', resumeUploadedAt: null }
    });
    res.json({ message: 'Resume removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile — update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, bio, phone, location, skills, education, experience, currentCompany, careerGoals, recruiterProfile } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;
    if (skills !== undefined) updates.skills = skills;
    if (education !== undefined) updates.education = education;
    if (experience !== undefined) updates.experience = experience;
    if (currentCompany !== undefined) updates.currentCompany = currentCompany;
    if (careerGoals !== undefined) updates.careerGoals = careerGoals;
    if (recruiterProfile !== undefined) updates.recruiterProfile = recruiterProfile;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    res.json({ user, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/save-job/:jobId
router.post('/save-job/:jobId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.jobId;
    const idx = user.savedJobs.findIndex(id => id.toString() === jobId);
    let saved;
    if (idx === -1) { user.savedJobs.push(jobId); saved = true; }
    else { user.savedJobs.splice(idx, 1); saved = false; }
    await user.save();
    res.json({ saved, savedJobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/saved-jobs
router.get('/saved-jobs', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedJobs',
      populate: { path: 'requiredSkills', select: 'name' }
    });
    res.json({ savedJobs: user.savedJobs || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/jobseeker
router.get('/analytics', auth, async (req, res) => {
  try {
    const Application = require('../models/Application');
    const user = req.user;
    const applications = await Application.find({ applicantId: user._id })
      .populate({ path: 'jobId', populate: { path: 'requiredSkills', select: 'name' } })
      .sort({ appliedAt: -1 });
    const statusBreakdown = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0, accepted: 0 };
    applications.forEach(a => { if (a.status in statusBreakdown) statusBreakdown[a.status]++; });
    const userSkillsSet = new Set((user.skills || []).map(s => s.toLowerCase()));
    const skillMatches = applications.map(a => {
      const jobSkills = (a.jobId?.requiredSkills || []).map(s => s.name.toLowerCase());
      const matched = jobSkills.filter(s => userSkillsSet.has(s)).length;
      const pct = jobSkills.length > 0 ? Math.round((matched / jobSkills.length) * 100) : 0;
      return { job: a.jobId?.title || 'Unknown', match: pct, status: a.status, date: a.appliedAt };
    });
    const now = Date.now();
    const weekData = Array.from({ length: 5 }, (_, i) => ({ week: `W${5 - i}`, applications: 0, shortlisted: 0 }));
    applications.forEach(a => {
      const weeksAgo = Math.floor((now - new Date(a.appliedAt).getTime()) / (7 * 86400000));
      const idx = 4 - weeksAgo;
      if (idx >= 0 && idx < 5) {
        weekData[idx].applications++;
        if (['shortlisted', 'accepted'].includes(a.status)) weekData[idx].shortlisted++;
      }
    });
    const missingSkillsMap = {};
    applications.forEach(a => {
      (a.jobId?.requiredSkills || []).forEach(s => {
        if (!userSkillsSet.has(s.name.toLowerCase())) {
          missingSkillsMap[s.name] = (missingSkillsMap[s.name] || 0) + 1;
        }
      });
    });
    const missingSkills = Object.entries(missingSkillsMap)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    res.json({ totalApplications: applications.length, statusBreakdown, skillMatches, weekData, missingSkills, userSkills: user.skills || [], savedJobsCount: (user.savedJobs || []).length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════
// NEW ROUTES — Settings Page
// ══════════════════════════════════════════

// POST /api/auth/send-otp — Settings Danger Zone OTP
router.post('/send-otp', auth, async (req, res) => {
  try {
    const { email, action } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findById(req.user._id).select('email username');
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ message: 'Email does not match your registered account' });
    }

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await User.findByIdAndUpdate(req.user._id, {
      $set: { settingsOtp: otp, settingsOtpExpiry: expiry, settingsOtpAction: action }
    });

    const actionLabels = {
      deactivate:    'Account Deactivation',
      deleteJobs:    'Delete All Job Postings',
      deleteAccount: 'Account Deletion',
    };

    const transporter = makeTransporter();
    await transporter.sendMail({
      from: `"ELance Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your confirmation code — ${actionLabels[action] || 'Settings'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#1a2f4e,#163d5e);padding:20px;border-radius:10px 10px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">🔐 ELance Portal</h1>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;">
            <p style="font-size:15px;color:#0f172a;">Hi <strong>${user.username}</strong>,</p>
            <p style="color:#475569;">You requested: <strong>${actionLabels[action] || action}</strong></p>
            <div style="background:#fef3c7;border:2px dashed #E85D3F;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
              <p style="margin:0 0 8px;color:#666;font-size:13px;">Your confirmation code</p>
              <h1 style="color:#E85D3F;letter-spacing:12px;margin:0;font-size:40px;">${otp}</h1>
            </div>
            <p style="color:#64748b;font-size:13px;">⏱ This code expires in <strong>10 minutes</strong>.</p>
            <p style="color:#64748b;font-size:13px;">If you didn't request this, ignore this email — no changes will be made.</p>
            <p style="color:#0f172a;margin-top:20px;">— ELance Team</p>
          </div>
        </div>`,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('send-otp error:', err.message);
    res.status(500).json({ message: 'Failed to send email. Please try again.' });
  }
});

// POST /api/auth/verify-settings-otp — verify OTP for settings actions
router.post('/verify-settings-otp', auth, async (req, res) => {
  try {
    const { email, code, action } = req.body;
    const user = await User.findById(req.user._id).select('email settingsOtp settingsOtpExpiry settingsOtpAction');

    if (!user)                              return res.status(404).json({ message: 'User not found' });
    if (!user.settingsOtp)                  return res.status(400).json({ message: 'No OTP found. Request a new code.' });
    if (Date.now() > user.settingsOtpExpiry) return res.status(400).json({ message: 'OTP expired. Request a new code.' });
    if (user.settingsOtp !== code)           return res.status(400).json({ message: 'Invalid code. Try again.' });
    if (user.settingsOtpAction !== action)   return res.status(400).json({ message: 'OTP mismatch. Request a new code.' });

    await User.findByIdAndUpdate(req.user._id, {
      $unset: { settingsOtp: '', settingsOtpExpiry: '', settingsOtpAction: '' }
    });

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const bcrypt = require('bcryptjs');
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/deactivate
router.post('/deactivate', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isDeactivated: true, deactivatedAt: new Date() } },
      { new: true }
    ).select('-password');

    try {
      const transporter = makeTransporter();
      await transporter.sendMail({
        from: `"ELance Portal" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your ELance account has been deactivated',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#d97706;">⚠️ Account Deactivated</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>Your ELance recruiter account has been <strong>temporarily deactivated</strong>.</p>
            <p>To reactivate, please contact our support team.</p>
            <p style="color:#999;font-size:12px;">If you did not request this, contact support immediately.</p>
            <p>— ELance Team</p>
          </div>`,
      });
    } catch(e) { console.warn('Deactivate email failed:', e.message); }

    res.json({ message: 'Account deactivated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/delete-account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { email, username } = user;

    if (user.role === 'recruiter') {
      const Application = require('../models/Application');
      const jobs = await Job.find({ postedBy: req.user._id });
      await Application.deleteMany({ jobId: { $in: jobs.map(j => j._id) } });
      await Job.deleteMany({ postedBy: req.user._id });
    }

    if (user.resumeUrl) {
      try {
        const filePath = path.join(__dirname, '..', user.resumeUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch(e) {}
    }

    await User.findByIdAndDelete(req.user._id);

    try {
      const transporter = makeTransporter();
      await transporter.sendMail({
        from: `"ELance Portal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your ELance account has been permanently deleted',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#ef4444;">🗑️ Account Deleted</h2>
            <p>Hi <strong>${username}</strong>,</p>
            <p>Your ELance account and all associated data have been <strong>permanently deleted</strong>.</p>
            <p style="color:#999;font-size:12px;">This action cannot be undone.</p>
            <p>— ELance Team</p>
          </div>`,
      });
    } catch(e) { console.warn('Delete account email failed:', e.message); }

    res.json({ message: 'Account permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', (req, res) => {
  res.json({ message: 'ELance Auth API' });
});

module.exports = router;
