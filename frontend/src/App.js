// frontend/src/App.js - FINAL MERGED
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';

import theme from './theme/theme';

// Auth pages
import Login    from './components/auth/Login';
import Signup   from './components/auth/Signup';
import ProtectedRoute from './components/ProtectedRoute';

// ── Public Page ──
import PublicPage from './pages/PublicPage';

// ── Job Seeker ──
import LandingPage from './pages/LandingPage';
import ResumeForm  from './pages/ResumeForm';

// ── Recruiter ──
import RecruiterDashboard  from './pages/RecruiterDashboard';

import './App.css';

// Smart root redirect
function RootRedirect() {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  if (!user) return <PublicPage />;
  return user.userType === 'recruiter'
    ? <Navigate to="/recruiter/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProfileProvider>
          <Box sx={{ minHeight: '100vh' }}>
            <Routes>
              {/* Public */}
              <Route path="/"       element={<RootRedirect />} />
              <Route path="/public" element={<PublicPage />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Job Seeker Routes */}
              <Route path="/dashboard"      element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/home"           element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/skill-radar"    element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/career-planner" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/resume"         element={<ProtectedRoute><ResumeForm /></ProtectedRoute>} />

              {/* Recruiter Routes */}
              <Route path="/recruiter/dashboard"    element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
              <Route path="/recruiter/post-job"     element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
              <Route path="/recruiter/applications" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
              <Route path="/recruiter/analytics"    element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
