// frontend/src/components/auth/Login.jsx
import React, { useState, useContext } from 'react';
import {
  Box, Button, Container, TextField, Typography,
  Alert, Card, CircularProgress, ToggleButton, ToggleButtonGroup, Chip,
  InputAdornment, IconButton,
} from '@mui/material';
import { WorkOutline, BusinessCenter, Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import elanceLogo from '../../assets/images/elance-logo.jpg';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [roleHint, setRoleHint] = useState('jobSeeker');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  const isRec = roleHint === 'recruiter';

  const theme = isRec ? {
    bg:        'linear-gradient(145deg, #0a1628 0%, #0e2347 50%, #091830 100%)',
    card:      'rgba(255,255,255,0.05)',
    border:    'rgba(255,255,255,0.10)',
    accent1:   '#1976d2',
    accent2:   '#f9a825',
    text:      '#ffffff',
    sub:       'rgba(255,255,255,0.5)',
    inputBg:   'rgba(255,255,255,0.07)',
    inputBdr:  'rgba(255,255,255,0.18)',
    inputFoc:  '#f9a825',
    btnGrad:   'linear-gradient(90deg, #f9a825, #fb8c00)',
    btnShadow: 'rgba(249,168,37,0.45)',
    chip:      { bg: 'rgba(249,168,37,0.12)', border: 'rgba(249,168,37,0.3)', color: '#ffd54f' },
    blobA:     'radial-gradient(circle, rgba(249,168,37,0.18), transparent 70%)',
    blobB:     'radial-gradient(circle, rgba(25,118,210,0.30), transparent 70%)',
  } : {
    bg:        'linear-gradient(145deg, #dde8f8 0%, #e8e0f5 40%, #f0e8f8 70%, #dde8f8 100%)',
    card:      'rgba(255,255,255,0.88)',
    border:    'rgba(200,190,240,0.5)',
    accent1:   '#4a6cf7',
    accent2:   '#7c4dff',
    text:      '#2d3748',
    sub:       '#718096',
    inputBg:   'rgba(255,255,255,0.9)',
    inputBdr:  'rgba(120,100,210,0.35)',
    inputFoc:  '#5c6bc0',
    btnGrad:   'linear-gradient(135deg, #4a6cf7, #7c4dff)',
    btnShadow: 'rgba(74,108,247,0.4)',
    chip:      { bg: 'rgba(74,108,247,0.1)', border: 'rgba(74,108,247,0.25)', color: '#4a6cf7' },
    blobA:     'radial-gradient(circle, rgba(180,160,240,0.3), transparent 70%)',
    blobB:     'radial-gradient(circle, rgba(130,170,240,0.25), transparent 70%)',
  };

  const inputSx = {
    mb: 2.5,
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.inputBg,
      borderRadius: '14px',
      color: theme.text,
      '& fieldset':             { borderColor: theme.inputBdr, borderWidth: '1.5px' },
      '&:hover fieldset':       { borderColor: theme.accent1 },
      '&.Mui-focused fieldset': { borderColor: theme.inputFoc, borderWidth: '2px' },
    },
    '& .MuiInputLabel-root':           { color: theme.sub },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.inputFoc },
    '& input':                         { color: theme.text },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: theme.sub },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try { await login(email, password); }
    catch (err) { setMessage(err.message || 'Login failed. Please check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme.bg, position: 'relative', overflow: 'hidden', py: 4,
      transition: 'background 0.7s ease',
    }}>
      {/* Background blobs */}
      <Box sx={{ position:'absolute', top:-100, left:-100, width:350, height:350, borderRadius:'50%', background: theme.blobA, pointerEvents:'none' }} />
      <Box sx={{ position:'absolute', bottom:-80, right:-80, width:300, height:300, borderRadius:'50%', background: theme.blobB, pointerEvents:'none' }} />
      {!isRec && (
        <Box sx={{ position:'absolute', inset:0,
          backgroundImage: 'radial-gradient(circle, rgba(130,130,210,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px', pointerEvents:'none' }} />
      )}
      {isRec && (
        <Box sx={{ position:'absolute', top:'30%', right:'10%', width:180, height:180, borderRadius:'50%',
          background: 'radial-gradient(circle, rgba(249,168,37,0.08), transparent 70%)', pointerEvents:'none' }} />
      )}

      <Container maxWidth="sm" sx={{ position:'relative', zIndex:1 }}>
        <Card sx={{
          p: { xs: 3, sm: 4.5 }, borderRadius: '24px',
          background: theme.card,
          backdropFilter: 'blur(24px)',
          border: `1px solid ${theme.border}`,
          boxShadow: isRec ? '0 28px 90px rgba(0,0,0,0.65)' : '0 20px 60px rgba(100,90,200,0.15)',
          transition: 'all 0.5s ease',
        }}>

          {/* Logo + Header */}
          <Box sx={{ textAlign:'center', mb: 3.5 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '18px', mb: 2, overflow: 'hidden',
              boxShadow: `0 8px 24px ${theme.btnShadow}`,
              border: `2px solid ${isRec ? 'rgba(255,255,255,0.15)' : 'rgba(120,100,210,0.2)'}`,
            }}>
              <Box component="img" src={elanceLogo} alt="ELance"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Typography variant="h4" sx={{
              fontWeight: 900, mb: 0.5, letterSpacing: '-0.5px',
              background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>ELance</Typography>
            <Typography variant="subtitle1" sx={{ color: isRec ? 'rgba(255,255,255,0.75)' : '#4a5568', fontWeight: 600, mb: 0.4 }}>
              Professional Career Portal
            </Typography>
            <Typography variant="body2" sx={{ color: theme.sub, fontSize: '0.82rem' }}>
              {isRec ? 'Find & hire the best talent for your business' : 'Unlock your potential with AI-powered career insights'}
            </Typography>
          </Box>

          {/* Role Toggle */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{
              color: theme.sub, display: 'block', textAlign: 'center',
              mb: 1.2, letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600,
            }}>
              I am a
            </Typography>
            <ToggleButtonGroup value={roleHint} exclusive fullWidth
              onChange={(_, v) => v && setRoleHint(v)}
              sx={{
                borderRadius: '14px', overflow: 'hidden',
                border: `1.5px solid ${isRec ? 'rgba(255,255,255,0.12)' : 'rgba(120,100,210,0.25)'}`,
                '& .MuiToggleButton-root': {
                  borderColor: 'transparent',
                  color: theme.sub, fontWeight: 600, py: 1.4,
                  textTransform: 'none', fontSize: '0.92rem',
                  transition: 'all 0.25s ease',
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
                    color: '#fff', borderColor: 'transparent',
                    boxShadow: `0 4px 16px ${theme.btnShadow}`,
                  },
                  '&:hover:not(.Mui-selected)': {
                    background: isRec ? 'rgba(255,255,255,0.06)' : 'rgba(74,108,247,0.06)',
                  },
                },
              }}>
              <ToggleButton value="jobSeeker">
                <WorkOutline sx={{ mr: 1, fontSize: 18 }} /> Job Seeker
              </ToggleButton>
              <ToggleButton value="recruiter">
                <BusinessCenter sx={{ mr: 1, fontSize: 18 }} /> Recruiter
              </ToggleButton>
            </ToggleButtonGroup>

            <Chip size="small"
              label={isRec
                ? '🏢 You\'ll access the Recruiter Dashboard'
                : '✨ You\'ll get the immersive Job Portal'}
              sx={{
                mt: 1.5, width: '100%', borderRadius: '10px',
                border: `1px solid ${theme.chip.border}`,
                background: theme.chip.bg, color: theme.chip.color, fontSize: '0.72rem', fontWeight: 500,
              }} />
          </Box>

          {/* Error message */}
          {message && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '0.82rem' }}>
              {message}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email Address" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required sx={inputSx}
              InputLabelProps={{ style: { color: theme.sub } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ fontSize: 18, color: theme.sub }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField fullWidth label="Password" type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} required sx={inputSx}
              InputLabelProps={{ style: { color: theme.sub } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 18, color: theme.sub }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)} edge="end" size="small"
                      sx={{ color: theme.sub }}>
                      {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large"
              sx={{
                py: 1.8, mb: 2.5, fontWeight: 700, borderRadius: '14px',
                textTransform: 'none', fontSize: '1rem', letterSpacing: '0.3px',
                background: theme.btnGrad,
                boxShadow: `0 6px 20px ${theme.btnShadow}`,
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 10px 28px ${theme.btnShadow}` },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': { background: '#e0e0e0', color: '#9e9e9e', boxShadow: 'none' },
              }}>
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : `Sign In as ${isRec ? 'Recruiter' : 'Job Seeker'}`}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.sub, display: 'inline' }}>
                Don't have an account?{' '}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                onClick={() => navigate('/signup')}
                sx={{
                  color: theme.accent2, fontWeight: 700, cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}>
                Create Account
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Footer */}
        <Typography variant="caption" sx={{
          display: 'block', textAlign: 'center', mt: 2.5,
          color: isRec ? 'rgba(255,255,255,0.25)' : 'rgba(100,90,180,0.4)',
          fontSize: '0.7rem',
        }}>
          © {new Date().getFullYear()} ELance Portal · All rights reserved
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;
