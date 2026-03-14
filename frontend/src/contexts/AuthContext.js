// frontend/src/contexts/AuthContext.js - FIXED
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import config from '../config';

const { API_URL } = config;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── FIX: App start pe DB se fresh user fetch karo ──
  // Pehle localStorage ka stale data use hota tha jisme resumeUrl, skills etc. nahi hote
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          authService.saveUser(data.user, token);
        } else {
          // Token expired/invalid
          authService.logout();
          setUser(null);
        }
      } catch (err) {
        // Network error — fallback to localStorage
        const userData = authService.getUser();
        if (userData) setUser(userData);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // ── refreshUser: profile/resume update ke baad call karo ──
  const refreshUser = async () => {
    const token = authService.getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        authService.saveUser(data.user, token);
        return data.user;
      }
    } catch (err) {
      console.error('refreshUser error:', err);
    }
  };

  const redirectByRole = (userType) => {
    if (userType === 'recruiter') navigate('/recruiter/dashboard');
    else navigate('/dashboard');
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (data.user && data.token) {
        setUser(data.user);
        authService.saveUser(data.user, data.token);
        redirectByRole(data.user.userType);
      }
      return data;
    } catch (error) { throw error; }
  };

  const loginWithGoogle = async (credential, userType) => {
    try {
      const data = await authService.googleAuth(credential, userType);
      if (data.user && data.token) {
        setUser(data.user);
        authService.saveUser(data.user, data.token);
        redirectByRole(data.user.userType);
      }
      return data;
    } catch (error) { throw error; }
  };

  const signup = async (userData) => {
    try {
      const data = await authService.signup(userData);
      if (data.user && data.token) {
        setUser(data.user);
        authService.saveUser(data.user, data.token);
        redirectByRole(data.user.userType);
      }
      return data;
    } catch (error) { throw error; }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const data = await authService.verifyOTP(email, otp);
      if (data.user && data.token) {
        setUser(data.user);
        authService.saveUser(data.user, data.token);
        redirectByRole(data.user.userType);
      }
      return data;
    } catch (error) { throw error; }
  };

  const logout = () => {
    setUser(null);
    // Sab local data clear karo
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('resumeAnalysis');
    localStorage.removeItem('jobAlerts');
    // Page reload nahi — navigate karo
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      refreshUser,
      login,
      loginWithGoogle,
      signup,
      verifyOTP,
      logout,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
