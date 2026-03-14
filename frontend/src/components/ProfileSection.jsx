// frontend/src/components/ProfileSection.jsx
// ✅ Self-contained: SavedJobs, Applications, JobAlerts, Settings — sab andar hain
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { AuthContext } from '../contexts/AuthContext';
import { jobService } from '../services/JobService';

/* ─── color tokens ─── */
const BLUE  = '#4a6cf7';
const GRAD  = 'linear-gradient(135deg,#4a6cf7,#7c4dff)';
const LIGHT = '#f0f4ff';
const CARD  = { background:'#fff', borderRadius:20, boxShadow:'0 4px 24px rgba(74,108,247,0.09)', border:'1px solid rgba(200,190,240,0.4)' };

/* ══════════════════════════════════════════════
   SHARED SMALL COMPONENTS
══════════════════════════════════════════════ */
const SkillTag = ({ label, onRemove }) => (
  <span style={{ background:'rgba(74,108,247,0.1)', color:BLUE, fontSize:12, fontWeight:600, borderRadius:20, padding:'4px 12px', border:'1px solid rgba(74,108,247,0.2)', display:'inline-flex', alignItems:'center', gap:5 }}>
    {label}
    {onRemove && <span onClick={onRemove} style={{ cursor:'pointer', color:'#fc8181', fontWeight:800, fontSize:13 }}>×</span>}
  </span>
);

const EditBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background:'transparent', border:'none', color:'#718096', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6 }}
    onMouseEnter={e=>e.currentTarget.style.background='rgba(74,108,247,0.08)'}
    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
    ✏️ Edit
  </button>
);

