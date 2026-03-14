// backend/controllers/jobController.js - FIXED
// requiredSkills ab simple [String] hai — ObjectId conversion nahi hoga

const Job         = require('../models/Job');
const Application = require('../models/Application');

/* ────────────────────────────────────────────────────────────
   POST /api/jobs  — create job
──────────────────────────────────────────────────────────── */
exports.createJob = async (req, res) => {
  try {
    const {
      title, company, description, location,
      requiredSkills, salaryRange, type, experience, status,
      salaryMin, salaryMax, currency,
    } = req.body;

    // ✅ Skills = clean string array, no ObjectId conversion
    const skills = (Array.isArray(requiredSkills) ? requiredSkills : [])
      .map(s => String(s).trim())
      .filter(Boolean);

    // salaryRange build karo agar min/max alag se aaye
    const salary = salaryRange || (salaryMin || salaryMax ? {
      min: parseInt(salaryMin) || 0,
      max: parseInt(salaryMax) || 0,
      currency: currency || 'USD',
    } : undefined);

    const job = await Job.create({
      title, company, description, location,
      requiredSkills: skills,
      salaryRange: salary,
      type, experience,
      status: status || 'active',
      postedBy: req.user._id,
    });

    res.status(201).json({ ...job.toObject(), applications: 0 });
  } catch (err) {
    console.error('createJob error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   PUT /api/jobs/:id  — update job
──────────────────────────────────────────────────────────── */
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const {
      title, company, description, location,
      requiredSkills, salaryRange, type, experience, status,
      salaryMin, salaryMax, currency,
    } = req.body;

    if (title)       job.title       = title;
    if (company)     job.company     = company;
    if (description) job.description = description;
    if (location)    job.location    = location;
    if (type)        job.type        = type;
    if (experience)  job.experience  = experience;
    if (status)      job.status      = status;

    if (salaryRange) {
      job.salaryRange = salaryRange;
    } else if (salaryMin || salaryMax) {
      job.salaryRange = {
        min: parseInt(salaryMin) || 0,
        max: parseInt(salaryMax) || 0,
        currency: currency || 'USD',
      };
    }

    // ✅ Skills = clean string array
    if (requiredSkills) {
      job.requiredSkills = (Array.isArray(requiredSkills) ? requiredSkills : [])
        .map(s => String(s).trim())
        .filter(Boolean);
    }

    await job.save();
    res.json(job.toObject());
  } catch (err) {
    console.error('updateJob error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/jobs  — all active jobs
──────────────────────────────────────────────────────────── */
exports.getAllJobs = async (req, res) => {
  try {
    const { search, location, type, experience } = req.query;
    const filter = { status: 'active' };

    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { company:     { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (location)   filter.location   = { $regex: location, $options: 'i' };
    if (type)       filter.type       = type;
    if (experience) filter.experience = experience;

    const jobs = await Job.find(filter)
      .populate('postedBy', 'username email recruiterProfile')
      .sort({ createdAt: -1 })
      .lean();

    const userSkills = (req.user?.skills || []).map(s => s.toLowerCase());

    const result = await Promise.all(jobs.map(async (job) => {
      const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      const matched = userSkills.filter(us => jobSkills.includes(us)).length;
      const matchPercentage = jobSkills.length
        ? Math.round((matched / jobSkills.length) * 100) : 0;
      const applications = await Application.countDocuments({ jobId: job._id });
      return { ...job, matchPercentage, skillsMatched: matched, applications };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/jobs/public
──────────────────────────────────────────────────────────── */
exports.getPublicJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/jobs/recruiter
──────────────────────────────────────────────────────────── */
exports.getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const jobIds = jobs.map(j => j._id);
    const counts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[String(c._id)] = c.count; });

    const jobsWithCount = jobs.map(j => ({
      ...j,
      applications: countMap[String(j._id)] || 0,
    }));

    res.json(jobsWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/jobs/:id
──────────────────────────────────────────────────────────── */
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'username email recruiterProfile');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   DELETE /api/jobs/:id
──────────────────────────────────────────────────────────── */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ────────────────────────────────────────────────────────────
   PATCH /api/jobs/:id/status
──────────────────────────────────────────────────────────── */
exports.updateJobStatus = async (req, res) => {
  try {
    const allowed = ['active', 'paused', 'closed'];
    const status = req.body.status || req.params.status;

    if (!allowed.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id || req.params.jobId, postedBy: req.user._id },
      { status },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
