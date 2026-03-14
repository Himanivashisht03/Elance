// backend/models/Candidate.js
import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: { type: Number, min: 0, max: 100, default: 0 },
});

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatarColor: { type: String, default: "#60A5FA" },
    role: { type: String, required: true },
    company: { type: String, default: "All Companies" },
    experienceYears: { type: Number, required: true },
    location: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    skills: [skillSchema],
    totalSkillsRequired: { type: Number, default: 7 },
    matchPercent: { type: Number, min: 0, max: 100 },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// How many skills pass the 50% threshold
candidateSchema.virtual("skillsMatched").get(function () {
  return this.skills.filter((s) => s.proficiency >= 50).length;
});

candidateSchema.set("toJSON", { virtuals: true });
candidateSchema.set("toObject", { virtuals: true });

export default mongoose.model("Candidate", candidateSchema);
