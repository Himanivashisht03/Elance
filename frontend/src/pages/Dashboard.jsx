//frontend\src\pages\Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Fade,
  Card,
  CardContent,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Chat,
  Menu as MenuIcon,
  Person,
  Logout,
  Settings,
} from '@mui/icons-material';

import { AuthContext } from '../contexts/AuthContext';
import FixedSidebar from '../components/FixedSidebar';
import JobSearch from '../components/JobSearch';
import AboutUS from '../pages/AboutUS';
import CareerPlanner from '../components/CareerPlanner';
import SkillDemandRadar from '../components/SkillDemandRadar';
import Chatbot from '../components/Chatbot'; // for chatbot integration

import elanceLogo from '../assets/images/elance-logo.jpg';
import meeting1 from '../assets/images/j1.jpg';
import meeting2 from '../assets/images/j2.jpg';
import meeting3 from '../assets/images/j3.jpg';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('home'); 
  const [hoveredItem, setHoveredItem] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const [chatOpen, setChatOpen] = useState(false); // chatbot state

  const navigationContent = {
    home: {
      title: 'Find Your Dream Job',
      description: 'Connect with top employers and discover opportunities that match your skills.',
      details: [
        'Browse thousands of job listings',
        'Create and manage your professional profile',
        'Get matched with relevant opportunities',
        'Apply directly to companies'
      ]
    },
    search: {
      title: 'Job Search',
      description: 'Advanced search tools to find the perfect job for your career.',
      details: [
        'Filter by location, salary, and skills',
        'Save searches and get alerts',
        'Search by company or industry',
        'Find remote work opportunities'
      ]
    },
    career: {
      title: 'Career Development',
      description: 'Build your career with our comprehensive resources and guidance.',
      details: [
        'Career path recommendations',
        'Skill assessment and development',
        'Resume building tools',
        'Interview preparation resources'
      ]
    },
    analytics: {
      title: 'Analytics Dashboard',
      description: 'View comprehensive analytics and insights about job market trends.',
      details: [
        'Skill demand radar charts',
        'Market trend analysis',
        'Salary insights',
        'Career path statistics'
      ]
    },
    about: {
      title: 'About ELance',
      description: 'Learn more about our company, mission, and values.',
      details: [
        'Company mission and vision',
        'Our team and history',
        'Platform features',
        'Contact information'
      ]
    }
  };

  // ✅ UPDATED: Only user profile options (removed navigation items)
  const userMenuItems = [
    { id: 'profile', label: 'My Profile', icon: <Person /> },
  
    { id: 'logout', label: 'Logout', icon: <Logout /> },
  ];

  const slides = [
    { id: 1, images: [meeting1], title: "Find Your Dream Team", subtitle: "Collaborate in inspiring spaces. Discover top jobs today." },
    { id: 2, images: [meeting2], title: "Professional Growth Meets Opportunity", subtitle: "Unlock new skills and step into your future, together." },
    { id: 3, images: [meeting3], title: "Connect. Apply. Succeed.", subtitle: "Office meets ambition—explore jobs and companies now." }
  ];

  useEffect(() => {
    if (activeItem === 'home') {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeItem, slides.length]);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // ✅ UPDATED: Handle only user actions (removed navigation)
  const handleMenuItemClick = (itemId) => {
    if (itemId === 'logout') {
      logout();
      navigate('/');
    } else if (itemId === 'profile') {
      setActiveItem('profile');
    }
    handleMenuClose();
  };

  const currentContent = navigationContent[activeItem];

  if (!user) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 3 }}>
              🔒 Login Required
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Please login to access your dashboard
            </Typography>
            <Button 
              variant="contained" 
              href="/login"
              sx={{ py: 2, px: 4 }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background slideshow for home page only */}
      {activeItem === 'home' && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundImage: `url(${slides[currentSlide]?.images?.[0] || meeting1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            transition: 'background-image 1s ease-in-out',
          }}
        />
      )}

      {/* ✅ CLEAN HEADER - Removed user avatar, simplified menu */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: '#1976d2', 
          zIndex: 1300,
          top: 0,
          left: 0,
          right: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src={elanceLogo} 
              alt="Elance Logo" 
              style={{ 
                height: 48, 
                width: 48, 
                borderRadius: 12,
                objectFit: 'cover',
                backgroundColor: 'white',
                padding: '4px'
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>
              Elance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton sx={{ color: 'white' }} title="Chatbot" onClick={() => setChatOpen(true)} >
              <Chat />
            </IconButton>
            
            {/* ✅ REMOVED: User Avatar - no longer displayed */}
            
            <IconButton 
              sx={{ color: 'white' }} 
              title="Menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>

            {/* ✅ SIMPLIFIED: Menu with only user profile options */}
            <Menu
              id="dropdown-menu"
              anchorEl={menuAnchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: 2,
                  zIndex: 1400,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  },
                },
              }}
            >
              {/* ✅ User Info Header - Simplified */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      bgcolor: '#1976d2',
                      fontSize: '1rem'
                    }}
                  >
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.username || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email || 'user@elance.com'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* ✅ REMOVED: Navigation section and divider */}
              
              {/* ✅ Only User Profile Items */}
              {userMenuItems.map((item) => (
                <MenuItem 
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  sx={{
                    color: item.id === 'logout' ? 'error.main' : 'text.primary'
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText>
                    {item.label}
                  </ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ✅ KEEP LEFT SIDEBAR */}
      <FixedSidebar 
  activeItem={activeItem}
  setActiveItem={setActiveItem}
  hoveredItem={hoveredItem}
  setHoveredItem={setHoveredItem}
  userType="jobSeeker"
/>

      {/* ✅ MAIN CONTENT - Same as before */}
      <Box sx={{ 
        flex: 1, 
        ml: '96px',
        mt: '64px',
        position: 'relative', 
        zIndex: 10,
        minHeight: 'calc(100vh - 64px)',
      }}>
        {/* HOME PAGE */}
        {activeItem === 'home' ? (
          <Box sx={{ 
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white',
            p: 3
          }}>
            <Fade in={true} key={currentSlide}>
              <Box>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2,
                    fontSize: { xs: '2rem', md: '4rem' },
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  Welcome, {user?.username?.split(' ')[0] || 'User'}! 👋
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '1.2rem', md: '1.8rem' },
                    maxWidth: 800,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {slides[currentSlide]?.subtitle || "Your professional journey starts here."}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => setActiveItem('search')}
                    sx={{ 
                      backgroundColor: '#3f51b5',
                      py: 2, px: 4, borderRadius: 25, fontWeight: 600,
                      '&:hover': { backgroundColor: '#303f9f', transform: 'scale(1.05)' },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Find Jobs
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => setActiveItem('about')}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)', color: '#3f51b5',
                      py: 2, px: 4, borderRadius: 25, fontWeight: 600,
                      '&:hover': { backgroundColor: 'white', transform: 'scale(1.05)' },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Know More
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Box>
        
        ) : activeItem === 'search' ? (
          <JobSearch />
        
        ) : activeItem === 'analytics' ? (
          <SkillDemandRadar />
        
        ) : activeItem === 'about' ? (
          <AboutUS />
        
        ) : activeItem === 'career' ? (
          <CareerPlanner />

        ) : activeItem === 'profile' ? (
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, color: '#333' }}>
              User Profile
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, color: '#666' }}>
              Manage your profile, skills, and job preferences.
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 120, height: 120, margin: '0 auto 16px',
                      bgcolor: '#1976d2', fontSize: '2rem'
                    }}
                  >
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {user?.username || 'User Name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {user?.email || 'user@elance.com'}
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Edit Profile
                  </Button>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  {[
                    'Update personal information',
                    'Add skills and experience',
                    'Set job preferences', 
                    'View application history'
                  ].map((detail, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'scale(1.02)' }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {detail.split(' ')[0]} {detail.split(' ')[1]}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {detail}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        
        ) : currentContent ? (
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, color: '#333' }}>
              {currentContent.title || 'Content'}
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, color: '#666' }}>
              {currentContent.description || 'Description'}
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {currentContent.details && Array.isArray(currentContent.details) && 
               currentContent.details.map((detail, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.02)' }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body1">
                        {detail || 'Detail item'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                py: 2, px: 6, borderRadius: 25,
                fontSize: '1.1rem', fontWeight: 600
              }}
            >
              Get Started with {currentContent.title || 'Content'}
            </Button>
          </Container>
        
        ) : (
          <Box sx={{ 
            height: 'calc(100vh - 64px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
          }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                Welcome to ELance
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Click on any sidebar item to explore opportunities
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
    </Box>
  );
};

export default Dashboard;
