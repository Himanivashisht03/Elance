//backend\routes\resume.js
const express = require('express');
const router = express.Router();
const { uploadResume, upload } = require('../controllers/resumeController');
const auth = require('../middleware/auth');

// Upload resume endpoint
router.post('/upload', auth, upload.single('resume'), uploadResume);

module.exports = router;