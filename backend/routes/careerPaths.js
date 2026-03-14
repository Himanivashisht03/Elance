//backend\routes\careerPaths.js
const express = require('express');
const router = express.Router();
const { 
    getCareerPathRecommendations, 
    analyzeSkillGaps, 
    updateCareerGoals,
    generateGeminiAdvice
} = require('../controllers/careerPaths');
const auth = require('../middleware/auth');

// Get career path recommendations
router.get('/recommendations', auth, getCareerPathRecommendations);

// Analyze skill gaps for a career path
router.get('/skill-gaps/:userId/:careerPathId', auth, analyzeSkillGaps);

// Update user career goals
router.put('/goals/:userId', auth, updateCareerGoals);

// Generate Gemini AI advice
router.post('/gemini-advice', auth, generateGeminiAdvice);

module.exports = router;