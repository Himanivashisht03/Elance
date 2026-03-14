//frontend\src\services\Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTypeSelector from './UserTypeSelector';
import OTPVerification from './OTPVerification';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [userType, setUserType] = useState('jobSeeker');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real app, you would call your backend API here
      console.log(`Sending OTP to ${email}`);
      setShowOTP(true);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleOTPVerification = (success) => {
    if (success) {
      navigate(userType === 'jobSeeker' ? '/resume' : '/dashboard');
    } else {
      setShowOTP(false);
    }
  };

  if (showOTP) {
    return <OTPVerification email={email} onVerify={handleOTPVerification} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <p>to access your professional resume portal</p>
        </div>
        
        {!isLogin && (
          <UserTypeSelector userType={userType} setUserType={setUserType} />
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <button type="submit" className="auth-button">
            {isLogin ? 'Sign In' : 'Sign Up'} with OTP
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              className="auth-toggle" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? ' Sign Up' : ' Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;