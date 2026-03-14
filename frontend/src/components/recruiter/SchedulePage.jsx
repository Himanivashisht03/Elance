import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Chip, Avatar, IconButton, alpha, CircularProgress,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  CalendarMonth, Schedule as ScheduleIcon, PersonAdd, Groups,
  ArrowBackIos, ArrowForwardIos, AccessTime, CheckCircle, Event,
  PlaylistAddCheck, Bolt, Close, Delete, Search,
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { jobService } from '../../services/JobService';
import { authService } from '../../services/AuthService';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ─── CONSTANTS ─────────────────────────── */
const SLOT_GAP  = 40;
const DAYS      = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS_S  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ACCENTS   = ['#6366f1','#0891b2','#059669','#db2777','#d97706','#7c3aed','#0d9488'];
const AV_COLORS = ['#6366f1','#0891b2','#059669','#db2777','#d97706','#7c3aed'];
const LS_KEY    = 'elance_scheduled_interviews';

/* ─── HELPERS ───────────────────────────── */
const pad2    = n  => String(n).padStart(2,'0');
const addMins = (h,m,add) => { const t = h*60+m+add; return [Math.floor(t/60)%24, t%60]; };
const fmtTime = (h,m) => `${pad2(h)}:${pad2(m)}`;
const avColor = i  => AV_COLORS[i % AV_COLORS.length];
const grpColor= gi => ACCENTS[gi % ACCENTS.length];
const fmtDate = d  => {
  if (!d) return '—';
  const dt = new Date(d+'T00:00:00');
  return dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
};
const getInitials = name => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
};

/* ─── AUTH HELPER ───────────────────────── */
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

/* ─── STATUS CONFIG ─────────────────────── */
const STATUS_CFG = {
  shortlisted: { bg:'#d1fae5', color:'#059669', border:'#6ee7b7', dot:'#059669' },
  reviewed:    { bg:'#ede9fe', color:'#7c3aed', border:'#c4b5fd', dot:'#7c3aed' },
  accepted:    { bg:'#dbeafe', color:'#2563eb', border:'#93c5fd', dot:'#2563eb' },
  pending:     { bg:'#fef3c7', color:'#d97706', border:'#fcd34d', dot:'#d97706' },
  rejected:    { bg:'#fee2e2', color:'#ef4444', border:'#fca5a5', dot:'#ef4444' },
};

/* ─── FIELD STYLE ───────────────────────── */
const fSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor:'#f8fafc', fontSize:'0.78rem', borderRadius:'8px',
    '& fieldset':{ borderColor:'#e2e8f0' },
    '&:hover fieldset':{ borderColor:'#6366f1' },
    '&.Mui-focused fieldset':{ borderColor:'#6366f1', boxShadow:'0 0 0 3px rgba(99,102,241,0.1)' },
  },
  '& .MuiInputLabel-root':{ fontSize:'0.75rem', color:'#64748b' },
  '& .MuiInputLabel-root.Mui-focused':{ color:'#6366f1', fontWeight:600 },
  '& .MuiSelect-select':{ color:'#0f172a' },
  '& input':{ color:'#0f172a' },
  '& textarea':{ color:'#0f172a' },
};

