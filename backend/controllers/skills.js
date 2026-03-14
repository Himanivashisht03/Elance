//backend\controllers\skills.js
const Skill = require('../models/Skill');
const Job = require('../models/Job');
const User = require('../models/User');

// Get trending skills
exports.getTrendingSkills = async (req, res) => {
    try {
        const trendingSkills = await Skill.find({ trending: true })
            .sort({ demandScore: -1 })
            .limit(10);
        res.json(trendingSkills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ★ FIX: Analyze skill demand from job listings — recruiter-wise count
exports.analyzeSkillDemand = async (req, res) => {
    try {
        // Sirf active jobs lo, recruiter filter optional
        const jobFilter = { status: 'active' };
        if (req.query.recruiterId) {
            const mongoose = require('mongoose');
            jobFilter.postedBy = new mongoose.Types.ObjectId(req.query.recruiterId);
        }

        const activeJobs = await Job.find(jobFilter).populate('requiredSkills');

        // Har skill kitni jobs mein hai — woh count karo
        const skillFrequency = new Map();

        activeJobs.forEach(job => {
            job.requiredSkills.forEach(skill => {
                const count = skillFrequency.get(skill.id) || 0;
                skillFrequency.set(skill.id, count + 1);
            });
        });

        // ★ FIX: demandScore = kitni jobs mein hai (job count)
        for (const [skillId, frequency] of skillFrequency) {
            await Skill.findByIdAndUpdate(skillId, {
                demandScore: frequency,
                trending: frequency > 2 // 2+ jobs mein ho toh trending
            });
        }

        res.json({ message: 'Skill demand analysis completed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Compare user skills with trending skills
exports.compareUserSkills = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('skills.skill');
        const trendingSkills = await Skill.find({ trending: true });

        const userSkillSet = new Set(user.skills.map(s => s.skill.name));
        const trendingSkillSet = new Set(trendingSkills.map(s => s.name));

        // Calculate match percentage
        const matchingSkills = [...trendingSkillSet].filter(skill => userSkillSet.has(skill));
        const matchPercentage = (matchingSkills.length / trendingSkillSet.size) * 100;

        // Find skills to learn
        const skillsToLearn = [...trendingSkillSet].filter(skill => !userSkillSet.has(skill));

        res.json({
            matchPercentage,
            matchingSkills,
            skillsToLearn
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
