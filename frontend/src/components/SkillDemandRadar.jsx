// frontend/src/components/SkillDemandRadar.jsx - BUG FIXED VERSION
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  CircularProgress,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  Slide,
  TextField,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  Star,
  School,
  Work,
  Psychology,
  Speed,
  Assessment,
  Refresh,
  ArrowForward,
  CheckCircle,
  Warning,
  Info,
  EmojiEvents,
  Timeline,
  Analytics,
  Search,
  Check,
  Close,
  People,
  ArrowRightAlt,
  NavigateNext,
  PlayArrow,
  Pause,
  SkipNext
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../services/AuthService';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement
);

const SkillDemandRadar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedRole, setSearchedRole] = useState(null);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [skillMatch, setSkillMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useContext(AuthContext);

  // Mock data for job roles and skills
  const jobRolesData = {
    'Business Analyst': {
      matchPercentage: 85,
      trendSkills: ['SQL', 'Python', 'Tableau', 'Machine Learning', 'Data Visualization', 'Statistics'],
      userHasSkills: ['SQL', 'Python', 'Tableau'],
      learningPaths: [
        {
          name: 'Google Data Analytics Certificate',
          provider: 'Google',
          duration: '6 months',
          level: 'Beginner',
          rating: 4.8,
          enrolled: '50000+',
          link: '#'
        },
        {
          name: 'Business Analytics Specialization',
          provider: 'Coursera',
          duration: '4 months',
          level: 'Intermediate',
          rating: 4.6,
          enrolled: '25000+',
          link: '#'
        }
      ],
      relatedRoles: [
        { name: 'Data Analyst', match: 75 },
        { name: 'Data Scientist', match: 70 },
        { name: 'Marketing Analyst', match: 65 },
        { name: 'Financial Analyst', match: 60 }
      ],
      // New: Skill conversion path data
      skillConversionPath: [
        {
          step: 1,
          title: 'Current Skills Assessment',
          description: 'Identify your existing skills and gaps',
          skills: ['SQL', 'Python', 'Tableau'],
          status: 'completed',
          duration: '1 week'
        },
        {
          step: 2,
          title: 'Core Business Analysis Fundamentals',
          description: 'Learn business process modeling and requirements gathering',
          skills: ['Requirements Analysis', 'Process Modeling', 'Stakeholder Management'],
          status: 'current',
          duration: '4 weeks',
          resources: [
            'Business Analysis Fundamentals - Coursera',
            'BABOK Guide Study'
          ]
        },
        {
          step: 3,
          title: 'Advanced Analytics & Visualization',
          description: 'Master data analysis and visualization tools',
          skills: ['Advanced SQL', 'Data Visualization', 'Dashboard Creation'],
          status: 'pending',
          duration: '6 weeks',
          resources: [
            'Tableau Advanced Training',
            'SQL for Business Analysis'
          ]
        },
        {
          step: 4,
          title: 'Domain Specialization',
          description: 'Choose and specialize in a business domain',
          skills: ['Domain Knowledge', 'Industry Analysis', 'Business Metrics'],
          status: 'pending',
          duration: '8 weeks',
          resources: [
            'Industry-specific case studies',
            'Domain certification programs'
          ]
        },
        {
          step: 5,
          title: 'Certification & Portfolio Building',
          description: 'Get certified and build project portfolio',
          skills: ['Portfolio Development', 'Certification Prep', 'Interview Skills'],
          status: 'pending',
          duration: '4 weeks',
          resources: [
            'Google Data Analytics Certificate',
            'IIBA Certification'
          ]
        }
      ]
    },
    'Data Analyst': {
      matchPercentage: 75,
      trendSkills: ['Python', 'SQL', 'R', 'Excel', 'Tableau', 'Statistics'],
      userHasSkills: ['Python', 'SQL', 'Excel'],
      learningPaths: [
        {
          name: 'Google Data Analytics Certificate',
          provider: 'Google',
          duration: '6 months',
          level: 'Beginner',
          rating: 4.8,
          enrolled: '50000+',
          link: '#'
        },
        {
          name: 'Python for Data Analysis Certificate',
          provider: 'DataCamp',
          duration: '3 months',
          level: 'Intermediate',
          rating: 4.7,
          enrolled: '35000+',
          link: '#'
        }
      ],
      relatedRoles: [
        { name: 'Business Analyst', match: 85 },
        { name: 'Data Scientist', match: 80 },
        { name: 'Marketing Analyst', match: 70 },
        { name: 'Financial Analyst', match: 65 }
      ],
      skillConversionPath: [
        {
          step: 1,
          title: 'Current Skills Assessment',
          description: 'Evaluate existing technical skills',
          skills: ['Python', 'SQL', 'Excel'],
          status: 'completed',
          duration: '1 week'
        },
        {
          step: 2,
          title: 'Statistical Analysis Foundation',
          description: 'Learn statistical methods and hypothesis testing',
          skills: ['Statistics', 'Probability', 'A/B Testing'],
          status: 'current',
          duration: '5 weeks',
          resources: [
            'Statistics for Data Science - edX',
            'Practical Statistics for Data Analysts'
          ]
        },
        {
          step: 3,
          title: 'Data Visualization Mastery',
          description: 'Master data visualization tools and techniques',
          skills: ['Tableau', 'Power BI', 'Data Storytelling'],
          status: 'pending',
          duration: '4 weeks',
          resources: [
            'Tableau Specialist Certification',
            'Data Visualization Best Practices'
          ]
        },
        {
          step: 4,
          title: 'Advanced SQL & Database Management',
          description: 'Deep dive into SQL and database concepts',
          skills: ['Advanced SQL', 'Database Design', 'ETL Processes'],
          status: 'pending',
          duration: '6 weeks',
          resources: [
            'Advanced SQL Queries',
            'Database Management Systems'
          ]
        },
        {
          step: 5,
          title: 'Portfolio Development & Certification',
          description: 'Build projects and get certified',
          skills: ['Project Portfolio', 'Certification', 'Interview Prep'],
          status: 'pending',
          duration: '4 weeks',
          resources: [
            'Google Data Analytics Certificate',
            'Real-world project building'
          ]
        }
      ]
    },
    'Data Scientist': {
      matchPercentage: 70,
      trendSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Deep Learning', 'TensorFlow'],
      userHasSkills: ['Python', 'SQL'],
      learningPaths: [
        {
          name: 'AWS Certified Machine Learning',
          provider: 'Amazon',
          duration: '4 months',
          level: 'Advanced',
          rating: 4.9,
          enrolled: '20000+',
          link: '#'
        },
        {
          name: 'Machine Learning Specialization',
          provider: 'Coursera',
          duration: '5 months',
          level: 'Intermediate',
          rating: 4.7,
          enrolled: '45000+',
          link: '#'
        }
      ],
      relatedRoles: [
        { name: 'Data Analyst', match: 80 },
        { name: 'ML Engineer', match: 75 },
        { name: 'Business Analyst', match: 70 },
        { name: 'Research Scientist', match: 65 }
      ],
      skillConversionPath: [
        {
          step: 1,
          title: 'Current Skills Assessment',
          description: 'Assess programming and math foundation',
          skills: ['Python', 'SQL'],
          status: 'completed',
          duration: '1 week'
        },
        {
          step: 2,
          title: 'Mathematics & Statistics Foundation',
          description: 'Build strong mathematical foundation',
          skills: ['Linear Algebra', 'Calculus', 'Probability', 'Statistics'],
          status: 'current',
          duration: '8 weeks',
          resources: [
            'Mathematics for Machine Learning',
            'Statistical Learning - Stanford'
          ]
        },
        {
          step: 3,
          title: 'Machine Learning Fundamentals',
          description: 'Learn core machine learning algorithms',
          skills: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation'],
          status: 'pending',
          duration: '10 weeks',
          resources: [
            'Machine Learning - Andrew Ng',
            'Hands-On ML with Scikit-Learn'
          ]
        },
        {
          step: 4,
          title: 'Deep Learning & Advanced ML',
          description: 'Master neural networks and deep learning',
          skills: ['Neural Networks', 'TensorFlow', 'PyTorch', 'NLP'],
          status: 'pending',
          duration: '12 weeks',
          resources: [
            'Deep Learning Specialization',
            'Advanced ML Techniques'
          ]
        },
        {
          step: 5,
          title: 'Specialization & Real-world Projects',
          description: 'Choose specialization and build portfolio',
          skills: ['MLOps', 'Cloud Platforms', 'Big Data', 'Portfolio'],
          status: 'pending',
          duration: '8 weeks',
          resources: [
            'AWS ML Certification',
            'Kaggle competitions',
            'Capstone projects'
          ]
        }
      ]
    }
  };

  useEffect(() => {
    fetchSkillData();
  }, []);

  const fetchSkillData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls
      setTimeout(() => {
        setTrendingSkills([
          { name: 'Python', demandScore: 95, trending: true },
          { name: 'SQL', demandScore: 90, trending: true },
          { name: 'JavaScript', demandScore: 88, trending: true },
          { name: 'React', demandScore: 85, trending: true },
          { name: 'Machine Learning', demandScore: 82, trending: true },
          { name: 'Data Analysis', demandScore: 80, trending: true },
          { name: 'Tableau', demandScore: 78, trending: true },
          { name: 'AWS', demandScore: 75, trending: true }
        ]);

        // Mock skill match data
        setSkillMatch({
          matchPercentage: 78,
          matchingSkills: ['Python', 'SQL', 'JavaScript', 'React', 'HTML', 'CSS'],
          skillsToLearn: ['Machine Learning', 'TensorFlow', 'Docker', 'Kubernetes', 'AWS']
        });

        setLoading(false);
      }, 1000);

    } catch (err) {
      setError('Failed to fetch skill data');
      console.error('Error fetching skill data:', err);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const role = jobRolesData[searchQuery];
      if (role) {
        setSearchedRole({
          name: searchQuery,
          ...role
        });
        setActiveStep(0); // Reset step when new role is searched
      } else {
        setError('Job role not found. Try: Business Analyst, Data Analyst, Data Scientist');
      }
      setSearchLoading(false);
    }, 1500);
  };

  const analyzeSkillDemand = async () => {
    try {
      setLoading(true);
      await fetchSkillData();
    } catch (err) {
      setError('Failed to analyze skill demand');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (activeStep < (searchedRole?.skillConversionPath?.length || 0)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Chart data preparation
  const radarData = {
    labels: trendingSkills.slice(0, 8).map(skill => skill.name),
    datasets: [
      {
        label: 'Demand Score',
        data: trendingSkills.slice(0, 8).map(skill => skill.demandScore),
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(25, 118, 210, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(25, 118, 210, 1)'
      }
    ]
  };

  // Prepare bar chart data
  const barData = {
    labels: trendingSkills.slice(0, 10).map(skill => skill.name),
    datasets: [
      {
        label: 'Job Demand',
        data: trendingSkills.slice(0, 10).map(skill => skill.demandScore),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#333'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: Math.max(...trendingSkills.map(s => s.demandScore)) + 2,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        angleLines: {
          color: 'rgba(0,0,0,0.1)'
        },
        pointLabels: {
          font: {
            size: 11,
            weight: 'bold'
          },
          color: '#333'
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        radius: 6,
        hoverRadius: 8
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#333'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold'
          },
          color: '#333'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold'
          },
          color: '#333'
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Fade in={true}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#1976d2', mb: 3 }} />
            <Typography variant="h5" sx={{ color: '#1976d2', mb: 1 }}>
              🎯 Analyzing Skill Market...
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(0,0,0,0.6)' }}>
              Gathering real-time insights for you
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern - Light Theme */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(66, 165, 245, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(220, 0, 78, 0.03) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />
      
      <Container maxWidth="xl" sx={{ pt: 8, pb: 4, width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              🎯 Skill Demand Radar
            </Typography>
            <Typography variant="h5" color="text.primary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Real-time insights into trending skills and your market alignment
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
  <Chip 
    icon={<TrendingUp />} 
    label="Live Market Data" 
    variant="outlined"
    sx={{ 
      fontWeight: 600,
      borderColor: '#1976d2',
      color: '#1976d2',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.04)',
      }
    }}
  />
  <Chip 
    icon={<Analytics />} 
    label="AI-Powered Insights" 
    variant="outlined"
    sx={{ 
      fontWeight: 600,
      borderColor: '#9c27b0',
      color: '#9c27b0',
      '&:hover': {
        backgroundColor: 'rgba(156, 39, 176, 0.04)',
      }
    }}
  />
  <Chip 
    icon={<Speed />} 
    label="Real-time Updates" 
    variant="outlined"
    sx={{ 
      fontWeight: 600,
      borderColor: '#2e7d32',
      color: '#2e7d32',
      '&:hover': {
        backgroundColor: 'rgba(46, 125, 50, 0.04)',
      }
    }}
  />
</Box>
          </Box>
        </Fade>

        {/* Search Section */}
        <Fade in={true} timeout={1200}>
          <Card sx={{ 
            mb: 4, 
            p: 3, 
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(25, 118, 210, 0.1)'
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search for job roles (e.g., Business Analyst, Data Scientist, Data Analyst)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white'
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searchLoading}
                size="large"
                sx={{ 
                  py: 2,
                  px: 4,
                  borderRadius: 3,
                  minWidth: 140,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  }
                }}
              >
                {searchLoading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>
          </Card>
        </Fade>

        {error && (
          <Slide in={true} direction="down">
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {error}
            </Alert>
          </Slide>
        )}

        {/* Search Results */}
        {searchedRole && (
          <Fade in={true} timeout={1500}>
            <Box sx={{ mb: 6 }}>
              {/* Role Match Header */}
              <Card sx={{ 
                mb: 4, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                    {searchedRole.name} - {searchedRole.matchPercentage}% Match
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Your skills are highly relevant for this role. Here's how you compare:
                  </Typography>
                  
                  {/* Related Roles Bar Chart */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Skill Match with Related Roles:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchedRole.relatedRoles.map((role, index) => (
                        <Slide in={true} direction="right" timeout={800 + (index * 200)} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ minWidth: 150, fontWeight: 600 }}>
                              {role.name}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={role.match} 
                                sx={{ 
                                  height: 20, 
                                  borderRadius: 2,
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                                    borderRadius: 2
                                  }
                                }}
                              />
                            </Box>
                            <Typography sx={{ minWidth: 40, fontWeight: 600 }}>
                              {role.match}%
                            </Typography>
                          </Box>
                        </Slide>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={4}>
                {/* Trend Skills */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'white',
                    border: '1px solid rgba(25, 118, 210, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 3, 
                          color: '#1976d2'
                        }}
                      >
                        📈 Trend Skills for {searchedRole.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
  {searchedRole.trendSkills.map((skill, index) => {
    const hasSkill = searchedRole.userHasSkills.includes(skill);
    return (
      <Zoom in={true} timeout={1000 + (index * 100)} key={index}>
        <Chip
          label={skill}
          icon={hasSkill ? 
            <Check /> : 
            <Close />
          }
          color={hasSkill ? "success" : "error"}
          variant="filled"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.9rem',
            py: 1.5,
            px: 1,
            // Force proper text color for both light and dark variants
            color: 'white',
            // Ensure proper background colors
            backgroundColor: hasSkill ? '#4caf50' : '#f44336',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'all 0.3s ease',
              backgroundColor: hasSkill ? '#388e3c' : '#d32f2f',
            },
            '& .MuiChip-icon': {
              color: 'white !important',
            }
          }}
        />
      </Zoom>
    );
  })}
</Box>

<Box sx={{ 
  p: 2, 
  backgroundColor: 'rgba(25, 118, 210, 0.05)', 
  borderRadius: 2,
  border: '1px solid rgba(25, 118, 210, 0.1)'
}}>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <Check sx={{ fontSize: 18, color: '#4caf50', mr: 1 }} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      Green checkmarks indicate skills you already have
    </Typography>
  </Box>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Close sx={{ fontSize: 18, color: '#f44336', mr: 1 }} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      Red crosses indicate skills to learn
    </Typography>
  </Box>
</Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Enhanced Learning Paths */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    height: '100%', 
                    background: 'white',
                    border: '1px solid rgba(25, 118, 210, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 3, 
                          color: '#1976d2'
                        }}
                      >
                        🎓 Recommended Learning Paths
                      </Typography>
                      
                      <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                        {searchedRole.learningPaths.map((path, index) => (
                          <Slide in={true} direction="up" timeout={800 + (index * 300)} key={index}>
                            <Card 
                              sx={{ 
                                mb: 2,
                                background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.05) 0%, rgba(25, 118, 210, 0.05) 100%)',
                                border: '1px solid rgba(66, 165, 245, 0.2)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 8px 25px rgba(66, 165, 245, 0.15)',
                                  borderColor: '#42a5f5'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 50, 
                                      height: 50,
                                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
                                    }}
                                  >
                                    <School sx={{ fontSize: 24 }} />
                                  </Avatar>
                                  
                                  <Box sx={{ flex: 1 }}>
                                    <Typography 
                                      variant="h6" 
                                      sx={{ 
                                        fontWeight: 700, 
                                        mb: 1,
                                        color: 'text.primary'
                                      }}
                                    >
                                      {path.name}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                      <Chip 
                                        label={path.provider} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                      <Chip 
                                        label={path.duration} 
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                                          color: '#4caf50'
                                        }}
                                      />
                                      <Chip 
                                        label={path.level} 
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                                          color: '#ff9800'
                                        }}
                                      />
                                    </Box>
                                    
                                    {/* Progress and Rating */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Star sx={{ fontSize: 18, color: '#ffc107' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                          {path.rating}/5
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <People sx={{ fontSize: 18, color: '#42a5f5' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                          {path.enrolled} enrolled
                                        </Typography>
                                      </Box>
                                    </Box>
                                    
                                    {/* Action Buttons */}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                      <Button 
                                        variant="contained" 
                                        size="small"
                                        sx={{ 
                                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                          '&:hover': {
                                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                          }
                                        }}
                                      >
                                        Enroll Now
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ 
                                          borderColor: 'rgba(0,0,0,0.2)',
                                          color: 'text.secondary',
                                          '&:hover': {
                                            borderColor: '#42a5f5',
                                            color: '#42a5f5'
                                          }
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Slide>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* NEW: Skill Conversion Flowchart Section */}
                <Grid item xs={12}>
                  <Card sx={{ 
                    background: 'white',
                    border: '1px solid rgba(25, 118, 210, 0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          color: '#1976d2',
                          textAlign: 'center'
                        }}
                      >
                        🗺️ Skill Conversion Path
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 4, 
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        Step-by-step roadmap to transition from your current skills to {searchedRole.name}
                      </Typography>

                      <Stepper activeStep={activeStep} orientation="vertical">
                        {searchedRole.skillConversionPath.map((step, index) => (
                          <Step key={step.step}>
                            <StepLabel
                              optional={
                                <Typography variant="caption" color="text.secondary">
                                  Duration: {step.duration}
                                </Typography>
                              }
                              onClick={() => handleStepClick(index)}
                              sx={{
                                cursor: 'pointer',
                                '& .MuiStepLabel-label': {
                                  fontSize: '1.1rem',
                                  fontWeight: 600
                                }
                              }}
                            >
                              {step.title}
                            </StepLabel>
                            <StepContent>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                  {step.description}
                                </Typography>
                                
                                {/* Skills for this step */}
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                                    Skills to Focus On:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {step.skills.map((skill, skillIndex) => (
                                      <Chip
                                        key={skillIndex}
                                        label={skill}
                                        size="small"
                                        color={index < activeStep ? "success" : "primary"}
                                        variant={index === activeStep ? "filled" : "outlined"}
                                      />
                                    ))}
                                  </Box>
                                </Box>

                                {/* Learning Resources */}
                                {step.resources && (
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                                      Recommended Resources:
                                    </Typography>
                                    <List dense>
                                      {step.resources.map((resource, resourceIndex) => (
                                        <ListItem key={resourceIndex}>
                                          <ListItemIcon>
                                            <School color="primary" />
                                          </ListItemIcon>
                                          <ListItemText primary={resource} />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}

                                {/* Step Navigation */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                  <Button
                                    variant="contained"
                                    onClick={handleNextStep}
                                    sx={{ mt: 1, mr: 1 }}
                                  >
                                    {index === searchedRole.skillConversionPath.length - 1 ? 'Complete' : 'Next Step'}
                                  </Button>
                                  <Button
                                    disabled={index === 0}
                                    onClick={handlePrevStep}
                                    sx={{ mt: 1, mr: 1 }}
                                  >
                                    Back
                                  </Button>
                                </Box>
                              </Box>
                            </StepContent>
                          </Step>
                        ))}
                      </Stepper>

                      {/* FIXED: Completion State - Show when all steps are completed */}
                      {activeStep === searchedRole.skillConversionPath.length && (
                        <Fade in={true} timeout={1000}>
                          <Paper square elevation={0} sx={{ p: 4, mt: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, mb: 2 }}>
                                🎉 Congratulations!
                              </Typography>
                              <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
                                You've completed the {searchedRole.name} learning path!
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                You're now ready to apply for {searchedRole.name} positions. 
                                Continue building your portfolio and practicing interview questions to land your dream job.
                              </Typography>
                              <Button 
                                onClick={() => setActiveStep(0)} 
                                variant="contained"
                                color="success"
                                size="large"
                                sx={{ 
                                  mt: 2,
                                  background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)',
                                  }
                                }}
                              >
                                Restart Path
                              </Button>
                            </Box>
                          </Paper>
                        </Fade>
                      )}

                      {/* Visual Progress Bar */}
                      <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                          Overall Progress: {Math.round((activeStep / searchedRole.skillConversionPath.length) * 100)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(activeStep / searchedRole.skillConversionPath.length) * 100} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            mb: 2,
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          {searchedRole.skillConversionPath.map((step, index) => (
                            <Tooltip key={index} title={step.title}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: index <= activeStep ? '#1976d2' : 'grey.300',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.2)',
                                    bgcolor: index <= activeStep ? '#1565c0' : 'grey.400'
                                  }
                                }}
                                onClick={() => handleStepClick(index)}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Original Skill Demand Content (shown when no search OR below search results) */}
        <Fade in={true} timeout={1500}>
          <Box>
            {/* Key Metrics Row */}
            <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center' }}>
              {/* Market Overview */}
              <Grid item xs={12} md={3}>
                <Zoom in={true} timeout={800}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                          <TrendingUp />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Market Overview
                        </Typography>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {trendingSkills.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Trending Skills Tracked
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>

              {/* Your Match Score */}
              {skillMatch && (
                <Grid item xs={12} md={3}>
                  <Zoom in={true} timeout={1000}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -30,
                          right: -30,
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                            <Assessment />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Your Match
                          </Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {Math.round(skillMatch.matchPercentage)}%
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Market Alignment Score
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={skillMatch.matchPercentage} 
                          sx={{ 
                            mt: 2, 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'white'
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              )}

              {/* Skills to Learn */}
              {skillMatch && skillMatch.skillsToLearn.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Zoom in={true} timeout={1200}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -40,
                          right: -40,
                          width: 90,
                          height: 90,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                            <School />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Skills to Learn
                          </Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {skillMatch.skillsToLearn.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Opportunities Identified
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              )}

              {/* Your Skills */}
              {skillMatch && skillMatch.matchingSkills.length > 0 && (
                <Grid item xs={12} md={3}>
                  <Zoom in={true} timeout={1400}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -35,
                          right: -35,
                          width: 85,
                          height: 85,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                            <CheckCircle />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Your Skills
                          </Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {skillMatch.matchingSkills.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Market-Ready Skills
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              )}
            </Grid>

            {/* Detailed Skills Analysis */}
            <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center' }}>
              {/* Skills to Learn */}
              {skillMatch && skillMatch.skillsToLearn.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Slide in={true} direction="right" timeout={1000}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        background: 'white',
                        border: '1px solid rgba(255, 152, 0, 0.1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', mr: 2 }}>
                            <School sx={{ color: '#ff9800' }} />
                          </Avatar>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                            🚀 Skills to Learn
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Focus on these trending skills to boost your market value
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {skillMatch.skillsToLearn.slice(0, 8).map((skill, index) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              sx={{ 
                                background: 'rgba(255, 152, 0, 0.1)',
                                color: '#ff9800',
                                fontWeight: 600,
                                border: '1px solid rgba(255, 152, 0, 0.3)',
                                '&:hover': {
                                  background: 'rgba(255, 152, 0, 0.2)',
                                  transform: 'scale(1.05)'
                                }
                              }}
                              icon={<TrendingUp sx={{ color: '#ff9800' }} />}
                            />
                          ))}
                        </Box>
                        {skillMatch.skillsToLearn.length > 8 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            +{skillMatch.skillsToLearn.length - 8} more opportunities
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Slide>
                </Grid>
              )}

              {/* Your Matching Skills */}
              {skillMatch && skillMatch.matchingSkills.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Slide in={true} direction="left" timeout={1200}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        background: 'white',
                        border: '1px solid rgba(76, 175, 80, 0.1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', mr: 2 }}>
                            <CheckCircle sx={{ color: '#4caf50' }} />
                          </Avatar>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                            ✅ Your Market Skills
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          These skills are currently in high demand
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {skillMatch.matchingSkills.slice(0, 8).map((skill, index) => (
                            <Chip 
                              key={index} 
                              label={skill} 
                              sx={{ 
                                background: 'rgba(76, 175, 80, 0.1)',
                                color: '#4caf50',
                                fontWeight: 600,
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                '&:hover': {
                                  background: 'rgba(76, 175, 80, 0.2)',
                                  transform: 'scale(1.05)'
                                }
                              }}
                              icon={<EmojiEvents sx={{ color: '#4caf50' }} />}
                            />
                          ))}
                        </Box>
                        {skillMatch.matchingSkills.length > 8 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            +{skillMatch.matchingSkills.length - 8} more skills
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Slide>
                </Grid>
              )}
            </Grid>

            {/* Refresh Button Section */}
            <Fade in={true} timeout={1400}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2
              }}>
                <Button 
                  variant="contained" 
                  onClick={fetchSkillData}
                  disabled={loading}
                  size="large"
                  startIcon={<Refresh />}
                  sx={{ 
                    py: 2,
                    px: 4,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
                    },
                    transition: 'all 0.3s ease',
                    borderRadius: 3,
                    fontWeight: 600
                  }}
                >
                  🔄 Refresh Data
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Get the latest skill market insights
                </Typography>
              </Box>
            </Fade>

            {/* Charts Section */}
            <Grid container spacing={4} sx={{ mb: 4, justifyContent: 'center' }}>
              {/* Radar Chart */}
              <Grid item xs={12} xl={6}>
                <Fade in={true} timeout={1500}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: 'white',
                      border: '1px solid rgba(25, 118, 210, 0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <Assessment />
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          📈 Skill Demand Radar
                        </Typography>
                      </Box>
                      {trendingSkills.length > 0 ? (
                        <Box sx={{ height: 500 }}>
                          <Radar data={radarData} options={chartOptions} />
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: 500, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            📊 No Data Available
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Trending skills data will appear here
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>

              {/* Bar Chart */}
              <Grid item xs={12} xl={6}>
                <Fade in={true} timeout={1800}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: 'white',
                      border: '1px solid rgba(25, 118, 210, 0.1)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                          <Analytics />
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          📊 Top Skills by Demand
                        </Typography>
                      </Box>
                      {trendingSkills.length > 0 ? (
                        <Box sx={{ height: 500 }}>
                          <Bar data={barData} options={barOptions} />
                        </Box>
                      ) : (
                        <Box sx={{ 
                          height: 500, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            📊 No Data Available
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Skill demand data will appear here
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            </Grid>
          </Box>
        </Fade>

        {/* Action Buttons */}
        <Fade in={true} timeout={2000}>
          <Box sx={{ 
            textAlign: 'center', 
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
              🚀 Ready to Take Action?
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              maxWidth: '800px',
              width: '100%'
            }}>
              <Button 
                variant="contained" 
                onClick={analyzeSkillDemand}
                disabled={loading}
                size="large"
                startIcon={<Refresh />}
                sx={{ 
                  py: 2,
                  px: 4,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Refresh Analysis
              </Button>
              <Button 
                variant="outlined" 
                href="/career-planner"
                size="large"
                endIcon={<ArrowForward />}
                sx={{ 
                  py: 2,
                  px: 4,
                  borderWidth: 2,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                🗺️ Career Planner
              </Button>
              <Button 
                variant="outlined" 
                href="/resume"
                size="large"
                startIcon={<Work />}
                sx={{ 
                  py: 2,
                  px: 4,
                  borderWidth: 2,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                📄 Upload Resume
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SkillDemandRadar;