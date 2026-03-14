// frontend/src/pages/RecruiterDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Button, Avatar, Menu, MenuItem,
  ListItemText, AppBar, Toolbar, IconButton, Tooltip,
  Divider, CircularProgress,
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import { jobService } from '../services/JobService';
import PostJob from '../components/recruiter/PostJob';
import SchedulePage from '../components/recruiter/SchedulePage';
import ApplicationManager from '../components/recruiter/ApplicationManager';
import RecruiterAnalytics from '../components/recruiter/RecruiterAnalytics';
import AboutUS from './AboutUS';
import MyProfilePage from './MyProfile';
import SettingsPage from './Settings';
import HeroImage from '../assets/images/1.webp';
import HeroBg    from '../assets/images/2.webp';
import HeroBg2   from '../assets/images/3.avif';
import HeroBg3   from '../assets/images/4.avif';
import elanceLogo from '../assets/images/elance-logo.jpg';

const SLIDES = [HeroBg, HeroBg2, HeroBg3];
const SLIDE_INTERVAL = 4500;

const RecruiterHome = ({ setActiveItem }) => {
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ activeJobs: 0, totalApps: 0, shortlisted: 0, accepted: 0, responseRate: 'N/A' });
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex(prev => (prev + 1) % SLIDES.length), SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const myJobs = await jobService.getRecruiterJobs();
        let totalApps = 0, totalAccepted = 0, totalResponded = 0;
        const allApps = [];
        for (const job of (myJobs || [])) {
          try {
            const apps = await jobService.getJobApplications(job._id);
            const arr = apps || [];
            totalApps += arr.length;
            totalAccepted += arr.filter(a => a.status === 'accepted').length;
            totalResponded += arr.filter(a => a.status !== 'pending').length;
            allApps.push(...arr);
          } catch (e) {}
        }
        const responsePct = totalApps > 0 ? Math.round((totalResponded / totalApps) * 100) : 0;
        setStats({
          activeJobs: (myJobs || []).filter(j => j.status !== 'closed').length,
          totalApps,
          shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
          accepted: totalAccepted,
          responseRate: responsePct > 0 ? responsePct + '%' : 'N/A',
        });
      } catch (e) {}
      finally { setLoadingStats(false); }
    };
    load();
  }, []);

  const statItems = [
    { icon: '💼', value: stats.activeJobs,   label: 'Active Jobs' },
    { icon: '📋', value: stats.totalApps,    label: 'Applications' },
    { icon: '✅', value: stats.shortlisted,  label: 'Shortlisted' },
    { icon: '🏆', value: stats.accepted,     label: 'Hired' },
    { icon: '📊', value: stats.responseRate, label: 'Response Rate' },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', px: { xs: 4, md: 9 } }}>
        {SLIDES.map((src, i) => (
          <Box key={i} sx={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(4px) brightness(0.65)', transform: 'scale(1.06)',
            transition: 'opacity 1.4s ease-in-out', opacity: slideIndex === i ? 1 : 0, zIndex: 0,
          }} />
        ))}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(8,18,60,0.65) 0%, rgba(15,50,120,0.50) 60%, rgba(0,0,0,0.35) 100%)', zIndex: 1 }} />
        <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, zIndex: 4 }}>
          {SLIDES.map((_, i) => (
            <Box key={i} onClick={() => setSlideIndex(i)} sx={{
              width: slideIndex === i ? 24 : 8, height: 8, borderRadius: 4,
              background: slideIndex === i ? '#f9a825' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer', transition: 'all 0.4s ease',
            }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, zIndex: 3, maxWidth: 540, pt: 2 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, background: 'rgba(249,168,37,0.18)', border: '1px solid rgba(249,168,37,0.45)', borderRadius: 5, px: 2, py: 0.5, mb: 2.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#f9a825' }} />
            <Typography sx={{ color: '#ffd54f', fontSize: '0.78rem', fontWeight: 600, letterSpacing: 0.5 }}>Smart Hiring Platform</Typography>
          </Box>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.1, mb: 2, fontSize: { xs: '2.2rem', md: '3.2rem' }, color: '#ffffff', letterSpacing: '-0.5px', textShadow: '0 3px 16px rgba(0,0,0,0.50)' }}>
            Hire top talent<br />
            <Box component="span" sx={{ color: '#ffd740' }}>for your business</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontWeight: 400, fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 420 }}>
            Reach millions of skilled candidates quickly and efficiently.
          </Typography>
          <Button variant="contained" onClick={() => setActiveItem('post-job')}
            sx={{ background: 'linear-gradient(90deg, #f9a825, #fb8c00)', color: '#fff', fontWeight: 700, px: 5, py: 1.6, borderRadius: 3, fontSize: '1rem', textTransform: 'none', boxShadow: '0 8px 28px rgba(249,168,37,0.55)', '&:hover': { background: 'linear-gradient(90deg,#fb8c00,#f57f17)' }, transition: 'all 0.25s ease' }}>
            Post a Job →
          </Button>
        </Box>
        <Box sx={{ flex: '0 0 auto', display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', width: { md: 360, lg: 430 }, height: '100%', zIndex: 3, pb: 6 }}>
          <Box sx={{ width: '100%', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 4, overflow: 'hidden', p: 1 }}>
            <Box component="img" src={HeroImage} alt="Hiring" sx={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 3, display: 'block' }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0, background: '#ffffff', borderTop: '1px solid #e8edf5', display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 2.2, px: { xs: 2, md: 6 } }}>
        {statItems.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{s.icon}</Typography>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#1a2a6c', fontSize: '1.15rem', lineHeight: 1.1 }}>
                {loadingStats ? <CircularProgress size={16} /> : s.value}
              </Typography>
              <Typography sx={{ color: '#607d8b', fontSize: '0.72rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</Typography>
            </Box>
            {i < statItems.length - 1 && <Box sx={{ width: '1px', height: 30, background: '#dde3f0', ml: 2, display: { xs: 'none', sm: 'block' } }} />}
          </Box>
        ))}
      </Box>

      <Box sx={{ flexShrink: 0, background: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 3, md: 8 }, py: 1 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {['Home', 'Contact', 'Privacy'].map(link => (
            <Typography key={link} sx={{ color: '#90a4ae', fontSize: '0.78rem', cursor: 'pointer', '&:hover': { color: '#1976d2' } }}>{link}</Typography>
          ))}
        </Box>
        <Typography sx={{ color: '#b0bec5', fontSize: '0.75rem' }}>2025 ELance Recruiter</Typography>
      </Box>
    </Box>
  );
};

const RecruiterDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeItem, setActiveItem] = useState('home');
  const [menuAnchor, setMenuAnchor] = useState(null);

  const navLinks = [
    { label: 'Home',         id: 'home' },
    { label: 'Post Jobs',    id: 'post-job' },
    { label: 'Applications', id: 'applications' },
    { label: 'Analytics',    id: 'analytics' },
    { label: 'Schedule',     id: 'schedule' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="fixed" sx={{ background: 'white', zIndex: 1300, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', borderBottom: '1px solid #edf0f7' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setActiveItem('home')}>
            <img src={elanceLogo} alt="Elance" style={{ height: 38, width: 38, borderRadius: 8, objectFit: 'cover' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1976d2', letterSpacing: 0.3 }}>ELance</Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            {navLinks.map(link => (
              <Button key={link.id} onClick={() => setActiveItem(link.id)}
                sx={{
                  color: activeItem === link.id ? '#1976d2' : '#64748b',
                  fontWeight: activeItem === link.id ? 700 : 400,
                  fontSize: '0.88rem', textTransform: 'none', px: 1.8,
                  borderBottom: activeItem === link.id ? '2px solid #1976d2' : '2px solid transparent',
                  borderRadius: 0, '&:hover': { color: '#1976d2', background: 'transparent' },
                }}>
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Account">
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontSize: '0.9rem' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'R'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
              PaperProps={{ elevation: 6, sx: { mt: 1, minWidth: 220, borderRadius: 2, border: '1px solid #f0f0f0' } }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f4ff', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {user?.recruiterProfile?.companyName || user?.username || 'Recruiter'}
                </Typography>
                <Typography variant="caption" color="#64748b">{user?.email}</Typography>
              </Box>
              <MenuItem onClick={() => { setActiveItem('profile'); setMenuAnchor(null); }} sx={{ color: '#475569', mx: 1, borderRadius: 1, my: 0.25, gap: 1 }}>
                <Typography sx={{ fontSize: '1rem', minWidth: 24 }}>👤</Typography>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setActiveItem('settings'); setMenuAnchor(null); }} sx={{ color: '#475569', mx: 1, borderRadius: 1, my: 0.25, gap: 1 }}>
                <Typography sx={{ fontSize: '1rem', minWidth: 24 }}>⚙️</Typography>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={logout} sx={{ color: '#dc2626', mx: 1, borderRadius: 1, my: 0.25, gap: 1 }}>
                <Typography sx={{ fontSize: '1rem', minWidth: 24 }}>🚪</Typography>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, mt: '64px', minHeight: 'calc(100vh - 64px)' }}>
        {activeItem === 'home'         && <RecruiterHome setActiveItem={setActiveItem} user={user} />}
        {activeItem === 'post-job'     && <PostJob />}
        {activeItem === 'applications' && <ApplicationManager />}
        {activeItem === 'analytics'    && <RecruiterAnalytics />}
        {activeItem === 'schedule'     && <SchedulePage />}
        {activeItem === 'profile'      && <MyProfilePage onBack={() => setActiveItem('home')} />}
        {activeItem === 'settings'     && <SettingsPage onBack={() => setActiveItem('home')} />}
        {activeItem === 'about'        && <AboutUS />}
      </Box>
    </Box>
  );
};

export default RecruiterDashboard;
