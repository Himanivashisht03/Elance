//backend\routes\gemini.js
const express = require('express');
const router = express.Router();
const { 
    generateCareerAdvice, 
    generateSkillRecommendations, 
    analyzeJobMarketTrends 
} = require('../controllers/geminiController');
const auth = require('../middleware/auth');

// POST routes (main functionality)
router.post('/career-advice', auth, generateCareerAdvice);
router.post('/skill-recommendations', auth, generateSkillRecommendations);
router.get('/market-trends', auth, analyzeJobMarketTrends);

// GET routes for API documentation/testing
router.get('/career-advice', (req, res) => {
    res.json({
        message: 'Career Advice API - POST method required',
        method: 'POST',
        endpoint: '/api/gemini/career-advice',
        authentication: 'Bearer token required',
        requiredBody: {
            currentRole: 'string (optional - falls back to user profile)',
            targetRole: 'string (required)',
            userSkills: ['array', 'of', 'strings (optional - falls back to user profile)']
        },
        example: {
            currentRole: 'Junior Developer',
            targetRole: 'Senior Full Stack Developer',
            userSkills: ['JavaScript', 'Node.js', 'MongoDB', 'React']
        }
    });
});

router.get('/skill-recommendations', (req, res) => {
    res.json({
        message: 'Skill Recommendations API - POST method required',
        method: 'POST',
        endpoint: '/api/gemini/skill-recommendations',
        authentication: 'Bearer token required',
        requiredBody: {
            currentRole: 'string (required)',
            targetRole: 'string (required)',
            userSkills: ['array', 'of', 'strings (required)']
        },
        example: {
            currentRole: 'Junior Developer',
            targetRole: 'Senior Full Stack Developer',
            userSkills: ['JavaScript', 'Node.js', 'Express.js']
        }
    });
});

// API help route
router.get('/', (req, res) => {
    res.json({
        message: 'Gemini AI Integration API',
        description: 'AI-powered career advice and skill recommendations',
        endpoints: [
            'GET /api/gemini/ - This help page',
            'GET /api/gemini/career-advice - API documentation for career advice',
            'POST /api/gemini/career-advice - Generate personalized career advice',
            'GET /api/gemini/skill-recommendations - API documentation for skill recommendations',
            'POST /api/gemini/skill-recommendations - Get AI skill recommendations',
            'GET /api/gemini/market-trends?industry=Technology - Analyze job market trends'
        ],
        note: 'All POST endpoints require Bearer token authentication',
        testingNote: 'Use GET endpoints to see API documentation before testing with POST'
    });
});

module.exports = router;
