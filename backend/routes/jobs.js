// backend/routes/jobs.js
const express = require('express');
const router  = express.Router();
const nodemailer     = require('nodemailer');
const Job            = require('../models/Job');
const Application    = require('../models/Application');
const authMiddleware = require('../middleware/auth');

function makeTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

// ═══════════════════════════════════════
// PUBLIC ROUTES — MUST be first
// ═══════════════════════════════════════

router.get('/public/stats', async (req, res) => {
  try {
    const companies = await Job.distinct('company', { status: 'active' });
    const companiesHiring = companies.filter(Boolean).length;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const liveToday = await Job.countDocuments({ status: 'active', createdAt: { $gte: todayStart } });
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const placedThisMonth = await Application.countDocuments({ status: 'accepted', updatedAt: { $gte: monthStart } });
    const totalAccepted    = await Application.countDocuments({ status: 'accepted' });
    const totalApplications = await Application.countDocuments({});
    const placementRate = totalApplications > 0 ? Math.round((totalAccepted / totalApplications) * 100) : null;
    res.json({ companiesHiring, liveToday, placedThisMonth: placedThisMonth > 0 ? placedThisMonth : totalAccepted, placementRate });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
// AUTHENTICATED STATIC ROUTES
// ═══════════════════════════════════════

router.get('/recruiter', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).lean();
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ jobId: job._id });
        return {
          ...job,
          _id: job._id.toString(),
          postedBy: job.postedBy?.toString(),
          applications: count,
          requiredSkills: (job.requiredSkills || []).map(String).filter(Boolean),
        };
      })
    );
    res.json(jobsWithCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/applications/my', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate('jobId', 'title company location type')
      .sort({ appliedAt: -1 });
    res.json(applications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/applications/stats', authMiddleware, async (req, res) => {
  try {
    const recruiterJobs = await Job.find({ postedBy: req.user._id });
    const jobIds = recruiterJobs.map(j => j._id);
    const [total, pending, shortlisted, accepted, rejected] = await Promise.all([
      Application.countDocuments({ jobId: { $in: jobIds } }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'pending' }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'shortlisted' }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'accepted' }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: 'rejected' }),
    ]);
    res.json({ total, pending, shortlisted, accepted, rejected });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/applications/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const appId = req.params.id;
  const allowed = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
  if (!status) return res.status(400).json({ message: 'status required' });
  if (!allowed.includes(status)) return res.status(400).json({ message: `Invalid status: ${status}` });
  if (!appId || appId.length !== 24) return res.status(400).json({ message: `Bad application ID` });
  try {
    const application = await Application.findById(appId).populate({ path: 'jobId', select: 'postedBy title' });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.jobId?.postedBy?.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    application.status = status;
    await application.save();
    res.json({ message: 'Status updated', application });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ══════════════════════════════════════════
// DELETE ALL JOBS — must be before /:id routes
// ══════════════════════════════════════════

router.delete('/delete-all', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id });
    const jobIds = jobs.map(j => j._id);

    await Application.deleteMany({ jobId: { $in: jobIds } });
    const result = await Job.deleteMany({ postedBy: req.user._id });

    // Send confirmation email
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user._id).select('email username');
      const transporter = makeTransporter();
      await transporter.sendMail({
        from: `"ELance Portal" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'All job postings deleted — ELance',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#ef4444;">🗑️ All Job Postings Deleted</h2>
            <p>Hi <strong>${user.username}</strong>,</p>
            <p><strong>${result.deletedCount} job posting(s)</strong> and all their associated applications have been permanently deleted.</p>
            <p style="color:#999;font-size:12px;">This action cannot be undone.</p>
            <p>— ELance Team</p>
          </div>`,
      });
    } catch(e) { console.warn('Delete-all-jobs email failed:', e.message); }

    res.json({ message: `${result.deletedCount} jobs deleted`, deletedCount: result.deletedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
// GENERAL JOB ROUTES
// ═══════════════════════════════════════

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: { $ne: 'closed' } }).sort({ createdAt: -1 }).lean();
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applications = await Application.countDocuments({ jobId: job._id });
        return { ...job, applications };
      })
    );
    res.json(jobsWithCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    let skills = body.requiredSkills || [];
    if (typeof skills === 'string') { try { skills = JSON.parse(skills); } catch { skills = [skills]; } }
    body.requiredSkills = Array.isArray(skills) ? skills.flat().map(s => String(s).trim()).filter(Boolean) : [];
    if (!body.salaryRange && (body.salaryMin || body.salaryMax)) {
      body.salaryRange = { min: parseInt(body.salaryMin)||0, max: parseInt(body.salaryMax)||0, currency: body.currency||'USD' };
    }
    const job = await Job.create({ ...body, postedBy: req.user._id });
    res.status(201).json({ ...job.toObject(), applications: 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════
// DYNAMIC /:param ROUTES — ALWAYS LAST
// ═══════════════════════════════════════

router.get('/:jobId/applications', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('applicantId', 'username email skills currentRole currentCompany careerGoals experience phone')
      .populate('jobId', 'title company location requiredSkills postedBy')
      .sort({ appliedAt: -1 });
    const result = applications.map(app => {
      const a = app.toObject({ versionKey: false });
      const user = a.applicantId || {};
      return {
        _id: a._id.toString(),
        status: a.status || 'pending',
        appliedAt: a.appliedAt,
        coverLetter: a.coverLetter || '',
        notes: a.notes || '',
        jobId: a.jobId ? {
          _id: a.jobId._id.toString(),
          title: a.jobId.title,
          company: a.jobId.company,
          location: a.jobId.location,
          postedBy: a.jobId.postedBy?.toString(),
          requiredSkills: (a.jobId.requiredSkills || []).map(String).filter(Boolean),
        } : null,
        applicantId: {
          _id: user._id?.toString() || '',
          username: user.username || 'Unknown',
          email: user.email || '',
          currentRole: user.currentRole || user.careerGoals?.currentRole || '',
          currentCompany: user.currentCompany || '',
          careerGoals: user.careerGoals || {},
          experience: user.experience || [],
          phone: user.phone || '',
          skills: (user.skills || []).map(String).filter(Boolean),
        },
      };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:jobId/apply', authMiddleware, async (req, res) => {
  try {
    const existing = await Application.findOne({ jobId: req.params.jobId, applicantId: req.user._id });
    if (existing) return res.status(409).json({ message: 'Aap pehle se apply kar chuke hain' });
    const application = await Application.create({
      jobId: req.params.jobId, applicantId: req.user._id,
      coverLetter: req.body.coverLetter || '', appliedAt: new Date(),
    });
    res.status(201).json(application);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'paused', 'closed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const job = await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, { status }, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found or permission denied' });
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
