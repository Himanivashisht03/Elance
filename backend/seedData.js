//backend\seedData.js
const mongoose = require('mongoose');
const Skill = require('./models/Skill');
const Job = require('./models/Job');
const CareerPath = require('./models/CareerPath');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const seedSkills = async () => {
  const skills = [
    { name: 'JavaScript', category: 'Programming', demandScore: 85, trending: true },
    { name: 'Python', category: 'Programming', demandScore: 90, trending: true },
    { name: 'React', category: 'Frontend', demandScore: 80, trending: true },
    { name: 'Node.js', category: 'Backend', demandScore: 75, trending: true },
    { name: 'AWS', category: 'Cloud', demandScore: 70, trending: true },
    { name: 'Docker', category: 'DevOps', demandScore: 65, trending: true },
    { name: 'Kubernetes', category: 'DevOps', demandScore: 60, trending: true },
    { name: 'Machine Learning', category: 'AI/ML', demandScore: 85, trending: true },
    { name: 'Data Science', category: 'Analytics', demandScore: 80, trending: true },
    { name: 'SQL', category: 'Database', demandScore: 75, trending: true },
    { name: 'MongoDB', category: 'Database', demandScore: 65, trending: true },
    { name: 'Git', category: 'Version Control', demandScore: 70, trending: true },
    { name: 'TypeScript', category: 'Programming', demandScore: 60, trending: true },
    { name: 'GraphQL', category: 'API', demandScore: 55, trending: true },
    { name: 'REST API', category: 'API', demandScore: 70, trending: true }
  ];

  for (const skill of skills) {
    await Skill.findOneAndUpdate(
      { name: skill.name },
      skill,
      { upsert: true, new: true }
    );
  }
  console.log('Skills seeded successfully');
};

const seedJobs = async () => {
  const skills = await Skill.find();
  const skillMap = {};
  skills.forEach(skill => {
    skillMap[skill.name] = skill._id;
  });

  const jobs = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      requiredSkills: [skillMap['JavaScript'], skillMap['React'], skillMap['Node.js']],
      description: 'Build scalable web applications',
      salaryRange: { min: 120000, max: 180000, currency: 'USD' },
      location: 'San Francisco, CA'
    },
    {
      title: 'Data Scientist',
      company: 'Data Inc',
      requiredSkills: [skillMap['Python'], skillMap['Machine Learning'], skillMap['SQL']],
      description: 'Analyze data and build ML models',
      salaryRange: { min: 100000, max: 150000, currency: 'USD' },
      location: 'New York, NY'
    },
    {
      title: 'DevOps Engineer',
      company: 'Cloud Solutions',
      requiredSkills: [skillMap['AWS'], skillMap['Docker'], skillMap['Kubernetes']],
      description: 'Manage cloud infrastructure',
      salaryRange: { min: 110000, max: 160000, currency: 'USD' },
      location: 'Seattle, WA'
    },
    {
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      requiredSkills: [skillMap['JavaScript'], skillMap['Python'], skillMap['React']],
      description: 'Develop end-to-end applications',
      salaryRange: { min: 80000, max: 120000, currency: 'USD' },
      location: 'Austin, TX'
    },
    {
      title: 'Machine Learning Engineer',
      company: 'AI Innovations',
      requiredSkills: [skillMap['Python'], skillMap['Machine Learning'], skillMap['AWS']],
      description: 'Build and deploy ML models',
      salaryRange: { min: 130000, max: 200000, currency: 'USD' },
      location: 'Boston, MA'
    }
  ];

  for (const job of jobs) {
    await Job.findOneAndUpdate(
      { title: job.title, company: job.company },
      job,
      { upsert: true, new: true }
    );
  }
  console.log('Jobs seeded successfully');
};

const seedCareerPaths = async () => {
  const skills = await Skill.find();
  const skillMap = {};
  skills.forEach(skill => {
    skillMap[skill.name] = skill._id;
  });

  const careerPaths = [
    {
      title: 'Software Engineer to Senior Software Engineer',
      description: 'Path from junior to senior software engineer',
      domain: 'Software Development',
      steps: [
        {
          role: 'Junior Software Engineer',
          requiredSkills: [skillMap['JavaScript'], skillMap['Git']],
          timelinePosition: 1,
          averageSalary: 70000,
          description: 'Learn fundamentals and work on small features'
        },
        {
          role: 'Software Engineer',
          requiredSkills: [skillMap['React'], skillMap['Node.js'], skillMap['SQL']],
          timelinePosition: 2,
          averageSalary: 95000,
          description: 'Take ownership of features and mentor juniors'
        },
        {
          role: 'Senior Software Engineer',
          requiredSkills: [skillMap['TypeScript'], skillMap['AWS'], skillMap['Docker']],
          timelinePosition: 3,
          averageSalary: 130000,
          description: 'Lead technical decisions and architecture'
        }
      ]
    },
    {
      title: 'Data Analyst to Data Scientist',
      description: 'Transition from data analysis to data science',
      domain: 'Data Science',
      steps: [
        {
          role: 'Data Analyst',
          requiredSkills: [skillMap['SQL'], skillMap['Python']],
          timelinePosition: 1,
          averageSalary: 65000,
          description: 'Analyze data and create reports'
        },
        {
          role: 'Senior Data Analyst',
          requiredSkills: [skillMap['Data Science'], skillMap['Machine Learning']],
          timelinePosition: 2,
          averageSalary: 85000,
          description: 'Build predictive models and advanced analytics'
        },
        {
          role: 'Data Scientist',
          requiredSkills: [skillMap['Machine Learning'], skillMap['AWS']],
          timelinePosition: 3,
          averageSalary: 120000,
          description: 'Lead ML projects and research'
        }
      ]
    }
  ];

  for (const path of careerPaths) {
    await CareerPath.findOneAndUpdate(
      { title: path.title },
      path,
      { upsert: true, new: true }
    );
  }
  console.log('Career paths seeded successfully');
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await seedSkills();
    await seedJobs();
    await seedCareerPaths();
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();