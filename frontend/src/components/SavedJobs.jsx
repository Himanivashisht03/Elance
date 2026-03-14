// frontend/src/components/SavedJobs.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const BLUE   = '#4a6cf7';
const GRAD   = 'linear-gradient(135deg,#4a6cf7,#7c4dff)';
const LIGHT  = '#f0f4ff';
const CARD   = { background:'#fff', borderRadius:20, boxShadow:'0 4px 24px rgba(74,108,247,0.09)', border:'1px solid rgba(200,190,240,0.4)' };

const statusColors = {
  'Full Time':    { bg:'rgba(72,187,120,0.12)',  color:'#38a169' },
  'Part Time':    { bg:'rgba(237,137,54,0.12)',  color:'#c05621' },
  'Remote':       { bg:'rgba(74,108,247,0.12)',  color:'#4a6cf7' },
  'Internship':   { bg:'rgba(124,77,255,0.12)',  color:'#7c4dff' },
  'Contract':     { bg:'rgba(236,72,153,0.12)',  color:'#be185d' },
};

const Badge = ({ label }) => {
  const s = statusColors[label] || { bg:'rgba(74,108,247,0.1)', color:BLUE };
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, borderRadius:20, padding:'3px 10px' }}>
      {label}
    </span>
  );
};

export default function SavedJobs({ onNavigate }) {
  const { user } = useContext(AuthContext);
  const [savedJobs, setSavedJobs]   = useState([]);
  const [filter, setFilter]         = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [toast, setToast]           = useState('');

  /* load from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem('savedJobs');
    if (stored) {
      try { setSavedJobs(JSON.parse(stored)); } catch {}
    } else {
      /* demo jobs */
      const demo = [
        { id:1, title:'Frontend Developer', company:'TechCorp India', location:'Jaipur, India', type:'Full Time', salary:'₹8-12 LPA', skills:['React','JavaScript','CSS'], logo:'TC', savedAt:'2026-02-20', applied:false },
        { id:2, title:'UI/UX Designer', company:'DesignHub', location:'Remote', type:'Remote', salary:'₹6-9 LPA', skills:['Figma','Wireframing','Prototyping'], logo:'DH', savedAt:'2026-02-19', applied:false },
        { id:3, title:'Software Engineer Intern', company:'StartupXYZ', location:'Bangalore, India', type:'Internship', salary:'₹25k/month', skills:['Python','Django','SQL'], logo:'SX', savedAt:'2026-02-18', applied:true },
        { id:4, title:'React Developer', company:'WebSolutions', location:'Delhi, India', type:'Full Time', salary:'₹10-15 LPA', skills:['React','Redux','Node.js'], logo:'WS', savedAt:'2026-02-17', applied:false },
      ];
      setSavedJobs(demo);
      localStorage.setItem('savedJobs', JSON.stringify(demo));
    }
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3000); };

  const removeJob = (id) => {
    const updated = savedJobs.filter(j => j.id !== id);
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    showToast('Job removed from saved list');
  };

  const applyJob = (job) => {
    const updated = savedJobs.map(j => j.id === job.id ? { ...j, applied:true } : j);
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setApplyingJob(null); setCoverLetter('');
    showToast(`✅ Applied to ${job.title} at ${job.company}!`);
  };

  const filters = ['All', 'Full Time', 'Part Time', 'Remote', 'Internship', 'Contract'];

  const filtered = savedJobs.filter(j => {
    const matchFilter = filter === 'All' || j.type === filter;
    const matchSearch = !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7ff', fontFamily:"'Segoe UI',sans-serif", padding:'28px 32px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#2d3748', color:'white', padding:'12px 20px', borderRadius:12, zIndex:9999, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <button onClick={() => onNavigate && onNavigate('profile')} style={{ background:'none', border:'none', color:BLUE, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:6, padding:0 }}>
            ← Back to Profile
          </button>
          <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>Saved Jobs</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>{savedJobs.length} jobs saved · {savedJobs.filter(j=>j.applied).length} applied</p>
        </div>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
          <input
            value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            placeholder="Search saved jobs..."
            style={{ paddingLeft:36, padding:'10px 16px 10px 36px', borderRadius:20, border:'1.5px solid rgba(120,100,210,0.25)', fontSize:13, outline:'none', width:220 }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'7px 16px', borderRadius:20, border:'1.5px solid',
            borderColor: filter===f ? BLUE : 'rgba(120,100,210,0.2)',
            background: filter===f ? BLUE : 'white',
            color: filter===f ? 'white' : '#4a5568',
            fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s'
          }}>{f}</button>
        ))}
      </div>

      {/* Jobs grid */}
      {filtered.length === 0 ? (
        <div style={{ ...CARD, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔖</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:8 }}>No saved jobs found</div>
          <div style={{ fontSize:13, color:'#718096', marginBottom:20 }}>Save jobs while browsing to see them here</div>
          <button onClick={()=>onNavigate&&onNavigate('search')} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
            Find Jobs
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {filtered.map(job => (
            <div key={job.id} style={{ ...CARD, padding:20, transition:'transform 0.18s,box-shadow 0.18s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(74,108,247,0.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 24px rgba(74,108,247,0.09)';}}>
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:14, flexShrink:0 }}>
                    {job.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#2d3748' }}>{job.title}</div>
                    <div style={{ fontSize:12, color:'#718096' }}>{job.company}</div>
                  </div>
                </div>
                <button onClick={()=>removeJob(job.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fc8181', fontSize:18, padding:4 }} title="Remove">🗑</button>
              </div>

              {/* Info */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                <Badge label={job.type} />
                <span style={{ fontSize:12, color:'#718096', display:'flex', alignItems:'center', gap:4 }}>📍 {job.location}</span>
                <span style={{ fontSize:12, color:'#48bb78', fontWeight:600 }}>💰 {job.salary}</span>
              </div>

              {/* Skills */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                {job.skills.map(s=>(
                  <span key={s} style={{ background:LIGHT, color:BLUE, fontSize:11, fontWeight:600, borderRadius:10, padding:'3px 10px' }}>{s}</span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                {job.applied ? (
                  <span style={{ flex:1, textAlign:'center', padding:'9px', background:'rgba(72,187,120,0.1)', color:'#38a169', borderRadius:20, fontSize:12, fontWeight:600 }}>
                    ✅ Applied
                  </span>
                ) : (
                  <button onClick={()=>setApplyingJob(job)} style={{ flex:1, background:GRAD, color:'white', border:'none', borderRadius:20, padding:'9px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                    Apply Now
                  </button>
                )}
                <button style={{ padding:'9px 14px', background:'white', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:20, cursor:'pointer', fontSize:13 }}>
                  👁
                </button>
              </div>
              <div style={{ fontSize:11, color:'#a0aec0', marginTop:8, textAlign:'right' }}>Saved {job.savedAt}</div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ ...CARD, padding:28, width:'100%', maxWidth:480 }}>
            <h3 style={{ margin:'0 0 6px', fontWeight:800, fontSize:18, color:'#2d3748' }}>Apply for {applyingJob.title}</h3>
            <p style={{ margin:'0 0 18px', fontSize:13, color:'#718096' }}>{applyingJob.company} · {applyingJob.location}</p>
            <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:6 }}>Cover Letter (optional)</label>
            <textarea
              value={coverLetter} onChange={e=>setCoverLetter(e.target.value)}
              placeholder="Write a brief cover letter..."
              rows={5}
              style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:12, padding:'10px 14px', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }}
            />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={()=>applyJob(applyingJob)} style={{ flex:1, background:GRAD, color:'white', border:'none', borderRadius:20, padding:'11px', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                Submit Application
              </button>
              <button onClick={()=>setApplyingJob(null)} style={{ padding:'11px 18px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:20, cursor:'pointer', fontWeight:600, fontSize:13, color:'#718096' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
