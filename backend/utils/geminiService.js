//backend/utils/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
require("dotenv").config();

// ── Gemini (for non-resume tasks) ──
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ── GROQ (free & fast — for analyzeResume) ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

/**
 * Safely parse JSON from LLM output
 */
function safeJSONParse(text, fallback) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

/**
 * Unified Service
 */
async function geminiService(type, payload) {
  try {
    let prompt = "";
    let fallback = {};

    switch (type) {

      // ✅ analyzeResume — GROQ use karega (free, no quota issues)
      case "analyzeResume": {
        const { resumeText } = payload;
        prompt = `
          Analyze the following resume text and extract structured information.
          Return ONLY valid JSON, no extra text, no markdown.

          Resume:
          ${resumeText}

          JSON structure:
          {
            "personalInfo": {
              "name": "extracted name or empty string",
              "email": "extracted email or empty string",
              "phone": "extracted phone or empty string",
              "location": "extracted location or empty string"
            },
            "currentRole": "current job title or empty string",
            "currentCompany": "current company or empty string",
            "skills": ["skill1", "skill2"],
            "experience": [
              {
                "title": "job title",
                "company": "company name",
                "duration": "e.g. Jan 2020 - Dec 2022",
                "description": "brief description"
              }
            ],
            "education": [
              {
                "degree": "degree name",
                "institution": "institution name",
                "year": "graduation year"
              }
            ],
            "summary": "brief professional summary"
          }
        `;
        fallback = {
          personalInfo: { name: "", email: "", phone: "", location: "" },
          currentRole: "",
          currentCompany: "",
          skills: [],
          experience: [],
          education: [],
          summary: ""
        };

        // ✅ GROQ call
        const groqResponse = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a resume parser. Always respond with valid JSON only. No markdown, no explanation."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2000,
        });

        const text = groqResponse.choices[0]?.message?.content || '';
        console.log('GROQ resume analysis done ✅');
        return safeJSONParse(text, fallback);
      }

      case "generateSkillRecommendations": {
        const { currentRole, targetRole, userSkills } = payload;
        prompt = `
          Based on the following information, provide skill recommendations:
          - Current Role: ${currentRole}
          - Target Role: ${targetRole}
          - Current Skills: ${userSkills.join(', ')}

          Return ONLY JSON:
          {
            "recommendedSkills": [
              {
                "skill": "skill name",
                "priority": "high/medium/low",
                "resources": ["resource1", "resource2"],
                "timeline": "X months"
              }
            ],
            "transitionPath": "brief description"
          }
        `;
        fallback = {
          recommendedSkills: [
            { skill: "Communication", priority: "high", resources: ["LinkedIn Learning"], timeline: "3 months" }
          ],
          transitionPath: "Focus on developing key skills"
        };
        break;
      }

      case "analyzeJobMarketTrends": {
        const { industry } = payload;
        prompt = `
          Analyze job market trends for ${industry} industry.
          Return ONLY JSON:
          {
            "trendingSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
            "salaryTrends": "description",
            "jobGrowth": "description",
            "emergingRoles": ["role1", "role2"]
          }
        `;
        fallback = {
          trendingSkills: ["JavaScript", "Python", "React", "Node.js", "AWS"],
          salaryTrends: "Growing demand for tech skills",
          jobGrowth: "Positive growth in tech sector",
          emergingRoles: ["AI Engineer", "DevOps Engineer"]
        };
        break;
      }

      case "generateCareerAdvice": {
        const { userProfile, careerGoals } = payload;
        prompt = `
          Provide career advice based on:
          - Current Role: ${userProfile.currentRole || 'Not specified'}
          - Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
          - Target Role: ${careerGoals.targetRole || 'Not specified'}
          - Timeline: ${careerGoals.timeline || 'Not specified'}

          Return ONLY JSON:
          {
            "roadmap": "step-by-step career roadmap",
            "skillPriorities": ["priority1", "priority2", "priority3"],
            "networkingTips": ["tip1", "tip2"],
            "industryInsights": "relevant insights"
          }
        `;
        fallback = {
          roadmap: "Focus on skill development and networking",
          skillPriorities: ["Technical Skills", "Soft Skills", "Industry Knowledge"],
          networkingTips: ["Attend industry events", "Connect on LinkedIn"],
          industryInsights: "Stay updated with industry trends"
        };
        break;
      }

      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }

    // Gemini call for non-resume tasks
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    return safeJSONParse(text, fallback);

  } catch (error) {
    console.error(`Gemini Service error (${type}):`, error.message);
    throw new Error(`Failed to process Gemini request: ${type}`);
  }
}

module.exports = geminiService;
