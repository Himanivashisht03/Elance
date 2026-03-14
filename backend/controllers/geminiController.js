//backend\controllers\geminiController.js
const geminiService = require('../utils/geminiService');
const User = require('../models/User');

// Generate AI-powered career advice
exports.generateCareerAdvice = async (req, res) => {
  try {
    const { currentRole, targetRole, userSkills } = req.body;
    const userId = req.user._id;

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      currentRole: user.careerGoals?.currentRole || currentRole,
      skills: userSkills || user.skills?.map(s => s.skill?.name).filter(Boolean) || [],
      experience: user.experience || []
    };

    const careerGoals = {
      targetRole,
      timeline: user.careerGoals?.targetTimeline || 12
    };

    const advice = await geminiService.generateCareerAdvice(userProfile, careerGoals);
    
    res.json(advice);
  } catch (error) {
    console.error('Error generating career advice:', error);
    res.status(500).json({ message: 'Failed to generate career advice' });
  }
};

// Generate skill recommendations
exports.generateSkillRecommendations = async (req, res) => {
  try {
    const { currentRole, targetRole, userSkills } = req.body;

    const recommendations = await geminiService.generateSkillRecommendations(
      currentRole,
      targetRole,
      userSkills
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    res.status(500).json({ message: 'Failed to generate skill recommendations' });
  }
};

// Analyze job market trends
exports.analyzeJobMarketTrends = async (req, res) => {
  try {
    const { industry } = req.query;

    const trends = await geminiService.analyzeJobMarketTrends(industry || 'Technology');
    
    res.json(trends);
  } catch (error) {
    console.error('Error analyzing job market trends:', error);
    res.status(500).json({ message: 'Failed to analyze job market trends' });
  }
};