/* ════════════════════════════════════════════
   COMPACT MINI CALENDAR
════════════════════════════════════════════ */
const MiniCalendar = ({ events, onDaySelect, selectedDay, currentMonth, onMonthChange }) => {
  const year    = currentMonth.getFullYear();
  const month   = currentMonth.getMonth();
  const firstDay= new Date(year, month, 1).getDay();
  const daysInM = new Date(year, month+1, 0).getDate();
  const today   = new Date();

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInM; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const evForDay = d => {
    if (!d) return [];
    return events.filter(e => e.date === `${year}-${pad2(month+1)}-${pad2(d)}`);
  };

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.8 }}>
        <IconButton size="small" onClick={() => onMonthChange(-1)}
          sx={{ color:'#64748b', p:0.3, borderRadius:'6px', '&:hover':{ backgroundColor:'#f1f5f9' } }}>
          <ArrowBackIos sx={{ fontSize:10 }}/>
        </IconButton>
        <Typography sx={{ fontWeight:800, fontSize:'0.76rem', color:'#0f172a' }}>
          {MONTHS_S[month]} {year}
        </Typography>
        <IconButton size="small" onClick={() => onMonthChange(1)}
          sx={{ color:'#64748b', p:0.3, borderRadius:'6px', '&:hover':{ backgroundColor:'#f1f5f9' } }}>
          <ArrowForwardIos sx={{ fontSize:10 }}/>
        </IconButton>
      </Box>

      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', mb:0.3 }}>
        {DAYS.map(d => (
          <Typography key={d} sx={{ textAlign:'center', fontSize:'0.5rem', fontWeight:700,
            color:'#94a3b8', textTransform:'uppercase', py:0.2 }}>{d}</Typography>
        ))}
      </Box>

      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((d, i) => {
          const evs     = evForDay(d);
          const dateKey = d ? `${year}-${pad2(month+1)}-${pad2(d)}` : null;
          const isToday = d && today.getDate()===d && today.getMonth()===month && today.getFullYear()===year;
          const isSel   = dateKey && selectedDay===dateKey;
          return (
            <Box key={i} onClick={() => d && onDaySelect(isSel ? null : dateKey)}
              sx={{
                height:26, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                borderRadius:'6px', cursor: d ? 'pointer' : 'default',
                transition:'all .1s',
                backgroundColor: isSel ? '#6366f1' : isToday ? '#eef2ff' : 'transparent',
                position:'relative',
                '&:hover': d ? { backgroundColor: isSel ? '#4f46e5' : '#f1f5f9' } : {},
              }}>
              {d && (
                <>
                  <Typography sx={{
                    fontSize:'0.63rem', fontWeight: isToday||isSel ? 800 : 500,
                    color: isSel ? '#fff' : isToday ? '#4f46e5' : '#374151', lineHeight:1,
                  }}>{d}</Typography>
                  {evs.length > 0 && (
                    <Box sx={{
                      position:'absolute', bottom:2,
                      width:4, height:4, borderRadius:'50%',
                      backgroundColor: isSel ? 'rgba(255,255,255,0.8)' : (evs[0].color||'#6366f1'),
                    }}/>
                  )}
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

function buildInterviewMessage({ candidateName, role, date, time, iType, link, notes, group, recruiterName }) {
  const dateStr = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '';
  const lines = [
    `Hi ${candidateName} 👋`,
    ``,
    `Interview invite:`,
    `📋 Role: ${role}`,
    `📅 Date: ${dateStr}`,
    `🕐 Time: ${time}${group ? ` (Group ${group})` : ''}`,
    `🎙️ Type: ${iType}`,
    link ? `🔗 Link: ${link}` : '',
    notes ? `📝 Notes: ${notes}` : '',
    ``,
    `Reply to confirm.`,
    `${recruiterName}`,
  ];
  return lines.filter(Boolean).join('\n');
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
const SchedulePage = () => {
  const { user } = useContext(AuthContext);

  const [mode,         setMode]         = useState('individual');
  const [jobs,         setJobs]         = useState([]);
  const [selectedJob,  setSelectedJob]  = useState('all');
  const [candidates,   setCandidates]   = useState([]);
  const [candLoading,  setCandLoading]  = useState(false);
  const [candSearch,   setCandSearch]   = useState('');
  const [selCands,     setSelCands]     = useState([]);
  const [date,         setDate]         = useState('');
  const [startTime,    setStartTime]    = useState('09:00');
  const [iType,        setIType]        = useState('Video Call');
  const [link,         setLink]         = useState('');
  const [notes,        setNotes]        = useState('');
  const [groupSize,    setGroupSize]    = useState(4);
  const [previewSlots, setPreviewSlots] = useState([]);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [snack,        setSnack]        = useState({ open:false, message:'', severity:'success' });
  const [calMonth,     setCalMonth]     = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [upcomingRole, setUpcomingRole] = useState('All');

  // ── Load from localStorage on mount ──
  const [scheduled, setScheduled] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── Persist to localStorage whenever scheduled changes ──
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(scheduled));
    } catch(e) { console.warn('localStorage save failed:', e); }
  }, [scheduled]);

  useEffect(() => {
    jobService.getRecruiterJobs?.().then(r => setJobs(r||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!user) return;
    setCandLoading(true);
    setSelCands([]);

    let url = `${API}/analytics/candidates?timeFilter=All%20Time`;
    if (selectedJob && selectedJob !== 'all') {
      const job = jobs.find(j => j._id === selectedJob);
      if (job?.title) url += `&role=${encodeURIComponent(job.title)}`;
    }

    fetch(url, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const raw = data?.candidates || [];
        const eligible = raw.filter(c =>
          ['shortlisted','reviewed','accepted'].includes(c.status?.toLowerCase())
        ).map(c => ({
          _id: c._id, name: c.name||'Unknown', role: c.role||'Applicant',
          email: c.email||'', match: c.match||0,
          status: c.status||'shortlisted', initials: getInitials(c.name),
        }));
        eligible.sort((a,b) => (b.match||0)-(a.match||0));
        setCandidates(eligible);
      })
      .catch(() => setCandidates([]))
      .finally(() => setCandLoading(false));
  }, [user, selectedJob, jobs]);

  const filteredCandidates = useMemo(() => {
    if (!candSearch.trim()) return candidates;
    const q = candSearch.toLowerCase();
    return candidates.filter(c =>
      c.name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q)
    );
  }, [candidates, candSearch]);

  const toggleCand = id =>
    setSelCands(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const filtAllSel = filteredCandidates.length > 0 &&
    filteredCandidates.every(c => selCands.includes(c._id));

  const toggleAllFiltered = () => {
    const ids = filteredCandidates.map(c => c._id);
    if (filtAllSel) setSelCands(p => p.filter(id => !ids.includes(id)));
    else setSelCands(p => [...new Set([...p, ...ids])]);
  };

  const generateSlots = () => {
    if (!date || !startTime || selCands.length===0) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const slots = [];
    if (mode === 'individual') {
      selCands.forEach((id, i) => {
        const [h,m] = addMins(sh,sm,i*SLOT_GAP);
        const c = candidates.find(x=>x._id===id);
        slots.push({ candidateId:id, candidateName:c?.name, role:c?.role, initials:c?.initials, time:fmtTime(h,m), date, group:null });
      });
    } else {
      const groups = [];
      for (let i=0; i<selCands.length; i+=groupSize) groups.push(selCands.slice(i,i+groupSize));
      groups.forEach((grp,gi) => {
        const [h,m] = addMins(sh,sm,gi*SLOT_GAP);
        grp.forEach(id => {
          const c = candidates.find(x=>x._id===id);
          slots.push({ candidateId:id, candidateName:c?.name, role:c?.role, initials:c?.initials, time:fmtTime(h,m), date, group:gi+1 });
        });
      });
    }
    setPreviewSlots(slots);
    setConfirmOpen(true);
  };

  const confirmSchedule = async () => {
    const color = ACCENTS[scheduled.length % ACCENTS.length];
    const events = previewSlots.map(s => ({ ...s, type: iType, link, notes, color }));

    setScheduled(p => [...p, ...events]);
    setConfirmOpen(false);
    setPreviewSlots([]);
    setSelCands([]);
    setDate('');

    let sent = 0;
    try {
      const slots = events.map(slot => ({
        to:            candidates.find(c => c._id === slot.candidateId)?.email || '',
        candidateName: slot.candidateName,
        role:          slot.role,
        date:          slot.date,
        time:          slot.time,
        iType:         slot.type,
        link:          slot.link,
        notes:         slot.notes,
        group:         slot.group,
      })).filter(s => s.to);

      if (slots.length > 0) {
        const res = await fetch(`${API}/email/interview`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ slots }),
        });
        const data = await res.json();
        sent = data.sent || 0;
        if (data.fallbacks?.length > 0) {
          data.fallbacks.forEach((f, i) => {
            setTimeout(() => window.open(f.mailtoUrl, '_blank'), i * 300);
          });
        }
      }

      for (const slot of events) {
        try {
          const messageText = buildInterviewMessage({
            candidateName: slot.candidateName, role: slot.role, date, time: slot.time,
            iType, link, notes, group: slot.group, recruiterName: user?.username || 'Team'
          });
          await fetch(`${API}/messages`, {
            method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ receiverId: slot.candidateId, text: messageText, isScheduleMsg: true }),
          });
        } catch(e) { console.warn('Msg failed:', slot.candidateName); }
      }
    } catch(e) { console.warn('Email send failed:', e); }

    setSnack({
      open: true,
      message: sent > 0
        ? `✅ ${events.length} interviews scheduled · ${sent} emails sent!`
        : `✅ ${events.length} interviews scheduled · in-app messages sent`,
      severity: 'success',
    });
  };

  const deleteScheduled = idx => setScheduled(p => p.filter((_,i)=>i!==idx));

  const dayEvents = useMemo(() =>
    selectedDay ? scheduled.filter(e=>e.date===selectedDay) : []
  ,[selectedDay, scheduled]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0,10);
    const nowTime  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    return [...scheduled]
      .filter(e => {
        if (e.date > todayStr) return true;
        if (e.date === todayStr && e.time >= nowTime) return true;
        return false;
      })
      .filter(e => upcomingRole === 'All' || e.role === upcomingRole)
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  }, [scheduled, upcomingRole]);

  const upcomingRoles = useMemo(() => {
    const roles = [...new Set(scheduled.map(e => e.role).filter(Boolean))];
    return ['All', ...roles];
  }, [scheduled]);

  const byDate = useMemo(() => {
    const map = {};
    upcoming.forEach(e => { if(!map[e.date]) map[e.date]=[]; map[e.date].push(e); });
    return Object.entries(map);
  },[upcoming]);

  const changeMonth = dir => setCalMonth(p => {
    const d = new Date(p); d.setMonth(d.getMonth()+dir); return d;
  });

  const canGenerate = date && startTime && selCands.length > 0;
  const thisMonth   = scheduled.filter(e =>
    e.date?.startsWith(`${calMonth.getFullYear()}-${pad2(calMonth.getMonth()+1)}`)
  ).length;
  const uniqueCands = new Set(scheduled.map(e=>e.candidateId)).size;

  return (
    <Box sx={{
      position:'fixed', top:64, left:0, right:0, bottom:0,
      display:'flex', flexDirection:'column',
      background:'#eef2f7',
      overflow:'hidden',
      fontFamily:'"DM Sans","Segoe UI",sans-serif',
      zIndex:1,
    }}>

      {/* ══ HEADER BANNER ══ */}
      <Box sx={{
        flexShrink:0,
        background:'linear-gradient(135deg,#1a2f4e 0%,#163d5e 45%,#0d5044 100%)',
        px:2.5, py:0.9,
        display:'flex', alignItems:'center', gap:2,
        boxShadow:'0 3px 16px rgba(0,0,0,0.2)',
        minHeight:54,
      }}>
        <Box sx={{
          width:32, height:32, borderRadius:'9px',
          background:'rgba(255,255,255,0.14)',
          display:'flex', alignItems:'center', justifyContent:'center',
          border:'1px solid rgba(255,255,255,0.28)',
        }}>
          <ScheduleIcon sx={{ color:'#fff', fontSize:17 }}/>
        </Box>
        <Box>
          <Typography sx={{ fontWeight:900, fontSize:'0.9rem', color:'#fff', lineHeight:1.1, letterSpacing:'-0.02em' }}>
            Interview Scheduler
          </Typography>
          <Typography sx={{ fontSize:'0.56rem', color:'rgba(255,255,255,0.6)', mt:'1px' }}>
            Individual & Bulk · 40-min slot gaps · Shortlisted candidates only
          </Typography>
        </Box>
        <Box sx={{ flex:1 }}/>
        {[
          { label:'Total',     val: scheduled.length, accent:'rgba(99,102,241,0.4)' },
          { label:'This Month',val: thisMonth,         accent:'rgba(8,145,178,0.4)' },
          { label:'Candidates',val: uniqueCands,       accent:'rgba(5,150,105,0.4)' },
        ].map(s => (
          <Box key={s.label} sx={{
            textAlign:'center', px:1.4, py:0.5,
            backgroundColor: s.accent, borderRadius:'8px',
            border:'1px solid rgba(255,255,255,0.18)', minWidth:58,
          }}>
            <Typography sx={{ fontSize:'1rem', fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
              {s.val}
            </Typography>
            <Typography sx={{ fontSize:'0.42rem', color:'rgba(255,255,255,0.65)',
              textTransform:'uppercase', letterSpacing:'0.07em', mt:'1px' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ══ 3-COLUMN BODY ══ */}
      <Box sx={{ flex:1, overflow:'hidden', display:'flex', gap:1.2, p:1.2 }}>

        {/* ── COL 1: Scheduler Form ── */}
        <Box sx={{
          width:295, flexShrink:0,
          backgroundColor:'#fff', borderRadius:'14px',
          border:'1px solid #e2e8f0',
          boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
          display:'flex', flexDirection:'column', overflow:'hidden',
        }}>
          <Box sx={{
            flexShrink:0, px:1.8, py:1.1,
            borderBottom:'1px solid #f1f5f9',
            background:'linear-gradient(135deg,#f8faff 0%,#f0fdf8 100%)',
          }}>
            <Typography sx={{ fontWeight:800, fontSize:'0.82rem', color:'#0f172a' }}>New Schedule</Typography>
            <Typography sx={{ fontSize:'0.58rem', color:'#64748b' }}>Shortlisted & reviewed only</Typography>
          </Box>

          <Box sx={{
            flex:1, overflowY:'auto', overflowX:'hidden',
            px:1.8, py:1.1,
            display:'flex', flexDirection:'column', gap:0.95,
            '&::-webkit-scrollbar':{ width:3 },
            '&::-webkit-scrollbar-thumb':{ backgroundColor:'#e2e8f0', borderRadius:99 },
          }}>

            {/* Mode toggle */}
            <Box sx={{ backgroundColor:'#f1f5f9', borderRadius:'9px', p:'3px', display:'flex', gap:'3px' }}>
              {[
                { v:'individual', icon:<PersonAdd sx={{fontSize:12}}/>, label:'Individual' },
                { v:'bulk',       icon:<Groups    sx={{fontSize:12}}/>, label:'Bulk Group'  },
              ].map(m => (
                <Button key={m.v} size="small" onClick={() => setMode(m.v)} startIcon={m.icon}
                  sx={{
                    flex:1, textTransform:'none', fontSize:'0.67rem', fontWeight:700,
                    borderRadius:'7px', py:0.45, minHeight:28, transition:'all .13s',
                    backgroundColor: mode===m.v ? '#fff' : 'transparent',
                    color: mode===m.v ? '#6366f1' : '#64748b',
                    boxShadow: mode===m.v ? '0 1px 5px rgba(0,0,0,0.09)' : 'none',
                    '& .MuiButton-startIcon':{ mr:0.4 },
                  }}>
                  {m.label}
                </Button>
              ))}
            </Box>

            {/* Job filter */}
            <FormControl fullWidth size="small" sx={fSx}>
              <InputLabel>Filter by Job</InputLabel>
              <Select value={selectedJob} label="Filter by Job"
                onChange={e => { setSelectedJob(e.target.value); setCandSearch(''); }}>
                <MenuItem value="all" sx={{fontSize:'0.77rem',color:'#0f172a',fontWeight:600}}>
                  🌐 All Positions
                </MenuItem>
                {jobs.map(j => (
                  <MenuItem key={j._id} value={j._id} sx={{fontSize:'0.77rem',color:'#0f172a'}}>
                    {j.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ── CANDIDATE PICKER BOX ── */}
            <Box sx={{
              borderRadius:'10px', border:'1.5px solid #e2e8f0',
              overflow:'hidden', display:'flex', flexDirection:'column',
              height: 324,
            }}>
              {/* Picker header */}
              <Box sx={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                px:1.2, py:0.65, backgroundColor:'#f8fafc',
                borderBottom:'1px solid #f0f0f0', flexShrink:0,
              }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                  <Typography sx={{ fontSize:'0.67rem', fontWeight:700, color:'#374151' }}>
                    Candidates
                  </Typography>
                  <Box sx={{
                    px:'5px', py:'1px', borderRadius:'20px',
                    backgroundColor: selCands.length > 0 ? '#d1fae5' : '#f1f5f9',
                    border:`1px solid ${selCands.length > 0 ? '#6ee7b7' : '#e2e8f0'}`,
                  }}>
                    <Typography sx={{
                      fontSize:'0.54rem', fontWeight:800,
                      color: selCands.length > 0 ? '#059669' : '#94a3b8',
                    }}>
                      {selCands.length}/{candidates.length}
                    </Typography>
                  </Box>
                </Box>
                {!candLoading && filteredCandidates.length > 0 && (
                  <Button size="small" onClick={toggleAllFiltered}
                    sx={{
                      fontSize:'0.57rem', fontWeight:700, textTransform:'none',
                      color: filtAllSel ? '#ef4444' : '#6366f1',
                      minWidth:0, py:0, px:0.6, lineHeight:1.8,
                      borderRadius:'5px',
                      '&:hover':{ backgroundColor: filtAllSel ? '#fee2e2' : '#eef2ff' },
                    }}>
                    {filtAllSel ? 'Clear' : 'Select All'}
                  </Button>
                )}
              </Box>

              {/* Search bar */}
              {!candLoading && (
                <Box sx={{
                  px:1, py:0.55, borderBottom:'1px solid #f0f0f0',
                  flexShrink:0, backgroundColor:'#fff',
                }}>
                  <Box sx={{
                    display:'flex', alignItems:'center', gap:0.5,
                    backgroundColor:'#f8fafc', borderRadius:'7px',
                    border:'1px solid #e8ecf0', px:0.7, py:0.35,
                    transition:'all .13s',
                    '&:focus-within':{
                      borderColor:'#6366f1',
                      boxShadow:'0 0 0 2px rgba(99,102,241,0.12)',
                      backgroundColor:'#fff',
                    },
                  }}>
                    <Search sx={{ fontSize:12, color:'#94a3b8', flexShrink:0 }}/>
                    <input
                      value={candSearch}
                      onChange={e => setCandSearch(e.target.value)}
                      placeholder={candidates.length > 0 ? `Search ${candidates.length} candidates…` : 'No candidates yet'}
                      disabled={candidates.length === 0}
                      style={{
                        flex:1, border:'none', background:'transparent',
                        fontSize:'0.67rem', color:'#374151', outline:'none',
                        fontFamily:'inherit', cursor: candidates.length === 0 ? 'not-allowed' : 'text',
                      }}
                    />
                    {candSearch && (
                      <Box onClick={() => setCandSearch('')} sx={{
                        cursor:'pointer', color:'#94a3b8', fontSize:'0.75rem', lineHeight:1,
                        px:0.3, borderRadius:'3px',
                        '&:hover':{ color:'#374151', backgroundColor:'#f1f5f9' },
                      }}>×</Box>
                    )}
                  </Box>
                  {candSearch && (
                    <Typography sx={{ fontSize:'0.53rem', color:'#94a3b8', mt:'2px', px:0.3 }}>
                      {filteredCandidates.length} result{filteredCandidates.length!==1?'s':''}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Scrollable candidate list */}
              <Box sx={{
                flex:1, overflowY:'auto', overflowX:'hidden',
                '&::-webkit-scrollbar':{ width:4 },
                '&::-webkit-scrollbar-thumb':{ backgroundColor:'#d1d5db', borderRadius:99 },
                '&::-webkit-scrollbar-track':{ backgroundColor:'#f8fafc' },
              }}>
                {candLoading && (
                  <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', py:3, gap:1 }}>
                    <CircularProgress size={13} sx={{ color:'#6366f1' }}/>
                    <Typography sx={{ fontSize:'0.67rem', color:'#64748b' }}>Loading...</Typography>
                  </Box>
                )}
                {!candLoading && candidates.length === 0 && (
                  <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', py:3, gap:0.5 }}>
                    <Typography sx={{ fontSize:'1.5rem' }}>⭐</Typography>
                    <Typography sx={{ fontSize:'0.67rem', color:'#94a3b8', textAlign:'center', px:2 }}>
                      No shortlisted candidates
                    </Typography>
                    <Typography sx={{ fontSize:'0.58rem', color:'#cbd5e1', textAlign:'center', px:2 }}>
                      Shortlist from Applications first
                    </Typography>
                  </Box>
                )}
                {!candLoading && candidates.length > 0 && filteredCandidates.length === 0 && (
                  <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', py:2.5, gap:0.5 }}>
                    <Typography sx={{ fontSize:'1.2rem' }}>🔍</Typography>
                    <Typography sx={{ fontSize:'0.67rem', color:'#94a3b8' }}>
                      No match for "{candSearch}"
                    </Typography>
                  </Box>
                )}
                {!candLoading && filteredCandidates.map((c, i) => {
                  const sel  = selCands.includes(c._id);
                  const scfg = STATUS_CFG[c.status?.toLowerCase()] || STATUS_CFG.shortlisted;
                  const mc   = c.match>=70?'#059669':c.match>=40?'#0891b2':'#d97706';
                  return (
                    <Box key={c._id} onClick={() => toggleCand(c._id)}
                      sx={{
                        display:'flex', alignItems:'center', gap:0.8,
                        px:1, py:0.6,
                        cursor:'pointer', transition:'background .08s',
                        backgroundColor: sel ? '#f0f0ff' : 'transparent',
                        borderLeft:`2.5px solid ${sel ? '#6366f1' : 'transparent'}`,
                        borderBottom:'1px solid #f8f9fa',
                        '&:hover':{ backgroundColor: sel ? '#eaebff' : '#fafbff' },
                      }}>
                      <Box sx={{
                        width:14, height:14, borderRadius:'3px', flexShrink:0,
                        border:`1.5px solid ${sel ? '#6366f1' : '#d1d5db'}`,
                        backgroundColor: sel ? '#6366f1' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all .1s',
                      }}>
                        {sel && <CheckCircle sx={{ fontSize:10, color:'#fff' }}/>}
                      </Box>
                      <Avatar sx={{ width:25, height:25, fontSize:'0.57rem', fontWeight:700,
                        backgroundColor:avColor(i), color:'#fff', flexShrink:0 }}>
                        {c.initials}
                      </Avatar>
                      <Box sx={{ minWidth:0, flex:1 }}>
                        <Typography sx={{ fontSize:'0.69rem', fontWeight:700, color:'#0f172a',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
                          {c.name}
                        </Typography>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.4, mt:'1px' }}>
                          <Typography sx={{ fontSize:'0.55rem', color:'#94a3b8',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:85 }}>
                            {c.role}
                          </Typography>
                          {c.match > 0 && (
                            <Typography sx={{ fontSize:'0.55rem', fontWeight:800, color:mc, flexShrink:0 }}>
                              · {c.match}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{
                        width:7, height:7, borderRadius:'50%', flexShrink:0,
                        backgroundColor: scfg.dot,
                        boxShadow:`0 0 0 2px ${alpha(scfg.dot,0.2)}`,
                      }}/>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Bulk group size */}
            {mode === 'bulk' && (
              <Box sx={{ backgroundColor:'#f0fdf4', borderRadius:'8px', border:'1px solid #bbf7d0', p:0.9 }}>
                <Typography sx={{ fontSize:'0.61rem', fontWeight:700, color:'#047857', mb:0.55 }}>
                  👥 Candidates per group · 40 min gaps
                </Typography>
                <Box sx={{ display:'flex', gap:0.4 }}>
                  {[2,3,4,5,6].map(n => (
                    <Button key={n} size="small" onClick={() => setGroupSize(n)}
                      sx={{
                        minWidth:30, height:25, fontWeight:700, fontSize:'0.67rem',
                        borderRadius:'6px', textTransform:'none', p:0,
                        backgroundColor: groupSize===n ? '#059669' : '#fff',
                        color: groupSize===n ? '#fff' : '#374151',
                        border:`1.5px solid ${groupSize===n ? '#059669' : '#d1fae5'}`,
                        '&:hover':{ backgroundColor: groupSize===n ? '#047857' : '#dcfce7' },
                      }}>{n}</Button>
                  ))}
                </Box>
              </Box>
            )}

            {/* Date + Time */}
            <Box sx={{ display:'flex', gap:0.8 }}>
              <TextField size="small" label="Date" type="date" fullWidth
                InputLabelProps={{ shrink:true }} value={date}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                onChange={e => setDate(e.target.value)} sx={fSx}/>
              <TextField size="small" label="Start" type="time" fullWidth
                InputLabelProps={{ shrink:true }} value={startTime}
                onChange={e => setStartTime(e.target.value)} sx={fSx}/>
            </Box>

            <FormControl fullWidth size="small" sx={fSx}>
              <InputLabel>Interview Type</InputLabel>
              <Select value={iType} label="Interview Type" onChange={e => setIType(e.target.value)}>
                {['Video Call','Phone Screen','In-Person','Technical Round','HR Round'].map(t => (
                  <MenuItem key={t} value={t} sx={{fontSize:'0.77rem',color:'#0f172a'}}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField size="small" fullWidth label="Meeting Link / Venue"
              placeholder="Zoom, Meet, or office address"
              value={link} onChange={e => setLink(e.target.value)} sx={fSx}/>

            <TextField size="small" fullWidth label="Notes" multiline rows={2}
              placeholder="Preparation tips or agenda..."
              value={notes} onChange={e => setNotes(e.target.value)} sx={fSx}/>

            {/* Summary preview */}
            {canGenerate && (
              <Box sx={{ backgroundColor:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe', p:0.85 }}>
                <Typography sx={{ fontSize:'0.63rem', fontWeight:700, color:'#1d4ed8' }}>
                  {mode==='individual'
                    ? `${selCands.length} individual slots · starts ${startTime}`
                    : `${Math.ceil(selCands.length/groupSize)} groups · ${selCands.length} candidates`}
                </Typography>
                <Typography sx={{ fontSize:'0.57rem', color:'#3b82f6', mt:'2px' }}>
                  Ends ~{mode==='bulk'
                    ? fmtTime(...addMins(...startTime.split(':').map(Number),(Math.ceil(selCands.length/groupSize)-1)*SLOT_GAP))
                    : fmtTime(...addMins(...startTime.split(':').map(Number),(selCands.length-1)*SLOT_GAP))}
                </Typography>
              </Box>
            )}

            {/* Generate button */}
            <Button variant="contained" fullWidth disabled={!canGenerate}
              onClick={generateSlots} startIcon={<Bolt sx={{ fontSize:14 }}/>}
              sx={{
                textTransform:'none', fontWeight:800, fontSize:'0.78rem',
                borderRadius:'9px', py:0.9,
                background: canGenerate ? 'linear-gradient(135deg,#6366f1,#0891b2)' : '#e2e8f0',
                color: canGenerate ? '#fff' : '#94a3b8',
                boxShadow: canGenerate ? '0 3px 12px rgba(99,102,241,0.3)' : 'none',
                '&:hover':{ background:'linear-gradient(135deg,#4f46e5,#0369a1)' },
                '&:disabled':{ background:'#e2e8f0', color:'#94a3b8', boxShadow:'none' },
                '& .MuiButton-startIcon':{ mr:0.5 },
              }}>
              {mode==='bulk'
                ? `Preview ${Math.ceil(selCands.length/groupSize)||0} Groups`
                : `Preview ${selCands.length} Slots`}
            </Button>
          </Box>
        </Box>

        {/* ── COL 2: Calendar + Day Detail ── */}
        <Box sx={{ flex:1, display:'flex', flexDirection:'column', gap:1.2, minWidth:0 }}>

          <Box sx={{
            backgroundColor:'#fff', borderRadius:'14px',
            border:'1px solid #e2e8f0',
            boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
            p:1.5, flexShrink:0,
          }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.9, mb:1.1 }}>
              <Box sx={{
                width:28, height:28, borderRadius:'8px',
                background:'linear-gradient(135deg,#6366f1,#0891b2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <CalendarMonth sx={{ color:'#fff', fontSize:14 }}/>
              </Box>
              <Box>
                <Typography sx={{ fontWeight:800, fontSize:'0.8rem', color:'#0f172a' }}>
                  Interview Calendar
                </Typography>
                <Typography sx={{ fontSize:'0.56rem', color:'#64748b' }}>
                  Tap a date to view interviews
                </Typography>
              </Box>
              {scheduled.length > 0 && (
                <Chip label={`${scheduled.length} total`} size="small"
                  sx={{ ml:'auto', fontSize:'0.57rem', fontWeight:700,
                    backgroundColor:'#ede9fe', color:'#7c3aed', border:'1px solid #c4b5fd' }}/>
              )}
            </Box>
            <MiniCalendar
              events={scheduled} selectedDay={selectedDay}
              onDaySelect={setSelectedDay} currentMonth={calMonth}
              onMonthChange={changeMonth}
            />
          </Box>

          {selectedDay ? (
            <Box sx={{
              flex:1, backgroundColor:'#fff', borderRadius:'14px',
              border:'1px solid #e2e8f0',
              boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
              p:1.4, display:'flex', flexDirection:'column', overflow:'hidden',
            }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.9, flexShrink:0 }}>
                <Typography sx={{ fontSize:'0.76rem', fontWeight:800, color:'#0f172a' }}>
                  {fmtDate(selectedDay)}
                </Typography>
                <Chip label={`${dayEvents.length} interview${dayEvents.length!==1?'s':''}`} size="small"
                  sx={{ fontSize:'0.56rem', fontWeight:700,
                    backgroundColor:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}/>
                <IconButton size="small" onClick={() => setSelectedDay(null)}
                  sx={{ ml:'auto', color:'#94a3b8', p:'2px', borderRadius:'6px',
                    '&:hover':{ backgroundColor:'#f1f5f9' } }}>
                  <Close sx={{ fontSize:12 }}/>
                </IconButton>
              </Box>
              {dayEvents.length === 0 ? (
                <Box sx={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  flexDirection:'column', gap:0.5 }}>
                  <Typography sx={{ fontSize:'1.8rem' }}>📭</Typography>
                  <Typography sx={{ fontSize:'0.7rem', color:'#94a3b8' }}>No interviews this day</Typography>
                </Box>
              ) : (
                <Box sx={{
                  flex:1, overflow:'auto', display:'flex', flexWrap:'wrap', gap:0.8, alignContent:'flex-start',
                  '&::-webkit-scrollbar':{ width:3 },
                  '&::-webkit-scrollbar-thumb':{ backgroundColor:'#e2e8f0', borderRadius:99 },
                }}>
                  {dayEvents.map((ev,i) => (
                    <Box key={i} sx={{
                      display:'flex', alignItems:'center', gap:0.8,
                      px:1.1, py:0.65, borderRadius:'9px', minWidth:150, flex:'0 0 auto',
                      backgroundColor: alpha(ev.color||'#6366f1',0.07),
                      border:`1px solid ${alpha(ev.color||'#6366f1',0.18)}`,
                      borderLeft:`3px solid ${ev.color||'#6366f1'}`,
                    }}>
                      <Avatar sx={{ width:22, height:22, fontSize:'0.5rem', fontWeight:800,
                        backgroundColor:ev.color||'#6366f1', color:'#fff' }}>
                        {ev.initials}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color:'#0f172a' }}>
                          {ev.candidateName}
                        </Typography>
                        <Typography sx={{ fontSize:'0.56rem', color:'#64748b' }}>
                          {ev.time} · {ev.type}{ev.group?` · G${ev.group}`:''}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{
              flex:1, backgroundColor:'#fff', borderRadius:'14px',
              border:'1.5px dashed #e2e8f0',
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:1,
            }}>
              <CalendarMonth sx={{ fontSize:28, color:'#e2e8f0' }}/>
              <Typography sx={{ fontSize:'0.68rem', color:'#cbd5e1', textAlign:'center', lineHeight:1.5 }}>
                Select a date on the calendar<br/>to view scheduled interviews
              </Typography>
            </Box>
          )}
        </Box>

        {/* ── COL 3: Upcoming ── */}
        <Box sx={{
          width:215, flexShrink:0, backgroundColor:'#fff', borderRadius:'14px',
          border:'1px solid #e2e8f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
          display:'flex', flexDirection:'column', overflow:'hidden',
        }}>
          <Box sx={{
            flexShrink:0, px:1.5, py:1.05,
            background:'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(8,145,178,0.02))',
            borderBottom:'1px solid #f1f5f9',
            display:'flex', flexDirection:'column', gap:0.5,
          }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.7 }}>
              <Event sx={{ fontSize:14, color:'#6366f1' }}/>
              <Typography sx={{ fontWeight:800, fontSize:'0.81rem', color:'#0f172a' }}>Upcoming</Typography>
              {upcoming.length > 0 && (
                <Box sx={{ ml:'auto', px:'7px', py:'1px', borderRadius:'20px',
                  backgroundColor:'#ede9fe', border:'1px solid #c4b5fd' }}>
                  <Typography sx={{ fontSize:'0.54rem', fontWeight:800, color:'#7c3aed' }}>
                    {upcoming.length}
                  </Typography>
                </Box>
              )}
            </Box>
            {upcomingRoles.length > 1 && (
              <select
                value={upcomingRole}
                onChange={e => setUpcomingRole(e.target.value)}
                style={{
                  width:'100%', padding:'3px 6px', borderRadius:'6px',
                  border:'1px solid #e2e8f0', background:'#f8fafc',
                  fontSize:'0.66rem', fontWeight:600, color:'#374151',
                  cursor:'pointer', outline:'none',
                }}>
                {upcomingRoles.map(r => (
                  <option key={r} value={r}>{r === 'All' ? '🌐 All Roles' : r}</option>
                ))}
              </select>
            )}
          </Box>

          <Box sx={{
            flex:1, overflow:'auto', p:1.1,
            '&::-webkit-scrollbar':{ width:3 },
            '&::-webkit-scrollbar-thumb':{ backgroundColor:'#e2e8f0', borderRadius:99 },
          }}>
            {upcoming.length === 0 ? (
              <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', height:'100%', gap:1 }}>
                <ScheduleIcon sx={{ fontSize:28, color:'#e2e8f0' }}/>
                <Typography sx={{ fontSize:'0.67rem', color:'#cbd5e1', textAlign:'center' }}>
                  No interviews yet
                </Typography>
              </Box>
            ) : (
              byDate.map(([dt, evs]) => (
                <Box key={dt} sx={{ mb:1.3 }}>
                  <Typography sx={{ fontSize:'0.55rem', fontWeight:700, color:'#64748b',
                    textTransform:'uppercase', letterSpacing:'0.08em', mb:0.4, px:0.2 }}>
                    {fmtDate(dt)} · {evs.length}
                  </Typography>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:0.45 }}>
                    {evs.map((ev, i) => {
                      const gIdx = scheduled.findIndex(s =>
                        s.candidateId===ev.candidateId && s.date===ev.date && s.time===ev.time
                      );
                      return (
                        <Box key={i} sx={{
                          p:'6px 8px', borderRadius:'9px',
                          backgroundColor: alpha(ev.color||'#6366f1',0.06),
                          border:`1px solid ${alpha(ev.color||'#6366f1',0.15)}`,
                          borderLeft:`2.5px solid ${ev.color||'#6366f1'}`,
                          position:'relative',
                          '&:hover .del-btn':{ opacity:1 },
                        }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.4, mb:'2px' }}>
                            <AccessTime sx={{ fontSize:9, color:ev.color||'#6366f1' }}/>
                            <Typography sx={{ fontSize:'0.59rem', fontWeight:700, color:ev.color||'#6366f1' }}>
                              {ev.time}{ev.group ? ` · G${ev.group}` : ''}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize:'0.67rem', fontWeight:700, color:'#0f172a', lineHeight:1.2 }}>
                            {ev.candidateName}
                          </Typography>
                          <Typography sx={{ fontSize:'0.55rem', color:'#64748b', mt:'1px' }}>{ev.type}</Typography>
                          {ev.link && (
                            <Typography sx={{ fontSize:'0.53rem', color:'#0891b2', mt:'1px',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              🔗 {ev.link}
                            </Typography>
                          )}
                          <IconButton className="del-btn" size="small"
                            onClick={() => deleteScheduled(gIdx)}
                            sx={{ position:'absolute', top:3, right:3, width:15, height:15, p:0,
                              opacity:0, transition:'opacity .12s',
                              '&:hover':{ backgroundColor:'#fee2e2', borderRadius:'4px' } }}>
                            <Delete sx={{ fontSize:9, color:'#94a3b8' }}/>
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* ── CONFIRM DIALOG ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:'14px', background:'#fff', border:'1px solid #e2e8f0',
          boxShadow:'0 20px 50px rgba(0,0,0,0.14)' }}}>
        <DialogTitle sx={{ fontWeight:800, fontSize:'0.92rem', color:'#0f172a',
          borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:1, py:1.4 }}>
          <PlaylistAddCheck sx={{ color:'#059669', fontSize:19 }}/>
          Confirm Schedule
          <IconButton size="small" onClick={() => setConfirmOpen(false)} sx={{ ml:'auto', color:'#94a3b8' }}>
            <Close sx={{ fontSize:14 }}/>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p:2 }}>
          <Box sx={{ display:'flex', gap:0.6, mb:1.4, flexWrap:'wrap' }}>
            <Chip label={mode==='bulk' ? `Bulk · ${groupSize}/group` : 'Individual'} size="small"
              sx={{ fontSize:'0.59rem', fontWeight:700, backgroundColor:'#d1fae5', color:'#047857', border:'1px solid #6ee7b7' }}/>
            <Chip label={iType} size="small"
              sx={{ fontSize:'0.59rem', fontWeight:700, backgroundColor:'#e0f2fe', color:'#0369a1', border:'1px solid #7dd3fc' }}/>
            <Chip label={`${previewSlots.length} slots · ${fmtDate(date)}`} size="small"
              sx={{ fontSize:'0.59rem', fontWeight:700, backgroundColor:'#fef3c7', color:'#b45309', border:'1px solid #fcd34d' }}/>
          </Box>
          {(() => {
            const byTime = {};
            previewSlots.forEach(s => { if(!byTime[s.time]) byTime[s.time]=[]; byTime[s.time].push(s); });
            return Object.entries(byTime).map(([time, slots], gi) => (
              <Box key={time} sx={{ mb:1.1 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.5,
                  p:'5px 8px', borderRadius:'7px',
                  backgroundColor:alpha(grpColor(gi),0.07), border:`1px solid ${alpha(grpColor(gi),0.18)}` }}>
                  <Box sx={{ width:6, height:6, borderRadius:'50%', backgroundColor:grpColor(gi) }}/>
                  <Typography sx={{ fontSize:'0.68rem', fontWeight:800, color:'#0f172a' }}>
                    🕐 {time}
                    {mode==='bulk' && (
                      <Typography component="span" sx={{ fontSize:'0.59rem', color:'#64748b', ml:1 }}>
                        Group {gi+1} · {slots.length}
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ pl:1.4, display:'flex', flexDirection:'column', gap:0.4 }}>
                  {slots.map((s, i) => (
                    <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.9,
                      px:0.9, py:0.5, borderRadius:'7px',
                      backgroundColor:alpha(grpColor(gi),0.05), border:`1px solid ${alpha(grpColor(gi),0.12)}` }}>
                      <Avatar sx={{ width:21, height:21, fontSize:'0.53rem', fontWeight:700,
                        backgroundColor:grpColor(gi), color:'#fff' }}>
                        {s.initials}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize:'0.69rem', fontWeight:700, color:'#0f172a' }}>{s.candidateName}</Typography>
                        <Typography sx={{ fontSize:'0.57rem', color:'#64748b' }}>{s.role}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ));
          })()}
        </DialogContent>
        <DialogActions sx={{ px:2, pb:1.4, gap:1, borderTop:'1px solid #f1f5f9' }}>
          <Button onClick={() => setConfirmOpen(false)}
            sx={{ textTransform:'none', color:'#64748b', fontSize:'0.74rem' }}>
            Back & Edit
          </Button>
          <Button variant="contained" onClick={confirmSchedule}
            sx={{
              textTransform:'none', fontWeight:700, fontSize:'0.77rem',
              borderRadius:'8px', px:2.2,
              background:'linear-gradient(135deg,#059669,#0891b2)',
              boxShadow:'0 3px 10px rgba(5,150,105,0.28)',
              '&:hover':{ background:'linear-gradient(135deg,#047857,#0369a1)' },
            }}>
            ✅ Confirm & Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ── */}
      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(p=>({...p,open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p=>({...p,open:false}))}
          sx={{ fontSize:'0.72rem', borderRadius:'10px', border:'1px solid #e2e8f0',
            '& .MuiAlert-message':{ color:'#0f172a', fontWeight:600 } }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchedulePage;
