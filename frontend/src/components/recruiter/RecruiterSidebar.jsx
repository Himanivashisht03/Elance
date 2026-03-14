// frontend/src/components/recruiter/RecruiterSidebar.jsx
import React from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import {
  Home,
  PostAdd,
  Analytics,
  Info,
  Chat,
  People,
} from '@mui/icons-material';

const RecruiterSidebar = ({ activeItem, setActiveItem, hoveredItem, setHoveredItem }) => {
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home />
    },
    {
      id: 'post-job',
      label: 'Post Job',
      icon: <PostAdd />
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: <People />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <Analytics />
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info />
    }
  ];

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? itemId : itemId);
  };

  return (
    <Box sx={{ 
      width: 96, 
      backgroundColor: 'rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      py: 4,
      position: 'fixed',
      left: 0,
      top: 64,
      height: 'calc(100vh - 64px)',
      zIndex: 1200,
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '500px',
        width: '100%'
      }}>
        {navigationItems.map((item) => (
          <Box
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 8,
                borderRadius: 4,
                backgroundColor: activeItem === item.id 
                  ? '#1976d2'
                  : hoveredItem === item.id 
                    ? '#757575'
                    : '#bdbdbd',
                transition: 'all 0.3s ease',
                boxShadow: activeItem === item.id ? '0 2px 8px rgba(25,118,210,0.4)' : 'none',
              }}
            />
            {activeItem === item.id && (
              <Fade in={true}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    color: '#1976d2',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {item.label}
                </Typography>
              </Fade>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RecruiterSidebar;