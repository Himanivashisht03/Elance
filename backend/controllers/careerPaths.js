//backend\controllers\careerPaths.js
const CareerPath = require('../models/CareerPath');
const User = require('../models/User');
const geminiService = require('../utils/geminiService');

// Get career path recommendations
exports.getCareerPathRecommendations = async (req, res) => {
    try {
        const { currentRole, targetRole } = req.query;
        const careerPaths = await CareerPath.find({
            'steps.role': { 
                $all: [currentRole, targetRole] 
            }
        }).populate('steps.requiredSkills');
        
        res.json(careerPaths);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get skill gaps for a career path
exports.analyzeSkillGaps = async (req, res) => {
    try {
        const { userId, careerPathId } = req.params;
        
        const user = await User.findById(userId)
            .populate('skills.skill');
        const careerPath = await CareerPath.findById(careerPathId)
            .populate('steps.requiredSkills');
        
        const userSkills = new Set(user.skills.map(s => s.skill.name));
        const targetRole = careerPath.steps[careerPath.steps.length - 1];
        const requiredSkills = new Set(targetRole.requiredSkills.map(s => s.name));
        
        // Calculate skill gaps
        const skillGaps = [...requiredSkills].filter(skill => !userSkills.has(skill));
        
        res.json({
            currentSkills: [...userSkills],
            requiredSkills: [...requiredSkills],
            skillGaps,
            gapPercentage: (skillGaps.length / requiredSkills.size) * 100
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user career goals
exports.updateCareerGoals = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentRole, targetRole, targetTimeline, careerPathId } = req.body;
        
        const user = await User.findByIdAndUpdate(userId, {
            careerGoals: {
                currentRole,
                targetRole,
                targetTimeline,
                careerPath: careerPathId
            }
        }, { new: true });
        
        res.json(user.careerGoals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate Gemini AI advice for career planning
exports.generateGeminiAdvice = async (req, res) => {
    try {
        const { currentRole, targetRole, userSkills } = req.body;
        
        const recommendations = await geminiService.generateSkillRecommendations(
            currentRole,
            targetRole,
            userSkills
        );
        
        res.json(recommendations);
    } catch (error) {
        console.error('Error generating Gemini advice:', error);
        res.status(500).json({ message: 'Failed to generate AI advice' });
    }
};
