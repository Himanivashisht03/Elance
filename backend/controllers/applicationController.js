// backend/controllers/applicationController.js
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// Apply for a job (job seeker)
exports.applyForJob = async (req, res) => {
  try {
    const user = req.user;
    const { jobId, coverLetter } = req.body;

    if (user.userType !== 'jobSeeker') {
      return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    const existingApplication = await Application.findOne({ jobId, applicantId: user._id });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new Application({
      jobId,
      applicantId: user._id,
      coverLetter: coverLetter || '',
      status: 'pending'
    });

    await application.save();

    await application.populate({
      path: 'jobId',
      select: 'title company location requiredSkills'
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      message: 'Server error submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get applications for a job (recruiter)
// FIX: populate now includes ALL fields needed for skill match + display
exports.getJobApplications = async (req, res) => {
  try {
    const user = req.user;
    const { jobId } = req.params;

    if (user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can view applications' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only view applications for your own jobs' });
    }

    const applications = await Application.find({ jobId })
      .populate({
        path: 'applicantId',
        // FIX 1: Added 'currentRole' and 'phone' — these are top-level User fields,
        // not nested inside careerGoals. Without them skill match card showed blank role
        // and calcMatch() received incomplete applicant data.
        select: 'username email skills careerGoals currentRole currentCompany experience phone'
      })
      .populate({
        path: 'jobId',
        // FIX 2: Always return requiredSkills with the application so the frontend
        // calcMatch() function has job skills available without a second lookup.
        select: 'title company location requiredSkills postedBy'
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

// Get applications by user (job seeker)
exports.getUserApplications = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'jobSeeker') {
      return res.status(403).json({ message: 'Only job seekers can view their applications' });
    }

    const applications = await Application.find({ applicantId: user._id })
      .populate({
        path: 'jobId',
        select: 'title company location type experience salaryRange status'
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

// Update application status (recruiter)
// FIX 3: Now returns the fully populated application so frontend state
// can update correctly without a separate refetch.
exports.updateApplicationStatus = async (req, res) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    if (user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can update application status' });
    }

    // Validate status value
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await Application.findById(applicationId).populate({
      path: 'jobId',
      select: 'postedBy title'
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.jobId.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only update applications for your own jobs' });
    }

    application.status = status || application.status;
    if (notes !== undefined) application.notes = notes;

    await application.save();

    // Re-populate with full applicant details for frontend state sync
    await application.populate({
      path: 'applicantId',
      select: 'username email skills careerGoals currentRole currentCompany experience phone'
    });

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error updating application' });
  }
};

// Get application stats for recruiter dashboard
exports.getApplicationStats = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can view application stats' });
    }

    const jobs = await Job.find({ postedBy: user._id });
    const jobIds = jobs.map(job => job._id);

    const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });

    const applicationsByStatus = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentApplications = await Application.find({ jobId: { $in: jobIds } })
      .populate({ path: 'jobId', select: 'title' })
      .populate({ path: 'applicantId', select: 'username email' })
      .sort({ appliedAt: -1 })
      .limit(5);

    res.json({
      totalApplications,
      applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentApplications
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Server error fetching application stats' });
  }
};
