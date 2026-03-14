//frontend\src\components\FixedSidebar.jsx
import React from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import {
  Search,
  Work,
  Analytics,
  Info,
  Home,
} from '@mui/icons-material';

const FixedSidebar = ({ activeItem, setActiveItem, hoveredItem, setHoveredItem }) => {
  // ✅ Navigation items array with 5 items
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home />
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search />
    },
    {
      id: 'career',
      label: 'Career',
      icon: <Work />
    },
    {
      id: 'analytics', // ✅ 4th bar links to Analytics
      label: 'Analytics',
      icon: <Analytics />
    },
    {
      id: 'about', // ✅ 5th bar for About Us
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
      position: 'fixed', // ✅ FIXED POSITION
      left: 0, // ✅ Stick to left side
      top: 64, // ✅ Below the AppBar (64px height)
      height: 'calc(100vh - 64px)', // ✅ Full height minus AppBar
      zIndex: 1200, // ✅ Below AppBar (1300) but above content
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '500px', // ✅ Space for 5 items
        width: '100%'
      }}>
        {navigationItems && navigationItems.length > 0 && navigationItems.map((item) => {
          if (!item || !item.id) return null;
          
          const isActive = activeItem === item.id;
          const isHovered = hoveredItem === item.id;
          
          return (
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
                  backgroundColor: isActive 
                    ? '#1976d2'
                    : isHovered 
                      ? '#757575'
                      : '#bdbdbd',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(25,118,210,0.4)' : 'none',
                }}
              />
              {isActive && (
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
                    {item.label || 'Item'}
                  </Typography>
                </Fade>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default FixedSidebar;
