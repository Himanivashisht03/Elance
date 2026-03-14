// frontend/src/components/ProtectedRoute.jsx - UPDATED
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect recruiters from job seeker routes and vice versa
  if (user?.userType === 'recruiter' && window.location.pathname.startsWith('/recruiter/')) {
    return children;
  }

  if (user?.userType === 'jobSeeker' && !window.location.pathname.startsWith('/recruiter/')) {
    return children;
  }

  // If user type doesn't match route, redirect to appropriate dashboard
  if (user?.userType === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export default ProtectedRoute;