// frontend/src/pages/PublicPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/JobService';
import elanceLogo from '../assets/images/elance-logo.jpg';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
const getCurrencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency || '$';

const fmtSalary = (job) => {
  const mn = job.salaryRange?.min ?? job.salaryMin;
  const mx = job.salaryRange?.max ?? job.salaryMax;
  const cu = job.salaryRange?.currency ?? job.currency ?? 'USD';
  if (!mn && !mx) return null;
  const sym = getCurrencySymbol(cu);
  return `${sym}${Number(mn).toLocaleString()} – ${sym}${Number(mx).toLocaleString()}`;
};

const timeAgo = (d) => {
  if (!d) return 'recently';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`;
};

const fmtNum = (n) => {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `${n}+`;
};

const BG_SLIDES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=80',
];

export default function PublicPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState('home');
  const [slide, setSlide] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({
    companiesHiring: null,
    placedThisMonth: null,
    placementRate: null,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await jobService.getPublicStats();
        setStats({
          companiesHiring: data.companiesHiring ?? null,
          placedThisMonth: data.placedThisMonth ?? null,
          placementRate:   data.placementRate   ?? null,
          loading: false,
        });
      } catch {
        try {
          const res = await jobService.getPublicJobs({ page: 1, limit: 1 });
          setStats({
            companiesHiring: res.totalCompanies  ?? null,
            placedThisMonth: res.placedThisMonth ?? null,
            placementRate:   res.placementRate   ?? null,
            loading: false,
          });
        } catch {
          setStats(s => ({ ...s, loading: false }));
        }
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p + 1) % BG_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const fetchJobs = useCallback(async (pg = 1) => {
    setLoadingJobs(true);
    try {
      const params = { page: pg, limit: 9 };
      if (search) params.search = search;
      if (locationFilter) params.location = locationFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await jobService.getPublicJobs(params);
      setJobs(res.jobs || []);
      setTotalJobs(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(pg);
    } catch { setJobs([]); }
    finally { setLoadingJobs(false); }
  }, [search, locationFilter, typeFilter]);

  useEffect(() => {
    if (section === 'jobs') fetchJobs(1);
  }, [section, fetchJobs]);

  const nav = (s) => setSection(s);

  const companiesDisplay = stats.companiesHiring != null ? fmtNum(stats.companiesHiring) : '—';
  const placedDisplay    = stats.placedThisMonth != null ? fmtNum(stats.placedThisMonth) : '—';
  const rateDisplay      = stats.placementRate   != null ? `${Math.round(stats.placementRate)}%` : '—';

  // ── Navbar ────────────────────────────────────────────────
  const Navbar = () => (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300,
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 60px',
      background: section === 'home' ? 'transparent' : 'linear-gradient(135deg,#4a6cf7,#7c4dff)',
      backdropFilter: section === 'home' ? 'none' : 'blur(10px)',
      transition: 'background 0.4s',
      boxShadow: section === 'home' ? 'none' : '0 2px 20px rgba(74,108,247,0.35)',
    }}>
      {/* ── LOGO ── */}
      <div onClick={() => nav('home')} style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <img
          src={elanceLogo}
          alt="ELance"
          style={{
            height: 36,
            width: 36,
            borderRadius: 10,
            objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: 0.5 }}>
          ELance
        </span>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {['home', 'jobs', 'about'].map(s => (
          <button key={s} onClick={() => nav(s)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: section === s ? 'white' : 'rgba(255,255,255,0.8)',
            fontSize: 15, fontWeight: section === s ? 700 : 400,
            borderBottom: section === s ? '2px solid white' : '2px solid transparent',
            paddingBottom: 4, textTransform: 'capitalize',
          }}>
            {s === 'jobs' ? 'Find Jobs' : s === 'about' ? 'About Us' : 'Home'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/login')} style={{
          background: 'rgba(255,255,255,0.15)', color: 'white',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: 25,
          padding: '9px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Log In</button>
        <button onClick={() => navigate('/signup')} style={{
          background: 'white', color: '#4a6cf7', border: 'none', borderRadius: 25,
          padding: '10px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        }}>Sign Up</button>
      </div>
    </nav>
  );

  // ── Home Section ─────────────────────────────────────────
  const HomeSection = () => (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {BG_SLIDES.map((img, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === slide ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,20,60,0.6)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(150,150,220,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 60px 60px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30, padding: '6px 18px', marginBottom: 24, display: 'inline-block' }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
            🚀 Trusted by {stats.loading ? '…' : companiesDisplay} Companies
          </span>
        </div>

        <h1 style={{ fontSize: 62, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 20, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          Find your <span style={{ color: '#a78bfa' }}>dream job</span><br />
          that fits your future
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
          Collaborate in inspiring spaces. Connect with top employers and discover opportunities tailored to your skills.
        </p>

        <div style={{ background: 'white', borderRadius: 20, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', maxWidth: 700, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', marginBottom: 40 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <input type="text" placeholder="Job Title or Keywords"
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') nav('jobs'); }}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#2d3748' }} />
          <div style={{ width: 1, height: 30, background: '#e2e8f0' }} />
          <span style={{ fontSize: 18 }}>📍</span>
          <input type="text" placeholder="City, Remote..."
            value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#2d3748' }} />
          <button onClick={() => nav('jobs')} style={{
            background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', color: 'white',
            border: 'none', borderRadius: 14, padding: '12px 28px', fontSize: 15,
            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Find it now</button>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          {[
            { value: stats.loading ? '…' : companiesDisplay, label: 'Companies Hiring'  },
            { value: stats.loading ? '…' : placedDisplay,    label: 'Placed This Month' },
            { value: stats.loading ? '…' : rateDisplay,      label: 'Placement Rate'    },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '14px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 30, display: 'flex', gap: 8 }}>
          {BG_SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 24 : 8, height: 8, borderRadius: 4,
              background: i === slide ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '14px 60px', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {[
          `✓ Trusted by ${stats.loading ? '…' : companiesDisplay} companies`,
          '🔒 Secure & verified',
          `📊 ${stats.loading ? '…' : rateDisplay} placement rate`,
          '🌍 Remote & hybrid options',
        ].map((t, i) => (
          <span key={i} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  );

  // ── Job Card ─────────────────────────────────────────────
  const JobCard = ({ job }) => {
    const salary = fmtSalary(job);
    const skills = (job.requiredSkills || []).map(s => typeof s === 'object' ? s.name : s);
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: '20px 24px',
        border: '1.5px solid #e8ecf4', boxShadow: '0 4px 16px rgba(74,108,247,0.06)',
        transition: 'all 0.25s', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(74,108,247,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,108,247,0.06)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 4 }}>{job.title}</div>
            <div style={{ fontSize: 14, color: '#718096', fontWeight: 500 }}>{job.company}</div>
          </div>
          <div style={{
            background: job.type === 'Remote' ? '#ebf8ff' : '#f0fff4',
            color: job.type === 'Remote' ? '#2b6cb0' : '#276749',
            borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{job.type}</div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#718096' }}>📍 {job.location}</span>
          <span style={{ fontSize: 13, color: '#718096' }}>💼 {job.experience}</span>
          {salary && <span style={{ fontSize: 13, color: '#4a6cf7', fontWeight: 600 }}>{salary}</span>}
        </div>

        {skills.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {skills.slice(0, 4).map(s => (
              <span key={s} style={{ background: 'rgba(74,108,247,0.08)', color: '#4a6cf7', borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 500 }}>{s}</span>
            ))}
            {skills.length > 4 && <span style={{ fontSize: 12, color: '#a0aec0' }}>+{skills.length - 4} more</span>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: '#a0aec0' }}>{timeAgo(job.createdAt)}</span>
          <button onClick={() => navigate('/login')} style={{
            background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', color: 'white',
            border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Login to Apply</button>
        </div>
      </div>
    );
  };

  // ── Jobs Section ─────────────────────────────────────────
  const JobsSection = () => (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg,#f0f4ff,#f5f0ff)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Find Jobs</h2>
        <p style={{ color: '#718096', marginBottom: 28 }}>Browse {totalJobs} open positions — login to apply</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', background: 'white', padding: '16px 20px', borderRadius: 16, boxShadow: '0 4px 16px rgba(74,108,247,0.06)' }}>
          <input type="text" placeholder="🔍 Search jobs..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchJobs(1)}
            style={{ flex: 2, minWidth: 200, border: '1.5px solid #e8ecf4', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
          <input type="text" placeholder="📍 Location"
            value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
            style={{ flex: 1, minWidth: 140, border: '1.5px solid #e8ecf4', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ flex: 1, minWidth: 140, border: '1.5px solid #e8ecf4', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', background: 'white' }}>
            <option value="">All Types</option>
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => fetchJobs(1)} style={{
            background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', color: 'white',
            border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Search</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, color: 'white',
        }}>
          <span style={{ fontWeight: 600 }}>🚀 Login to save jobs, apply directly & see your skill match %</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Log In</button>
            <button onClick={() => navigate('/signup')} style={{ background: 'white', color: '#4a6cf7', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sign Up Free</button>
          </div>
        </div>

        {loadingJobs ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e8ecf4', borderTopColor: '#4a6cf7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 20 }}>
              {jobs.map(j => <JobCard key={j._id} job={j} />)}
              {jobs.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#718096' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
                  <p style={{ fontSize: 18, fontWeight: 600 }}>No jobs found</p>
                  <p>Try adjusting your search filters</p>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button onClick={() => fetchJobs(page - 1)} disabled={page === 1}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8ecf4', background: page === 1 ? '#f7f8fc' : 'white', cursor: page === 1 ? 'default' : 'pointer', color: '#718096' }}>←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => fetchJobs(p)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', borderColor: page === p ? '#4a6cf7' : '#e8ecf4', background: page === p ? '#4a6cf7' : 'white', color: page === p ? 'white' : '#718096', fontWeight: page === p ? 700 : 400, cursor: 'pointer' }}>{p}</button>
                ))}
                <button onClick={() => fetchJobs(page + 1)} disabled={page === totalPages}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e8ecf4', background: page === totalPages ? '#f7f8fc' : 'white', cursor: page === totalPages ? 'default' : 'pointer', color: '#718096' }}>→</button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── About Section ─────────────────────────────────────────
  const AboutSection = () => (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg,#f0f4ff,#f5f0ff)', paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>About ELance</h2>
        <p style={{ fontSize: 18, color: '#718096', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7 }}>
          We connect talented professionals with opportunities that match their skills and career goals.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48 }}>
          {[
            { icon: '🎯', title: 'Smart Matching',    desc: 'AI-powered skill matching ensures you see jobs that fit your profile.' },
            { icon: '🚀', title: 'Fast Hiring',       desc: 'Our streamlined process gets you from application to offer faster.' },
            { icon: '🌍', title: 'Remote First',      desc: 'Browse thousands of remote, hybrid, and in-office opportunities.' },
            { icon: '📊', title: 'Real Analytics',    desc: 'Track your application journey with detailed insights.' },
            { icon: '🔒', title: 'Verified Employers',desc: 'All companies on ELance are verified and trusted.' },
            { icon: '💡', title: 'Career Tools',      desc: 'Resume parsing, career planner and skill demand radar included.' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: '24px 20px', textAlign: 'center', border: '1.5px solid #e8ecf4', boxShadow: '0 4px 16px rgba(74,108,247,0.06)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(135deg,#4a6cf7,#7c4dff)', borderRadius: 20, padding: '36px 40px', color: 'white' }}>
          <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to find your dream job?</h3>
          <p style={{ opacity: 0.85, marginBottom: 24 }}>Join thousands of professionals who found their perfect role on ELance.</p>
          <button onClick={() => navigate('/signup')} style={{ background: 'white', color: '#4a6cf7', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Get Started Free</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar />
      <div style={{ paddingTop: section === 'home' ? 0 : 64 }}>
        {section === 'home' && <HomeSection />}
        {section === 'jobs'  && <JobsSection />}
        {section === 'about' && <AboutSection />}
      </div>
    </div>
  );
}
