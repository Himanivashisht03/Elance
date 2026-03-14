// frontend/src/pages/LandingPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Chatbot from '../components/Chatbot';

import JobSearch from '../components/JobSearch';
import AboutUS from './AboutUS';
import ProfileSection from '../components/ProfileSection';
import CareerPlannerSimple from '../components/CareerPlannerSimple';
import JobSeekerAnalytics from '../components/JobSeekerAnalytics';
import { jobService } from '../services/JobService';
import elanceLogo from '../assets/images/elance-logo.jpg';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SLIDES = [
  { src: '/slide1.jpeg', caption: 'Collaborate in inspiring spaces. Discover top jobs today.' },
  { src: '/slide2.jpeg', caption: 'Unlock new skills and step into your future, together.'   },
  { src: '/slide3.jpeg', caption: 'Office meets ambition — explore jobs and companies now.'  },
  { src: '/slide4.jpeg', caption: 'Build your career with the world\'s leading companies.'   },
  { src: '/slide5.jpeg', caption: 'Your next big opportunity is just one search away.'        },
];

const GRADIENTS = [
  'linear-gradient(135deg,#4a6cf7,#7c4dff)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#38bdf8)',
  'linear-gradient(135deg,#e879f9,#7c4dff)',
  'linear-gradient(135deg,#38bdf8,#4a6cf7)',
  'linear-gradient(135deg,#4ade80,#10b981)',
];

const LandingPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (user.role === 'recruiter' || user.role === 'employer')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [activeSection, setActiveSection] = useState('home');
  const [hoveredNav, setHoveredNav]       = useState(null);
  const [chatOpen, setChatOpen]           = useState(false);

  const [currentSlide, setCurrentSlide]   = useState(0);
  const [jobTitle, setJobTitle]           = useState('');
  const [location, setLocation]           = useState('');
  const [searchDone, setSearchDone]       = useState(false);
  const [jobs, setJobs]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [applying, setApplying]           = useState({});
  const [appliedJobs, setAppliedJobs]     = useState(new Set());
  const [error, setError]                 = useState('');

  const [stats, setStats] = useState({
    companiesHiring: null,
    liveJobs: null,
    placedTotal: null,
    placementRate: null,
    totalSeekers: null,
    loading: true,
  });

  useEffect(() => {
    if (activeSection === 'home') {
      const t = setInterval(() => setCurrentSlide(p => (p + 1) % SLIDES.length), 4000);
      return () => clearInterval(t);
    }
  }, [activeSection]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/jobs/public/stats`);
        if (!res.ok) throw new Error('Stats fetch failed');
        const data = await res.json();
        setStats({
          liveJobs:        data.liveJobs        ?? data.liveToday ?? null,
          companiesHiring: data.companiesHiring ?? null,
          placedTotal:     data.placedThisMonth ?? null,
          placementRate:   data.placementRate   ?? null,
          totalSeekers:    data.totalSeekers    ?? null,
          loading: false,
        });
      } catch {
        // fallback: count from jobs list
        try {
          const response = await jobService.getAllJobs();
          const allJobs = Array.isArray(response) ? response : (response.jobs || []);
          const activeJobs = allJobs.filter(j => j.status !== 'closed');
          const uniqueCompanies = new Set(activeJobs.map(j => j.company).filter(Boolean)).size;
          setStats({
            liveJobs:        activeJobs.length || null,
            companiesHiring: uniqueCompanies   || null,
            placedTotal:     null,
            placementRate:   null,
            totalSeekers:    null,
            loading: false,
          });
        } catch {
          setStats({
            liveJobs: null, companiesHiring: null,
            placedTotal: null, placementRate: null,
            totalSeekers: null, loading: false,
          });
        }
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (user) {
      jobService.getUserApplications()
        .then(r => {
          const list = Array.isArray(r) ? r : (r.applications || []);
          setAppliedJobs(new Set(list.map(a => a.jobId?._id || a.jobId)));
        })
        .catch(() => {});
    }
  }, [user]);

  const navItems = [
    { label: 'Home',      section: 'home'      },
    { label: 'Find Jobs', section: 'jobs'      },
    { label: 'Career',    section: 'career'    },
    { label: 'Analytics', section: 'analytics' },
    { label: 'About',     section: 'about'     },
  ];

  const buildStats = () => {
    if (stats.loading) return [];
    const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K+` : `${n}+`;
    const items = [];
    if (stats.liveJobs        > 0) items.push({ value: fmt(stats.liveJobs),        label: 'Live Jobs'        });
    if (stats.companiesHiring > 0) items.push({ value: fmt(stats.companiesHiring), label: 'Companies Hiring' });
    if (stats.placedTotal     > 0) items.push({ value: fmt(stats.placedTotal),     label: 'Placements'       });
    if (stats.placementRate   > 0) items.push({ value: `${stats.placementRate}%`,  label: 'Placement Rate'   });
    if (stats.totalSeekers    > 0) items.push({ value: fmt(stats.totalSeekers),    label: 'Job Seekers'      });
    return items;
  };

  const STATS = buildStats();

  const handleSearch = async () => {
    setLoading(true); setSearchDone(true); setError('');
    try {
      const response = await jobService.getAllJobs();
      let results = Array.isArray(response) ? response : (response.jobs || []);
      if (jobTitle.trim())
        results = results.filter(j =>
          j.title?.toLowerCase().includes(jobTitle.toLowerCase()) ||
          j.company?.toLowerCase().includes(jobTitle.toLowerCase()) ||
          j.description?.toLowerCase().includes(jobTitle.toLowerCase())
        );
      if (location.trim())
        results = results.filter(j =>
          j.location?.toLowerCase().includes(location.toLowerCase())
        );
      if (user) results = results.filter(j => !appliedJobs.has(j._id));
      setJobs(results);
    } catch { setError('Failed to fetch jobs. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleApply = async (jobId) => {
    if (!user) { navigate('/login'); return; }
    setApplying(p => ({ ...p, [jobId]: true }));
    try {
      await jobService.applyForJob(jobId);
      setAppliedJobs(p => new Set([...p, jobId]));
      setJobs(p => p.filter(j => j._id !== jobId));
    } catch {}
    finally { setApplying(p => ({ ...p, [jobId]: false })); }
  };

  const handleNavClick = (section) => {
    if (!user && ['jobs', 'career', 'analytics'].includes(section)) {
      navigate('/login'); return;
    }
    setActiveSection(section);
    setSearchDone(false); setJobs([]);
  };

  const formatSalary = (job) => {
    if (job.salaryRange?.min && job.salaryRange?.max)
      return `${job.salaryRange.currency || '$'}${(job.salaryRange.min/1000).toFixed(0)}K–${(job.salaryRange.max/1000).toFixed(0)}K`;
    return 'Competitive';
  };

  /* ════ NAVBAR ════ */
  const Navbar = () => (
    <nav style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 60px', height:64,
      background:'linear-gradient(90deg,#1a2caa 0%,#5216c0 100%)',
      position:'fixed', top:0, left:0, right:0, zIndex:1300,
      boxShadow:'0 2px 20px rgba(74,108,247,0.30)',
    }}>

      {/* ── LOGO + BRAND ── */}
      <div
        onClick={() => { setActiveSection('home'); setSearchDone(false); setJobs([]); }}
        style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', textDecoration:'none' }}
      >
        <img
          src={elanceLogo}
          alt="Elance logo"
          style={{
            height: 38,
            width: 38,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,255,255,0.55)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize:22, fontWeight:800, color:'white', letterSpacing:'0.5px' }}>
          Elance
        </span>
      </div>

      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {navItems.map(n => (
          <button key={n.section}
            onClick={() => handleNavClick(n.section)}
            onMouseEnter={() => setHoveredNav(n.section)}
            onMouseLeave={() => setHoveredNav(null)}
            style={{
              background: hoveredNav===n.section ? 'rgba(255,255,255,0.12)' : 'transparent',
              border:'none', cursor:'pointer', color:'white',
              fontSize:15, fontWeight: activeSection===n.section ? 700 : 400,
              opacity: activeSection===n.section ? 1 : 0.82,
              padding:'8px 18px', borderRadius:8, position:'relative', transition:'all 0.2s',
            }}>
            {n.label}
            {activeSection===n.section && (
              <span style={{
                position:'absolute', bottom:4, left:'50%', transform:'translateX(-50%)',
                width:18, height:3, borderRadius:2, background:'white', display:'block',
              }}/>
            )}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        {user ? (
          <>
            <span style={{ color:'rgba(255,255,255,0.92)', fontSize:14, fontWeight:500 }}>
              Hi, {user?.username?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}
            </span>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#facc15',
              boxShadow:'0 0 6px #facc15', display:'inline-block' }}/>

            <button onClick={() => setActiveSection('profile')} style={{
              background:'rgba(255,255,255,0.13)', color:'white',
              border:'1.5px solid rgba(255,255,255,0.35)',
              borderRadius:8, padding:'7px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
            }}>Profile</button>
            <button onClick={() => logout()} style={{
              background:'white', color:'#4a6cf7', border:'none',
              borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
            }}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{
              background:'rgba(255,255,255,0.13)', color:'white',
              border:'1.5px solid rgba(255,255,255,0.38)',
              borderRadius:8, padding:'8px 20px', fontSize:14, fontWeight:600, cursor:'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.13)'}
            >Log in</button>
            <button onClick={() => navigate('/signup')} style={{
              background:'white', color:'#4a6cf7', border:'none',
              borderRadius:8, padding:'9px 22px', fontSize:14, fontWeight:700, cursor:'pointer',
              boxShadow:'0 2px 10px rgba(255,255,255,0.2)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 18px rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 10px rgba(255,255,255,0.2)'}
            >Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );

  /* ════ HOME SECTION ════ */
  const HomeSection = () => (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', height:'calc(100vh - 64px)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            position:'absolute', inset:0, zIndex:0,
            backgroundImage:`url(${slide.src})`,
            backgroundSize:'cover', backgroundPosition:'center',
            opacity: currentSlide===i ? 1 : 0,
            transition:'opacity 1.4s ease-in-out',
          }}/>
        ))}

        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(180deg, rgba(8,14,50,0.72) 0%, rgba(12,20,60,0.45) 40%, rgba(12,20,60,0.50) 65%, rgba(8,14,50,0.82) 100%)',
        }}/>

        <div style={{
          position:'relative', zIndex:2, flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'0 80px', boxSizing:'border-box',
          maxWidth:1300, width:'100%', margin:'0 auto', gap:20,
        }}>
          <h1 style={{
            fontSize:62, fontWeight:800, color:'white',
            lineHeight:1.1, margin:0, letterSpacing:'-1.5px',
            textShadow:'0 2px 20px rgba(0,0,0,0.55)', maxWidth:700,
          }}>
            Find your{' '}
            <span style={{ background:'linear-gradient(90deg,#93c5fd,#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              dream job
            </span>
            <br/>that fits your future
          </h1>

          <p style={{
            fontSize:17, color:'rgba(210,225,255,0.88)',
            lineHeight:1.65, margin:0, maxWidth:520,
            textShadow:'0 1px 8px rgba(0,0,0,0.45)', minHeight:28,
          }}>
            {SLIDES[currentSlide].caption}
          </p>

          {stats.loading ? (
            <div style={{ display:'flex', gap:14 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:12, padding:'10px 20px', width:110, height:54,
                  animation:'shimmer 1.5s infinite',
                }}/>
              ))}
            </div>
          ) : STATS.length > 0 ? (
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              {STATS.map((s, i) => (
                <div key={i} style={{
                  background:'rgba(255,255,255,0.11)', border:'1px solid rgba(255,255,255,0.20)',
                  borderRadius:12, padding:'10px 20px', textAlign:'center',
                }}>
                  <div style={{ fontSize:21, fontWeight:900, color:'white', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'rgba(200,215,255,0.76)', fontWeight:600, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          {!user && (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.20)',
              borderRadius:12, padding:'10px 20px', width:'fit-content', marginTop:4,
            }}>
              <span style={{ fontSize:13, color:'rgba(200,215,255,0.85)', fontWeight:500 }}>
                🔓 Search jobs freely — log in to apply
              </span>
              <button onClick={() => navigate('/login')} style={{
                background:'white', color:'#1a2caa', border:'none',
                borderRadius:8, padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer',
              }}>Log in →</button>
            </div>
          )}
        </div>

        <div style={{
          position:'relative', zIndex:2, display:'flex', flexDirection:'column',
          alignItems:'center', padding:'0 40px 36px', width:'100%', boxSizing:'border-box',
        }}>
          <div style={{
            display:'flex', alignItems:'center', background:'white',
            borderRadius:16, boxShadow:'0 10px 52px rgba(0,0,0,0.40)',
            border:'2px solid rgba(255,255,255,0.95)', overflow:'hidden',
            height:64, width:'70%', maxWidth:960,
          }}>
            <div style={{ display:'flex', alignItems:'center', flex:2, padding:'0 26px', gap:12 }}>
              <span style={{ fontSize:20, color:'#94a3b8', flexShrink:0 }}>🔍</span>
              <input type="text" placeholder="Job Title or Keywords"
                value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleSearch()}
                style={{ border:'none', background:'transparent', outline:'none', fontSize:15, color:'#1e293b', width:'100%', fontFamily:'inherit' }}
              />
            </div>
            <div style={{ width:1, height:34, background:'#e2e8f0', flexShrink:0 }}/>
            <div style={{ display:'flex', alignItems:'center', flex:1.5, padding:'0 26px', gap:12 }}>
              <span style={{ fontSize:20, color:'#94a3b8', flexShrink:0 }}>📍</span>
              <input type="text" placeholder="City, Remote…"
                value={location} onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleSearch()}
                style={{ border:'none', background:'transparent', outline:'none', fontSize:15, color:'#1e293b', width:'100%', fontFamily:'inherit' }}
              />
            </div>
            <button onClick={handleSearch} style={{
              height:'100%', padding:'0 40px',
              background:'linear-gradient(135deg,#4a7fd4,#6a5acd)',
              color:'white', fontWeight:700, fontSize:16,
              border:'none', cursor:'pointer', flexShrink:0,
              fontFamily:'inherit', transition:'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='linear-gradient(135deg,#3568be,#5548b8)'}
            onMouseLeave={e => e.currentTarget.style.background='linear-gradient(135deg,#4a7fd4,#6a5acd)'}
            >Find it now</button>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            {SLIDES.map((_,i) => (
              <div key={i} onClick={() => setCurrentSlide(i)} style={{
                width: currentSlide===i ? 26 : 8, height:8, borderRadius:4,
                background: currentSlide===i ? 'white' : 'rgba(255,255,255,0.32)',
                cursor:'pointer', transition:'all 0.35s ease',
              }}/>
            ))}
          </div>

          <p style={{ color:'rgba(200,215,255,0.65)', fontSize:12.5, fontWeight:500, margin:'12px 0 0', letterSpacing:0.3 }}>
            {!stats.loading && (stats.liveJobs > 0 || stats.companiesHiring > 0)
              ? `✓ ${stats.liveJobs > 0 ? `${stats.liveJobs}+ active jobs` : ''}${stats.liveJobs > 0 && stats.companiesHiring > 0 ? ' · ' : ''}${stats.companiesHiring > 0 ? `${stats.companiesHiring}+ companies hiring` : ''} · 100% free to apply`
              : '✓ Secure & verified · 100% free to apply · Trusted by top companies'
            }
          </p>
        </div>

        <style>{`
          @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.7} 100%{opacity:0.4} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>

      {searchDone && (
        <div style={{ background:'#f4f7fb', flex:1, padding:'36px 60px 52px' }}>
          {!loading && !error && (
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <p style={{ fontSize:18, fontWeight:700, color:'#18234a', margin:'0 0 4px' }}>
                {jobs.length > 0
                  ? `${jobs.length} job${jobs.length>1?'s':''} found${jobTitle ? ` for "${jobTitle}"` : ''}`
                  : 'No jobs found — try different keywords'}
              </p>
              {!user && jobs.length > 0 && (
                <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>
                  👋 <span style={{ fontWeight:600 }}>Log in</span> to apply to any of these roles
                </p>
              )}
            </div>
          )}

          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:16 }}>
              <div style={{ width:44, height:44, border:'4px solid #dde8f4', borderTopColor:'#4a7fd4', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ color:'#64748b', fontWeight:600, margin:0 }}>Finding your best matches...</p>
            </div>
          )}

          {error && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <p style={{ color:'#ef4444', fontWeight:600 }}>{error}</p>
              <button onClick={handleSearch} style={{ background:'#4a7fd4', color:'white', border:'none', borderRadius:8, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Retry</button>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20, maxWidth:1200, margin:'0 auto' }}>
              {jobs.map((job, idx) => (
                <div key={job._id} style={{
                  background:'white', borderRadius:16,
                  border:'1px solid rgba(74,127,212,0.12)', overflow:'hidden',
                  boxShadow:'0 4px 20px rgba(74,127,212,0.08)', transition:'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(74,127,212,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(74,127,212,0.08)'; }}>
                  <div style={{ padding:'20px 22px' }}>
                    <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:14 }}>
                      <div style={{
                        width:48, height:48, borderRadius:12, flexShrink:0,
                        background:GRADIENTS[idx % GRADIENTS.length],
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, fontWeight:800, color:'white',
                        boxShadow:'0 4px 14px rgba(74,127,212,0.25)',
                      }}>
                        {job.company?.charAt(0) || 'C'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:16, color:'#18234a', marginBottom:3, lineHeight:1.3 }}>{job.title}</div>
                        <div style={{ fontSize:13, color:'#4a7fd4', fontWeight:700 }}>{job.company}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:12 }}>
                      {[{ icon:'📍', text:job.location }, { icon:'💼', text:job.type }, { icon:'💰', text:formatSalary(job) }].map((m,i) => (
                        <span key={i} style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>{m.icon} {m.text}</span>
                      ))}
                    </div>
                    <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:'0 0 14px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {job.description}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
                      {job.requiredSkills?.slice(0,5).map((s,i) => (
                        <span key={i} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'rgba(74,127,212,0.08)', color:'#4a7fd4', border:'1px solid rgba(74,127,212,0.18)' }}>
                          {s.name || s}
                        </span>
                      ))}
                      {job.requiredSkills?.length > 5 && (
                        <span style={{ fontSize:11, color:'#94a3b8', padding:'3px 8px' }}>+{job.requiredSkills.length-5}</span>
                      )}
                    </div>
                    {user ? (
                      <button onClick={() => handleApply(job._id)} disabled={applying[job._id]} style={{
                        width:'100%', height:44,
                        background: applying[job._id] ? '#e2e8f0' : 'linear-gradient(135deg,#4a7fd4,#6a5acd)',
                        color: applying[job._id] ? '#94a3b8' : 'white',
                        border:'none', borderRadius:10, fontWeight:700, fontSize:14,
                        cursor: applying[job._id] ? 'not-allowed' : 'pointer',
                        fontFamily:'inherit', transition:'all 0.2s',
                        boxShadow: applying[job._id] ? 'none' : '0 4px 14px rgba(74,127,212,0.30)',
                      }}>
                        {applying[job._id] ? 'Applying…' : '🚀 Apply Now'}
                      </button>
                    ) : (
                      <button onClick={() => navigate('/login')} style={{
                        width:'100%', height:44, background:'linear-gradient(135deg,#f0f4ff,#ede9ff)',
                        color:'#4a7fd4', border:'2px solid rgba(74,127,212,0.25)',
                        borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg,#4a7fd4,#6a5acd)'; e.currentTarget.style.color='white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg,#f0f4ff,#ede9ff)'; e.currentTarget.style.color='#4a7fd4'; }}
                      >🔐 Log in to Apply</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && jobs.length===0 && (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
              <p style={{ fontWeight:700, fontSize:18, color:'#18234a', margin:'0 0 8px' }}>No jobs found</p>
              <p style={{ color:'#64748b', margin:'0 0 24px' }}>Try different keywords or show all jobs</p>
              <button onClick={() => { setJobTitle(''); setLocation(''); handleSearch(); }} style={{
                background:'linear-gradient(135deg,#4a7fd4,#6a5acd)', color:'white',
                border:'none', borderRadius:10, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit',
              }}>Show All Jobs</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Segoe UI',Tahoma,Geneva,Verdana,sans-serif" }}>
      <Navbar />

      <div style={{ paddingTop:64 }}>
        {activeSection==='home'      && <HomeSection />}
        {activeSection==='jobs'      && <div style={{ minHeight:'calc(100vh - 64px)', background:'linear-gradient(135deg,#f0f4ff,#f5f0ff)' }}><JobSearch /></div>}
        {activeSection==='analytics' && <div style={{ minHeight:'calc(100vh - 64px)', background:'linear-gradient(135deg,#f0f4ff,#f5f0ff)' }}><JobSeekerAnalytics /></div>}
        {activeSection==='about'     && <div style={{ minHeight:'calc(100vh - 64px)', background:'linear-gradient(135deg,#f0f4ff,#f5f0ff)' }}><AboutUS /></div>}
        {activeSection==='career'    && <div style={{ minHeight:'calc(100vh - 64px)', background:'linear-gradient(135deg,#f0f4ff,#f5f0ff)' }}><CareerPlannerSimple /></div>}
        {activeSection==='profile'   && <div style={{ minHeight:'calc(100vh - 64px)', background:'linear-gradient(135deg,#eef2ff,#f5f0ff)' }}><ProfileSection user={user} onNavigate={setActiveSection} /></div>}
      </div>



      {user && (
        <>
          {chatOpen && <Chatbot onClose={() => setChatOpen(false)} />}

          {!chatOpen && (
            <>
              <div style={{
                position:'fixed', bottom:36, right:96, zIndex:8998,
                background:'rgba(24,35,74,0.88)', color:'white',
                padding:'6px 14px', borderRadius:20,
                fontSize:13, fontWeight:500,
                pointerEvents:'none', whiteSpace:'nowrap',
                boxShadow:'0 4px 14px rgba(0,0,0,0.2)',
              }}>
                Ask Sam 💬
              </div>
              <div style={{
                position:'fixed', bottom:20, right:20, zIndex:8997,
                width:62, height:62, borderRadius:'50%',
                background:'rgba(124,58,237,0.2)',
                animation:'samPulseRing 2s infinite',
                pointerEvents:'none',
              }}/>
            </>
          )}

          <button
            onClick={() => setChatOpen(p => !p)}
            style={{
              position:'fixed', bottom:24, right:24, zIndex:8999,
              width:54, height:54, borderRadius:'50%',
              background: chatOpen ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              border:'3px solid white', cursor:'pointer',
              boxShadow:'0 6px 22px rgba(124,58,237,0.5)',
              fontSize:22, display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              transform: chatOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = chatOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = chatOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
            title={chatOpen ? 'Close Sam' : 'Chat with Sam'}
          >
            {chatOpen ? '✕' : '🤖'}
          </button>

          <style>{`
            @keyframes samPulseRing {
              0% { transform: scale(1); opacity: 0.7; }
              100% { transform: scale(1.65); opacity: 0; }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default LandingPage;
