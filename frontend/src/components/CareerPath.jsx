// frontend/src/components/CareerPath.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Fade,
  Zoom
} from '@mui/material';
import {
  TrendingUp,
  School,
  Work,
  CheckCircle,
  ArrowForward,
  Star
} from '@mui/icons-material';

const CareerPath = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userSkills, setUserSkills] = useState(['SQL', 'Python', 'Data Visualization']);
  const [careerMatches, setCareerMatches] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Mock data based on your images
  const careerData = [
    {
      id: 1,
      title: 'Business Analyst',
      match: 85,
      skills: ['SQL', 'Data Analysis', 'Requirements Gathering', 'Stakeholder Management'],
      trendingSkills: ['Python', 'SQL', 'Tableau', 'Machine Learning'],
      learningPath: [
        {
          step: 1,
          title: 'Google Data Analytics Certificate',
          description: 'Learn foundational data analysis skills',
          duration: '3 months',
          skills: ['Data Analysis', 'SQL', 'Spreadsheets']
        },
        {
          step: 2,
          title: 'SQL Mastery',
          description: 'Advanced database querying and management',
          duration: '2 months',
          skills: ['SQL', 'Database Design', 'Query Optimization']
        },
        {
          step: 3,
          title: 'Python for Data Analysis',
          description: 'Data manipulation with Python libraries',
          duration: '2 months',
          skills: ['Python', 'Pandas', 'NumPy']
        },
        {
          step: 4,
          title: 'Machine Learning Fundamentals',
          description: 'Introduction to ML algorithms',
          duration: '3 months',
          skills: ['Machine Learning', 'Scikit-learn', 'Model Evaluation']
        }
      ],
      salary: '$75,000 - $95,000',
      demand: 'High'
    },
    {
      id: 2,
      title: 'Data Analyst',
      match: 75,
      skills: ['SQL', 'Python', 'Data Visualization', 'Statistical Analysis'],
      trendingSkills: ['Python', 'SQL', 'Data Visualization', 'Machine Learning'],
      learningPath: [
        {
          step: 1,
          title: 'Google Data Analytics Certificate',
          description: 'Comprehensive data analytics training',
          duration: '3 months',
          skills: ['Data Analysis', 'R', 'SQL', 'Tableau']
        },
        {
          step: 2,
          title: 'Advanced SQL Certification',
          description: 'Master complex queries and database management',
          duration: '2 months',
          skills: ['SQL', 'Database Optimization']
        },
        {
          step: 3,
          title: 'Python for Data Analysis',
          description: 'Data manipulation and analysis with Python',
          duration: '2 months',
          skills: ['Python', 'Pandas', 'Data Cleaning']
        }
      ],
      salary: '$65,000 - $85,000',
      demand: 'Very High'
    },
    {
      id: 3,
      title: 'Data Scientist',
      match: 70,
      skills: ['Python', 'Machine Learning', 'Statistics', 'Deep Learning'],
      trendingSkills: ['Python', 'Machine Learning', 'AWS', 'SQL'],
      learningPath: [
        {
          step: 1,
          title: 'AWS Certified Machine Learning',
          description: 'Cloud-based ML solutions',
          duration: '4 months',
          skills: ['AWS', 'Machine Learning', 'Cloud Computing']
        },
        {
          step: 2,
          title: 'Advanced Machine Learning',
          description: 'Deep learning and neural networks',
          duration: '3 months',
          skills: ['TensorFlow', 'Keras', 'Neural Networks']
        }
      ],
      salary: '$95,000 - $130,000',
      demand: 'High'
    }
  ];

  useEffect(() => {
    // Simulate career matching based on skills
    const matches = careerData.map(career => {
      const matchedSkills = career.skills.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      const matchPercentage = Math.min(100, Math.round((matchedSkills.length / career.skills.length) * 100));
      
      return {
        ...career,
        matchedSkills,
        missingSkills: career.skills.filter(skill => !matchedSkills.includes(skill)),
        matchPercentage
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    setCareerMatches(matches);
  }, [userSkills]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Fade in={true}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800,
                color: 'white',
                mb: 2
              }}
            >
              Career Path Explorer
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Discover your ideal career path based on your skills
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Career Matches Sidebar */}
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={800}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                    Career Matches
                  </Typography>
                  
                  {careerMatches.map((career) => (
                    <Zoom in={true} key={career.id} timeout={1000 + career.id * 200}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          cursor: 'pointer',
                          border: selectedCareer?.id === career.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => setSelectedCareer(career)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {career.title}
                          </Typography>
                          <Chip 
                            label={`${career.matchPercentage}%`}
                            color={
                              career.matchPercentage >= 80 ? 'success' :
                              career.matchPercentage >= 60 ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </Box>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={career.matchPercentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            mb: 1,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 
                                career.matchPercentage >= 80 ? '#4caf50' :
                                career.matchPercentage >= 60 ? '#ff9800' : '#f44336'
                            }
                          }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {career.matchedSkills.length}/{career.skills.length} skills
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {career.demand}
                          </Typography>
                        </Box>
                      </Paper>
                    </Zoom>
                  ))}
                </CardContent>
              </Card>
            </Fade>

            {/* Trending Skills */}
            <Fade in={true} timeout={1200}>
              <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Trending Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['Python', 'SQL', 'Data Visualization', 'Machine Learning', 'AWS', 'Tableau'].map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        variant={userSkills.includes(skill) ? "filled" : "outlined"}
                        color={userSkills.includes(skill) ? "primary" : "default"}
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Career Details */}
          <Grid item xs={12} md={8}>
            {selectedCareer ? (
              <Fade in={true}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                      <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
                          {selectedCareer.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip 
                            label={`${selectedCareer.matchPercentage}% Match`}
                            color="primary"
                            size="medium"
                          />
                          <Typography variant="body1" color="text.secondary">
                            Salary: {selectedCareer.salary}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Demand: {selectedCareer.demand}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Skills Analysis */}
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, backgroundColor: '#e8f5e8' }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#2e7d32' }}>
                            ✅ Your Matching Skills
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedCareer.matchedSkills.map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                color="success"
                                variant="outlined"
                                size="small"
                                icon={<CheckCircle />}
                              />
                            ))}
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, backgroundColor: '#ffebee' }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#c62828' }}>
                            📚 Skills to Learn
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedCareer.missingSkills.map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                color="error"
                                variant="outlined"
                                size="small"
                              />
                            ))}
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Learning Path */}
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                      Learning Path
                    </Typography>
                    
                    <Stepper orientation="vertical">
                      {selectedCareer.learningPath.map((step, index) => (
                        <Step key={step.step} active={true}>
                          <StepLabel 
                            StepIconComponent={() => (
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {index + 1}
                              </Avatar>
                            )}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {step.title}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                              {step.description}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Duration: {step.duration}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {step.skills.map((skill, skillIndex) => (
                                  <Chip
                                    key={skillIndex}
                                    label={skill}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                            <Button 
                              variant="contained" 
                              endIcon={<ArrowForward />}
                              sx={{ borderRadius: 2 }}
                            >
                              Enroll Now
                            </Button>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </CardContent>
                </Card>
              </Fade>
            ) : (
              <Fade in={true}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center', p: 6 }}>
                  <CardContent>
                    <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Select a Career Path
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Choose a career from the left panel to view detailed learning path and skill requirements
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CareerPath;