const SectionBlock = ({ title, badge, onEdit, children }) => (
  <div style={{ marginBottom:24, borderBottom:'1px solid rgba(200,190,240,0.3)', paddingBottom:20 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{title}</span>
        {badge}
      </div>
      {onEdit && <EditBtn onClick={onEdit} />}
    </div>
    {children}
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type='text' }) => (
  <div>
    <label style={{ fontSize:11, color:'#718096', fontWeight:600, display:'block', marginBottom:4 }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder||label}
      style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', color:'#2d3748' }}
      onFocus={e=>e.target.style.border=`1.5px solid ${BLUE}`}
      onBlur={e=>e.target.style.border='1.5px solid rgba(120,100,210,0.25)'}
    />
  </div>
);

const SaveCancel = ({ onSave, onCancel }) => (
  <div style={{ display:'flex', gap:10, marginTop:14 }}>
    <button onClick={onSave} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'9px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Save Changes</button>
    <button onClick={onCancel} style={{ background:'transparent', color:'#718096', border:'1.5px solid #e2e8f0', borderRadius:20, padding:'9px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Cancel</button>
  </div>
);

const Toast = ({ msg }) => msg ? (
  <div style={{ position:'fixed', top:20, right:20, background:'#2d3748', color:'white', padding:'12px 20px', borderRadius:12, zIndex:99999, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
    {msg}
  </div>
) : null;

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background:'none', border:'none', color:BLUE, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:10, padding:0, display:'flex', alignItems:'center', gap:5 }}>
    ← Back to Profile
  </button>
);

/* ══════════════════════════════════════════════
   PAGE 1 — SAVED JOBS
══════════════════════════════════════════════ */
const SavedJobsPage = ({ onBack }) => {
  const [jobs, setJobs]         = useState([]);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [applyJob, setApplyJob] = useState(null);
  const [cover, setCover]       = useState('');
  const [toast, setToast]       = useState('');
  const [loading, setLoading]   = useState(true);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const { jobService } = await import('../services/JobService');
        const saved = await jobService.getSavedJobs();
        setJobs(saved || []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const remove = async (id) => {
    try {
      const { jobService } = await import('../services/JobService');
      await jobService.toggleSaveJob(id);
      setJobs(prev => prev.filter(j => (j._id || j.id) !== id));
      showToast('Job removed from saved');
    } catch { showToast('Failed to remove job'); }
  };
  const submitApply = async (job) => {
    try {
      const { jobService } = await import('../services/JobService');
      await jobService.applyForJob(job._id || job.id, cover);
      setJobs(prev => prev.map(j => (j._id||j.id)===(job._id||job.id) ? {...j, applied:true} : j));
      setApplyJob(null); setCover('');
      showToast(`✅ Applied to ${job.title}!`);
    } catch(err) { showToast(err.message || 'Apply failed'); }
  };

  const typeColors = { 'Full-time':['#38a169','rgba(72,187,120,0.1)'], 'Full Time':['#38a169','rgba(72,187,120,0.1)'], 'Remote':['#4a6cf7','rgba(74,108,247,0.1)'], 'Internship':['#7c4dff','rgba(124,77,255,0.1)'], 'Part Time':['#c05621','rgba(237,137,54,0.12)'], 'Contract':['#be185d','rgba(236,72,153,0.12)'] };

  const filtered = jobs.filter(j=>{
    const mf = filter==='All'||j.type===filter;
    const ms = !search||j.title?.toLowerCase().includes(search.toLowerCase())||j.company?.toLowerCase().includes(search.toLowerCase());
    return mf&&ms;
  });

  const formatSalary = (job) => {
    const syms = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
    const mn = job.salaryRange?.min;
    const mx = job.salaryRange?.max;
    const cu = job.salaryRange?.currency || 'USD';
    const sym = syms[cu] || cu;
    if (!mn && !mx) return null;
    return `${sym}${Number(mn).toLocaleString()} – ${sym}${Number(mx).toLocaleString()}`;
  };

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#f5f7ff' }}>
      <Toast msg={toast} />
      <BackBtn onClick={onBack} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>Saved Jobs</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>{jobs.length} saved · {jobs.filter(j=>j.applied).length} applied</p>
        </div>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs..."
            style={{ paddingLeft:34, padding:'9px 16px 9px 34px', borderRadius:20, border:'1.5px solid rgba(120,100,210,0.25)', fontSize:13, outline:'none', width:200 }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['All','Full Time','Part Time','Remote','Internship','Contract'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'7px 16px', borderRadius:20, border:'1.5px solid', borderColor:filter===f?BLUE:'rgba(120,100,210,0.2)', background:filter===f?BLUE:'white', color:filter===f?'white':'#4a5568', fontSize:12, fontWeight:600, cursor:'pointer' }}>{f}</button>
        ))}
      </div>
      {filtered.length===0 ? (
        <div style={{ ...CARD, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔖</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:8 }}>No saved jobs found</div>
          <div style={{ fontSize:13, color:'#718096' }}>Save jobs while browsing to see them here</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {filtered.map(job=>{
            const [tc,bc] = typeColors[job.type]||['#718096','#f7fafc'];
            const jobId = job._id || job.id;
            const jobSkills = (job.requiredSkills || job.skills || []).map(s => typeof s === 'object' ? s.name : s);
            const salary = formatSalary(job) || job.salary || null;
            return (
              <div key={jobId} style={{ ...CARD, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13, flexShrink:0 }}>{(job.company||'?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#2d3748' }}>{job.title}</div>
                      <div style={{ fontSize:12, color:'#718096' }}>{job.company}</div>
                    </div>
                  </div>
                  <button onClick={()=>remove(jobId)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fc8181', fontSize:18, padding:2 }}>🗑</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  <span style={{ background:bc, color:tc, fontSize:11, fontWeight:600, borderRadius:20, padding:'3px 10px' }}>{job.type}</span>
                  <span style={{ fontSize:12, color:'#718096' }}>📍 {job.location}</span>
                  {salary && <span style={{ fontSize:12, color:'#38a169', fontWeight:600 }}>💰 {salary}</span>}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {jobSkills.slice(0,5).map(s=><span key={s} style={{ background:LIGHT, color:BLUE, fontSize:11, fontWeight:600, borderRadius:10, padding:'3px 10px' }}>{s}</span>)}
                </div>
                {job.applied
                  ? <span style={{ display:'block', textAlign:'center', padding:'9px', background:'rgba(72,187,120,0.1)', color:'#38a169', borderRadius:20, fontSize:12, fontWeight:600 }}>✅ Applied</span>
                  : <button onClick={()=>setApplyJob(job)} style={{ width:'100%', background:GRAD, color:'white', border:'none', borderRadius:20, padding:'9px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Apply Now</button>
                }
                <div style={{ fontSize:11, color:'#a0aec0', marginTop:8, textAlign:'right' }}>
                  {job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : (job.savedAt ? `Saved ${job.savedAt}` : '')}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {applyJob && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, padding:20 }}>
          <div style={{ ...CARD, padding:28, width:'100%', maxWidth:480 }}>
            <h3 style={{ margin:'0 0 6px', fontWeight:800, fontSize:18, color:'#2d3748' }}>Apply for {applyJob.title}</h3>
            <p style={{ margin:'0 0 16px', fontSize:13, color:'#718096' }}>{applyJob.company} · {applyJob.location}</p>
            <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:6 }}>Cover Letter (optional)</label>
            <textarea value={cover} onChange={e=>setCover(e.target.value)} placeholder="Write a brief cover letter..." rows={5}
              style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:12, padding:'10px 14px', fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }} />
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={()=>submitApply(applyJob)} style={{ flex:1, background:GRAD, color:'white', border:'none', borderRadius:20, padding:'11px', fontWeight:700, cursor:'pointer', fontSize:14 }}>Submit Application</button>
              <button onClick={()=>setApplyJob(null)} style={{ padding:'11px 18px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:20, cursor:'pointer', fontWeight:600, fontSize:13, color:'#718096' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PAGE 2 — APPLICATIONS
══════════════════════════════════════════════ */
const ApplicationsPage = ({ onBack }) => {
  const [apps, setApps]       = useState([]);
  const [filter, setFilter]   = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast]     = useState('');
  const [loading, setLoading] = useState(true);
  const showToast = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  useEffect(() => {
    const load = async () => {
      try {
        const { jobService } = await import('../services/JobService');
        const data = await jobService.getUserApplications();
        setApps(data || []);
      } catch {
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_CFG = {
    Applied:{color:'#4a6cf7',bg:'rgba(74,108,247,0.1)',icon:'📤'},
    Reviewing:{color:'#ed8936',bg:'rgba(237,137,54,0.12)',icon:'👀'},
    Interview:{color:'#7c4dff',bg:'rgba(124,77,255,0.12)',icon:'🎯'},
    Offered:{color:'#38a169',bg:'rgba(72,187,120,0.12)',icon:'🎉'},
    Rejected:{color:'#e53e3e',bg:'rgba(229,62,62,0.1)',icon:'❌'},
    pending:{color:'#ed8936',bg:'rgba(237,137,54,0.12)',icon:'⏳'},
    reviewed:{color:'#4a6cf7',bg:'rgba(74,108,247,0.1)',icon:'👀'},
    shortlisted:{color:'#7c4dff',bg:'rgba(124,77,255,0.12)',icon:'🎯'},
    accepted:{color:'#38a169',bg:'rgba(72,187,120,0.12)',icon:'🎉'},
    rejected:{color:'#e53e3e',bg:'rgba(229,62,62,0.1)',icon:'❌'},
  };

  const filtered = apps.filter(a => {
    const status = a.status || 'pending';
    return filter === 'All' || status === filter.toLowerCase() || status === filter;
  });

  const stats = ['pending','reviewed','shortlisted','accepted','rejected'].map(s=>({
    label: s.charAt(0).toUpperCase()+s.slice(1),
    count: apps.filter(a=>a.status===s).length,
    ...(STATUS_CFG[s]||{color:'#718096',bg:'#f5f5f5',icon:'📋'})
  }));

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#f5f7ff' }}>
      <Toast msg={toast} />
      <BackBtn onClick={onBack} />
      <h2 style={{ margin:'0 0 4px', fontWeight:800, fontSize:22, color:'#2d3748' }}>My Applications</h2>
      <p style={{ margin:'0 0 20px', fontSize:13, color:'#718096' }}>{apps.length} total applications</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ ...CARD, padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:20, color:s.color }}>{s.count}</div>
            <div style={{ fontSize:11, color:'#718096', fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['All',...Object.keys(STATUS_CFG)].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'7px 14px', borderRadius:20, border:'1.5px solid', borderColor:filter===f?BLUE:'rgba(120,100,210,0.2)', background:filter===f?BLUE:'white', color:filter===f?'white':'#4a5568', fontSize:12, fontWeight:600, cursor:'pointer' }}>{f}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(app=>{
          const jobData = app.jobId || {};
          const appStatus = app.status || 'pending';
          const cfg = STATUS_CFG[appStatus]||STATUS_CFG['pending']||{color:'#718096',bg:'#f5f5f5',icon:'📋'};
          const appId = app._id || app.id;
          const isExp = expanded===appId;
          const skills = (jobData.requiredSkills || []).map(s => typeof s === 'object' ? s.name : s);
          return (
            <div key={appId} style={{ ...CARD, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:46, height:46, borderRadius:12, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:15, flexShrink:0 }}>{(jobData.company||'?').charAt(0).toUpperCase()}</div>
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{jobData.title || app.title || 'Unknown Job'}</div>
                  <div style={{ fontSize:12, color:'#718096' }}>{jobData.company || app.company || ''} · {jobData.location || app.location || ''}</div>
                  <div style={{ fontSize:11, color:'#a0aec0', marginTop:2 }}>Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}</div>
                </div>
                <span style={{ background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700, borderRadius:20, padding:'4px 12px' }}>{cfg.icon} {appStatus.charAt(0).toUpperCase()+appStatus.slice(1)}</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setExpanded(isExp?null:appId)} style={{ padding:'7px 14px', background:LIGHT, color:BLUE, border:'none', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600 }}>{isExp?'Hide':'Details'}</button>
                </div>
              </div>
              {isExp&&(
                <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid rgba(200,190,240,0.3)' }}>
                  {skills.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:12, color:'#718096', fontWeight:600, marginBottom:8 }}>Required Skills</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {skills.map(s=><span key={s} style={{ background:LIGHT, color:BLUE, fontSize:11, fontWeight:600, borderRadius:10, padding:'3px 10px' }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {app.notes && (
                    <div style={{ fontSize:12, color:'#718096', background:'#f7f8fc', borderRadius:10, padding:'10px 12px' }}>
                      <strong>Note from recruiter:</strong> {app.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PAGE 3 — JOB ALERTS
══════════════════════════════════════════════ */
const JobAlertsPage = ({ onBack }) => {
  const [alerts, setAlerts]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ keywords:'', location:'', type:'Full Time', frequency:'Daily', salary:'' });
  const [toast, setToast]       = useState('');
  const showToast = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  useEffect(() => {
    const s = localStorage.getItem('jobAlerts');
    if (s) { try { setAlerts(JSON.parse(s)); return; } catch {} }
    const demo = [
      { id:1, keywords:'React Developer', location:'Jaipur', type:'Full Time', frequency:'Daily', salary:'₹8L+', active:true, createdAt:'Feb 20, 2026', matches:12 },
      { id:2, keywords:'UI/UX Designer', location:'Remote', type:'Remote', frequency:'Weekly', salary:'', active:true, createdAt:'Feb 18, 2026', matches:7 },
      { id:3, keywords:'Python Intern', location:'Bangalore', type:'Internship', frequency:'Instant', salary:'', active:false, createdAt:'Feb 15, 2026', matches:3 },
    ];
    setAlerts(demo); localStorage.setItem('jobAlerts', JSON.stringify(demo));
  }, []);

  const saveAll = u => { setAlerts(u); localStorage.setItem('jobAlerts', JSON.stringify(u)); };
  const submit = () => {
    if(!form.keywords.trim()) return;
    if(editId!==null) { saveAll(alerts.map(a=>a.id===editId?{...a,...form}:a)); showToast('Alert updated!'); }
    else { saveAll([...alerts,{...form,id:Date.now(),createdAt:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),matches:0,active:true}]); showToast('✅ Alert created!'); }
    setForm({keywords:'',location:'',type:'Full Time',frequency:'Daily',salary:''}); setShowForm(false); setEditId(null);
  };
  const toggle = id => { const u=alerts.map(a=>a.id===id?{...a,active:!a.active}:a); saveAll(u); showToast(u.find(a=>a.id===id).active?'🔔 Activated':'🔕 Paused'); };
  const del = id => { saveAll(alerts.filter(a=>a.id!==id)); showToast('Deleted'); };
  const edit = a => { setForm({keywords:a.keywords,location:a.location,type:a.type,frequency:a.frequency,salary:a.salary||''}); setEditId(a.id); setShowForm(true); };
  const setF = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#f5f7ff' }}>
      <Toast msg={toast} />
      <BackBtn onClick={onBack} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>Job Alerts</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>{alerts.filter(a=>a.active).length} active · {alerts.filter(a=>!a.active).length} paused</p>
        </div>
        <button onClick={()=>{setEditId(null);setForm({keywords:'',location:'',type:'Full Time',frequency:'Daily',salary:''});setShowForm(true);}} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'11px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>+ Create Alert</button>
      </div>
      {showForm&&(
        <div style={{ ...CARD, padding:24, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 16px', fontWeight:700, fontSize:16, color:'#2d3748' }}>{editId?'Edit Alert':'New Job Alert'}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div style={{ gridColumn:'1/-1' }}><InputField label="Job Keywords *" value={form.keywords} onChange={setF('keywords')} placeholder="e.g. React Developer, UI/UX" /></div>
            <InputField label="Location" value={form.location} onChange={setF('location')} placeholder="e.g. Jaipur, Remote" />
            <InputField label="Min Salary (optional)" value={form.salary} onChange={setF('salary')} placeholder="e.g. ₹6 LPA" />
            <div>
              <label style={{ fontSize:11, color:'#718096', fontWeight:600, display:'block', marginBottom:4 }}>Job Type</label>
              <select value={form.type} onChange={setF('type')} style={{ width:'100%', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', background:'white' }}>
                {['Full Time','Part Time','Remote','Internship','Contract'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#718096', fontWeight:600, display:'block', marginBottom:6 }}>Frequency</label>
              <div style={{ display:'flex', gap:6 }}>
                {['Instant','Daily','Weekly'].map(f=>(
                  <button key={f} onClick={()=>setForm(p=>({...p,frequency:f}))} style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'1.5px solid', borderColor:form.frequency===f?BLUE:'rgba(120,100,210,0.2)', background:form.frequency===f?LIGHT:'white', color:form.frequency===f?BLUE:'#718096', fontSize:12, fontWeight:600, cursor:'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={submit} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>{editId?'Update':'Create Alert 🔔'}</button>
            <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{ background:'white', color:'#718096', border:'1.5px solid #e2e8f0', borderRadius:20, padding:'10px 18px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}
      {alerts.length===0?(
        <div style={{ ...CARD, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔔</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:8 }}>No alerts yet</div>
          <button onClick={()=>setShowForm(true)} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13, marginTop:8 }}>Create First Alert</button>
        </div>
      ):(
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {alerts.map(a=>(
            <div key={a.id} style={{ ...CARD, padding:20, opacity:a.active?1:0.75 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:a.active?GRAD:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🔔</div>
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{a.keywords}</div>
                  <div style={{ fontSize:12, color:'#718096', marginTop:2 }}>{a.location&&`📍 ${a.location} · `}{a.type} · {a.frequency}{a.salary&&` · Min ${a.salary}`}</div>
                  <div style={{ fontSize:11, color:'#a0aec0', marginTop:2 }}>Created {a.createdAt}</div>
                </div>
                <div style={{ background:LIGHT, borderRadius:12, padding:'8px 14px', textAlign:'center' }}>
                  <div style={{ fontWeight:800, fontSize:18, color:BLUE }}>{a.matches}</div>
                  <div style={{ fontSize:10, color:'#718096', fontWeight:600 }}>Matches</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div onClick={()=>toggle(a.id)} style={{ width:44, height:24, borderRadius:20, cursor:'pointer', background:a.active?BLUE:'#e2e8f0', position:'relative' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:a.active?22:4, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize:10, color:'#718096', fontWeight:600 }}>{a.active?'On':'Off'}</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>edit(a)} style={{ padding:'7px 12px', background:LIGHT, color:BLUE, border:'none', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600 }}>✏️ Edit</button>
                  <button onClick={()=>del(a.id)} style={{ padding:'7px 10px', background:'rgba(229,62,62,0.08)', color:'#e53e3e', border:'none', borderRadius:20, cursor:'pointer', fontSize:13 }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   PAGE 4 — SETTINGS
══════════════════════════════════════════════ */
const SettingsPage = ({ onBack }) => {
  const { user, logout } = useContext(AuthContext);
  const { profile, updateProfile, resetProfile } = useProfile();
  const [tab, setTab]     = useState('Account');
  const [toast, setToast] = useState('');
  const [delText, setDelText] = useState('');
  const [showDel, setShowDel] = useState(false);
  const [pwForm, setPwForm]   = useState({ current:'', newP:'', confirm:'' });
  const [pwErr, setPwErr]     = useState('');
  const [accForm, setAccForm] = useState({ name:profile.name||user?.name||user?.username||'', email:profile.email||user?.email||'', phone:profile.phone||'', language:'English' });
  const [notifs, setNotifs]   = useState({ emailJobs:true, emailApps:true, emailMsg:false, pushJobs:true, pushApps:true, smsAlerts:false });
  const [privacy, setPrivacy] = useState({ publicProfile:true, showEmail:false, showPhone:false, resumePublic:false, allowContact:true });

  useEffect(()=>{
    const n=localStorage.getItem('cfg_notifs'); if(n) try{setNotifs(JSON.parse(n));}catch{}
    const p=localStorage.getItem('cfg_privacy'); if(p) try{setPrivacy(JSON.parse(p));}catch{}
  },[]);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const Toggle = ({ checked, onChange }) => (
    <div onClick={onChange} style={{ width:44, height:24, borderRadius:20, cursor:'pointer', background:checked?BLUE:'#e2e8f0', position:'relative', flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:checked?22:4, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
  const Row = ({ label, sub, checked, onChange }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(200,190,240,0.2)' }}>
      <div><div style={{ fontSize:13, fontWeight:600, color:'#2d3748' }}>{label}</div>{sub&&<div style={{ fontSize:11, color:'#718096', marginTop:2 }}>{sub}</div>}</div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
  const tn = k => { const u={...notifs,[k]:!notifs[k]}; setNotifs(u); localStorage.setItem('cfg_notifs',JSON.stringify(u)); };
  const tp = k => { const u={...privacy,[k]:!privacy[k]}; setPrivacy(u); localStorage.setItem('cfg_privacy',JSON.stringify(u)); };

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#f5f7ff' }}>
      <Toast msg={toast} />
      <BackBtn onClick={onBack} />
      <h2 style={{ margin:'0 0 4px', fontWeight:800, fontSize:22, color:'#2d3748' }}>Settings</h2>
      <p style={{ margin:'0 0 24px', fontSize:13, color:'#718096' }}>Manage your account preferences</p>
      <div style={{ display:'flex', gap:24 }}>
        <div style={{ width:190, flexShrink:0 }}>
          <div style={{ ...CARD, padding:'10px 8px' }}>
            {['Account','Notifications','Privacy','Danger Zone'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ width:'100%', textAlign:'left', padding:'11px 14px', border:'none', borderRadius:10, background:tab===t?LIGHT:'transparent', color:tab===t?BLUE:t==='Danger Zone'?'#e53e3e':'#4a5568', fontWeight:tab===t?700:500, fontSize:13, cursor:'pointer' }}>
                {{'Account':'👤','Notifications':'🔔','Privacy':'🔒','Danger Zone':'⚠️'}[t]} {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1 }}>
          {tab==='Account'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:16 }}>👤 Personal Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <InputField label="Full Name" value={accForm.name} onChange={e=>setAccForm(p=>({...p,name:e.target.value}))} />
                  <InputField label="Email" value={accForm.email} onChange={e=>setAccForm(p=>({...p,email:e.target.value}))} type="email" />
                  <InputField label="Phone" value={accForm.phone} onChange={e=>setAccForm(p=>({...p,phone:e.target.value}))} />
                  <div>
                    <label style={{ fontSize:11, color:'#718096', fontWeight:600, display:'block', marginBottom:4 }}>Language</label>
                    <select value={accForm.language} onChange={e=>setAccForm(p=>({...p,language:e.target.value}))} style={{ width:'100%', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', background:'white' }}>
                      {['English','Hindi','Gujarati','Marathi','Tamil'].map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={()=>{updateProfile({name:accForm.name,email:accForm.email,phone:accForm.phone});showToast('✅ Saved!');}} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Save Changes</button>
              </div>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:16 }}>🔑 Change Password</div>
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:12 }}>
                  <InputField label="Current Password" value={pwForm.current} onChange={e=>setPwForm(p=>({...p,current:e.target.value}))} type="password" placeholder="••••••••" />
                  <InputField label="New Password (min 8)" value={pwForm.newP} onChange={e=>setPwForm(p=>({...p,newP:e.target.value}))} type="password" placeholder="••••••••" />
                  <InputField label="Confirm New Password" value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} type="password" placeholder="••••••••" />
                </div>
                {pwErr&&<div style={{ fontSize:12, color:'#e53e3e', marginBottom:10, fontWeight:600 }}>⚠ {pwErr}</div>}
                <button onClick={()=>{ setPwErr(''); if(!pwForm.current){setPwErr('Enter current password');return;} if(pwForm.newP.length<8){setPwErr('Min 8 chars');return;} if(pwForm.newP!==pwForm.confirm){setPwErr('Passwords do not match');return;} setPwForm({current:'',newP:'',confirm:''}); showToast('✅ Password changed!'); }} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Update Password</button>
              </div>
            </div>
          )}
          {tab==='Notifications'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:14 }}>📧 Email</div>
                <Row label="Job Alerts" sub="New job matches via email" checked={notifs.emailJobs} onChange={()=>tn('emailJobs')} />
                <Row label="Application Updates" sub="Status changes" checked={notifs.emailApps} onChange={()=>tn('emailApps')} />
                <Row label="Messages" sub="New messages from recruiters" checked={notifs.emailMsg} onChange={()=>tn('emailMsg')} />
              </div>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:14 }}>📱 Push & SMS</div>
                <Row label="Push Job Alerts" sub="Real-time alerts" checked={notifs.pushJobs} onChange={()=>tn('pushJobs')} />
                <Row label="Push App Updates" sub="Instant status updates" checked={notifs.pushApps} onChange={()=>tn('pushApps')} />
                <Row label="SMS Alerts" sub="SMS (charges may apply)" checked={notifs.smsAlerts} onChange={()=>tn('smsAlerts')} />
              </div>
            </div>
          )}
          {tab==='Privacy'&&(
            <div style={{ ...CARD, padding:24 }}>
              <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:14 }}>🔒 Privacy</div>
              <Row label="Public Profile" sub="Anyone can view your profile" checked={privacy.publicProfile} onChange={()=>tp('publicProfile')} />
              <Row label="Show Email" sub="Display on public profile" checked={privacy.showEmail} onChange={()=>tp('showEmail')} />
              <Row label="Show Phone" sub="Display on public profile" checked={privacy.showPhone} onChange={()=>tp('showPhone')} />
              <Row label="Resume Visible to All" sub="All recruiters can view" checked={privacy.resumePublic} onChange={()=>tp('resumePublic')} />
              <Row label="Allow Recruiter Contact" sub="Recruiters can message you" checked={privacy.allowContact} onChange={()=>tp('allowContact')} />
            </div>
          )}
          {tab==='Danger Zone'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#2d3748', marginBottom:8 }}>📦 Export Data</div>
                <p style={{ fontSize:13, color:'#718096', margin:'0 0 14px' }}>Download your profile as JSON.</p>
                <button onClick={()=>{ const b=new Blob([JSON.stringify({profile},null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='elance_data.json';a.click(); }} style={{ background:LIGHT, color:BLUE, border:`1.5px solid ${BLUE}`, borderRadius:20, padding:'10px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>📥 Download My Data</button>
              </div>
              <div style={{ ...CARD, padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#2d3748', marginBottom:8 }}>🔄 Reset Profile</div>
                <p style={{ fontSize:13, color:'#718096', margin:'0 0 14px' }}>Clear all profile data. Cannot be undone.</p>
                <button onClick={()=>{resetProfile();showToast('Profile reset!');}} style={{ background:'rgba(229,62,62,0.08)', color:'#e53e3e', border:'1.5px solid rgba(229,62,62,0.3)', borderRadius:20, padding:'10px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Reset Profile</button>
              </div>
              <div style={{ ...CARD, padding:24, border:'2px solid rgba(229,62,62,0.4)' }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#e53e3e', marginBottom:8 }}>⚠️ Delete Account</div>
                <p style={{ fontSize:13, color:'#718096', margin:'0 0 14px' }}>Permanently delete your account. <strong style={{color:'#e53e3e'}}>Cannot be undone.</strong></p>
                {!showDel
                  ? <button onClick={()=>setShowDel(true)} style={{ background:'#e53e3e', color:'white', border:'none', borderRadius:20, padding:'10px 22px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Delete My Account</button>
                  : <div style={{ background:'rgba(229,62,62,0.05)', borderRadius:12, padding:16 }}>
                      <p style={{ fontSize:13, color:'#e53e3e', fontWeight:600, margin:'0 0 10px' }}>Type <strong>DELETE</strong> to confirm:</p>
                      <input value={delText} onChange={e=>setDelText(e.target.value)} placeholder="DELETE"
                        style={{ width:'100%', boxSizing:'border-box', border:'2px solid rgba(229,62,62,0.3)', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none', marginBottom:12 }} />
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={()=>{if(delText==='DELETE'){resetProfile();logout();}}} disabled={delText!=='DELETE'} style={{ background:delText==='DELETE'?'#e53e3e':'#e2e8f0', color:delText==='DELETE'?'white':'#a0aec0', border:'none', borderRadius:20, padding:'10px 22px', fontWeight:600, cursor:delText==='DELETE'?'pointer':'not-allowed', fontSize:13 }}>Confirm Delete</button>
                        <button onClick={()=>{setShowDel(false);setDelText('');}} style={{ background:'white', color:'#718096', border:'1.5px solid #e2e8f0', borderRadius:20, padding:'10px 16px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Cancel</button>
                      </div>
                    </div>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   ✅ NEW: PROFILE STRENGTH CARD (replaces Career Tips)
   — circular gauge + step checklist
══════════════════════════════════════════════ */
const ProfileStrengthCard = ({ pct, steps }) => {
  const getLevel = p => p>=85?{label:'Expert',color:'#38a169',ring:'#38a169'}:p>=65?{label:'Strong',color:BLUE,ring:BLUE}:p>=40?{label:'Good',color:'#ed8936',ring:'#ed8936'}:{label:'Starter',color:'#e53e3e',ring:'#e53e3e'};
  const { label, color, ring } = getLevel(pct);
  const r = 30, circ = 2*Math.PI*r;

  return (
    <div style={{ ...CARD, padding:18 }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#2d3748' }}>Profile Strength</div>
        <span style={{ fontSize:10, fontWeight:700, color, background:`${color}18`, borderRadius:20, padding:'2px 9px' }}>{label}</span>
      </div>

      {/* Gauge + message */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ position:'relative', width:68, height:68, flexShrink:0 }}>
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r={r} fill="none" stroke="#eef2ff" strokeWidth="7"/>
            <circle cx="34" cy="34" r={r} fill="none" stroke={ring} strokeWidth="7"
              strokeDasharray={`${(pct/100)*circ} ${circ}`}
              strokeLinecap="round"
              style={{ transformOrigin:'center', transform:'rotate(-90deg)', transition:'stroke-dasharray 0.8s ease' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:15, fontWeight:800, color:'#2d3748', lineHeight:1 }}>{pct}%</span>
          </div>
        </div>
        <div style={{ fontSize:11, color:'#718096', lineHeight:1.65 }}>
          {pct<45?'Complete steps below to attract recruiters.':pct<75?'Good progress! A few more steps left.':'You\'re in the top tier of applicants! 🎉'}
        </div>
      </div>

      {/* Step checklist */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {steps.map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:17, height:17, borderRadius:'50%', flexShrink:0, background:s.done?'#48bb78':'#eef2ff', border:s.done?'none':'1.5px solid #c3cfe8', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {s.done&&<span style={{ color:'white', fontSize:9, fontWeight:800 }}>✓</span>}
            </div>
            <span style={{ fontSize:11, color:s.done?'#a0aec0':'#4a5568', fontWeight:s.done?400:600, textDecoration:s.done?'line-through':'none', flex:1 }}>{s.label}</span>
            {!s.done&&<span style={{ fontSize:10, color:BLUE, fontWeight:700 }}>+{s.pts}%</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   ✅ NEW: REAL SUGGESTIONS ENGINE
   — builds dynamic list from actual profile gaps
══════════════════════════════════════════════ */
const buildSuggestions = ({ profile, skills, education, work, resumeFile, displayName, displayRole, displayLoc, appCount, savedCount }) => {
  const s = [];

  // Priority 1 — Critical missing items
  if (!resumeFile)
    s.push({ icon:'📄', color:'#e53e3e', bg:'rgba(229,62,62,0.08)', label:'Upload Your Resume', sub:'Recruiters are 4x more likely to contact you', action:'resume' });
  if (skills.length===0)
    s.push({ icon:'⚡', color:'#e53e3e', bg:'rgba(229,62,62,0.08)', label:'Add Skills', sub:'Required to appear in recruiter searches', action:'skills' });

  // Priority 2 — Important missing
  if (education.length===0)
    s.push({ icon:'🎓', color:'#ed8936', bg:'rgba(237,137,54,0.09)', label:'Add Education', sub:'Most job filters require a degree field', action:'education' });
  if (work.length===0)
    s.push({ icon:'💼', color:'#ed8936', bg:'rgba(237,137,54,0.09)', label:'Add Work Experience', sub:'Even internships boost visibility 3x', action:'experience' });

  // Priority 3 — Medium improvements
  if (!profile.summary)
    s.push({ icon:'📝', color:'#d69e2e', bg:'rgba(214,158,46,0.09)', label:'Write a Short Bio', sub:'Profiles with bios get 2x more views', action:'bio' });
  if (displayLoc==='Location not set')
    s.push({ icon:'📍', color:'#d69e2e', bg:'rgba(214,158,46,0.09)', label:'Set Your Location', sub:'Enables local job alert matching', action:'location' });

  // Priority 4 — Nice to have
  if (!profile.phone)
    s.push({ icon:'📞', color:'#718096', bg:'rgba(113,128,150,0.08)', label:'Add Phone Number', sub:'Recruiters prefer candidates they can call', action:'phone' });
  if (!profile.github && !profile.website)
    s.push({ icon:'🔗', color:BLUE, bg:'rgba(74,108,247,0.07)', label:'Add GitHub / Portfolio', sub:'Essential for tech & design roles', action:'social' });
  if (skills.length>0 && skills.length<5)
    s.push({ icon:'➕', color:'#7c4dff', bg:'rgba(124,77,255,0.07)', label:`Add ${5-skills.length} More Skills`, sub:`You have ${skills.length}/5 — more = better AI matches`, action:'skills' });

  // Priority 5 — Engagement
  if (savedCount===0)
    s.push({ icon:'🔖', color:BLUE, bg:'rgba(74,108,247,0.07)', label:'Save Jobs to Your List', sub:'Build a shortlist to apply faster', action:'jobs' });
  if (appCount===0 && skills.length>0)
    s.push({ icon:'🚀', color:'#38a169', bg:'rgba(56,161,105,0.08)', label:'Apply to Your First Job', sub:'Your profile is ready — start now!', action:'jobs' });

  return s.slice(0,4);
};

/* ══════════════════════════════════════════════
   ✅ NEW: REAL SUGGESTIONS CARD
══════════════════════════════════════════════ */
const SuggestionsCard = ({ suggestions, onAction }) => (
  <div style={{ ...CARD, padding:20 }}>
    <div style={{ fontWeight:700, fontSize:14, color:'#2d3748', marginBottom:3 }}>Suggestions to Improve</div>
    <div style={{ fontSize:11, color:'#a0aec0', marginBottom:14 }}>Based on your actual profile gaps</div>
    {suggestions.length===0 ? (
      <div style={{ textAlign:'center', padding:'16px 0' }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
        <div style={{ fontSize:12, fontWeight:700, color:'#38a169' }}>Profile complete!</div>
        <div style={{ fontSize:11, color:'#718096', marginTop:3 }}>You're ready to get hired.</div>
      </div>
    ) : (
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {suggestions.map((s,i)=>(
          <div key={i} onClick={()=>onAction(s.action)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 11px', background:s.bg, borderRadius:12, cursor:'pointer', border:`1px solid ${s.color}18`, transition:'transform 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';e.currentTarget.style.boxShadow=`0 3px 12px ${s.color}20`}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
            <div style={{ width:33, height:33, borderRadius:10, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, boxShadow:`0 2px 8px ${s.color}22` }}>{s.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:s.color, marginBottom:1 }}>{s.label}</div>
              <div style={{ fontSize:10, color:'#718096', lineHeight:1.4 }}>{s.sub}</div>
            </div>
            <span style={{ fontSize:14, color:s.color, flexShrink:0 }}>›</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════════
   ✅ NEW: REAL PROGRESS CARD
   — only shows items that are genuinely incomplete
══════════════════════════════════════════════ */
const ProgressCard = ({ items }) => (
  <div style={{ ...CARD, padding:20 }}>
    <div style={{ fontWeight:700, fontSize:14, color:'#2d3748', marginBottom:14 }}>Improve Your Profile</div>
    {items.map((p,i)=>(
      <div key={i} style={{ display:'flex', alignItems:'center', gap:11, marginBottom:i<items.length-1?15:0 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{ width:15, height:15, borderRadius:4, background:p.done?'#48bb78':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {p.done&&<span style={{ color:'white', fontSize:9, fontWeight:800 }}>✓</span>}
            </span>
            <span style={{ fontSize:12, fontWeight:600, color:p.done?'#a0aec0':'#2d3748', textDecoration:p.done?'line-through':'none' }}>{p.label}</span>
          </div>
          <div style={{ fontSize:10, color:'#718096', marginBottom:5 }}>{p.sub}</div>
          <div style={{ height:5, background:'#eef2ff', borderRadius:3 }}>
            <div style={{ width:`${p.pct}%`, height:'100%', background:p.done?'#48bb78':GRAD, borderRadius:3, transition:'width 0.7s ease' }}/>
          </div>
        </div>
        <div style={{ position:'relative', width:42, height:42, flexShrink:0 }}>
          <svg viewBox="0 0 36 36" width="42" height="42" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="#eef2ff" strokeWidth="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke={p.done?'#48bb78':BLUE} strokeWidth="3"
              strokeDasharray={`${(p.pct/100)*88} 88`} strokeLinecap="round"
              style={{ transition:'stroke-dasharray 0.7s ease' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#2d3748' }}>{p.pct}%</div>
        </div>
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════
   MAIN PROFILE SECTION
══════════════════════════════════════════════ */
export default function ProfileSection({ user, onNavigate }) {
  const { profile, updateProfile } = useProfile();
  const { user: authUser } = useContext(AuthContext);

  const [currentPage, setCurrentPage] = useState('profile');
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState({});
  const [skillInput, setSkillInput]   = useState('');
  const [resumeFile, setResumeFile]   = useState(null);
  const [resumeUrl,  setResumeUrl]    = useState(null);
  const [resumeMsg,  setResumeMsg]    = useState('');
  const [eduEditIdx, setEduEditIdx]   = useState(null);
  const [expEditIdx, setExpEditIdx]   = useState(null);
  const [githubInput,  setGithubInput]  = useState(profile.github  || '');
  const [websiteInput, setWebsiteInput] = useState(profile.website || '');
  const [socialEditing, setSocialEditing] = useState(false);
  const [toast, setToast]             = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [showDeleteResumeConfirm, setShowDeleteResumeConfirm] = useState(false);

  // ✅ Real backend counts
  const [appCount,   setAppCount]   = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  // ── FIX: DB se resume load karo — authUser ya profile context se ──
  useEffect(()=>{
    const name = authUser?.resumeName || profile.resumeFile;
    const url  = authUser?.resumeUrl  || profile.resumeUrl;
    if (name) setResumeFile(name);
    if (url)  setResumeUrl(url);
  },[authUser?.resumeName, authUser?.resumeUrl, profile.resumeFile, profile.resumeUrl]);

  useEffect(()=>{
    (async()=>{
      try { const a = await jobService.getUserApplications(); setAppCount((a||[]).length); } catch {}
      try { const s = await jobService.getSavedJobs();        setSavedCount((s||[]).length); } catch {}
    })();
  },[]);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const displayName  = profile.name        || authUser?.name || authUser?.username || user?.name || user?.username || 'Your Name';
  const displayEmail = profile.email       || authUser?.email || user?.email || '';
  const displayRole  = profile.currentRole || 'Job Seeker';
  const displayLoc   = profile.location    || 'Location not set';
  const skills       = Array.isArray(profile.skills)         ? profile.skills         : [];
  const education    = Array.isArray(profile.education)      ? profile.education      : [];
  const work         = Array.isArray(profile.workExperience) ? profile.workExperience : [];
  const initials     = displayName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U';

  // ✅ Weighted profile completion steps
  const completionSteps = [
    { label:'Basic Info (name + email)', done: displayName!=='Your Name' && !!displayEmail, pts:15 },
    { label:'Upload Resume',             done: !!resumeFile,                                pts:20 },
    { label:'Add 5+ Skills',             done: skills.length>=5,                            pts:20 },
    { label:'Add Education',             done: education.length>0,                          pts:15 },
    { label:'Add Work Experience',       done: work.length>0,                               pts:15 },
    { label:'Write a Bio',               done: !!profile.summary,                           pts:10 },
    { label:'Set Location',              done: displayLoc!=='Location not set',             pts:5  },
  ];
  const profilePct = completionSteps.reduce((acc,s) => acc+(s.done?s.pts:0), 0);

  // ✅ Real suggestions — based on profile state
  const suggestions = buildSuggestions({ profile, skills, education, work, resumeFile, displayName, displayRole, displayLoc, appCount, savedCount });

  // ✅ Real progress items — only 3, only incomplete or just-finished ones
  const progressItems = [
    { label:'Upload Resume',   sub:'4x more recruiter contact',       pct: resumeFile?100:0,           done:!!resumeFile },
    { label:'Add 5 Skills',    sub:`${skills.length} of 5 added`,     pct:Math.min(100,skills.length*20), done:skills.length>=5 },
    { label:'Complete Profile',sub:`${profilePct}% complete`,         pct:profilePct,                   done:profilePct>=100 },
  ].slice(0,3);

  // ✅ Suggestion action handler — routes to correct edit section
  const handleSuggestionAction = (action) => {
    if (action==='resume') { document.getElementById('resume-upload-input')?.click(); }
    else if (action==='skills') { setEditing('skills'); }
    else if (action==='education') { setForm({}); setEduEditIdx('new'); setEditing('edu'); }
    else if (action==='experience') { setForm({}); setExpEditIdx('new'); setEditing('exp'); }
    else if (action==='social') { setSocialEditing(true); }
    else if (action==='jobs') { onNavigate&&onNavigate('find-jobs'); }
    else {
      // bio, location, phone — open info edit
      setForm({ name:displayName, email:displayEmail, phone:profile.phone||'', location:displayLoc, currentRole:displayRole, summary:profile.summary||'', studentVisa:profile.studentVisa||'' });
      setEditing('info');
    }
  };

  const setF = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const openInfoEdit = () => { setForm({name:displayName,email:displayEmail,phone:profile.phone||'',location:displayLoc,currentRole:displayRole,summary:profile.summary||'',studentVisa:profile.studentVisa||''}); setEditing('info'); };
  const saveInfo = () => { updateProfile(form); setEditing(null); showToast('✅ Profile updated!'); };
  const addSkill = () => { const s=skillInput.trim(); if(!s||skills.includes(s))return; updateProfile({skills:[...skills,s]}); setSkillInput(''); };
  const removeSkill = s => updateProfile({skills:skills.filter(x=>x!==s)});

  const handleResume = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setResumeMsg('⏳ Resume upload ho raha hai...');
    setResumeLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // ── STEP 1: DB mein save karo (persist across logout/login) ──
      const dbForm = new FormData();
      dbForm.append('resume', f);
      const dbRes = await fetch('http://localhost:5000/api/auth/upload-resume', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: dbForm,
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setResumeFile(dbData.resumeName || f.name);
        setResumeUrl(dbData.resumeUrl   || null);
        updateProfile({ resumeFile: dbData.resumeName || f.name });
      } else {
        // Fallback - sirf naam set karo
        setResumeFile(f.name);
        updateProfile({ resumeFile: f.name });
      }

      // ── STEP 2: AI analysis ke liye ──
      setResumeMsg('⏳ Resume analyze ho raha hai AI se...');
      const formData = new FormData();
      formData.append('resume', f);
      const res = await fetch('http://localhost:5000/api/resume/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) { const errData = await res.json().catch(()=>({})); throw new Error(errData.message || 'AI analysis failed'); }
      const data = await res.json();
      const analysis = data.analysis || {};
      const profileUpdates = {};
      const extractedSkills = Array.isArray(analysis.skills) ? analysis.skills : [];
      if (extractedSkills.length > 0) profileUpdates.skills = [...new Set([...skills, ...extractedSkills])];
      const extractedExp = Array.isArray(analysis.experience) ? analysis.experience : [];
      if (extractedExp.length > 0) {
        const formattedExp = extractedExp.map(ex => ({ title:ex.title||ex.role||'', company:ex.company||'', duration:ex.duration||ex.period||'', location:ex.location||'', description:ex.description||ex.responsibilities||'' }));
        const existingCos = work.map(w=>w.company?.toLowerCase());
        profileUpdates.workExperience = [...work, ...formattedExp.filter(e=>!existingCos.includes(e.company?.toLowerCase()))];
      }
      const extractedEdu = Array.isArray(analysis.education) ? analysis.education : [];
      if (extractedEdu.length > 0) {
        const formattedEdu = extractedEdu.map(ed => ({ degree:ed.degree||'', field:ed.field||ed.branch||'', institution:ed.institution||ed.school||ed.university||'', year:ed.year||ed.graduationYear||ed.passout||'' }));
        const existingInst = education.map(e=>e.institution?.toLowerCase());
        profileUpdates.education = [...education, ...formattedEdu.filter(e=>!existingInst.includes(e.institution?.toLowerCase()))];
      }
      if (analysis.currentRole && displayRole==='Job Seeker') profileUpdates.currentRole = analysis.currentRole;
      if (analysis.personalInfo?.location && displayLoc==='Location not set') profileUpdates.location = analysis.personalInfo.location;
      if (analysis.summary && !profile.summary) profileUpdates.summary = analysis.summary;
      if (analysis.personalInfo?.name && displayName==='Your Name') profileUpdates.name = analysis.personalInfo.name;
      if (analysis.personalInfo?.phone && !profile.phone) profileUpdates.phone = analysis.personalInfo.phone;
      if (Object.keys(profileUpdates).length>0) updateProfile(profileUpdates);
      setResumeMsg(`✅ Done! ${(profileUpdates.skills||extractedSkills).length} skills, ${extractedExp.length} experiences auto-filled!`);
      showToast('🎉 Resume analyzed!');
    } catch(err) {
      setResumeMsg(`❌ Error: ${err.message||'Resume process nahi hua'}`);
      showToast('Resume upload hua, auto-extract failed.');
    } finally {
      setResumeLoading(false);
      setTimeout(()=>setResumeMsg(''),6000);
    }
  };

  const saveEdu = () => { const u=eduEditIdx==='new'?[...education,{...form}]:education.map((e,i)=>i===eduEditIdx?{...e,...form}:e); updateProfile({education:u}); setEditing(null); setEduEditIdx(null); setForm({}); };
  const saveExp = () => { const u=expEditIdx==='new'?[...work,{...form}]:work.map((e,i)=>i===expEditIdx?{...e,...form}:e); updateProfile({workExperience:u}); setEditing(null); setExpEditIdx(null); setForm({}); };

  if (currentPage==='saved-jobs')   return <SavedJobsPage    onBack={()=>setCurrentPage('profile')} />;
  if (currentPage==='applications') return <ApplicationsPage onBack={()=>setCurrentPage('profile')} />;
  if (currentPage==='job-alerts')   return <JobAlertsPage    onBack={()=>setCurrentPage('profile')} />;
  if (currentPage==='settings')     return <SettingsPage     onBack={()=>setCurrentPage('profile')} />;

  const sideMenuItems = [
    { icon:'📊', label:'Dashboard',    action:()=>{ onNavigate&&onNavigate('home'); } },
    { icon:'💼', label:'Saved Jobs',   action:()=>setCurrentPage('saved-jobs') },
    { icon:'📋', label:'Applications', action:()=>setCurrentPage('applications') },
    { icon:'🔔', label:'Job Alerts',   action:()=>setCurrentPage('job-alerts') },
    { icon:'⚙️', label:'Settings',     action:()=>setCurrentPage('settings') },
  ];

  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Segoe UI',Roboto,sans-serif", background:'#f5f7ff' }}>
      <Toast msg={toast} />
      <div style={{ display:'flex', padding:'28px 28px', gap:22, maxWidth:1320, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Avatar */}
          <div style={{ ...CARD, padding:20, textAlign:'center' }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:12 }}>
              <div style={{ width:84, height:84, borderRadius:'50%', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:800, color:'white', margin:'0 auto', boxShadow:'0 6px 20px rgba(74,108,247,0.3)' }}>{initials}</div>
              <div style={{ position:'absolute', bottom:2, right:2, width:22, height:22, borderRadius:'50%', background:'#48bb78', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'white', fontSize:11, fontWeight:800 }}>✓</span></div>
            </div>
            <div style={{ fontWeight:700, fontSize:15, color:'#2d3748', marginBottom:3 }}>{displayName}</div>
            <div style={{ fontSize:12, color:'#718096', marginBottom:4 }}>{displayRole}</div>
            {displayLoc!=='Location not set'&&<div style={{ fontSize:12, color:'#718096', marginBottom:12 }}>📍 {displayLoc}</div>}
            <button onClick={openInfoEdit} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'8px 0', fontWeight:600, cursor:'pointer', fontSize:12, width:'100%' }}>↺ Improve Profile</button>
          </div>

          {/* Nav */}
          <div style={{ ...CARD, padding:'12px 8px' }}>
            {sideMenuItems.map(item=>(
              <button key={item.label} onClick={item.action} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'transparent', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:500, color:'#4a5568', textAlign:'left' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(74,108,247,0.07)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>

          {/* ✅ REPLACED Career Tips → Profile Strength */}
          <ProfileStrengthCard pct={profilePct} steps={completionSteps} />
        </div>

        {/* ── CENTER ── */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ ...CARD, padding:26 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>My Profile</h2>
              <button onClick={openInfoEdit} style={{ background:'transparent', border:'1.5px solid rgba(120,100,210,0.35)', color:'#5c6bc0', borderRadius:20, padding:'7px 20px', fontWeight:600, cursor:'pointer', fontSize:13 }}>Edit Profile</button>
            </div>

            {/* Personal Info */}
            <SectionBlock title="Personal Info">
              {editing==='info' ? (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <InputField label="Full Name"    value={form.name        ||''} onChange={setF('name')} />
                    <InputField label="Email"        value={form.email       ||''} onChange={setF('email')} type="email" />
                    <InputField label="Phone"        value={form.phone       ||''} onChange={setF('phone')} />
                    <InputField label="Location"     value={form.location    ||''} onChange={setF('location')} />
                    <InputField label="Current Role" value={form.currentRole ||''} onChange={setF('currentRole')} />
                    <InputField label="Student Visa" value={form.studentVisa ||''} onChange={setF('studentVisa')} placeholder="e.g. Student Visa" />
                    <div style={{ gridColumn:'1/-1' }}><InputField label="Bio" value={form.summary||''} onChange={setF('summary')} placeholder="Short bio..." /></div>
                  </div>
                  <SaveCancel onSave={saveInfo} onCancel={()=>setEditing(null)} />
                </div>
              ) : (
                <div style={{ background:LIGHT, borderRadius:14, padding:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'white', flexShrink:0 }}>{initials}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{displayName}</div>
                        <div style={{ fontSize:12, color:'#718096' }}>{displayRole}</div>
                      </div>
                    </div>
                    <EditBtn onClick={openInfoEdit} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {[['📍',displayLoc],[displayEmail&&'✉️',displayEmail],[profile.phone&&'📞',profile.phone],[profile.studentVisa&&'🪪',profile.studentVisa],[profile.summary&&'📝',profile.summary]].filter(([i,v])=>i&&v).map(([icon,val],idx)=>(
                      <div key={idx} style={{ fontSize:13, color:'#4a5568', display:'flex', alignItems:'center', gap:8 }}><span>{icon}</span>{val}</div>
                    ))}
                  </div>
                </div>
              )}
            </SectionBlock>

            {/* Social Links */}
            <SectionBlock title="Social Links" onEdit={()=>setSocialEditing(true)}>
              {socialEditing ? (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <InputField label="GitHub URL" value={githubInput} onChange={e=>setGithubInput(e.target.value)} placeholder="github.com/username" />
                    <InputField label="Portfolio / Website" value={websiteInput} onChange={e=>setWebsiteInput(e.target.value)} placeholder="www.yoursite.com" />
                  </div>
                  <SaveCancel onSave={()=>{updateProfile({github:githubInput,website:websiteInput});setSocialEditing(false);showToast('✅ Saved!');}} onCancel={()=>setSocialEditing(false)} />
                </div>
              ) : (
                <div style={{ background:LIGHT, borderRadius:14, padding:'12px 16px', display:'flex', gap:20, flexWrap:'wrap' }}>
                  {(profile.github||githubInput)
                    ? <a href={`https://${(profile.github||githubInput).replace(/^https?:\/\//,'')}`} target="_blank" rel="noreferrer" style={{ fontSize:13, color:BLUE, fontWeight:600, textDecoration:'none' }}>🐙 {profile.github||githubInput}</a>
                    : <span style={{ fontSize:13, color:'#718096' }}>No GitHub. <button onClick={()=>setSocialEditing(true)} style={{ border:'none', background:'none', color:BLUE, cursor:'pointer', fontWeight:600, fontSize:13 }}>Add</button></span>}
                  {(profile.website||websiteInput)&&<a href={`https://${(profile.website||websiteInput).replace(/^https?:\/\//,'')}`} target="_blank" rel="noreferrer" style={{ fontSize:13, color:BLUE, fontWeight:600, textDecoration:'none' }}>🌐 {profile.website||websiteInput}</a>}
                </div>
              )}
            </SectionBlock>

            {/* Skills */}
            <SectionBlock title="Skills"
              badge={skills.length===0?<span style={{ fontSize:11, color:'#ed8936', background:'rgba(237,137,54,0.12)', borderRadius:10, padding:'2px 8px', fontWeight:600 }}>⚠ Due</span>:<span style={{ fontSize:11, color:'#48bb78', background:'rgba(72,187,120,0.1)', borderRadius:10, padding:'2px 8px', fontWeight:600 }}>{skills.length} added</span>}
              onEdit={()=>setEditing('skills')}>
              {editing==='skills' ? (
                <div>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Type skill + Enter"
                      style={{ flex:1, border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'9px 12px', fontSize:13, outline:'none' }} />
                    <button onClick={addSkill} style={{ background:GRAD, color:'white', border:'none', borderRadius:10, padding:'9px 18px', cursor:'pointer', fontWeight:600 }}>Add</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                    {skills.map(s=><SkillTag key={s} label={s} onRemove={()=>removeSkill(s)} />)}
                  </div>
                  <button onClick={()=>setEditing(null)} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'8px 22px', fontWeight:600, cursor:'pointer' }}>Done</button>
                </div>
              ) : (
                skills.length===0
                  ? <div style={{ padding:'12px 16px', background:LIGHT, borderRadius:14, fontSize:13, color:'#718096' }}>No skills yet. <button onClick={()=>setEditing('skills')} style={{ border:'none', background:'none', color:BLUE, cursor:'pointer', fontWeight:600 }}>+ Add Skills</button></div>
                  : <div style={{ background:LIGHT, borderRadius:14, padding:'14px 16px' }}><div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>{skills.map(s=><SkillTag key={s} label={s} />)}</div></div>
              )}
            </SectionBlock>

            {/* Education */}
            <SectionBlock title="Education" onEdit={()=>{setForm({});setEduEditIdx('new');setEditing('edu');}}>
              {editing==='edu' ? (
                <div style={{ background:LIGHT, borderRadius:14, padding:18 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <InputField label="Degree" value={form.degree||''} onChange={setF('degree')} placeholder="e.g. B.Tech" />
                    <InputField label="Field" value={form.field||''} onChange={setF('field')} placeholder="e.g. Computer Science" />
                    <InputField label="Institution" value={form.institution||''} onChange={setF('institution')} />
                    <InputField label="Year" value={form.year||''} onChange={setF('year')} placeholder="2021-2025" />
                  </div>
                  <SaveCancel onSave={saveEdu} onCancel={()=>{setEditing(null);setEduEditIdx(null);setForm({});}} />
                </div>
              ) : (
                education.length===0
                  ? <div style={{ padding:'12px 16px', background:LIGHT, borderRadius:14, fontSize:13, color:'#718096' }}>No education added. <button onClick={()=>{setForm({});setEduEditIdx('new');setEditing('edu');}} style={{ border:'none', background:'none', color:BLUE, cursor:'pointer', fontWeight:600 }}>+ Add</button></div>
                  : <>
                      {education.map((e,i)=>(
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:LIGHT, borderRadius:12, marginBottom:10 }}>
                          <div style={{ display:'flex', gap:10 }}>
                            <span style={{ width:32, height:32, borderRadius:'50%', background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🎓</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13, color:'#2d3748' }}>{e.degree}{e.field?` in ${e.field}`:''}</div>
                              <div style={{ fontSize:12, color:'#718096' }}>{e.institution}{e.year?` (${e.year})`:''}</div>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:4 }}>
                            <EditBtn onClick={()=>{setForm(e);setEduEditIdx(i);setEditing('edu');}} />
                            <button onClick={()=>updateProfile({education:education.filter((_,j)=>j!==i)})} style={{ background:'none', border:'none', color:'#fc8181', cursor:'pointer', fontSize:14 }}>🗑</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>{setForm({});setEduEditIdx('new');setEditing('edu');}} style={{ background:'transparent', color:BLUE, border:`1.5px dashed ${BLUE}`, borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:12, fontWeight:600, width:'100%', marginTop:4 }}>+ Add Another Education</button>
                    </>
              )}
            </SectionBlock>

            {/* Work Experience */}
            <SectionBlock title="Work Experience" onEdit={()=>{setForm({});setExpEditIdx('new');setEditing('exp');}}>
              {editing==='exp' ? (
                <div style={{ background:LIGHT, borderRadius:14, padding:18 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <InputField label="Job Title" value={form.title||''} onChange={setF('title')} placeholder="e.g. Software Engineer" />
                    <InputField label="Company"   value={form.company||''} onChange={setF('company')} />
                    <InputField label="Duration"  value={form.duration||''} onChange={setF('duration')} placeholder="Jan 2022 - Present" />
                    <InputField label="Location"  value={form.location||''} onChange={setF('location')} placeholder="Remote / City" />
                    <div style={{ gridColumn:'1/-1' }}><InputField label="Description" value={form.description||''} onChange={setF('description')} /></div>
                  </div>
                  <SaveCancel onSave={saveExp} onCancel={()=>{setEditing(null);setExpEditIdx(null);setForm({});}} />
                </div>
              ) : (
                work.length===0
                  ? <div style={{ padding:'12px 16px', background:LIGHT, borderRadius:14, fontSize:13, color:'#718096' }}>No experience added. <button onClick={()=>{setForm({});setExpEditIdx('new');setEditing('exp');}} style={{ border:'none', background:'none', color:BLUE, cursor:'pointer', fontWeight:600 }}>+ Add</button></div>
                  : <>
                      {work.map((w,i)=>(
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:LIGHT, borderRadius:12, marginBottom:10 }}>
                          <div style={{ display:'flex', gap:10 }}>
                            <span style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#48bb78,#38a169)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>💼</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13, color:'#2d3748' }}>{w.title||'Role'}</div>
                              <div style={{ fontSize:12, color:'#718096' }}>{w.company}{w.duration?` · ${w.duration}`:''}</div>
                              {w.description&&<div style={{ fontSize:12, color:'#718096', marginTop:2 }}>{w.description}</div>}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:4 }}>
                            <EditBtn onClick={()=>{setForm(w);setExpEditIdx(i);setEditing('exp');}} />
                            <button onClick={()=>updateProfile({workExperience:work.filter((_,j)=>j!==i)})} style={{ background:'none', border:'none', color:'#fc8181', cursor:'pointer', fontSize:14 }}>🗑</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>{setForm({});setExpEditIdx('new');setEditing('exp');}} style={{ background:'transparent', color:BLUE, border:`1.5px dashed ${BLUE}`, borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:12, fontWeight:600, width:'100%', marginTop:4 }}>+ Add Another Experience</button>
                    </>
              )}
            </SectionBlock>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ width:248, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Resume Upload (unchanged) */}
          <div style={{ ...CARD, padding:22, textAlign:'center' }}>
            <div style={{ width:56, height:56, background:'rgba(74,108,247,0.1)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:26 }}>☁️</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#2d3748', marginBottom:6 }}>
              {resumeFile ? 'Resume Uploaded' : 'Upload Your Resume'}
            </div>
            <div style={{ fontSize:12, color:'#718096', lineHeight:1.6, marginBottom:14 }}>
              {resumeFile ? 'Replace ya delete kar sakte ho.' : 'Add an updated copy. .pdf, .doc, .docx'}
            </div>
            {resumeFile && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:LIGHT, borderRadius:10, padding:'8px 12px', marginBottom:12, border:'1px solid rgba(74,108,247,0.2)' }}>
                <span style={{ fontSize:12, color:'#2d3748', fontWeight:600, flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📄 {resumeFile}</span>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {resumeUrl && !resumeLoading && (
                    <a href={`http://localhost:5000${resumeUrl}`} target="_blank" rel="noreferrer"
                      style={{ background:'none', border:'none', cursor:'pointer', color:BLUE, fontSize:12, fontWeight:600, padding:'0 6px', textDecoration:'none' }}
                      title="Resume dekho">👁 View</a>
                  )}
                  {!resumeLoading && (
                    <button onClick={()=>setShowDeleteResumeConfirm(true)} title="Resume delete karo"
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#fc8181', fontSize:16, padding:'0 0 0 4px', flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color='#e53e3e'}
                      onMouseLeave={e=>e.currentTarget.style.color='#fc8181'}>🗑</button>
                  )}
                </div>
              </div>
            )}
            {showDeleteResumeConfirm && (
              <div style={{ background:'rgba(229,62,62,0.07)', border:'1.5px solid rgba(229,62,62,0.25)', borderRadius:12, padding:'14px 12px', marginBottom:12, textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e53e3e', marginBottom:6 }}>⚠️ Resume delete karein?</div>
                <div style={{ fontSize:11, color:'#718096', marginBottom:12, lineHeight:1.5 }}>Sirf resume file remove hogi.</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={async()=>{
                    try {
                      const token = localStorage.getItem('token')||'';
                      await fetch('http://localhost:5000/api/auth/resume',{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
                    } catch {}
                    setResumeFile(null); setResumeUrl(null);
                    updateProfile({resumeFile:null});
                    setShowDeleteResumeConfirm(false); setResumeMsg('');
                    showToast('🗑 Resume remove ho gaya!');
                  }}
                    style={{ flex:1, background:'#e53e3e', color:'white', border:'none', borderRadius:20, padding:'8px', fontWeight:700, cursor:'pointer', fontSize:12 }}>Haan, Delete</button>
                  <button onClick={()=>setShowDeleteResumeConfirm(false)}
                    style={{ flex:1, background:'white', color:'#718096', border:'1.5px solid #e2e8f0', borderRadius:20, padding:'8px', fontWeight:600, cursor:'pointer', fontSize:12 }}>Cancel</button>
                </div>
              </div>
            )}
            {resumeMsg && (
              <div style={{ fontSize:12, color:resumeMsg.startsWith('⏳')?'#ed8936':resumeMsg.startsWith('❌')?'#e53e3e':'#48bb78', marginBottom:10, fontWeight:600, lineHeight:1.6, textAlign:'left' }}>{resumeMsg}</div>
            )}
            <label style={{ display:'block', background:resumeLoading?'#a0aec0':GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 0', fontWeight:600, cursor:resumeLoading?'not-allowed':'pointer', fontSize:13, textAlign:'center' }}>
              {resumeLoading ? '⏳ Analyzing...' : resumeFile ? '🔄 Replace Resume' : '📤 Upload Resume'}
              <input id="resume-upload-input" type="file" accept=".pdf,.doc,.docx" onChange={handleResume} style={{ display:'none' }} disabled={resumeLoading} />
            </label>
            {skills.length>0&&!resumeLoading&&<div style={{ fontSize:11, color:'#718096', marginTop:8 }}>✨ {skills.length} skills is in profile</div>}
          </div>

          {/* ✅ REAL Suggestions — dynamic from profile gaps */}
          <SuggestionsCard suggestions={suggestions} onAction={handleSuggestionAction} />

          {/* ✅ REAL Progress — dynamic items */}
          <ProgressCard items={progressItems} />

        </div>
      </div>
    </div>
  );
}
