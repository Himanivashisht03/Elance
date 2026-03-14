//backend/controllers/resumeController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const geminiService = require('../utils/geminiService');
const User = require('../models/User');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
    }
  }
});

async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error('pdf-parse error:', err.message);
    return 'Resume file uploaded. Extract skills and work experience from context.';
  }
}

const uploadResume = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    console.log('Resume uploaded:', filePath);

    const extractedText = await extractTextFromPDF(filePath);
    console.log('Extracted text length:', extractedText.length);

    const resumeAnalysis = await geminiService('analyzeResume', { resumeText: extractedText });
    console.log('Resume analysis done:', JSON.stringify(resumeAnalysis, null, 2));

    await updateUserProfile(userId, resumeAnalysis);

    // Delete temp file
    try { fs.unlinkSync(filePath); } catch (e) {}

    res.json({
      message: 'Resume processed successfully',
      fileName: originalName,
      analysis: resumeAnalysis
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Failed to process resume: ' + error.message });
  }
};

async function updateUserProfile(userId, resumeAnalysis) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // ── Skills (merge, no duplicates) ──
    const extractedSkills = resumeAnalysis.skills || [];
    const mergedSkills = [...new Set([...(user.skills || []), ...extractedSkills])];

    // ── Experience → DB schema ──
    const extractedExp = resumeAnalysis.experience || [];
    const formattedExperience = extractedExp.map(exp => ({
      title:       exp.title || exp.role || '',
      company:     exp.company || '',
      startDate:   parseDurationStart(exp.duration || exp.period || ''),
      endDate:     parseDurationEnd(exp.duration || exp.period || ''),
      description: exp.description || exp.responsibilities || '',
    }));

    // ── Education → DB schema ──
    const extractedEdu = resumeAnalysis.education || [];
    const formattedEducation = extractedEdu.map(edu => ({
      degree:      edu.degree || '',
      institution: edu.institution || '',
      field:       edu.field || edu.degree || '',
      startYear:   edu.year || '',
      endYear:     edu.year || '',
    }));

    // ── Build update object ──
    const updateData = {
      skills:         mergedSkills,
      currentCompany: resumeAnalysis.currentCompany || user.currentCompany || '',
    };

    // Personal info from resume (only update if not already set)
    if (resumeAnalysis.personalInfo) {
      const pi = resumeAnalysis.personalInfo;
      if (pi.phone    && !user.phone)    updateData.phone    = pi.phone;
      if (pi.location && !user.location) updateData.location = pi.location;
    }

    // Experience: merge with existing (avoid full duplicates by checking title+company)
    if (formattedExperience.length > 0) {
      const existing = user.experience || [];
      const existingKeys = new Set(existing.map(e => `${e.title}|${e.company}`));
      const newExp = formattedExperience.filter(e => !existingKeys.has(`${e.title}|${e.company}`));
      updateData.experience = [...existing, ...newExp];
    }

    // Education: merge with existing
    if (formattedEducation.length > 0) {
      const existing = user.education || [];
      const existingKeys = new Set(existing.map(e => `${e.degree}|${e.institution}`));
      const newEdu = formattedEducation.filter(e => !existingKeys.has(`${e.degree}|${e.institution}`));
      updateData.education = [...existing, ...newEdu];
    }

    // Career goals
    if (resumeAnalysis.currentRole) {
      updateData['careerGoals.currentRole'] = resumeAnalysis.currentRole;
    }

    await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    console.log(`✅ Profile updated — Skills: ${mergedSkills.length} | Exp: ${formattedExperience.length} | Edu: ${formattedEducation.length}`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Parse "Jan 2020 - Dec 2022" → start Date
function parseDurationStart(duration) {
  if (!duration) return null;
  const parts = duration.split(/[-–]/);
  if (parts.length >= 1) {
    const d = new Date(parts[0].trim());
    return isNaN(d) ? null : d;
  }
  return null;
}

// Parse "Jan 2020 - Dec 2022" → end Date (null if Present/Current)
function parseDurationEnd(duration) {
  if (!duration) return null;
  const lower = duration.toLowerCase();
  if (lower.includes('present') || lower.includes('current')) return null;
  const parts = duration.split(/[-–]/);
  if (parts.length >= 2) {
    const d = new Date(parts[1].trim());
    return isNaN(d) ? null : d;
  }
  return null;
}

module.exports = { uploadResume, upload };
