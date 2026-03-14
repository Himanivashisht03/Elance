// backend/seedCandidates.js
// Run ONCE to populate MongoDB: node seedCandidates.js
// You can delete this file after seeding.

import mongoose from "mongoose";
import dotenv from "dotenv";
import Candidate from "./models/Candidate.js";

dotenv.config();

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000);
}

const candidates = [
  // ── Data Analyst ──────────────────────────────────────────────────────
  { name: "Aditi Sharma", role: "Data Analyst", company: "Google", experienceYears: 2.1, location: "Bangalore", rating: 4, avatarColor: "#F59E0B", matchPercent: 92, totalSkillsRequired: 7, appliedAt: daysAgo(5), skills: [{ name: "SQL", proficiency: 95 }, { name: "Excel", proficiency: 80 }, { name: "Python", proficiency: 90 }, { name: "Power BI", proficiency: 85 }, { name: "Tableau", proficiency: 75 }, { name: "Statistics", proficiency: 88 }] },
  { name: "Rahul Verma", role: "Data Analyst", company: "Amazon", experienceYears: 3.0, location: "Pune", rating: 4.5, avatarColor: "#60A5FA", matchPercent: 85, totalSkillsRequired: 7, appliedAt: daysAgo(8), skills: [{ name: "SQL", proficiency: 90 }, { name: "Excel", proficiency: 70 }, { name: "Python", proficiency: 88 }, { name: "Power BI", proficiency: 65 }, { name: "Tableau", proficiency: 72 }] },
  { name: "Neha Gupta", role: "Data Analyst", company: "Flipkart", experienceYears: 1.8, location: "Hyderabad", rating: 4, avatarColor: "#A78BFA", matchPercent: 90, totalSkillsRequired: 7, appliedAt: daysAgo(3), skills: [{ name: "SQL", proficiency: 88 }, { name: "Excel", proficiency: 92 }, { name: "Python", proficiency: 85 }, { name: "Power BI", proficiency: 90 }, { name: "Tableau", proficiency: 95 }, { name: "Statistics", proficiency: 80 }, { name: "R", proficiency: 60 }] },
  { name: "Aman Singh", role: "Data Analyst", company: "TCS", experienceYears: 2.5, location: "Delhi NCR", rating: 3.5, avatarColor: "#34D399", matchPercent: 70, totalSkillsRequired: 7, appliedAt: daysAgo(12), skills: [{ name: "SQL", proficiency: 75 }, { name: "Excel", proficiency: 68 }, { name: "Python", proficiency: 72 }, { name: "Statistics", proficiency: 65 }] },
  { name: "Divya Menon", role: "Data Analyst", company: "Infosys", experienceYears: 5.2, location: "Remote", rating: 4, avatarColor: "#F472B6", matchPercent: 88, totalSkillsRequired: 7, appliedAt: daysAgo(20), skills: [{ name: "SQL", proficiency: 95 }, { name: "Excel", proficiency: 90 }, { name: "Python", proficiency: 78 }, { name: "Tableau", proficiency: 85 }, { name: "Statistics", proficiency: 92 }] },

  // ── Frontend Developer ────────────────────────────────────────────────
  { name: "Priya Mehta", role: "Frontend Developer", company: "Google", experienceYears: 3.2, location: "Bangalore", rating: 5, avatarColor: "#F59E0B", matchPercent: 94, totalSkillsRequired: 8, appliedAt: daysAgo(4), skills: [{ name: "React", proficiency: 95 }, { name: "CSS", proficiency: 90 }, { name: "JavaScript", proficiency: 92 }, { name: "TypeScript", proficiency: 85 }, { name: "Next.js", proficiency: 80 }, { name: "Testing", proficiency: 70 }, { name: "GraphQL", proficiency: 65 }] },
  { name: "Karan Joshi", role: "Frontend Developer", company: "Zomato", experienceYears: 2.5, location: "Pune", rating: 4.5, avatarColor: "#60A5FA", matchPercent: 88, totalSkillsRequired: 8, appliedAt: daysAgo(9), skills: [{ name: "React", proficiency: 90 }, { name: "CSS", proficiency: 85 }, { name: "JavaScript", proficiency: 88 }, { name: "TypeScript", proficiency: 75 }, { name: "Next.js", proficiency: 70 }, { name: "Testing", proficiency: 60 }] },
  { name: "Sneha Roy", role: "Frontend Developer", company: "Amazon", experienceYears: 4.0, location: "Remote", rating: 4, avatarColor: "#A78BFA", matchPercent: 96, totalSkillsRequired: 8, appliedAt: daysAgo(2), skills: [{ name: "React", proficiency: 98 }, { name: "CSS", proficiency: 95 }, { name: "JavaScript", proficiency: 97 }, { name: "TypeScript", proficiency: 92 }, { name: "Next.js", proficiency: 90 }, { name: "Testing", proficiency: 85 }, { name: "GraphQL", proficiency: 80 }, { name: "Performance", proficiency: 88 }] },
  { name: "Dev Patel", role: "Frontend Developer", company: "Infosys", experienceYears: 1.5, location: "Mumbai", rating: 3.5, avatarColor: "#34D399", matchPercent: 72, totalSkillsRequired: 8, appliedAt: daysAgo(15), skills: [{ name: "React", proficiency: 75 }, { name: "CSS", proficiency: 80 }, { name: "JavaScript", proficiency: 78 }, { name: "TypeScript", proficiency: 55 }, { name: "Next.js", proficiency: 50 }] },

  // ── Data Scientist ────────────────────────────────────────────────────
  { name: "Meera Iyer", role: "Data Scientist", company: "Google", experienceYears: 4.5, location: "Bangalore", rating: 5, avatarColor: "#F59E0B", matchPercent: 97, totalSkillsRequired: 7, appliedAt: daysAgo(6), skills: [{ name: "Python", proficiency: 99 }, { name: "ML", proficiency: 96 }, { name: "Statistics", proficiency: 95 }, { name: "TensorFlow", proficiency: 92 }, { name: "SQL", proficiency: 88 }, { name: "NLP", proficiency: 85 }, { name: "Computer Vision", proficiency: 80 }] },
  { name: "Saurabh Rao", role: "Data Scientist", company: "Flipkart", experienceYears: 3.0, location: "Hyderabad", rating: 4, avatarColor: "#60A5FA", matchPercent: 83, totalSkillsRequired: 7, appliedAt: daysAgo(10), skills: [{ name: "Python", proficiency: 88 }, { name: "ML", proficiency: 80 }, { name: "Statistics", proficiency: 78 }, { name: "TensorFlow", proficiency: 70 }, { name: "SQL", proficiency: 75 }] },
  { name: "Tanya Singh", role: "Data Scientist", company: "Amazon", experienceYears: 2.2, location: "Pune", rating: 4.5, avatarColor: "#A78BFA", matchPercent: 89, totalSkillsRequired: 7, appliedAt: daysAgo(7), skills: [{ name: "Python", proficiency: 90 }, { name: "ML", proficiency: 85 }, { name: "Statistics", proficiency: 82 }, { name: "TensorFlow", proficiency: 78 }, { name: "SQL", proficiency: 72 }, { name: "NLP", proficiency: 68 }] },
  { name: "Arun Pillai", role: "Data Scientist", company: "TCS", experienceYears: 1.9, location: "Chennai", rating: 3, avatarColor: "#34D399", matchPercent: 65, totalSkillsRequired: 7, appliedAt: daysAgo(18), skills: [{ name: "Python", proficiency: 70 }, { name: "ML", proficiency: 60 }, { name: "Statistics", proficiency: 65 }, { name: "SQL", proficiency: 58 }] },

  // ── Product Manager ───────────────────────────────────────────────────
  { name: "Rohit Kumar", role: "Product Manager", company: "Zomato", experienceYears: 5.0, location: "Mumbai", rating: 5, avatarColor: "#F59E0B", matchPercent: 95, totalSkillsRequired: 6, appliedAt: daysAgo(3), skills: [{ name: "Roadmap", proficiency: 98 }, { name: "Agile", proficiency: 95 }, { name: "Analytics", proficiency: 90 }, { name: "Jira", proficiency: 92 }, { name: "Strategy", proficiency: 88 }, { name: "OKRs", proficiency: 85 }] },
  { name: "Ananya Das", role: "Product Manager", company: "Flipkart", experienceYears: 3.5, location: "Bangalore", rating: 4, avatarColor: "#60A5FA", matchPercent: 82, totalSkillsRequired: 6, appliedAt: daysAgo(11), skills: [{ name: "Roadmap", proficiency: 80 }, { name: "Agile", proficiency: 85 }, { name: "Analytics", proficiency: 78 }, { name: "Jira", proficiency: 75 }, { name: "Strategy", proficiency: 70 }] },
  { name: "Vikram Shah", role: "Product Manager", company: "Google", experienceYears: 4.2, location: "Hyderabad", rating: 4.5, avatarColor: "#A78BFA", matchPercent: 91, totalSkillsRequired: 6, appliedAt: daysAgo(5), skills: [{ name: "Roadmap", proficiency: 92 }, { name: "Agile", proficiency: 90 }, { name: "Analytics", proficiency: 88 }, { name: "Jira", proficiency: 85 }, { name: "Strategy", proficiency: 82 }, { name: "OKRs", proficiency: 78 }] },
  { name: "Riya Nair", role: "Product Manager", company: "Infosys", experienceYears: 2.8, location: "Delhi NCR", rating: 3, avatarColor: "#34D399", matchPercent: 68, totalSkillsRequired: 6, appliedAt: daysAgo(22), skills: [{ name: "Roadmap", proficiency: 70 }, { name: "Agile", proficiency: 65 }, { name: "Analytics", proficiency: 60 }, { name: "Jira", proficiency: 72 }] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    await Candidate.deleteMany({});
    console.log("🗑  Cleared old candidates");
    await Candidate.insertMany(candidates);
    console.log(`🌱 Seeded ${candidates.length} candidates successfully`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
