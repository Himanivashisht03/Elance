//backend\routes\skills.js
const express = require('express');
const router = express.Router();
const { getTrendingSkills, analyzeSkillDemand, compareUserSkills } = require('../controllers/skills');
const auth = require('../middleware/auth');

// Get trending skills
router.get('/trending', getTrendingSkills);

// Analyze skill demand
router.post('/analyze-demand', auth, analyzeSkillDemand);

// Compare user skills with trending skills
router.get('/compare/:userId', auth, compareUserSkills);
// Base route – list all skills or API help
router.get('/', async (req, res) => {
  res.json({
    message: 'Skills API',
    endpoints: [
      '/api/skills/trending',
      '/api/skills/analyze-demand',
      '/api/skills/compare/:userId'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;