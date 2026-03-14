// frontend/src/components/auth/OTPVerification.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Container, TextField, Typography, Card, Alert, CircularProgress } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/AuthService';

const bgStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #dde8f8 0%, #e8e0f5 40%, #f0e8f8 70%, #dde8f8 100%)',
  position: 'relative', overflow: 'hidden', py: 4,
};

const OTPVerification = ({ email, onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { verifyOTP } = useContext(AuthContext);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
      if (value && index < 5) { const n = document.getElementById(`otp-${index + 1}`); if (n) n.focus(); }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) { const p = document.getElementById(`otp-${index - 1}`); if (p) p.focus(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setMessage('Please enter all 6 digits'); setLoading(false); return; }
    try { await verifyOTP(email, otpStr); setMessage('✅ OTP verified successfully!'); onSuccess(); }
    catch (error) { setMessage(error.message || 'Failed to verify OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setResendLoading(true); setMessage('');
    try {
      await authService.resendOTP(email);
      setMessage('✅ New OTP sent to your email!'); setCountdown(60); setOtp(['', '', '', '', '', '']);
      const first = document.getElementById('otp-0'); if (first) first.focus();
    } catch (error) { setMessage(error.message || 'Failed to resend OTP.'); }
    finally { setResendLoading(false); }
  };

  return (
    <Box sx={bgStyle}>
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(130,130,210,0.18) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,160,240,0.3), transparent 70%)', pointerEvents: 'none' }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 20px 60px rgba(100,90,200,0.15)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(200,190,240,0.5)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Email icon */}
            <Box sx={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(74,108,247,0.15), rgba(124,77,255,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, fontSize: '2rem', border: '2px solid rgba(120,100,210,0.2)' }}>
              📧
            </Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
              ELance
            </Typography>
            <Typography variant="h6" sx={{ color: '#4a5568', fontWeight: 600, mb: 2 }}>Verify Your Email</Typography>
            <Typography variant="body2" sx={{ color: '#718096' }}>We've sent a 6-digit verification code to</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#5c6bc0', mt: 0.5 }}>{email}</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 4 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index} id={`otp-${index}`} value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', padding: '10px 0' } }}
                  sx={{
                    width: '52px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.9)',
                      '& fieldset': { borderColor: digit ? '#5c6bc0' : 'rgba(120,100,210,0.3)', borderWidth: digit ? '2px' : '1.5px' },
                      '&:hover fieldset': { borderColor: '#7c4dff' },
                      '&.Mui-focused fieldset': { borderColor: '#5c6bc0', borderWidth: '2px' },
                    },
                  }}
                />
              ))}
            </Box>

            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large"
              sx={{ py: 1.8, mb: 2, fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)', boxShadow: '0 6px 20px rgba(74,108,247,0.4)', textTransform: 'none', '&:hover': { background: 'linear-gradient(135deg, #3a5ce7, #6c3def)', transform: 'translateY(-1px)' } }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
            </Button>

            <Button fullWidth variant="outlined" onClick={handleResendOTP} disabled={resendLoading || countdown > 0}
              sx={{ mb: 3, borderRadius: '12px', borderColor: 'rgba(120,100,210,0.4)', color: '#5c6bc0', textTransform: 'none', '&:hover': { borderColor: '#7c4dff', backgroundColor: 'rgba(124,77,255,0.05)' }, '&:disabled': { borderColor: 'rgba(120,100,210,0.2)', color: '#a0aec0' } }}>
              {resendLoading ? <CircularProgress size={24} /> : countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Button>
          </Box>

          {message && <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}

          <Typography variant="body2" align="center" sx={{ color: '#718096' }}>
            Didn't receive the code?{' '}
            <Button variant="text" size="small" onClick={onBack} sx={{ color: '#5c6bc0', fontWeight: 700, textTransform: 'none', '&:hover': { color: '#7c4dff', background: 'transparent' } }}>
              Back to Signup
            </Button>
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default OTPVerification;
