import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Box, Typography, TextField, Button, FormControl, Select,
  MenuItem, Chip, IconButton, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  Avatar, Popper, Paper, ClickAwayListener, Drawer, Divider,
  LinearProgress, Badge,
} from '@mui/material';
import {
  Add, Delete, Edit, Close, Search, Tune, MoreHoriz,
  LocationOn, AttachMoney, Work, People,
  CheckCircle, Cancel, Autorenew, NavigateNext,
  BoltOutlined, BookmarkBorder, Bookmark, PostAdd, Star, Email,
  Phone, School, Timeline, ArrowBack, OpenInNew,
  EmojiEvents, Person, Code, CheckCircleOutline,
  FilterList, Sort,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { jobService } from '../../services/JobService';
import { authService } from '../../services/AuthService';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ─── CONSTANTS ──────────────────────────────────────── */
const JOB_TYPES  = ['Full-time','Part-time','Contract','Internship','Remote'];
const EXP_LEVELS = ['Entry-level','Mid-level','Senior','Executive'];
const CURRENCIES = ['USD','EUR','GBP','INR','CAD','AUD'];
const STATUS_OPT = ['active','paused','closed'];

const STATUS_CFG = {
  active: { label:'Active',  color:'#22c55e', bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.25)',  icon: CheckCircle },
  paused: { label:'Paused',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', icon: BoltOutlined },
  closed: { label:'Closed',  color:'#ef4444', bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  icon: Cancel },
};

const AVATAR_BG = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
];

const EMPTY_FORM = (co='') => ({
  title:'', company:co, location:'', type:'Full-time',
  experience:'Mid-level', salaryMin:'', salaryMax:'', currency:'USD',
  description:'', skills:[], newSkill:'',
});

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
const getCurrencySymbol = (cu) => CURRENCY_SYMBOLS[cu] || cu || '$';

const fmtSalary = j => {
  const mn = j.salaryRange?.min ?? j.salaryMin;
  const mx = j.salaryRange?.max ?? j.salaryMax;
  const cu = j.salaryRange?.currency ?? j.currency ?? 'USD';
  const sym = getCurrencySymbol(cu);
  if (!mn && !mx) return null;
  return `${sym}${Number(mn).toLocaleString()} – ${sym}${Number(mx).toLocaleString()}`;
};

const timeAgo = d => {
  if (!d) return 'recently';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff/86400000);
  if (days === 0) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days/7)} week${days>=14?'s':''} ago`;
  return `${Math.floor(days/30)} month${days>=60?'s':''} ago`;
};

const fSx = (accent='#6c63ff') => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor:'rgba(255,255,255,0.7)',
    fontSize:'0.82rem', borderRadius:'12px', transition:'all .2s',
    '& fieldset': { borderColor:'rgba(180,170,230,0.35)' },
    '&:hover fieldset': { borderColor:`${accent}88` },
    '&.Mui-focused fieldset': { borderColor:accent, borderWidth:'1.5px', boxShadow:`0 0 0 3px ${accent}18` },
  },
  '& .MuiInputLabel-root': { fontSize:'0.78rem', color:'#8b8fc7' },
  '& .MuiInputLabel-root.Mui-focused': { color:accent, fontWeight:600 },
  '& input, & textarea': { color:'#2d2b5e' },
  '& input::placeholder, & textarea::placeholder': { color:'#b0aed4' },
  '& .MuiSelect-select': { color:'#2d2b5e' },
});

const menuP = { PaperProps:{ sx:{
  borderRadius:'12px', border:'1px solid rgba(180,170,230,0.3)',
  boxShadow:'0 8px 24px rgba(108,99,255,0.12)',
  '& .MuiMenuItem-root':{ fontSize:'0.8rem', color:'#2d2b5e',
    '&:hover':{ background:'rgba(108,99,255,0.08)' },
    '&.Mui-selected':{ background:'rgba(108,99,255,0.12)' } }
}}};

const skillColors = ['#6c63ff','#f093fb','#4facfe','#43e97b','#fa709a','#f5a623','#00b4d8'];

/* ─── helpers ── */
function getToken() {
  const s = authService?.getToken?.() || authService?.token;
  if (s) return s;
  const keys = ['token','authToken','auth_token','jwtToken','jwt','accessToken','access_token'];
  for (const k of keys) { const v = localStorage.getItem(k); if (v) return v; }
  try {
    for (let i=0; i<localStorage.length; i++) {
      const v = localStorage.getItem(localStorage.key(i));
      if (v && v.startsWith('eyJ') && v.split('.').length===3) return v;
    }
  } catch(_){}
  return '';
}

function authHeaders() {
  const t = getToken();
  return { 'Content-Type':'application/json', ...(t ? { Authorization:`Bearer ${t}` } : {}) };
}

const matchColor = pct =>
  pct >= 75 ? '#059669' : pct >= 50 ? '#0891b2' : pct >= 25 ? '#d97706' : '#ef4444';

const statusBadge = {
  pending:    { bg:'#fef3c7', color:'#d97706', border:'#fcd34d' },
  reviewed:   { bg:'#ede9fe', color:'#7c3aed', border:'#c4b5fd' },
  shortlisted:{ bg:'#d1fae5', color:'#059669', border:'#6ee7b7' },
  rejected:   { bg:'#fee2e2', color:'#ef4444', border:'#fca5a5' },
  accepted:   { bg:'#dbeafe', color:'#2563eb', border:'#93c5fd' },
};

// ✅ FIX: Robust applicant name extractor used everywhere
const extractCandidateName = (app) => {
  return app.applicantId?.username
    || app.applicantId?.name
    || app.applicantId?.fullName
    || app.applicant?.username
    || app.applicant?.name
    || app.applicantName
    || app.name
    || app.username
    || 'Unknown Candidate';
};

const extractCandidateEmail = (app) => {
  return app.applicantId?.email
    || app.applicant?.email
    || app.applicantEmail
    || app.email
    || '';
};

const extractCandidateSkills = (app) => {
  return app.applicantId?.skills
    || app.applicant?.skills
    || app.skills
    || [];
};

// ✅ FIX: Normalize skill to string
const normSkill = (s) => {
  if (!s) return '';
  if (typeof s === 'object') return (s?.skill?.name || s?.name || s?.skill || '').toString().toLowerCase().trim();
  return s.toString().toLowerCase().trim();
};

/* ══════════════════════════════════════════════════════
   CANDIDATE DETAIL MODAL
══════════════════════════════════════════════════════ */
function CandidateDetailModal({ candidate, job, onClose, onStatusChange }) {
  const [status, setStatus] = useState(candidate?.status || 'pending');
  const [saving, setSaving] = useState(false);

  if (!candidate) return null;

  const sb = statusBadge[status] || statusBadge.pending;
  const matchPct = candidate.match || 0;
  const mc = matchColor(matchPct);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      // ✅ FIX: Try multiple endpoint patterns
      let res = await fetch(`${API}/jobs/applications/${candidate.applicationId || candidate._id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      // Fallback endpoint
      if (!res.ok) {
        res = await fetch(`${API}/applications/${candidate.applicationId || candidate._id}/status`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: newStatus }),
        });
      }
      if (res.ok) {
        setStatus(newStatus);
        onStatusChange && onStatusChange(candidate._id, newStatus);
      }
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx:{ borderRadius:'20px', background:'#f8f7ff',
        border:'1px solid rgba(200,190,255,0.4)', boxShadow:'0 32px 80px rgba(108,99,255,0.2)', overflow:'hidden' }}}>
      <Box sx={{ height:3, background:'linear-gradient(90deg,#6c63ff,#a78bfa,#f093fb)' }}/>

      {/* Header */}
      <Box sx={{ px:3, py:2, display:'flex', alignItems:'flex-start', gap:2,
        background:'rgba(255,255,255,0.8)', borderBottom:'1px solid rgba(200,190,255,0.25)' }}>
        <Avatar sx={{ width:54, height:54, borderRadius:'15px', fontSize:'1.1rem', fontWeight:800,
          background:'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow:'0 6px 20px rgba(108,99,255,0.3)' }}>
          {(candidate.name||'?')[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'1.1rem', color:'#1a1848' }}>{candidate.name}</Typography>
          <Typography sx={{ fontSize:'0.78rem', color:'#8b8fc7', mt:0.2 }}>{candidate.email}</Typography>
          <Box sx={{ display:'flex', gap:1, mt:0.8, flexWrap:'wrap' }}>
            <Box sx={{ px:'8px', py:'2px', borderRadius:'20px', background:sb.bg, border:`1px solid ${sb.border}` }}>
              <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:sb.color, textTransform:'capitalize' }}>{status}</Typography>
            </Box>
            {candidate.role && (
              <Box sx={{ px:'8px', py:'2px', borderRadius:'20px', background:'rgba(108,99,255,0.08)', border:'1px solid rgba(108,99,255,0.2)' }}>
                <Typography sx={{ fontSize:'0.65rem', fontWeight:600, color:'#6c63ff' }}>{candidate.role}</Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ textAlign:'center', flexShrink:0 }}>
          <Box sx={{ width:56, height:56, borderRadius:'50%', border:`3px solid ${mc}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:`${mc}12` }}>
            <Typography sx={{ fontSize:'1rem', fontWeight:900, color:mc }}>{matchPct}%</Typography>
          </Box>
          <Typography sx={{ fontSize:'0.55rem', color:'#8b8fc7', mt:0.3, fontWeight:600 }}>MATCH</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color:'#b0aed4', alignSelf:'flex-start' }}>
          <Close sx={{ fontSize:18 }}/>
        </IconButton>
      </Box>

      <DialogContent sx={{ p:0 }}>
        <Box sx={{ px:3, py:1.5, background:'rgba(255,255,255,0.6)', borderBottom:'1px solid rgba(200,190,255,0.2)' }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
            <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7' }}>Skill Match for {job?.title}</Typography>
            <Typography sx={{ fontSize:'0.7rem', fontWeight:800, color:mc }}>{matchPct}%</Typography>
          </Box>
          <Box sx={{ height:6, borderRadius:99, background:'#e8e4ff', overflow:'hidden' }}>
            <Box sx={{ height:'100%', width:`${matchPct}%`, borderRadius:99,
              background:`linear-gradient(90deg,${mc},${mc}99)`, transition:'width 0.6s ease' }}/>
          </Box>
        </Box>

        <Box sx={{ px:3, py:2, display:'flex', flexDirection:'column', gap:2 }}>
          {candidate.skillList?.length > 0 && (
            <Box>
              <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', textTransform:'uppercase',
                letterSpacing:'0.06em', mb:0.8, display:'flex', alignItems:'center', gap:0.5 }}>
                <Code sx={{ fontSize:12 }}/> Skills
              </Typography>
              <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.6 }}>
                {candidate.skillList.map((sk, i) => {
                  const jobSkills = (job?.requiredSkills || []).map(s => normSkill(s));
                  const isMatch = jobSkills.includes(normSkill(sk));
                  return (
                    <Box key={i} sx={{
                      px:'8px', py:'3px', borderRadius:'8px',
                      background: isMatch ? 'rgba(5,150,105,0.1)' : 'rgba(108,99,255,0.06)',
                      border: `1px solid ${isMatch ? '#6ee7b7' : 'rgba(108,99,255,0.2)'}`,
                      display:'flex', alignItems:'center', gap:0.4,
                    }}>
                      {isMatch && <CheckCircleOutline sx={{ fontSize:9, color:'#059669' }}/>}
                      <Typography sx={{ fontSize:'0.65rem', fontWeight:600,
                        color: isMatch ? '#059669' : '#6c63ff' }}>{sk}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {candidate.expYears > 0 && (
            <Box sx={{ display:'flex', alignItems:'center', gap:1, px:1.5, py:1.2,
              borderRadius:'10px', background:'rgba(108,99,255,0.05)', border:'1px solid rgba(108,99,255,0.12)' }}>
              <Timeline sx={{ fontSize:16, color:'#6c63ff' }}/>
              <Typography sx={{ fontSize:'0.78rem', fontWeight:600, color:'#4a4870' }}>
                <strong style={{ color:'#1a1848' }}>{candidate.expYears}</strong> years experience
              </Typography>
            </Box>
          )}

          {candidate.appliedAt && (
            <Typography sx={{ fontSize:'0.7rem', color:'#8b8fc7' }}>
              Applied {timeAgo(candidate.appliedAt)}
            </Typography>
          )}

          <Box>
            <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', textTransform:'uppercase',
              letterSpacing:'0.06em', mb:0.8 }}>Update Status</Typography>
            <Box sx={{ display:'flex', gap:0.7, flexWrap:'wrap' }}>
              {['pending','reviewed','shortlisted','rejected','accepted'].map(s => {
                const cfg = statusBadge[s];
                const isActive = status === s;
                return (
                  <Box key={s} onClick={() => !saving && handleStatusChange(s)}
                    sx={{ px:'10px', py:'5px', borderRadius:'8px', cursor:'pointer',
                      background: isActive ? cfg.bg : 'rgba(255,255,255,0.7)',
                      border: `1.5px solid ${isActive ? cfg.border : 'rgba(200,190,255,0.3)'}`,
                      transition:'all .15s', opacity: saving ? 0.6 : 1,
                      '&:hover':{ background: cfg.bg, borderColor: cfg.border } }}>
                    <Typography sx={{ fontSize:'0.68rem', fontWeight:700,
                      color: isActive ? cfg.color : '#8b8fc7', textTransform:'capitalize' }}>{s}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px:3, pb:2.5, borderTop:'1px solid rgba(200,190,255,0.25)', gap:1 }}>
        <Button onClick={onClose}
          sx={{ textTransform:'none', color:'#8b8fc7', borderRadius:'10px', px:2, fontSize:'0.78rem' }}>
          Close
        </Button>
        {candidate.email && (
          <Button startIcon={<Email sx={{ fontSize:14 }}/>}
            href={`mailto:${candidate.email}`}
            sx={{ textTransform:'none', fontWeight:700, borderRadius:'10px', px:2, fontSize:'0.78rem',
              color:'#6c63ff', border:'1px solid rgba(108,99,255,0.3)',
              '&:hover':{ background:'rgba(108,99,255,0.08)' } }}>
            Email Candidate
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════
   APPLICATIONS DRAWER
══════════════════════════════════════════════════════ */
function ApplicationsDrawer({ open, onClose, job }) {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('match');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    if (!open || !job?._id) return;
    setLoading(true);
    setError('');
    setCandidates([]);

    const loadApplications = async () => {
      try {
        // ✅ FIX: Try jobService first, then fall back to direct fetch
        let raw = [];
        try {
          const data = await jobService.getJobApplications(job._id);
          // Handle all possible response shapes
          if (Array.isArray(data)) raw = data;
          else if (Array.isArray(data?.applications)) raw = data.applications;
          else if (Array.isArray(data?.data)) raw = data.data;
          else if (Array.isArray(data?.candidates)) raw = data.candidates;
          else raw = [];
        } catch (serviceErr) {
          console.warn('jobService.getJobApplications failed, trying direct fetch:', serviceErr);
          const res = await fetch(`${API}/jobs/${job._id}/applications`, { headers: authHeaders() });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (Array.isArray(data)) raw = data;
          else if (Array.isArray(data?.applications)) raw = data.applications;
          else if (Array.isArray(data?.candidates)) raw = data.candidates;
          else raw = [];
        }

        // ✅ FIX: Normalize each application to extract name/email/skills correctly
        const normalized = raw.map(app => {
          const name = extractCandidateName(app);
          const email = extractCandidateEmail(app);
          const rawSkills = extractCandidateSkills(app);
          const skillList = rawSkills.map(normSkill).filter(Boolean);

          // Calculate match score
          const jobSkills = (job?.requiredSkills || []).map(normSkill).filter(Boolean);
          let match = app.matchScore ?? app.match ?? null;
          if (match === null && jobSkills.length > 0 && skillList.length > 0) {
            const matched = jobSkills.filter(js => skillList.some(cs => cs.includes(js) || js.includes(cs)));
            match = Math.round((matched.length / jobSkills.length) * 100);
          } else if (match === null) {
            match = 0;
          }

          return {
            ...app,
            _id: app._id || app.id,
            applicationId: app._id || app.id,
            name,
            email,
            skillList,
            match,
            status: app.status || 'pending',
            appliedAt: app.appliedAt || app.createdAt,
            role: app.applicantId?.careerGoals?.currentRole || app.applicantId?.currentRole || '',
          };
        });

        setCandidates(normalized);
      } catch (err) {
        console.error('loadApplications error:', err);
        setError('Failed to load candidates. Please try again.');
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [open, job?._id]);

  const handleStatusChange = (candidateId, newStatus) => {
    setCandidates(prev => prev.map(c => c._id === candidateId ? { ...c, status: newStatus } : c));
  };

  const sorted = [...candidates]
    .filter(c => {
      const matchSearch = !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.skillList?.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return (b.match || 0) - (a.match || 0);
      if (sortBy === 'date')  return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      return 0;
    });

  const statusCounts = candidates.reduce((acc, c) => {
    acc[c.status || 'pending'] = (acc[c.status || 'pending'] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx:{
          width: { xs:'100vw', sm:520 },
          background:'#f8f7ff',
          borderLeft:'1px solid rgba(200,190,255,0.4)',
          boxShadow:'-8px 0 40px rgba(108,99,255,0.15)',
        }}}
      >
        {/* Drawer Header */}
        <Box sx={{ px:2.5, py:2, background:'linear-gradient(135deg,rgba(108,99,255,0.06),rgba(167,139,250,0.04))',
          borderBottom:'1px solid rgba(200,190,255,0.3)', flexShrink:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
            <IconButton size="small" onClick={onClose} sx={{ color:'#8b8fc7',
              '&:hover':{ color:'#6c63ff', background:'rgba(108,99,255,0.08)' } }}>
              <ArrowBack sx={{ fontSize:18 }}/>
            </IconButton>
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.95rem', color:'#1a1848' }}>
                Applications
              </Typography>
              <Typography sx={{ fontSize:'0.68rem', color:'#8b8fc7', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {job?.title} · {job?.company}
              </Typography>
            </Box>
            <Box sx={{ px:'10px', py:'4px', borderRadius:'20px', background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)' }}>
              <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#6c63ff' }}>
                {loading ? '...' : `${candidates.length} total`}
              </Typography>
            </Box>
          </Box>

          {/* Status mini counts */}
          {!loading && candidates.length > 0 && (
            <Box sx={{ display:'flex', gap:0.6, flexWrap:'wrap' }}>
              {['shortlisted','reviewed','pending','rejected','accepted'].map(s => {
                const cnt = statusCounts[s] || 0;
                if (!cnt) return null;
                const cfg = statusBadge[s];
                return (
                  <Box key={s} onClick={() => setFilterStatus(filterStatus===s ? 'all' : s)}
                    sx={{ px:'8px', py:'2px', borderRadius:'20px', cursor:'pointer',
                      background: filterStatus===s ? cfg.bg : 'rgba(255,255,255,0.7)',
                      border:`1px solid ${filterStatus===s ? cfg.border : 'rgba(200,190,255,0.3)'}`,
                      transition:'all .15s', '&:hover':{ background:cfg.bg } }}>
                    <Typography sx={{ fontSize:'0.6rem', fontWeight:700,
                      color: filterStatus===s ? cfg.color : '#8b8fc7', textTransform:'capitalize' }}>
                      {s} {cnt}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Search + Sort */}
        <Box sx={{ px:2, py:1.2, background:'rgba(255,255,255,0.6)', borderBottom:'1px solid rgba(200,190,255,0.2)',
          display:'flex', gap:1, alignItems:'center', flexShrink:0 }}>
          <Box sx={{ flex:1, position:'relative' }}>
            <Search sx={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
              fontSize:14, color:'#b0aed4' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates..."
              style={{ width:'100%', paddingLeft:30, paddingRight:12, paddingTop:7, paddingBottom:7,
                background:'rgba(255,255,255,0.8)', border:'1px solid rgba(200,190,255,0.35)',
                borderRadius:10, fontSize:'0.78rem', color:'#2d2b5e', outline:'none',
                fontFamily:'inherit', boxSizing:'border-box' }}/>
          </Box>
          <Box sx={{ display:'flex', gap:0.5 }}>
            {[['match','⭐'],['date','📅'],['status','🏷️']].map(([key,icon]) => (
              <Box key={key} onClick={() => setSortBy(key)}
                sx={{ px:'8px', py:'5px', borderRadius:'8px', cursor:'pointer', fontSize:'0.65rem', fontWeight:700,
                  background: sortBy===key ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.7)',
                  border:`1px solid ${sortBy===key ? 'rgba(108,99,255,0.3)' : 'rgba(200,190,255,0.3)'}`,
                  color: sortBy===key ? '#6c63ff' : '#8b8fc7',
                  transition:'all .15s', '&:hover':{ background:'rgba(108,99,255,0.08)' } }}>
                {icon} {key}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Candidates list */}
        <Box sx={{ flex:1, overflow:'auto',
          '&::-webkit-scrollbar':{ width:4 },
          '&::-webkit-scrollbar-thumb':{ background:'rgba(108,99,255,0.25)', borderRadius:99 } }}>
          {loading ? (
            <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', py:8, gap:2 }}>
              <CircularProgress sx={{ color:'#6c63ff' }} size={32}/>
              <Typography sx={{ fontSize:'0.78rem', color:'#8b8fc7' }}>Loading applicants...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p:3 }}>
              <Alert severity="error" sx={{ borderRadius:'12px' }}>{error}</Alert>
            </Box>
          ) : sorted.length === 0 ? (
            <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', py:8, gap:1.5 }}>
              <Box sx={{ width:56, height:56, borderRadius:'18px', background:'rgba(108,99,255,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <People sx={{ fontSize:26, color:'rgba(108,99,255,0.3)' }}/>
              </Box>
              <Typography sx={{ fontSize:'0.85rem', fontWeight:700, color:'#b0aed4' }}>
                {candidates.length === 0 ? 'No applications yet' : 'No results found'}
              </Typography>
              <Typography sx={{ fontSize:'0.72rem', color:'#c4c0e8', textAlign:'center', maxWidth:220 }}>
                {candidates.length === 0 ? 'Applications will appear here once candidates apply.' : 'Try a different search or filter.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p:1.5, display:'flex', flexDirection:'column', gap:1 }}>
              <Box sx={{ px:1, display:'flex', alignItems:'center', gap:0.5, mb:0.5 }}>
                <EmojiEvents sx={{ fontSize:12, color:'#d97706' }}/>
                <Typography sx={{ fontSize:'0.62rem', fontWeight:700, color:'#8b8fc7', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {sorted.length} Candidates · Ranked by {sortBy === 'match' ? 'Skill Match' : sortBy === 'date' ? 'Apply Date' : 'Status'}
                </Typography>
              </Box>

              {sorted.map((c, i) => {
                const mc = matchColor(c.match || 0);
                const sb = statusBadge[c.status || 'pending'];
                return (
                  <Box key={c._id || i}
                    onClick={() => setSelected(c)}
                    sx={{
                      p:1.5, borderRadius:'14px', cursor:'pointer',
                      background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)',
                      border:'1px solid rgba(200,190,255,0.35)',
                      boxShadow:'0 2px 10px rgba(108,99,255,0.06)',
                      transition:'all .18s',
                      '&:hover':{ boxShadow:'0 6px 24px rgba(108,99,255,0.14)', transform:'translateY(-1px)',
                        border:'1px solid rgba(108,99,255,0.3)' },
                    }}>
                    <Box sx={{ display:'flex', alignItems:'flex-start', gap:1.2 }}>
                      {/* Rank */}
                      <Box sx={{ width:22, height:22, borderRadius:'8px', flexShrink:0,
                        background: i < 3 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'rgba(108,99,255,0.08)',
                        display:'flex', alignItems:'center', justifyContent:'center', mt:0.3 }}>
                        <Typography sx={{ fontSize:'0.6rem', fontWeight:800,
                          color: i < 3 ? '#fff' : '#8b8fc7' }}>{i+1}</Typography>
                      </Box>

                      {/* Avatar */}
                      <Avatar sx={{ width:36, height:36, borderRadius:'11px', fontSize:'0.75rem', fontWeight:800,
                        background:AVATAR_BG[i % AVATAR_BG.length], flexShrink:0 }}>
                        {(c.name||'?')[0].toUpperCase()}
                      </Avatar>

                      {/* Info */}
                      <Box sx={{ flex:1, minWidth:0 }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.2 }}>
                          <Typography sx={{ fontWeight:800, fontSize:'0.82rem', color:'#1a1848',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {c.name}
                          </Typography>
                          <Box sx={{ px:'6px', py:'1px', borderRadius:'20px', background:sb.bg,
                            border:`1px solid ${sb.border}`, flexShrink:0 }}>
                            <Typography sx={{ fontSize:'0.55rem', fontWeight:700, color:sb.color,
                              textTransform:'capitalize' }}>{c.status || 'pending'}</Typography>
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize:'0.68rem', color:'#8b8fc7', mb:0.6,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.email || 'No email'}
                        </Typography>

                        {/* Match bar */}
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
                          <Box sx={{ flex:1, height:4, borderRadius:99, background:'#e8e4ff', overflow:'hidden' }}>
                            <Box sx={{ height:'100%', width:`${c.match || 0}%`, borderRadius:99,
                              background:`linear-gradient(90deg,${mc},${mc}aa)` }}/>
                          </Box>
                          <Typography sx={{ fontSize:'0.65rem', fontWeight:800, color:mc, minWidth:28, textAlign:'right' }}>
                            {c.match || 0}%
                          </Typography>
                        </Box>

                        {/* Skills */}
                        {c.skillList?.length > 0 && (
                          <Box sx={{ display:'flex', gap:0.4, mt:0.6, flexWrap:'wrap' }}>
                            {c.skillList.slice(0, 4).map((sk, si) => {
                              const jobSkills = (job?.requiredSkills || []).map(normSkill);
                              const isMatch = jobSkills.includes(normSkill(sk));
                              return (
                                <Box key={si} sx={{ px:'5px', py:'1px', borderRadius:'5px',
                                  background: isMatch ? 'rgba(5,150,105,0.1)' : 'rgba(108,99,255,0.06)',
                                  border:`1px solid ${isMatch ? '#a7f3d0' : 'rgba(108,99,255,0.15)'}` }}>
                                  <Typography sx={{ fontSize:'0.55rem', fontWeight:600,
                                    color: isMatch ? '#059669' : '#a78bfa' }}>{sk}</Typography>
                                </Box>
                              );
                            })}
                            {c.skillList.length > 4 && (
                              <Typography sx={{ fontSize:'0.55rem', color:'#b0aed4', alignSelf:'center' }}>
                                +{c.skillList.length - 4}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Typography sx={{ fontSize:'0.6rem', color:'#c4c0e8', flexShrink:0, mt:0.3 }}>
                        {timeAgo(c.appliedAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Drawer>

      {selected && (
        <CandidateDetailModal
          candidate={selected}
          job={job}
          onClose={() => setSelected(null)}
          onStatusChange={(id, s) => {
            handleStatusChange(id, s);
            setSelected(prev => prev?._id === id ? { ...prev, status: s } : prev);
          }}
        />
      )}
    </>
  );
}

/* ─── 3-DOT MENU — only Delete ──────────────────────── */
function ThreeDotMenu({ job, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const handleClose = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={e => { e.stopPropagation(); setAnchor(anchor ? null : e.currentTarget); }}
        sx={{ border:'1px solid rgba(200,190,255,0.4)', borderRadius:'10px',
          width:32, height:32, color:'#b0aed4', '&:hover':{ color:'#ef4444', borderColor:'#ef4444' } }}>
        <MoreHoriz sx={{ fontSize:14 }}/>
      </IconButton>
      <Popper open={Boolean(anchor)} anchorEl={anchor} placement="bottom-end"
        style={{ zIndex:1400 }} modifiers={[{ name:'offset', options:{ offset:[0,6] } }]}>
        <ClickAwayListener onClickAway={handleClose}>
          <Paper sx={{
            borderRadius:'12px', border:'1px solid rgba(200,190,255,0.35)',
            boxShadow:'0 8px 28px rgba(108,99,255,0.18)',
            background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)',
            overflow:'hidden', minWidth:140,
          }}>
            <Box onClick={e => {
                e.stopPropagation();
                onDelete(job);
                handleClose();
              }}
              sx={{ px:2, py:1.2, display:'flex', alignItems:'center', gap:1, cursor:'pointer',
                '&:hover':{ background:'rgba(239,68,68,0.07)' }, transition:'all .15s' }}>
              <Delete sx={{ fontSize:14, color:'#ef4444' }}/>
              <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:'#ef4444' }}>Delete Job</Typography>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

/* ─── JOB CARD ──── */
function JobCard({ job, idx, onEdit, onDelete, onStatus, onViewApplications, savedJobs, onSave }) {
  const sc = STATUS_CFG[job.status] || STATUS_CFG.active;
  const SI = sc.icon;
  const salary = fmtSalary(job);
  const isSaved = savedJobs?.includes(job._id);

  return (
    <Box sx={{
      background:'rgba(255,255,255,0.75)', backdropFilter:'blur(20px)',
      display:'flex', flexDirection:'column',
      borderRadius:'18px', border:'1px solid rgba(200,190,255,0.4)',
      boxShadow:'0 4px 20px rgba(108,99,255,0.08)', p:2, transition:'all .2s',
      '&:hover':{ boxShadow:'0 8px 32px rgba(108,99,255,0.15)', transform:'translateY(-2px)' },
    }}>
      {/* Header */}
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:1.2 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <Avatar sx={{ width:38, height:38, borderRadius:'11px', fontSize:'0.72rem', fontWeight:800,
            background:AVATAR_BG[idx % AVATAR_BG.length], boxShadow:'0 3px 10px rgba(108,99,255,0.2)' }}>
            {job.company?.[0] || 'C'}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight:800, fontSize:'0.85rem', color:'#1a1848', lineHeight:1.2 }}>{job.company || 'Company'}</Typography>
            <Typography sx={{ fontSize:'0.6rem', color:'#b0aed4' }}>{timeAgo(job.createdAt)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display:'flex', alignItems:'flex-start', gap:0.5 }}>
          <Box sx={{ px:'8px', py:'2px', borderRadius:'20px', background:sc.bg, border:`1px solid ${sc.border}`,
            display:'flex', alignItems:'center', gap:0.4 }}>
            <SI sx={{ fontSize:9, color:sc.color }}/>
            <Typography sx={{ fontSize:'0.58rem', fontWeight:700, color:sc.color, textTransform:'capitalize' }}>{job.status}</Typography>
          </Box>
          <ThreeDotMenu job={job} onDelete={onDelete}/>
        </Box>
      </Box>

      <Typography sx={{ fontWeight:900, fontSize:'1rem', color:'#1a1848', mb:0.5 }}>{job.title}</Typography>

      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.6, flexWrap:'wrap' }}>
        <Typography sx={{ fontSize:'0.8rem', fontWeight:700, color:'#4a4870' }}>
          <span style={{ fontWeight:900, color:'#1a1848' }}>{job.applications || 0}</span> Applicants
        </Typography>
        <IconButton
          size="small"
          onClick={e => { e.stopPropagation(); onSave && onSave(job._id); }}
          title={isSaved ? 'Remove from saved' : 'Save job'}
          sx={{
            color: isSaved ? '#6c63ff' : '#b0aed4',
            transition:'all .18s',
            '&:hover':{ color:'#6c63ff', background:'rgba(108,99,255,0.08)', transform:'scale(1.15)' },
          }}>
          {isSaved ? <Bookmark sx={{ fontSize:14 }}/> : <BookmarkBorder sx={{ fontSize:14 }}/>}
        </IconButton>
      </Box>

      <Box sx={{ display:'flex', gap:1, mb:1.5, flexWrap:'wrap' }}>
        {salary && <Typography sx={{ fontSize:'0.72rem', color:'#6c63ff', fontWeight:600 }}>{salary}</Typography>}
        {job.location && (
          <Box sx={{ display:'flex', alignItems:'center', gap:0.3 }}>
            <LocationOn sx={{ fontSize:11, color:'#b0aed4' }}/>
            <Typography sx={{ fontSize:'0.68rem', color:'#8b8fc7' }}>{job.location}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex:1 }}/>

      <Box sx={{ display:'flex', gap:0.7, mb:0.8 }}>
        <Button size="small" startIcon={<Edit sx={{ fontSize:12 }}/>} onClick={() => onEdit(job)}
          sx={{ flex:1, textTransform:'none', fontSize:'0.7rem', fontWeight:600, borderRadius:'10px', py:0.7,
            color:'#8b8fc7', border:'1px solid rgba(200,190,255,0.4)',
            '&:hover':{ color:'#6c63ff', borderColor:'#6c63ff', background:'rgba(108,99,255,0.06)' } }}>
          Edit Job
        </Button>
        <Button size="small" startIcon={<People sx={{ fontSize:12 }}/>}
          onClick={() => onViewApplications(job)}
          sx={{ flex:1, textTransform:'none', fontSize:'0.7rem', fontWeight:700, borderRadius:'10px', py:0.7,
            background:'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(167,139,250,0.1))',
            color:'#6c63ff', border:'1px solid rgba(108,99,255,0.2)',
            '&:hover':{ background:'rgba(108,99,255,0.18)' } }}>
          View Applications
        </Button>
      </Box>

      <Box sx={{ display:'flex', gap:0.7 }}>
        {job.status === 'active' && (
          <>
            <Button size="small" startIcon={<Cancel sx={{ fontSize:11 }}/>} onClick={() => onStatus(job._id, 'closed')}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.05)',
                '&:hover':{ background:'rgba(239,68,68,0.1)' } }}>Close Job</Button>
            <Button size="small" onClick={() => onStatus(job._id, 'paused')}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#8b8fc7', border:'1px solid rgba(200,190,255,0.3)', background:'rgba(200,190,255,0.08)',
                '&:hover':{ background:'rgba(200,190,255,0.18)' } }}>Pause</Button>
          </>
        )}
        {job.status === 'closed' && (
          <>
            <Button size="small" startIcon={<Autorenew sx={{ fontSize:11 }}/>} onClick={() => onStatus(job._id, 'active')}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#22c55e', border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.05)',
                '&:hover':{ background:'rgba(34,197,94,0.1)' } }}>Re-open</Button>
            <Button size="small" startIcon={<Delete sx={{ fontSize:11 }}/>} onClick={() => onDelete(job)}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)',
                '&:hover':{ background:'rgba(239,68,68,0.1)' } }}>Delete</Button>
          </>
        )}
        {job.status === 'paused' && (
          <>
            <Button size="small" startIcon={<CheckCircle sx={{ fontSize:11 }}/>} onClick={() => onStatus(job._id, 'active')}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#22c55e', border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.05)',
                '&:hover':{ background:'rgba(34,197,94,0.1)' } }}>Activate</Button>
            <Button size="small" startIcon={<Delete sx={{ fontSize:11 }}/>} onClick={() => onDelete(job)}
              sx={{ flex:1, textTransform:'none', fontSize:'0.68rem', fontWeight:700, borderRadius:'10px', py:0.6,
                color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)',
                '&:hover':{ background:'rgba(239,68,68,0.1)' } }}>Delete</Button>
          </>
        )}
      </Box>
    </Box>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────── */
export default function PostJob() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab,       setTab]       = useState('post');
  const [step,      setStep]      = useState(0);
  const [jobs,      setJobs]      = useState([]);
  const [fetching,  setFetching]  = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM(user?.recruiterProfile?.companyName));
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [editDlg,   setEditDlg]   = useState({ open:false, job:null });
  const [editData,  setEditData]  = useState(null);
  const [delDlg,    setDelDlg]    = useState({ open:false, job:null });
  const [snack,     setSnack]     = useState({ open:false, msg:'', sev:'success' });
  const [sortOrder, setSortOrder] = useState('newest');
  const [appDrawer, setAppDrawer] = useState({ open:false, job:null });
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('elance_saved_jobs') || '[]'); } catch(_){ return []; }
  });

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => {
    if (user?.recruiterProfile?.companyName)
      setForm(p => ({ ...p, company: user.recruiterProfile.companyName }));
  }, [user]);

  const loadJobs = async () => {
    try {
      setFetching(true);
      const r = await jobService.getRecruiterJobs();
      // ✅ FIX: handle all response shapes
      const list = Array.isArray(r) ? r : (r?.jobs || r?.data || []);
      setJobs(list);
    } catch(err) {
      console.error('loadJobs error:', err);
      toast('Failed to load jobs', 'error');
    }
    finally { setFetching(false); }
  };

  const toast = (msg, sev = 'success') => setSnack({ open:true, msg, sev });
  const ch = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const addSkill = () => {
    const sk = form.newSkill.trim();
    if (sk && !form.skills.includes(sk)) setForm(p => ({ ...p, skills:[...p.skills, sk], newSkill:'' }));
  };

  const handlePost = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast('Title, description & location required', 'error'); return;
    }
    try {
      setLoading(true);
      await jobService.postJob({
        title: form.title.trim(), company: form.company.trim(), description: form.description.trim(),
        location: form.location.trim(), type: form.type, experience: form.experience,
        salaryMin: parseInt(form.salaryMin) || 0, salaryMax: parseInt(form.salaryMax) || 0,
        currency: form.currency, requiredSkills: form.skills,
      });
      await loadJobs();
      setForm(EMPTY_FORM(user?.recruiterProfile?.companyName));
      setStep(0);
      toast('Job posted! 🎉');
      setTab('myjobs');
    } catch(err) { toast(err.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  const openEdit = job => {
    setEditData({
      title: job.title || '', company: job.company || '', location: job.location || '',
      type: job.type || 'Full-time', experience: job.experience || 'Mid-level',
      salaryMin: job.salaryRange?.min ?? job.salaryMin ?? '',
      salaryMax: job.salaryRange?.max ?? job.salaryMax ?? '',
      currency: job.salaryRange?.currency ?? job.currency ?? 'USD',
      description: job.description || '',
      skills: (job.requiredSkills || []).map(s => typeof s === 'object' ? (s.name || normSkill(s)) : s),
      newSkill: '', status: job.status || 'active',
    });
    setEditDlg({ open:true, job });
  };

  const handleEditSave = async () => {
    if (!editData.title.trim()) { toast('Title is required', 'error'); return; }
    const id = editDlg.job._id;
    const payload = {
      title:       editData.title.trim(),
      company:     editData.company.trim(),
      description: editData.description.trim(),
      location:    editData.location.trim(),
      type:        editData.type,
      experience:  editData.experience,
      salaryMin:   parseInt(editData.salaryMin) || 0,
      salaryMax:   parseInt(editData.salaryMax) || 0,
      currency:    editData.currency,
      requiredSkills: editData.skills,
      status:      editData.status,
    };
    try {
      setLoading(true);
      const updated = { ...editDlg.job, ...payload,
        salaryRange:{ min:payload.salaryMin, max:payload.salaryMax, currency:payload.currency } };
      setJobs(prev => prev.map(j => j._id === id ? updated : j));
      setEditDlg({ open:false, job:null });
      setEditData(null);

      try {
        await jobService.updateJob(id, payload);
        if (editData.status !== editDlg.job.status) {
          try { await jobService.updateJobStatus(id, editData.status); } catch(_) {}
        }
        toast('Job updated! ✓');
      } catch(apiErr) {
        setJobs(prev => prev.map(j => j._id === id ? editDlg.job : j));
        toast(apiErr.message || 'Save failed — changes reverted', 'error');
      }
    } catch(err) { toast(err.message || 'Save failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    const jobId = delDlg.job._id;
    try {
      setLoading(true);

      const token = getToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      let succeeded = false;

      // Try jobService first
      try {
        await jobService.deleteJob(jobId);
        succeeded = true;
      } catch (_) {}

      // Fallback direct fetch
      if (!succeeded) {
        const endpoints = [
          `${API}/jobs/${jobId}`,
          `${API}/recruiter/jobs/${jobId}`,
        ];
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { method: 'DELETE', headers });
            if (res.ok) { succeeded = true; break; }
          } catch (_) {}
        }
      }

      if (succeeded) {
        setJobs(p => p.filter(j => j._id !== jobId));
        toast('Job deleted 🗑️');
      } else {
        toast('Failed to delete job', 'error');
      }

      setDelDlg({ open:false, job:null });
    } catch(err) {
      toast(err.message || 'Failed', 'error');
    }
    finally { setLoading(false); }
  };

  // ✅ FIX: Direct fetch with multiple endpoint fallbacks — bypasses potentially broken jobService
  const handleStatus = async (jobId, ns) => {
    // Optimistic update immediately
    setJobs(p => p.map(j => j._id === jobId ? { ...j, status: ns } : j));

    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    // Try multiple endpoint patterns backends use
    const endpoints = [
      { method: 'PATCH', url: `${API}/jobs/${jobId}/status`,        body: { status: ns } },
      { method: 'PATCH', url: `${API}/jobs/${jobId}`,               body: { status: ns } },
      { method: 'PUT',   url: `${API}/jobs/${jobId}/status`,        body: { status: ns } },
      { method: 'PUT',   url: `${API}/jobs/${jobId}`,               body: { status: ns } },
      { method: 'PATCH', url: `${API}/recruiter/jobs/${jobId}`,     body: { status: ns } },
    ];

    let succeeded = false;
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers,
          body: JSON.stringify(ep.body),
        });
        if (res.ok) {
          succeeded = true;
          toast(`Status → ${ns} ✓`);
          break;
        }
      } catch (_) {}
    }

    // Also try jobService as last resort
    if (!succeeded) {
      try {
        await jobService.updateJobStatus(jobId, ns);
        succeeded = true;
        toast(`Status → ${ns} ✓`);
      } catch (_) {}
    }

    if (!succeeded) {
      // Revert optimistic update
      await loadJobs();
      toast('Failed to update status', 'error');
    }
  };

  const handleViewApplications = (job) => {
    setAppDrawer({ open:true, job });
  };

  const toggleSave = (jobId) => {
    setSavedJobs(prev => {
      const next = prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId];
      try { localStorage.setItem('elance_saved_jobs', JSON.stringify(next)); } catch(_) {}
      toast(next.includes(jobId) ? 'Job saved ✓' : 'Removed from saved', next.includes(jobId) ? 'success' : 'info');
      return next;
    });
  };

  const filtered = (() => {
    const now = Date.now();
    let list = jobs.filter(j => {
      if (!search) return true;
      return j.title?.toLowerCase().includes(search.toLowerCase())
        || j.company?.toLowerCase().includes(search.toLowerCase());
    });
    if (filter === 'saved') list = list.filter(j => savedJobs.includes(j._id));
    else if (filter !== 'all') list = list.filter(j => j.status === filter);

    if (sortOrder === 'newest') {
      return [...list].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'week') {
      const cutoff = now - 7*24*60*60*1000;
      return [...list].filter(j => new Date(j.createdAt).getTime() < cutoff)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'month') {
      const cutoff = now - 30*24*60*60*1000;
      return [...list].filter(j => new Date(j.createdAt).getTime() < cutoff)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'closed') {
      return [...list].filter(j => j.status === 'closed')
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  })();

  const activeCount = jobs.filter(j => j.status === 'active').length;
  const closedCount = jobs.filter(j => j.status === 'closed').length;
  const draftCount  = jobs.filter(j => j.status === 'paused').length;
  const savedCount  = jobs.filter(j => savedJobs.includes(j._id)).length;
  const totalApps   = jobs.reduce((s,j) => s + (j.applications || 0), 0);

  const STEPS = ['Basic Info', 'Details', 'Preview'];

  const SortDropdown = () => (
    <FormControl size="small" sx={{ minWidth:145, flexShrink:0 }}>
      <Select value={sortOrder} onChange={e => setSortOrder(e.target.value)} MenuProps={menuP}
        sx={{ background:'rgba(255,255,255,0.72)', borderRadius:'12px',
          '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(200,190,255,0.35)' },
          '& .MuiSelect-select':{ py:'9px', px:'14px', fontSize:'0.75rem', fontWeight:700, color:'#8b8fc7' },
          '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(108,99,255,0.4)' } }}>
        <MenuItem value="newest">⇅ Newest</MenuItem>
        <MenuItem value="week">1 Week Older</MenuItem>
        <MenuItem value="month">1 Month Older</MenuItem>
        <MenuItem value="closed">Closed</MenuItem>
      </Select>
    </FormControl>
  );

  const FilterTabs = () => (
    <Box sx={{ flexShrink:0, display:'flex', alignItems:'center', gap:0.8 }}>
      {[
        { k:'all',    l:'All' },
        { k:'active', l:`Active ${activeCount}` },
        { k:'closed', l:`Closed ${closedCount}` },
        { k:'paused', l:`Draft ${draftCount}` },
        { k:'saved',  l:`Saved ${savedCount}` },
      ].map(f => (
        <Box key={f.k} onClick={() => setFilter(f.k)} sx={{
          px:'12px', py:'4px', borderRadius:'20px', cursor:'pointer', transition:'all .15s',
          ...(filter === f.k
            ? { background:'linear-gradient(135deg,#6c63ff,#8b7ff5)', boxShadow:'0 3px 10px rgba(108,99,255,0.3)' }
            : { background:'rgba(255,255,255,0.6)', border:'1px solid rgba(200,190,255,0.3)',
                '&:hover':{ background:'rgba(255,255,255,0.85)' } }),
        }}>
          <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color: filter === f.k ? '#fff' : '#8b8fc7' }}>{f.l}</Typography>
        </Box>
      ))}
    </Box>
  );

  const cardProps = {
    onEdit: openEdit,
    onDelete: (job) => setDelDlg({ open:true, job }),
    onStatus: handleStatus,
    onViewApplications: handleViewApplications,
    savedJobs,
    onSave: toggleSave,
  };

  return (
    <Box sx={{
      position:'fixed', inset:0, overflow:'hidden',
      background:'linear-gradient(135deg,#f0edff 0%,#e8e4ff 30%,#ede8ff 60%,#f5f0ff 100%)',
      fontFamily:'"Plus Jakarta Sans","DM Sans",sans-serif',
      display:'flex', flexDirection:'column',
    }}>
      {/* bg blobs */}
      {[
        { top:'-8%',  left:'60%', w:400, h:400, c:'rgba(168,148,255,0.2)' },
        { top:'50%',  left:'-5%', w:300, h:300, c:'rgba(196,181,253,0.18)' },
        { top:'60%',  left:'70%', w:280, h:280, c:'rgba(167,139,250,0.15)' },
      ].map((o,i) => (
        <Box key={i} sx={{ position:'absolute', top:o.top, left:o.left, width:o.w, height:o.h,
          borderRadius:'50%', background:o.c, filter:'blur(60px)', pointerEvents:'none', zIndex:0 }}/>
      ))}

      {/* TOP NAV */}
      <Box sx={{
        flexShrink:0, px:3, py:1.4, zIndex:10,
        background:'rgba(255,255,255,0.65)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(200,190,255,0.35)',
        display:'flex', alignItems:'center', gap:2,
        boxShadow:'0 2px 20px rgba(108,99,255,0.06)',
      }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
          <Box sx={{ width:32, height:32, borderRadius:'10px',
            background:'linear-gradient(135deg,#6c63ff,#a78bfa)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 12px rgba(108,99,255,0.35)' }}>
            <PostAdd sx={{ color:'#fff', fontSize:17 }}/>
          </Box>
          <Typography sx={{ fontWeight:900, fontSize:'1rem', color:'#2d2b5e', letterSpacing:'-0.02em' }}>ELAnce</Typography>
        </Box>
        <Box sx={{ ml:'auto', display:'flex', alignItems:'center', gap:1.5 }}>
          {[
            { label:`${jobs.length} Jobs`, color:'#6c63ff' },
            { label:`${activeCount} Active`, color:'#22c55e' },
            { label:`${totalApps} Apps`, color:'#f59e0b' },
          ].map((s,i) => (
            <Box key={i} sx={{ px:1.2, py:0.4, borderRadius:'20px',
              background:'rgba(255,255,255,0.7)', border:`1px solid ${s.color}30`,
              boxShadow:`0 2px 8px ${s.color}15` }}>
              <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:s.color }}>{s.label}</Typography>
            </Box>
          ))}
          <Button onClick={() => { setTab('post'); setStep(0); }} startIcon={<Add sx={{ fontSize:15 }}/>}
            sx={{ textTransform:'none', fontWeight:700, fontSize:'0.8rem', borderRadius:'12px', px:2, py:0.9,
              background:'linear-gradient(135deg,#6c63ff,#a78bfa)', color:'#fff',
              boxShadow:'0 4px 14px rgba(108,99,255,0.35)',
              '&:hover':{ background:'linear-gradient(135deg,#5a52e0,#9370db)', transform:'translateY(-1px)' },
              transition:'all .2s' }}>
            Post New Job
          </Button>
        </Box>
      </Box>

      {/* PAGE HEADER */}
      <Box sx={{ flexShrink:0, px:3, pt:2, pb:1.5, zIndex:1 }}>
        <Typography sx={{ fontWeight:900, fontSize:'1.6rem', color:'#1a1848', letterSpacing:'-0.03em', lineHeight:1 }}>
          Job Management
        </Typography>
        <Typography sx={{ fontSize:'0.78rem', color:'#8b8fc7', mt:0.4 }}>
          Create new openings or manage your posted jobs
        </Typography>
        <Box sx={{ display:'flex', gap:0, mt:1.8, background:'rgba(255,255,255,0.6)', borderRadius:'14px', p:0.5,
          border:'1px solid rgba(200,190,255,0.3)', width:'fit-content', boxShadow:'0 2px 12px rgba(108,99,255,0.08)' }}>
          {[
            { key:'post',   label:'Post Job', icon:<PostAdd sx={{ fontSize:14 }}/> },
            { key:'myjobs', label:'My Jobs',  icon:<Work sx={{ fontSize:14 }}/>, badge:jobs.length },
          ].map(t => (
            <Button key={t.key} onClick={() => setTab(t.key)} startIcon={t.icon}
              sx={{ textTransform:'none', fontSize:'0.8rem', fontWeight:700, borderRadius:'10px', px:2, py:0.8, minWidth:110, transition:'all .2s',
                ...(tab === t.key
                  ? { background:'linear-gradient(135deg,#6c63ff,#8b7ff5)', color:'#fff', boxShadow:'0 4px 14px rgba(108,99,255,0.3)' }
                  : { color:'#8b8fc7', background:'transparent', '&:hover':{ color:'#6c63ff', background:'rgba(108,99,255,0.06)' } }),
              }}>
              {t.label}
              {t.badge > 0 && (
                <Box sx={{ ml:0.6, px:'7px', borderRadius:'99px',
                  background: tab === t.key ? 'rgba(255,255,255,0.25)' : 'rgba(108,99,255,0.15)',
                  fontSize:'0.58rem', color: tab === t.key ? '#fff' : '#6c63ff', fontWeight:800, lineHeight:'16px' }}>
                  {t.badge}
                </Box>
              )}
            </Button>
          ))}
        </Box>
      </Box>

      {/* BODY */}
      <Box sx={{ flex:1, overflow:'hidden', px:3, pb:2, zIndex:1, display:'flex', gap:2, minHeight:0 }}>

        {/* ══ POST JOB TAB ══ */}
        {tab === 'post' && (
          <>
            <Box sx={{
              width:400, flexShrink:0,
              background:'rgba(255,255,255,0.72)', backdropFilter:'blur(20px)',
              borderRadius:'20px', border:'1px solid rgba(200,190,255,0.4)',
              boxShadow:'0 8px 32px rgba(108,99,255,0.1)',
              display:'flex', flexDirection:'column',
              height:'100%', minHeight:0,
            }}>
              {/* Steps header */}
              <Box sx={{ px:2.5, py:1.8, borderBottom:'1px solid rgba(200,190,255,0.25)',
                display:'flex', alignItems:'center', gap:0.5, flexShrink:0, background:'rgba(255,255,255,0.5)',
                borderRadius:'20px 20px 0 0' }}>
                {STEPS.map((s,i) => (
                  <React.Fragment key={s}>
                    <Typography onClick={() => i <= step && setStep(i)} sx={{
                      fontSize:'0.72rem', fontWeight: i === step ? 800 : 600,
                      color: i === step ? '#6c63ff' : i < step ? '#a78bfa' : '#b0aed4',
                      cursor: i <= step ? 'pointer' : 'default', transition:'color .2s',
                    }}>{s}</Typography>
                    {i < STEPS.length - 1 && <NavigateNext sx={{ fontSize:14, color: i < step ? '#a78bfa' : '#d4d0f0' }}/>}
                  </React.Fragment>
                ))}
                <Box sx={{ ml:'auto', display:'flex', gap:0.3 }}>
                  {[0,1,2].map(d => <Box key={d} sx={{ width:6, height:6, borderRadius:'50%',
                    background: d <= step ? '#6c63ff' : 'rgba(180,170,230,0.35)' }}/>)}
                </Box>
              </Box>

              {/* Form body */}
              <Box sx={{ flex:1, overflow:'auto', px:2.5, py:2, minHeight:0,
                '&::-webkit-scrollbar':{ width:4 },
                '&::-webkit-scrollbar-thumb':{ background:'rgba(180,170,230,0.4)', borderRadius:99 } }}>

                {step === 0 && (
                  <Box sx={{ display:'flex', flexDirection:'column', gap:1.6 }}>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Job Title</Typography>
                      <TextField fullWidth size="small" placeholder="e.g. Full Stack JavaScript Developer" value={form.title} onChange={ch('title')} sx={fSx()}/>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Company Name</Typography>
                      <TextField fullWidth size="small" placeholder="Your company name" value={form.company} onChange={ch('company')} sx={fSx()}/>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Location</Typography>
                      <TextField fullWidth size="small" placeholder="City, Country or Remote" value={form.location} onChange={ch('location')} sx={fSx()}/>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Job Type & Experience</Typography>
                      <Box sx={{ display:'flex', gap:1 }}>
                        <FormControl size="small" sx={{ minWidth:110 }}>
                          <Select value={form.type} onChange={ch('type')} MenuProps={menuP}
                            sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                              '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                              '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                            {JOB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ flex:1 }}>
                          <Select value={form.experience} onChange={ch('experience')} MenuProps={menuP}
                            sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                              '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                              '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                            {EXP_LEVELS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Required Skills</Typography>
                      <Box sx={{ display:'flex', gap:0.6, flexWrap:'wrap', mb:0.8 }}>
                        {form.skills.map((s,i) => (
                          <Chip key={s} label={s} size="small"
                            onDelete={() => setForm(p => ({ ...p, skills:p.skills.filter(x => x !== s) }))}
                            sx={{ fontSize:'0.65rem', fontWeight:700, borderRadius:'8px',
                              background:`${skillColors[i%skillColors.length]}18`, color:skillColors[i%skillColors.length],
                              border:`1px solid ${skillColors[i%skillColors.length]}30`,
                              '& .MuiChip-deleteIcon':{ color:skillColors[i%skillColors.length], opacity:0.6 } }}/>
                        ))}
                      </Box>
                      <TextField fullWidth size="small" placeholder="Type skill and press Enter"
                        value={form.newSkill} onChange={ch('newSkill')}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        sx={fSx()} InputProps={{ endAdornment:(
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={addSkill} sx={{ color:'#6c63ff' }}><Add sx={{ fontSize:16 }}/></IconButton>
                          </InputAdornment>
                        )}}/>
                    </Box>
                  </Box>
                )}

                {step === 1 && (
                  <Box sx={{ display:'flex', flexDirection:'column', gap:1.6 }}>
                    <Box sx={{ display:'flex', gap:1 }}>
                      <Box sx={{ flex:1 }}>
                        <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Currency</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={form.currency} onChange={ch('currency')} MenuProps={menuP}
                            sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                              '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                              '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                            {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ flex:1 }}>
                        <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Min Salary</Typography>
                        <TextField fullWidth size="small" type="number" placeholder="80,000" value={form.salaryMin} onChange={ch('salaryMin')} sx={fSx()}/>
                      </Box>
                      <Box sx={{ flex:1 }}>
                        <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Max Salary</Typography>
                        <TextField fullWidth size="small" type="number" placeholder="120,000" value={form.salaryMax} onChange={ch('salaryMax')} sx={fSx()}/>
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Description</Typography>
                      <TextField fullWidth size="small" multiline rows={8}
                        placeholder="Describe the role, responsibilities, and ideal candidate in detail..."
                        value={form.description} onChange={ch('description')} sx={fSx()}/>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Experience Level</Typography>
                      <FormControl fullWidth size="small">
                        <Select value={form.experience} onChange={ch('experience')} MenuProps={menuP}
                          sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                            '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                            '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                          {EXP_LEVELS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                )}

                {step === 2 && (
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <Box sx={{ p:2, background:'rgba(108,99,255,0.05)', borderRadius:'14px', border:'1px solid rgba(108,99,255,0.12)' }}>
                      <Typography sx={{ fontWeight:900, fontSize:'1.1rem', color:'#1a1848', mb:0.3 }}>{form.title || 'Untitled Position'}</Typography>
                      <Typography sx={{ fontSize:'0.8rem', color:'#8b8fc7', mb:1.5 }}>{form.company} · {form.location}</Typography>
                      {form.salaryMin && form.salaryMax && (
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:1 }}>
                          <Typography sx={{ fontSize:'0.82rem', fontWeight:700, color:'#6c63ff' }}>
                            {getCurrencySymbol(form.currency)}{Number(form.salaryMin).toLocaleString()} – {getCurrencySymbol(form.currency)}{Number(form.salaryMax).toLocaleString()} / year
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display:'flex', gap:0.6, flexWrap:'wrap', mb:1.5 }}>
                        {[form.type, form.experience].map((t,i) => (
                          <Box key={i} sx={{ px:'10px', py:'3px', borderRadius:'8px', background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)' }}>
                            <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:'#6c63ff' }}>{t}</Typography>
                          </Box>
                        ))}
                      </Box>
                      <Typography sx={{ fontSize:'0.78rem', color:'#4a4870', lineHeight:1.7, mb:1.5 }}>{form.description || 'No description provided.'}</Typography>
                      {form.skills.length > 0 && (
                        <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}>
                          {form.skills.map((s,i) => (
                            <Box key={s} sx={{ px:'8px', py:'2px', borderRadius:'7px',
                              background:`${skillColors[i%skillColors.length]}15`,
                              border:`1px solid ${skillColors[i%skillColors.length]}30` }}>
                              <Typography sx={{ fontSize:'0.62rem', fontWeight:700, color:skillColors[i%skillColors.length] }}>{s}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Form footer */}
              <Box sx={{ flexShrink:0, px:2.5, py:2, borderTop:'1px solid rgba(200,190,255,0.25)',
                background:'rgba(255,255,255,0.5)', borderRadius:'0 0 20px 20px' }}>
                {step < 2 ? (
                  <Button fullWidth onClick={() => setStep(s => s + 1)} endIcon={<NavigateNext/>}
                    sx={{ textTransform:'none', fontWeight:800, fontSize:'0.88rem', borderRadius:'12px', py:1.2,
                      background:'linear-gradient(135deg,#6c63ff,#a78bfa)', color:'#fff',
                      boxShadow:'0 6px 20px rgba(108,99,255,0.3)',
                      '&:hover':{ background:'linear-gradient(135deg,#5a52e0,#9370db)', transform:'translateY(-1px)' },
                      transition:'all .2s' }}>
                    Next: {STEPS[step + 1]}
                  </Button>
                ) : (
                  <Button fullWidth onClick={handlePost} disabled={loading}
                    sx={{ textTransform:'none', fontWeight:800, fontSize:'0.88rem', borderRadius:'12px', py:1.2,
                      background:'linear-gradient(135deg,#6c63ff,#a78bfa)', color:'#fff',
                      boxShadow:'0 6px 20px rgba(108,99,255,0.3)',
                      '&:hover':{ background:'linear-gradient(135deg,#5a52e0,#9370db)' },
                      '&:disabled':{ background:'rgba(180,170,230,0.3)', color:'#b0aed4', boxShadow:'none' } }}>
                    {loading ? <CircularProgress size={18} color="inherit"/> : '✦ Publish Job'}
                  </Button>
                )}
                {step > 0 && (
                  <Button fullWidth onClick={() => setStep(s => s - 1)}
                    sx={{ mt:0.8, textTransform:'none', fontSize:'0.78rem', color:'#8b8fc7', fontWeight:600,
                      '&:hover':{ color:'#6c63ff', background:'rgba(108,99,255,0.05)' } }}>
                    ← Back
                  </Button>
                )}
              </Box>
            </Box>

            {/* RIGHT: job grid */}
            <Box sx={{ flex:1, minHeight:0, height:'100%', display:'flex', flexDirection:'column', gap:1.5, overflow:'hidden' }}>
              <Box sx={{ flexShrink:0, display:'flex', gap:1, alignItems:'center' }}>
                <Box sx={{ flex:1, position:'relative' }}>
                  <Search sx={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#b0aed4' }}/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
                    style={{ width:'100%', paddingLeft:36, paddingRight:16, paddingTop:10, paddingBottom:10,
                      background:'rgba(255,255,255,0.72)', border:'1px solid rgba(200,190,255,0.35)',
                      borderRadius:12, fontSize:'0.82rem', color:'#2d2b5e', outline:'none',
                      fontFamily:'inherit', backdropFilter:'blur(10px)', boxSizing:'border-box' }}/>
                </Box>
                <SortDropdown/>
              </Box>
              <FilterTabs/>
              <Box sx={{ flex:1, minHeight:0, overflow:'auto',
                '&::-webkit-scrollbar':{ width:6 },
                '&::-webkit-scrollbar-thumb':{ background:'rgba(108,99,255,0.35)', borderRadius:99 },
                '&::-webkit-scrollbar-track':{ background:'rgba(200,190,255,0.15)', borderRadius:99 } }}>
                {fetching ? (
                  <Box sx={{ display:'flex', justifyContent:'center', mt:4 }}><CircularProgress sx={{ color:'#6c63ff' }}/></Box>
                ) : filtered.length === 0 ? (
                  <Box sx={{ py:6, display:'flex', flexDirection:'column', alignItems:'center', gap:1.5 }}>
                    <Box sx={{ width:64, height:64, borderRadius:'20px', background:'rgba(108,99,255,0.08)',
                      border:'1px solid rgba(108,99,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Work sx={{ fontSize:28, color:'rgba(108,99,255,0.3)' }}/>
                    </Box>
                    <Typography sx={{ color:'#b0aed4', fontWeight:700, fontSize:'0.9rem' }}>No jobs yet</Typography>
                    <Typography sx={{ color:'#c4c0e8', fontSize:'0.75rem' }}>Posted jobs will appear here</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:1.5, pb:1, alignItems:'stretch' }}>
                    {filtered.map((job, idx) => <JobCard key={job._id} job={job} idx={idx} {...cardProps}/>)}
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}

        {/* ══ MY JOBS TAB ══ */}
        {tab === 'myjobs' && (
          <Box sx={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:1.5, overflow:'hidden' }}>
            <Box sx={{ flexShrink:0, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1.2 }}>
              {[
                { label:'Total Jobs', val:jobs.length,  color:'#6c63ff', border:'rgba(108,99,255,0.2)'  },
                { label:'Active',     val:activeCount,  color:'#22c55e', border:'rgba(34,197,94,0.2)'   },
                { label:'Drafts',     val:draftCount,   color:'#f59e0b', border:'rgba(245,158,11,0.2)'  },
                { label:'Total Apps', val:totalApps,    color:'#a78bfa', border:'rgba(167,139,250,0.2)' },
              ].map(s => (
                <Box key={s.label} sx={{ background:'rgba(255,255,255,0.72)', backdropFilter:'blur(16px)',
                  borderRadius:'16px', border:`1px solid ${s.border}`, p:'12px 16px', boxShadow:`0 4px 16px ${s.color}10` }}>
                  <Typography sx={{ fontSize:'1.8rem', fontWeight:900, color:'#1a1848', lineHeight:1, letterSpacing:'-0.04em' }}>{s.val}</Typography>
                  <Typography sx={{ fontSize:'0.62rem', fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.07em', mt:0.5 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ flexShrink:0, display:'flex', gap:1, alignItems:'center' }}>
              <Box sx={{ flex:1, position:'relative' }}>
                <Search sx={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#b0aed4' }}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
                  style={{ width:'100%', paddingLeft:36, paddingRight:16, paddingTop:10, paddingBottom:10,
                    background:'rgba(255,255,255,0.72)', border:'1px solid rgba(200,190,255,0.35)',
                    borderRadius:12, fontSize:'0.82rem', color:'#2d2b5e', outline:'none',
                    fontFamily:'inherit', backdropFilter:'blur(10px)', boxSizing:'border-box' }}/>
              </Box>
              <SortDropdown/>
            </Box>
            <FilterTabs/>
            <Box sx={{ flex:1, minHeight:0, overflow:'auto',
              '&::-webkit-scrollbar':{ width:6 },
              '&::-webkit-scrollbar-thumb':{ background:'rgba(108,99,255,0.35)', borderRadius:99 },
              '&::-webkit-scrollbar-track':{ background:'rgba(200,190,255,0.15)', borderRadius:99 } }}>
              {fetching ? (
                <Box sx={{ display:'flex', justifyContent:'center', mt:4 }}><CircularProgress sx={{ color:'#6c63ff' }}/></Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:1.5 }}>
                  <Work sx={{ fontSize:40, color:'rgba(180,170,230,0.5)' }}/>
                  <Typography sx={{ color:'#b0aed4', fontWeight:700 }}>No jobs found</Typography>
                  <Button onClick={() => setTab('post')} size="small"
                    sx={{ textTransform:'none', color:'#6c63ff', fontSize:'0.75rem',
                      border:'1px solid rgba(108,99,255,0.3)', borderRadius:'10px', px:2,
                      '&:hover':{ background:'rgba(108,99,255,0.08)' } }}>
                    Post a job →
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:1.5, pb:1, alignItems:'stretch' }}>
                  {filtered.map((job, idx) => <JobCard key={job._id} job={job} idx={idx} {...cardProps}/>)}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* ══ APPLICATIONS DRAWER ══ */}
      <ApplicationsDrawer
        open={appDrawer.open}
        onClose={() => setAppDrawer({ open:false, job:null })}
        job={appDrawer.job}
      />

      {/* ══ EDIT DIALOG ══ */}
      <Dialog open={editDlg.open} onClose={() => { setEditDlg({ open:false, job:null }); setEditData(null); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:'20px', background:'rgba(245,242,255,0.97)',
          border:'1px solid rgba(200,190,255,0.4)', boxShadow:'0 32px 80px rgba(108,99,255,0.2)', overflow:'hidden' }}}>
        <Box sx={{ height:3, background:'linear-gradient(90deg,#6c63ff,#a78bfa)' }}/>
        <DialogTitle sx={{ fontWeight:800, fontSize:'0.92rem', color:'#1a1848',
          borderBottom:'1px solid rgba(200,190,255,0.3)', display:'flex', alignItems:'center', gap:1, py:1.8 }}>
          <Edit sx={{ color:'#6c63ff', fontSize:16 }}/>
          Edit: <span style={{ color:'#6c63ff' }}>{editDlg.job?.title}</span>
          <IconButton size="small" onClick={() => { setEditDlg({ open:false, job:null }); setEditData(null); }} sx={{ ml:'auto', color:'#b0aed4' }}>
            <Close sx={{ fontSize:15 }}/>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p:2.5 }}>
          {editData && (
            <Box sx={{ display:'flex', flexDirection:'column', gap:1.8, mt:0.5 }}>
              <TextField fullWidth size="small" label="Job Title *" value={editData.title}
                onChange={e => setEditData(p => ({ ...p, title:e.target.value }))} sx={fSx()}/>
              <Box sx={{ display:'flex', gap:1.5 }}>
                <TextField fullWidth size="small" label="Company" value={editData.company}
                  onChange={e => setEditData(p => ({ ...p, company:e.target.value }))} sx={fSx()}/>
                <TextField fullWidth size="small" label="Location" value={editData.location}
                  onChange={e => setEditData(p => ({ ...p, location:e.target.value }))} sx={fSx()}/>
              </Box>
              <Box sx={{ display:'flex', gap:1.5 }}>
                <FormControl fullWidth size="small">
                  <Select value={editData.type || 'Full-time'} onChange={e => setEditData(p => ({ ...p, type:e.target.value }))} MenuProps={menuP}
                    sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                      '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                      '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                    {JOB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <Select value={editData.experience || 'Mid-level'} onChange={e => setEditData(p => ({ ...p, experience:e.target.value }))} MenuProps={menuP}
                    sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                      '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                      '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                    {EXP_LEVELS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</Typography>
                <Box sx={{ display:'flex', gap:0.8 }}>
                  {STATUS_OPT.map(s => {
                    const cfg = STATUS_CFG[s];
                    const active = editData.status === s;
                    return (
                      <Box key={s} onClick={() => setEditData(p => ({ ...p, status:s }))}
                        sx={{ flex:1, py:'8px', borderRadius:'10px', cursor:'pointer', textAlign:'center',
                          border:`1.5px solid ${active ? cfg.color : cfg.border}`,
                          background: active ? cfg.bg : 'rgba(255,255,255,0.5)',
                          transition:'all .15s', '&:hover':{ background:cfg.bg } }}>
                        <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color:active ? cfg.color : '#8b8fc7', textTransform:'capitalize' }}>{s}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <TextField fullWidth size="small" multiline rows={4} label="Description" value={editData.description}
                onChange={e => setEditData(p => ({ ...p, description:e.target.value }))} sx={fSx()}/>
              <Box sx={{ display:'flex', gap:1 }}>
                <FormControl size="small" sx={{ width:100 }}>
                  <Select value={editData.currency} onChange={e => setEditData(p => ({ ...p, currency:e.target.value }))} MenuProps={menuP}
                    sx={{ background:'rgba(255,255,255,0.7)', borderRadius:'12px',
                      '& .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(180,170,230,0.35)' },
                      '& .MuiSelect-select':{ color:'#2d2b5e', fontSize:'0.78rem', py:'8px' } }}>
                    {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label="Min Salary" type="number" value={editData.salaryMin}
                  onChange={e => setEditData(p => ({ ...p, salaryMin:e.target.value }))} sx={fSx()}/>
                <TextField fullWidth size="small" label="Max Salary" type="number" value={editData.salaryMax}
                  onChange={e => setEditData(p => ({ ...p, salaryMax:e.target.value }))} sx={fSx()}/>
              </Box>
              <Box>
                <Typography sx={{ fontSize:'0.7rem', fontWeight:700, color:'#8b8fc7', mb:0.7, textTransform:'uppercase', letterSpacing:'0.06em' }}>Skills</Typography>
                <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', mb:0.8 }}>
                  {editData.skills.map((s,i) => (
                    <Chip key={s} label={s} size="small"
                      onDelete={() => setEditData(p => ({ ...p, skills:p.skills.filter(x => x !== s) }))}
                      sx={{ fontSize:'0.65rem', fontWeight:700, borderRadius:'8px',
                        background:`${skillColors[i%skillColors.length]}18`, color:skillColors[i%skillColors.length],
                        border:`1px solid ${skillColors[i%skillColors.length]}30` }}/>
                  ))}
                </Box>
                <TextField fullWidth size="small" placeholder="Add skill and press Enter"
                  value={editData.newSkill || ''}
                  onChange={e => setEditData(p => ({ ...p, newSkill:e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const sk = editData.newSkill?.trim();
                      if (sk && !editData.skills.includes(sk))
                        setEditData(p => ({ ...p, skills:[...p.skills, sk], newSkill:'' }));
                    }
                  }}
                  sx={fSx()} InputProps={{ endAdornment:(
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => {
                        const sk = editData.newSkill?.trim();
                        if (sk && !editData.skills.includes(sk))
                          setEditData(p => ({ ...p, skills:[...p.skills, sk], newSkill:'' }));
                      }} sx={{ color:'#6c63ff' }}><Add sx={{ fontSize:16 }}/></IconButton>
                    </InputAdornment>
                  )}}/>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px:2.5, pb:2.5, borderTop:'1px solid rgba(200,190,255,0.3)', gap:1 }}>
          <Button onClick={() => { setEditDlg({ open:false, job:null }); setEditData(null); }}
            sx={{ textTransform:'none', color:'#8b8fc7', borderRadius:'10px', px:2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={loading}
            sx={{ textTransform:'none', fontWeight:700, borderRadius:'12px', px:3,
              background:'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow:'0 4px 16px rgba(108,99,255,0.3)',
              '&:hover':{ background:'linear-gradient(135deg,#5a52e0,#9370db)' },
              '&:disabled':{ background:'rgba(180,170,230,0.3)', boxShadow:'none' } }}>
            {loading ? <CircularProgress size={16} color="inherit"/> : '✦ Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ DELETE DIALOG ══ */}
      <Dialog open={delDlg.open} onClose={() => setDelDlg({ open:false, job:null })}
        PaperProps={{ sx:{ borderRadius:'18px', background:'rgba(245,242,255,0.97)',
          border:'1px solid rgba(239,68,68,0.2)', boxShadow:'0 24px 60px rgba(239,68,68,0.15)', overflow:'hidden' }}}>
        <Box sx={{ height:3, background:'linear-gradient(90deg,#ef4444,#fca5a5)' }}/>
        <DialogTitle sx={{ fontWeight:800, fontSize:'0.92rem', color:'#1a1848', py:2 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ color:'#6b6b8e', fontSize:'0.85rem' }}>
            Delete <strong style={{ color:'#1a1848' }}>{delDlg.job?.title}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p:2, gap:1, borderTop:'1px solid rgba(200,190,255,0.25)' }}>
          <Button onClick={() => setDelDlg({ open:false, job:null })} sx={{ textTransform:'none', color:'#8b8fc7', borderRadius:'10px' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} disabled={loading}
            sx={{ textTransform:'none', fontWeight:700, borderRadius:'10px',
              background:'linear-gradient(135deg,#ef4444,#fca5a5)', boxShadow:'0 4px 12px rgba(239,68,68,0.3)',
              '&:hover':{ background:'linear-gradient(135deg,#dc2626,#f87171)' } }}>
            {loading ? <CircularProgress size={16} color="inherit"/> : 'Delete Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(p => ({ ...p, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
        <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open:false }))}
          sx={{ fontSize:'0.75rem', borderRadius:'14px',
            background: snack.sev === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            backdropFilter:'blur(12px)',
            border:`1px solid ${snack.sev === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            '& .MuiAlert-icon':{ color: snack.sev === 'success' ? '#22c55e' : '#ef4444' },
            '& .MuiAlert-message':{ color:'#1a1848', fontWeight:600 } }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
