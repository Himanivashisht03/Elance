// frontend/src/components/JobSearch.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button, Card,
  Grid, Chip, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Pagination, Avatar, Paper, Collapse, IconButton,
  CircularProgress, Alert, Snackbar, Tooltip, LinearProgress, Divider, Fade
} from '@mui/material';
import {
  Search as SearchIcon, LocationOn, Work, AttachMoney,
  ExpandMore, ExpandLess, FilterList, Clear, Bookmark, BookmarkBorder,
  AccessTime, Business, CheckCircle, Send, TrendingUp, Star, StarBorder,
  Tune, FlashOn, Verified, OpenInNew
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { jobService } from '../services/JobService';
import { authService } from '../services/AuthService';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function safeFetch(url, options = {}) {
  const token = authService?.getToken?.() || localStorage.getItem('token') || '';
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    console.error(`[safeFetch] Non-JSON from ${url}:`, text.slice(0, 200));
    throw new Error(`Server error (${res.status})`);
  }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

const COMPANY_GRADIENTS = [
  'linear-gradient(135deg, #4a6cf7, #7c4dff)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #38bdf8)',
  'linear-gradient(135deg, #e879f9, #7c4dff)',
  'linear-gradient(135deg, #38bdf8, #4a6cf7)',
  'linear-gradient(135deg, #4ade80, #10b981)',
];

const JobSearch = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [searchQuery,       setSearchQuery]       = useState('');
  const [location,          setLocation]          = useState('');
  const [jobType,           setJobType]           = useState('');
  const [experienceLevel,   setExperienceLevel]   = useState('');
  const [salaryMin,         setSalaryMin]         = useState('');
  const [salaryMax,         setSalaryMax]         = useState('');
  const [company,           setCompany]           = useState('');
  const [skills,            setSkills]            = useState([]);
  const [jobs,              setJobs]              = useState([]);
  const [filteredJobs,      setFilteredJobs]      = useState([]);
  const [currentPage,       setCurrentPage]       = useState(1);
  const [savedJobs,         setSavedJobs]         = useState(new Set());
  const [appliedJobs,       setAppliedJobs]       = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userSkills,        setUserSkills]        = useState([]);
  const [sortBy,            setSortBy]            = useState('match');
  const [expandedJob,       setExpandedJob]       = useState(null);
  const [activeTab,         setActiveTab]         = useState('all');

  // ── Real stats state ──
  const [platformStats, setPlatformStats] = useState({
    liveToday: null,
    placedMonthly: null,
    companiesHiring: null,
    placementRate: null,
    loaded: false,
  });

  const jobsPerPage    = 6;
  const jobTypes       = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
  const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
  const skillOptions   = [
    'React','JavaScript','TypeScript','Node.js','Python','CSS','HTML',
    'AWS','MongoDB','PostgreSQL','Redux','Tailwind','Figma','Firebase',
    'Docker','Kubernetes','Java','Spring Boot','SQL','Git','REST API',
    'GraphQL','Machine Learning','Data Science','AI','TensorFlow',
  ];

  /* ══════════════════════════════════════════
     FETCH REAL STATS — /api/jobs/public/stats
     Uses safeFetch so auth header is included
  ══════════════════════════════════════════ */
  const fetchPlatformStats = useCallback(async () => {
    try {
      // FIX: use safeFetch so the Authorization header is sent
      const data = await safeFetch(`${API}/jobs/public/stats`);

      setPlatformStats({
        liveToday:       data.liveToday        ?? null,
        placedMonthly:   data.placedThisMonth  ?? null,
        companiesHiring: data.companiesHiring  ?? null,
        placementRate:   data.placementRate    ?? null,
        loaded: true,
      });
    } catch (err) {
      console.warn('fetchPlatformStats failed:', err.message);
      setPlatformStats(p => ({ ...p, loaded: true }));
    }
  }, []);

  const fetchAllJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobService.getAllJobs();
      const list = Array.isArray(response) ? response : (response.jobs || []);
      const sorted = [...list].sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
      setJobs(sorted);
      setFilteredJobs(sorted);
    } catch (err) {
      console.error('fetchAllJobs:', err);
      setSnackbar({ open: true, message: 'Failed to load jobs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppliedJobs = useCallback(async () => {
    try {
      const response = await jobService.getUserApplications();
      const list = Array.isArray(response) ? response : (response.applications || []);
      setAppliedJobs(new Set(list.map(app => app.jobId?._id || app.jobId)));
    } catch (err) { console.warn('fetchAppliedJobs:', err.message); }
  }, []);

  const fetchSavedJobs = useCallback(async () => {
    try {
      const response = await jobService.getSavedJobs();
      const list = Array.isArray(response) ? response : (response.savedJobs || []);
      setSavedJobs(new Set(list.map(job => job._id || job.id)));
    } catch (err) { console.warn('fetchSavedJobs:', err.message); }
  }, []);

  useEffect(() => {
    if (user) {
      setUserSkills(user.skills || []);
      fetchAppliedJobs();
      fetchSavedJobs();
    }
    fetchAllJobs();
    fetchPlatformStats();
  }, [user, fetchAllJobs, fetchAppliedJobs, fetchSavedJobs, fetchPlatformStats]);

  /* ── Fallback: derive from jobs list if API gave nothing ── */
  useEffect(() => {
    if (jobs.length > 0 && platformStats.loaded &&
        platformStats.liveToday == null && platformStats.companiesHiring == null) {
      const uniqueCompanies = new Set(jobs.map(j => j.company?.toLowerCase()).filter(Boolean)).size;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const liveToday = jobs.filter(j => new Date(j.createdAt) >= today).length || jobs.length;
      setPlatformStats(p => ({
        ...p,
        liveToday,
        companiesHiring: uniqueCompanies,
      }));
    }
  }, [jobs, platformStats.loaded]);

  const handleApplyJob = useCallback(async (jobId) => {
    if (!user) {
      setSnackbar({ open: true, message: 'Please log in to apply', severity: 'warning' });
      return;
    }
    setApplying(prev => ({ ...prev, [jobId]: true }));
    try {
      await jobService.applyForJob(jobId);
      setAppliedJobs(prev => new Set([...prev, jobId]));
      setSnackbar({ open: true, message: '🎉 Application submitted successfully!', severity: 'success' });
    } catch (serviceErr) {
      try {
        await safeFetch(`${API}/jobs/${jobId}/apply`, { method: 'POST' });
        setAppliedJobs(prev => new Set([...prev, jobId]));
        setSnackbar({ open: true, message: '🎉 Application submitted successfully!', severity: 'success' });
      } catch (directErr) {
        setSnackbar({ open: true, message: directErr.message || 'Failed to apply', severity: 'error' });
      }
    } finally {
      setApplying(prev => ({ ...prev, [jobId]: false }));
    }
  }, [user]);

  const handleSaveJob = useCallback(async (jobId) => {
    setSavedJobs(prev => { const n = new Set(prev); n.has(jobId) ? n.delete(jobId) : n.add(jobId); return n; });
    try {
      if (typeof jobService.toggleSaveJob === 'function') {
        await jobService.toggleSaveJob(jobId);
      } else {
        await safeFetch(`${API}/auth/save-job/${jobId}`, { method: 'POST' });
      }
    } catch (err) {
      setSavedJobs(prev => { const n = new Set(prev); n.has(jobId) ? n.delete(jobId) : n.add(jobId); return n; });
      setSnackbar({ open: true, message: 'Failed to save job', severity: 'error' });
    }
  }, []);

  useEffect(() => {
    let filtered = jobs.filter(job => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !searchQuery ||
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q);
      const matchesLocation = !location || job.location?.toLowerCase().includes(location.toLowerCase());
      const matchesType     = !jobType || job.type === jobType;
      const matchesExp      = !experienceLevel || job.experience === experienceLevel;
      const jobMin = job.salaryRange?.min || 0;
      const jobMax = job.salaryRange?.max || 0;
      const minSal = parseInt(salaryMin) || 0;
      const maxSal = parseInt(salaryMax) || 100_000_000;
      const matchesSalary = (!salaryMin && !salaryMax) || (jobMax >= minSal && jobMin <= maxSal);
      const matchesCompany = !company || job.company?.toLowerCase().includes(company.toLowerCase());
      const matchesSkills  = skills.length === 0 ||
        skills.every(skill => job.requiredSkills?.some(s => (s.name || s)?.toLowerCase().includes(skill.toLowerCase())));
      return matchesQuery && matchesLocation && matchesType && matchesExp && matchesSalary && matchesCompany && matchesSkills;
    });

    switch (sortBy) {
      case 'date':   filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'salary': filtered.sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0)); break;
      default:       filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
    }

    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [searchQuery, location, jobType, experienceLevel, salaryMin, salaryMax, company, skills, sortBy, jobs]);

  const handleSkillChange = useCallback((skill) =>
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]), []);

  const clearFilters = useCallback(() => {
    setSearchQuery(''); setLocation(''); setJobType(''); setExperienceLevel('');
    setSalaryMin(''); setSalaryMax(''); setCompany(''); setSkills([]); setSortBy('match');
  }, []);

  const formatSalary = useCallback((job) => {
    if (job.salaryRange?.min && job.salaryRange?.max)
      return `${(job.salaryRange.min / 1000).toFixed(0)}K – ${(job.salaryRange.max / 1000).toFixed(0)}K`;
    return 'Competitive';
  }, []);

  const formatDate = useCallback((d) => {
    const days = Math.floor((new Date() - new Date(d)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getMatchColor = (p) => p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : p >= 20 ? '#4a6cf7' : '#94a3b8';
  const getMatchLabel = (p) => p >= 80 ? '🔥 Excellent' : p >= 50 ? '⭐ Good' : p >= 20 ? '👍 Fair' : 'Low';
  const fmtNum = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;

  /* ── Build stats display — only real non-null values ── */
  const statsDisplay = useMemo(() => [
    platformStats.liveToday       != null && { value: fmtNum(platformStats.liveToday),       suffix: '',  label: 'Live Today'       },
    platformStats.placedMonthly   != null && { value: fmtNum(platformStats.placedMonthly),   suffix: '',  label: 'Placed Monthly'   },
    platformStats.companiesHiring != null && { value: fmtNum(platformStats.companiesHiring), suffix: '+', label: 'Companies Hiring' },
  ].filter(Boolean), [platformStats]);

  const appliedJobsList = useMemo(() => jobs.filter(job => appliedJobs.has(job._id)), [jobs, appliedJobs]);
  const recommendedJobs = useMemo(() => jobs.filter(j => (j.matchPercentage || 0) >= 70 && !appliedJobs.has(j._id)).slice(0, 6), [jobs, appliedJobs]);
  const savedJobsList   = useMemo(() => jobs.filter(j => savedJobs.has(j._id)), [jobs, savedJobs]);
  const displayJobs     = activeTab === 'saved' ? savedJobsList : activeTab === 'recommended' ? recommendedJobs : filteredJobs;
  const indexOfLastJob  = currentPage * jobsPerPage;
  const currentJobs     = displayJobs.slice(indexOfLastJob - jobsPerPage, indexOfLastJob);
  const totalPages      = Math.ceil(displayJobs.length / jobsPerPage);
  const activeFilterCount = [searchQuery, location, jobType, experienceLevel, company, salaryMin, salaryMax].filter(Boolean).length + skills.length;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #f8f4ff 100%)' }}>

      {/* ── HERO HEADER ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a2caa 0%, #5216c0 60%, #7c4dff 100%)',
        pt: 5, pb: 4, px: { xs: 3, md: 6 },
        position: 'relative', overflow: 'hidden',
      }}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            width:  [180, 120, 200, 90, 150][i],
            height: [180, 120, 200, 90, 150][i],
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            top:  ['-20%', '60%', '-10%', '30%', '70%'][i],
            left: ['80%', '5%', '40%', '90%', '60%'][i],
          }} />
        ))}

        <Container maxWidth="xl">
          <Typography sx={{
            fontWeight: 900, fontSize: { xs: '2rem', md: '2.6rem' },
            color: 'white', mb: 0.5, lineHeight: 1.15,
            textShadow: '0 2px 16px rgba(0,0,0,0.3)',
          }}>
            Find Your{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Perfect Job
            </Box>
          </Typography>
          <Typography sx={{ color: 'rgba(210,222,255,0.85)', mb: 3, fontSize: '1rem' }}>
            {userSkills.length > 0
              ? `Matching with your skills: ${userSkills.slice(0, 4).join(', ')}${userSkills.length > 4 ? ` +${userSkills.length - 4} more` : ''}`
              : `${jobs.length} opportunities waiting for you`}
          </Typography>

          {/* ── SEARCH BAR ── */}
          <Box sx={{
            display: 'flex', flexWrap: 'wrap', gap: 1.5,
            background: 'white', borderRadius: 3, p: 1.5, maxWidth: 860,
            boxShadow: '0 20px 60px rgba(0,0,0,0.30)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 200px', gap: 1, px: 1 }}>
              <SearchIcon sx={{ color: '#4a6cf7', flexShrink: 0 }} />
              <TextField variant="standard" placeholder="Job title or keywords" fullWidth
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ '& input': { fontSize: '0.9rem', color: '#1a1f3a' } }} />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 150px', gap: 1, px: 1 }}>
              <LocationOn sx={{ color: '#7c4dff', flexShrink: 0 }} />
              <TextField variant="standard" placeholder="City or Remote" fullWidth
                value={location} onChange={e => setLocation(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ '& input': { fontSize: '0.9rem', color: '#1a1f3a' } }} />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 1 140px', gap: 1, px: 1 }}>
              <Work sx={{ color: '#10b981', flexShrink: 0 }} />
              <Select variant="standard" value={jobType} onChange={e => setJobType(e.target.value)}
                displayEmpty disableUnderline
                sx={{ fontSize: '0.9rem', flex: 1, color: jobType ? '#1a1f3a' : '#94a3b8' }}>
                <MenuItem value=""><em>Job Type</em></MenuItem>
                {jobTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </Box>
            <Button onClick={() => setCurrentPage(1)} disableElevation sx={{
              px: 3.5, py: 1.2, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)',
              color: 'white', fontWeight: 700, textTransform: 'none', fontSize: '0.9rem',
              '&:hover': { background: 'linear-gradient(135deg, #3b5ce6, #6a3ddf)' },
            }}>
              <SearchIcon sx={{ mr: 0.5, fontSize: 18 }} /> Search
            </Button>
          </Box>

          {/* ── REAL STATS DOTS ── */}
          <Box sx={{ display: 'flex', gap: 3, mt: 2.5, flexWrap: 'wrap' }}>
            {!platformStats.loaded ? (
              [1,2,3].map(i => (
                <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
                  <Box sx={{ width:6, height:6, borderRadius:'50%', background:'rgba(74,222,128,0.4)' }} />
                  <Box sx={{ width:100, height:14, borderRadius:4, background:'rgba(255,255,255,0.12)', animation:'shimmer 1.5s infinite' }} />
                </Box>
              ))
            ) : statsDisplay.length > 0 ? (
              statsDisplay.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  <Typography sx={{ color: 'rgba(210,225,255,0.85)', fontSize: '0.78rem', fontWeight: 600 }}>
                    <strong style={{ color: 'white' }}>{s.value}{s.suffix}</strong> {s.label}
                  </Typography>
                </Box>
              ))
            ) : null}
          </Box>
        </Container>

        <style>{`@keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.7} 100%{opacity:0.4} }`}</style>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={5000}
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
            sx={{ borderRadius: 2, fontWeight: 600 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>



        <Grid container spacing={3}>
          {/* ── LEFT SIDEBAR ── */}
          <Grid item xs={12} md={3}>
            <Paper elevation={0} sx={{
              borderRadius: 3, border: '1px solid rgba(74,108,247,0.12)',
              background: 'white', overflow: 'hidden', position: 'sticky', top: 80,
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, #4a6cf7, #7c4dff)',
                px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tune sx={{ color: 'white', fontSize: 20 }} />
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Search Filters</Typography>
                </Box>
                {activeFilterCount > 0 && (
                  <Chip label={`${activeFilterCount} active`} size="small" onClick={clearFilters}
                    sx={{ background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }} />
                )}
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a6cf7', mb: 1, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Experience
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {experienceLevels.map(lvl => (
                      <Box key={lvl} onClick={() => setExperienceLevel(experienceLevel === lvl ? '' : lvl)} sx={{
                        display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8,
                        borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                        background: experienceLevel === lvl ? 'linear-gradient(135deg,#4a6cf720,#7c4dff20)' : 'transparent',
                        border: `1px solid ${experienceLevel === lvl ? 'rgba(74,108,247,0.35)' : 'transparent'}`,
                        '&:hover': { background: 'rgba(74,108,247,0.06)' },
                      }}>
                        <Box sx={{
                          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${experienceLevel === lvl ? '#4a6cf7' : '#d0d5dd'}`,
                          background: experienceLevel === lvl ? '#4a6cf7' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {experienceLevel === lvl && <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />}
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', color: experienceLevel === lvl ? '#4a6cf7' : '#4b5563', fontWeight: experienceLevel === lvl ? 700 : 400 }}>
                          {lvl}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a6cf7', mb: 1.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Salary Range
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField size="small" type="number" placeholder="Min" value={salaryMin}
                      onChange={e => setSalaryMin(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }} />
                    <TextField size="small" type="number" placeholder="Max" value={salaryMax}
                      onChange={e => setSalaryMax(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }} />
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a6cf7', mb: 1, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Job Type
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {jobTypes.map(t => (
                      <Chip key={t} label={t} size="small" clickable
                        onClick={() => setJobType(jobType === t ? '' : t)}
                        sx={{
                          fontSize: '0.72rem', fontWeight: 600,
                          background: jobType === t ? 'linear-gradient(135deg,#4a6cf7,#7c4dff)' : 'transparent',
                          color: jobType === t ? 'white' : '#4b5563',
                          border: `1px solid ${jobType === t ? 'transparent' : 'rgba(74,108,247,0.25)'}`,
                        }} />
                    ))}
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a6cf7', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Skills
                    </Typography>
                    <IconButton size="small" onClick={() => setShowAdvancedFilters(p => !p)}>
                      {showAdvancedFilters ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                    {skillOptions.slice(0, showAdvancedFilters ? skillOptions.length : 8).map(skill => (
                      <Chip key={skill} label={skill} size="small" clickable
                        onClick={() => handleSkillChange(skill)}
                        sx={{
                          fontSize: '0.68rem', fontWeight: 600, height: 24,
                          background: skills.includes(skill) ? 'linear-gradient(135deg,#4a6cf720,#7c4dff20)' : 'transparent',
                          color: skills.includes(skill) ? '#4a6cf7' : '#6b7280',
                          border: `1px solid ${skills.includes(skill) ? 'rgba(74,108,247,0.45)' : 'rgba(0,0,0,0.12)'}`,
                        }} />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a6cf7', mb: 1, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Company
                  </Typography>
                  <TextField size="small" fullWidth placeholder="Search company..." value={company}
                    onChange={e => setCompany(e.target.value)}
                    InputProps={{ startAdornment: <Business sx={{ mr: 0.5, fontSize: 16, color: '#94a3b8' }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }} />
                </Box>

                {activeFilterCount > 0 && (
                  <Button fullWidth onClick={clearFilters} startIcon={<Clear />} variant="outlined"
                    sx={{
                      borderRadius: 2, textTransform: 'none',
                      borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444',
                      '&:hover': { background: 'rgba(239,68,68,0.06)', borderColor: '#ef4444' },
                    }}>
                    Clear All Filters
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── RIGHT: JOB RESULTS ── */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { id: 'all',         label: `All Jobs (${filteredJobs.length})` },
                    { id: 'recommended', label: `⚡ Recommended (${recommendedJobs.length})` },
                    { id: 'saved',       label: `🔖 Saved (${savedJobsList.length})` },
                  ].map(tab => (
                    <Chip key={tab.id} label={tab.label} clickable
                      onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                      sx={{
                        fontWeight: 700, fontSize: '0.78rem',
                        background: activeTab === tab.id ? 'linear-gradient(135deg,#4a6cf7,#7c4dff)' : 'white',
                        color: activeTab === tab.id ? 'white' : '#4a6cf7',
                        border: `1px solid ${activeTab === tab.id ? 'transparent' : 'rgba(74,108,247,0.25)'}`,
                        boxShadow: activeTab === tab.id ? '0 4px 14px rgba(74,108,247,0.30)' : 'none',
                      }} />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Sort:</Typography>
                  {[
                    { id: 'match',  label: '⚡ Best Match' },
                    { id: 'date',   label: '🕒 Recent'    },
                    { id: 'salary', label: '💰 Salary'    },
                  ].map(s => (
                    <Chip key={s.id} label={s.label} size="small" clickable onClick={() => setSortBy(s.id)}
                      sx={{
                        fontSize: '0.72rem', fontWeight: 700,
                        background: sortBy === s.id ? 'linear-gradient(135deg,#4a6cf7,#7c4dff)' : 'rgba(74,108,247,0.08)',
                        color: sortBy === s.id ? 'white' : '#4a6cf7', border: 'none',
                      }} />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1f3a' }}>
                  {loading ? 'Finding jobs…' : `${displayJobs.length} ${activeTab === 'recommended' ? 'Recommended' : activeTab === 'saved' ? 'Saved' : 'Jobs Found'}`}
                  {searchQuery && activeTab === 'all' && (
                    <Box component="span" sx={{ color: '#7c4dff' }}> for "{searchQuery}"</Box>
                  )}
                </Typography>
                {userSkills.length > 0 && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#4a6cf7', mt: 0.2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FlashOn sx={{ fontSize: 14 }} /> Matched to your {userSkills.length} skills
                  </Typography>
                )}
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
                <CircularProgress sx={{ color: '#4a6cf7' }} />
                <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Finding your best matches…</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentJobs.map((job, idx) => {
                    const matchPct       = job.matchPercentage || 0;
                    const matchingSkills = job.matchingSkills  || [];
                    const isExpanded     = expandedJob === job._id;
                    // FIX: declare isApplied inside the map callback so it has access to job._id
                    const isApplied      = appliedJobs.has(job._id);
                    const gradient       = COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length];

                    return (
                      <Fade in key={job._id} timeout={300 + idx * 80}>
                        <Card elevation={0} sx={{
                          borderRadius: 3, border: '1px solid rgba(74,108,247,0.10)',
                          background: 'white', overflow: 'hidden', transition: 'all 0.25s',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(74,108,247,0.15)', borderColor: 'rgba(74,108,247,0.28)' },
                        }}>
                          {matchPct > 0 && (
                            <Box sx={{ height: 3, background: '#f0f4ff' }}>
                              <Box sx={{ height: '100%', width: `${matchPct}%`, background: `linear-gradient(90deg, ${getMatchColor(matchPct)}, ${getMatchColor(matchPct)}99)`, transition: 'width 0.8s ease' }} />
                            </Box>
                          )}

                          <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2} alignItems="flex-start">
                              <Grid item xs={12} sm={8}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                  <Avatar sx={{ width: 52, height: 52, borderRadius: 2.5, flexShrink: 0, background: gradient, fontSize: '1.3rem', fontWeight: 800, boxShadow: '0 4px 16px rgba(74,108,247,0.25)' }}>
                                    {job.company?.charAt(0) || 'C'}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1a1f3a', lineHeight: 1.3, mb: 0.4 }}>{job.title}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                      <Typography sx={{ fontSize: '0.84rem', color: '#4a6cf7', fontWeight: 700 }}>{job.company}</Typography>
                                      <Verified sx={{ fontSize: 14, color: '#10b981' }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                                      {[
                                        { icon: <LocationOn sx={{ fontSize: 14 }} />, text: job.location },
                                        { icon: <Work sx={{ fontSize: 14 }} />,       text: job.type     },
                                        { icon: <AccessTime sx={{ fontSize: 14 }} />, text: formatDate(job.createdAt) },
                                        { icon: null,                                 text: formatSalary(job) },
                                      ].map((m, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#6b7280' }}>
                                          {m.icon}
                                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 500 }}>{m.text}</Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6, mb: 1.5, display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {job.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                      {job.requiredSkills?.slice(0, isExpanded ? undefined : 5).map((skill, i) => {
                                        const name = skill.name || skill;
                                        const matched = matchingSkills.includes(name) || userSkills.some(u => u.toLowerCase().includes(name.toLowerCase()));
                                        return (
                                          <Chip key={i} label={name} size="small"
                                            icon={matched ? <Star sx={{ fontSize: '12px !important', color: '#10b981 !important' }} /> : undefined}
                                            sx={{ fontSize: '0.7rem', height: 24, fontWeight: 600, background: matched ? 'rgba(16,185,129,0.10)' : 'rgba(74,108,247,0.06)', color: matched ? '#059669' : '#4b5563', border: `1px solid ${matched ? 'rgba(16,185,129,0.30)' : 'rgba(74,108,247,0.15)'}` }} />
                                        );
                                      })}
                                      {!isExpanded && job.requiredSkills?.length > 5 && (
                                        <Chip label={`+${job.requiredSkills.length - 5}`} size="small"
                                          sx={{ fontSize: '0.7rem', height: 24, background: 'rgba(0,0,0,0.05)', color: '#6b7280' }} />
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between' }}>
                                  {matchPct > 0 && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 0.3 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <Box sx={{ width: 44, height: 44, position: 'relative', flexShrink: 0 }}>
                                          <svg viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="22" cy="22" r="18" fill="none" stroke="#f0f4ff" strokeWidth="4"/>
                                            <circle cx="22" cy="22" r="18" fill="none" stroke={getMatchColor(matchPct)} strokeWidth="4"
                                              strokeDasharray={`${(matchPct / 100) * 113} 113`} strokeLinecap="round"/>
                                          </svg>
                                          <Typography sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '0.6rem', fontWeight: 900, color: getMatchColor(matchPct), lineHeight: 1 }}>
                                            {matchPct}%
                                          </Typography>
                                        </Box>
                                        <Box>
                                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: getMatchColor(matchPct) }}>{getMatchLabel(matchPct)}</Typography>
                                          <Typography sx={{ fontSize: '0.63rem', color: '#94a3b8' }}>match</Typography>
                                        </Box>
                                      </Box>
                                      {matchingSkills.length > 0 && (
                                        <Typography sx={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>{matchingSkills.length} skills matched</Typography>
                                      )}
                                    </Box>
                                  )}

                                  <Chip label={job.experience || 'Any level'} size="small"
                                    sx={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(74,108,247,0.08)', color: '#4a6cf7', border: '1px solid rgba(74,108,247,0.20)' }} />

                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                                    <Tooltip title={savedJobs.has(job._id) ? 'Saved' : 'Save job'}>
                                      <IconButton size="small" onClick={() => handleSaveJob(job._id)} sx={{
                                        border: '1.5px solid rgba(74,108,247,0.25)', borderRadius: 1.5,
                                        color: savedJobs.has(job._id) ? '#4a6cf7' : '#94a3b8',
                                        background: savedJobs.has(job._id) ? 'rgba(74,108,247,0.08)' : 'transparent',
                                        '&:hover': { borderColor: '#4a6cf7', color: '#4a6cf7' },
                                      }}>
                                        {savedJobs.has(job._id) ? <Bookmark sx={{ fontSize: 18 }} /> : <BookmarkBorder sx={{ fontSize: 18 }} />}
                                      </IconButton>
                                    </Tooltip>
                                    <Button onClick={() => setExpandedJob(isExpanded ? null : job._id)}
                                      size="small" variant="outlined" sx={{
                                        borderRadius: 2, textTransform: 'none', fontSize: '0.76rem', fontWeight: 600,
                                        borderColor: 'rgba(74,108,247,0.30)', color: '#4a6cf7', px: 1.5,
                                        '&:hover': { background: 'rgba(74,108,247,0.06)', borderColor: '#4a6cf7' },
                                      }}>
                                      {isExpanded ? 'Less' : 'Details'}
                                    </Button>
                                    {/* FIX: use isApplied (declared above) and rely on disabled prop — no inline guard needed */}
                                    <Button
                                      onClick={() => handleApplyJob(job._id)}
                                      disabled={applying[job._id] || isApplied}
                                      size="small" variant="contained"
                                      startIcon={
                                        applying[job._id]
                                          ? <CircularProgress size={12} color="inherit" />
                                          : isApplied
                                            ? <CheckCircle sx={{ fontSize: 14 }} />
                                            : <Send sx={{ fontSize: 14 }} />
                                      }
                                      sx={{
                                        borderRadius: 2, textTransform: 'none', fontSize: '0.76rem', fontWeight: 700,
                                        background: isApplied
                                          ? 'linear-gradient(135deg, #10b981, #059669)'
                                          : 'linear-gradient(135deg, #4a6cf7, #7c4dff)',
                                        px: 2,
                                        boxShadow: isApplied
                                          ? '0 4px 14px rgba(16,185,129,0.35)'
                                          : '0 4px 14px rgba(74,108,247,0.40)',
                                        '&:hover': {
                                          background: isApplied
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : 'linear-gradient(135deg, #3b5ce6, #6a3ddf)',
                                        },
                                        '&:disabled': {
                                          background: isApplied
                                            ? 'linear-gradient(135deg, #10b981, #059669) !important'
                                            : '#e2e8f0',
                                          color: isApplied ? 'white !important' : '#94a3b8',
                                          boxShadow: 'none',
                                          opacity: isApplied ? 1 : 0.6,
                                        },
                                      }}>
                                      {applying[job._id] ? 'Applying…' : isApplied ? 'Applied ✓' : 'Apply Now'}
                                    </Button>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Card>
                      </Fade>
                    );
                  })}
                </Box>

                {displayJobs.length === 0 && !loading && (
                  <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>
                      {activeTab === 'saved' ? '🔖' : activeTab === 'recommended' ? '⚡' : '🔍'}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#1a1f3a', mb: 1 }}>
                      {activeTab === 'saved' ? 'No saved jobs yet' : activeTab === 'recommended' ? 'No recommendations yet' : 'No jobs found'}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', mb: 3 }}>
                      {activeTab === 'saved' ? 'Bookmark jobs using the 🔖 icon'
                       : activeTab === 'recommended' ? 'Add skills to your profile to get AI recommendations'
                       : appliedJobs.size > 0 ? "You've applied to all matching jobs!"
                       : 'Try adjusting your filters'}
                    </Typography>
                    {activeTab === 'all' && (
                      <Button onClick={clearFilters} variant="contained"
                        sx={{ background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Clear All Filters
                      </Button>
                    )}
                  </Box>
                )}

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination count={totalPages} page={currentPage}
                      onChange={(_, p) => setCurrentPage(p)} color="primary" size="large"
                      sx={{
                        '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: 2 },
                        '& .Mui-selected': { background: 'linear-gradient(135deg,#4a6cf7,#7c4dff) !important', color: 'white' },
                      }} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default JobSearch;
