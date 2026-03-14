// frontend/src/components/DashboardRouter.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import JobSearch from './JobSearch';
import CareerPlanner from './CareerPlanner';
import SkillDemandRadar from './SkillDemandRadar';
import AboutUS from '../pages/AboutUS';
import UserProfile from './UserProfile';

const DashboardRouter = ({ activeItem }) => {
  const location = useLocation();

  const getActiveComponent = () => {
    switch (activeItem) {
      case 'home':
        return <DashboardHome />;
      case 'search':
        return <JobSearch />;
      case 'career':
        return <CareerPlanner />;
      case 'analytics':
        return <SkillDemandRadar />;
      case 'about':
        return <AboutUS />;
      case 'profile':
        return <UserProfile />;
      default:
        return <DashboardHome />;
    }
  };

  const DashboardHome = () => (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1>Welcome to Your Dashboard</h1>
      <p>Use the sidebar to navigate between different sections</p>
    </div>
  );

  return getActiveComponent();
};

export default DashboardRouter;