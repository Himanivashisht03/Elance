// frontend/src/components/auth/Signup.jsx
import React, { useState, useContext } from 'react';
import { Box, Button, Container, TextField, Typography, Card, ToggleButton, ToggleButtonGroup, Alert, Grid, Divider, CircularProgress } from '@mui/material';
import { WorkOutline, BusinessCenter } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/AuthService';
import OTPVerification from './OTPVerification';

const bgStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #dde8f8 0%, #e8e0f5 40%, #f0e8f8 70%, #dde8f8 100%)',
  position: 'relative', overflow: 'hidden', py: 4,
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '10px',
    '& fieldset': { borderColor: 'rgba(120,100,210,0.3)', borderWidth: '1.5px' },
    '&:hover fieldset': { borderColor: '#7c4dff' },
    '&.Mui-focused fieldset': { borderColor: '#5c6bc0', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': { color: '#718096', '&.Mui-focused': { color: '#5c6bc0' } },
  '& .MuiOutlinedInput-input': { color: '#2d3748' },
  '& .MuiFormHelperText-root': { color: '#a0aec0' },
};

const Signup = () => {
  const [userType, setUserType] = useState('jobSeeker');
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    currentRole: '', targetRole: '', skills: '',
    companyName: '', roleHiringFor: '', industry: '', companySize: '', website: '', description: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const { signup } = useContext(AuthContext);

  const handleUserTypeChange = (e, newType) => { if (newType !== null) setUserType(newType); };
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignupSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (formData.password !== formData.confirmPassword) { setMessage('Passwords do not match'); setLoading(false); return; }
    if (formData.password.length < 6) { setMessage('Password must be at least 6 characters'); setLoading(false); return; }
    if (userType === 'jobSeeker' && (!formData.currentRole || !formData.targetRole)) { setMessage('Current Role and Target Role are required'); setLoading(false); return; }
    if (userType !== 'jobSeeker' && (!formData.companyName || !formData.roleHiringFor || !formData.industry)) { setMessage('Company Name, Role Hiring For, and Industry are required'); setLoading(false); return; }
    try {
      const userData = { username: formData.username, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword, userType };
      if (userType === 'jobSeeker') { userData.currentRole = formData.currentRole; userData.targetRole = formData.targetRole; userData.skills = formData.skills.split(',').map(s => s.trim()).filter(s => s); }
      else { userData.companyName = formData.companyName; userData.roleHiringFor = formData.roleHiringFor; userData.industry = formData.industry; userData.companySize = formData.companySize; userData.website = formData.website; userData.description = formData.description; }
      await authService.signup(userData);
      setMessage('✅ OTP sent to your email! Please check your inbox.');
      setSignupEmail(formData.email); setShowOTP(true);
    } catch (error) { setMessage(error.message || 'Failed to sign up'); }
    finally { setLoading(false); }
  };

  if (showOTP) return <OTPVerification email={signupEmail} onBack={() => { setShowOTP(false); setMessage(''); }} onSuccess={() => setMessage('✅ Account created successfully! Redirecting...')} />;

  return (
    <Box sx={bgStyle}>
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(130,130,210,0.18) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: -80, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,160,240,0.25), transparent 70%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,170,240,0.25), transparent 70%)', pointerEvents: 'none' }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: '0 20px 60px rgba(100,90,200,0.15)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(200,190,240,0.5)' }}>
          
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5 }}>
              ELance
            </Typography>
            <Typography variant="h6" sx={{ color: '#4a5568', fontWeight: 600 }}>Create Your Account</Typography>
            <Typography variant="body2" sx={{ color: '#718096', mt: 0.5 }}>Join thousands of professionals finding their dream careers</Typography>
          </Box>

          {/* User Type Toggle - Card style */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#718096', mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              I am joining as
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {[
                { value: 'jobSeeker', label: 'Job Seeker', icon: <WorkOutline sx={{ fontSize: 28 }} />, desc: 'Find your dream job' },
                { value: 'recruiter', label: 'Recruiter', icon: <BusinessCenter sx={{ fontSize: 28 }} />, desc: 'Hire top talent' },
              ].map(opt => (
                <Box
                  key={opt.value}
                  onClick={() => setUserType(opt.value)}
                  sx={{
                    flex: 1, maxWidth: 220, p: 2.5, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    border: userType === opt.value ? '2px solid #5c6bc0' : '2px solid rgba(120,100,210,0.2)',
                    background: userType === opt.value ? 'linear-gradient(135deg, rgba(74,108,247,0.1), rgba(124,77,255,0.1))' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#7c4dff', transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(124,77,255,0.15)' },
                  }}
                >
                  <Box sx={{ color: userType === opt.value ? '#5c6bc0' : '#a0aec0', mb: 1 }}>{opt.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: userType === opt.value ? '#4a5568' : '#718096', lineHeight: 1.2 }}>{opt.label}</Typography>
                  <Typography variant="caption" sx={{ color: '#a0aec0' }}>{opt.desc}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ mb: 4, borderColor: 'rgba(120,100,210,0.15)' }} />

          <Box component="form" onSubmit={handleSignupSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleInputChange} required sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} required helperText="Minimum 6 characters" sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required sx={inputSx} />
              </Grid>

              {userType === 'jobSeeker' ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Current Role" name="currentRole" value={formData.currentRole} onChange={handleInputChange} required placeholder="e.g., Software Developer" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Target Role" name="targetRole" value={formData.targetRole} onChange={handleInputChange} required placeholder="e.g., Senior Developer" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Skills (comma separated)" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="JavaScript, React, Node.js, Python" helperText="Separate skills with commas" sx={inputSx} />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} required sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Role Hiring For" name="roleHiringFor" value={formData.roleHiringFor} onChange={handleInputChange} required placeholder="e.g., Software Engineer" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Industry" name="industry" value={formData.industry} onChange={handleInputChange} required placeholder="e.g., Technology, Healthcare" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Company Size" name="companySize" value={formData.companySize} onChange={handleInputChange} placeholder="e.g., 1-10, 11-50, 500+" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://example.com" sx={inputSx} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Company Description" name="description" value={formData.description} onChange={handleInputChange} multiline rows={3} placeholder="Brief description of your company..." sx={inputSx} />
                  </Grid>
                </>
              )}
            </Grid>

            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large"
              sx={{ mt: 4, py: 1.8, fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)', boxShadow: '0 6px 20px rgba(74,108,247,0.4)', textTransform: 'none', '&:hover': { background: 'linear-gradient(135deg, #3a5ce7, #6c3def)', transform: 'translateY(-1px)' } }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
            </Button>
          </Box>

          {message && <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 3, borderRadius: 2 }}>{message}</Alert>}

          <Typography variant="body2" align="center" sx={{ mt: 3, color: '#718096' }}>
            Already have an account?{' '}
            <Button variant="text" size="small" href="/login" sx={{ color: '#5c6bc0', fontWeight: 700, textTransform: 'none', '&:hover': { color: '#7c4dff', background: 'transparent' } }}>
              Sign In
            </Button>
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default Signup;
