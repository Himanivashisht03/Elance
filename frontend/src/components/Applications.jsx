// frontend/src/components/Applications.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const BLUE  = '#4a6cf7';
const GRAD  = 'linear-gradient(135deg,#4a6cf7,#7c4dff)';
const LIGHT = '#f0f4ff';
const CARD  = { background:'#fff', borderRadius:20, boxShadow:'0 4px 24px rgba(74,108,247,0.09)', border:'1px solid rgba(200,190,240,0.4)' };

const STATUS = {
  Applied:     { color:'#4a6cf7', bg:'rgba(74,108,247,0.1)',  icon:'📤' },
  Reviewing:   { color:'#ed8936', bg:'rgba(237,137,54,0.12)', icon:'👀' },
  Interview:   { color:'#7c4dff', bg:'rgba(124,77,255,0.12)', icon:'🎯' },
  Offered:     { color:'#38a169', bg:'rgba(72,187,120,0.12)', icon:'🎉' },
  Rejected:    { color:'#e53e3e', bg:'rgba(229,62,62,0.1)',   icon:'❌' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS['Applied'];
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:700, borderRadius:20, padding:'4px 12px', display:'inline-flex', alignItems:'center', gap:5 }}>
      {s.icon} {status}
    </span>
  );
};

const TimelineStep = ({ label, done, active }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
    <div style={{
      width:28, height:28, borderRadius:'50%',
      background: done ? GRAD : active ? 'white' : '#eef2ff',
      border: active ? `2.5px solid ${BLUE}` : done ? 'none' : '2px solid #e2e8f0',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:12, fontWeight:800,
      color: done ? 'white' : active ? BLUE : '#a0aec0',
      boxShadow: active ? `0 0 0 4px rgba(74,108,247,0.15)` : 'none'
    }}>
      {done ? '✓' : ''}
    </div>
    <div style={{ fontSize:10, color: done||active ? BLUE : '#a0aec0', fontWeight:600, marginTop:4, textAlign:'center' }}>{label}</div>
  </div>
);

export default function Applications({ onNavigate }) {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3000); };

  useEffect(() => {
    const stored = localStorage.getItem('myApplications');
    if (stored) {
      try { setApplications(JSON.parse(stored)); return; } catch {}
    }
    const demo = [
      {
        id:1, title:'Frontend Developer', company:'TechCorp India', location:'Jaipur, India',
        type:'Full Time', salary:'₹8-12 LPA', logo:'TC', appliedAt:'2026-02-20',
        status:'Interview', statusHistory:[
          { status:'Applied',   date:'Feb 20, 2026', note:'Application submitted successfully' },
          { status:'Reviewing', date:'Feb 21, 2026', note:'Your profile is under review' },
          { status:'Interview', date:'Feb 22, 2026', note:'Interview scheduled for Feb 25' },
        ],
        interviewDate:'Feb 25, 2026', skills:['React','JavaScript','CSS']
      },
      {
        id:2, title:'UI/UX Designer', company:'DesignHub', location:'Remote',
        type:'Remote', salary:'₹6-9 LPA', logo:'DH', appliedAt:'2026-02-19',
        status:'Reviewing', statusHistory:[
          { status:'Applied',   date:'Feb 19, 2026', note:'Application submitted' },
          { status:'Reviewing', date:'Feb 21, 2026', note:'Under review by hiring team' },
        ],
        skills:['Figma','Wireframing','Prototyping']
      },
      {
        id:3, title:'Software Engineer Intern', company:'StartupXYZ', location:'Bangalore',
        type:'Internship', salary:'₹25k/month', logo:'SX', appliedAt:'2026-02-18',
        status:'Offered', statusHistory:[
          { status:'Applied',   date:'Feb 18, 2026', note:'Application submitted' },
          { status:'Reviewing', date:'Feb 19, 2026', note:'Profile reviewed' },
          { status:'Interview', date:'Feb 20, 2026', note:'Technical round completed' },
          { status:'Offered',   date:'Feb 22, 2026', note:'Offer letter sent to your email 🎉' },
        ],
        skills:['Python','Django','SQL']
      },
      {
        id:4, title:'React Developer', company:'WebSolutions', location:'Delhi',
        type:'Full Time', salary:'₹10-15 LPA', logo:'WS', appliedAt:'2026-02-17',
        status:'Rejected', statusHistory:[
          { status:'Applied',   date:'Feb 17, 2026', note:'Application submitted' },
          { status:'Reviewing', date:'Feb 18, 2026', note:'Profile reviewed' },
          { status:'Rejected',  date:'Feb 20, 2026', note:'Position filled internally' },
        ],
        skills:['React','Redux','Node.js']
      },
    ];
    setApplications(demo);
    localStorage.setItem('myApplications', JSON.stringify(demo));
  }, []);

  const statusOrder = ['Applied','Reviewing','Interview','Offered','Rejected'];
  const stepsOrder  = ['Applied','Reviewing','Interview','Offered'];

  const filters = ['All', ...Object.keys(STATUS)];
  const filtered = applications.filter(a => filter === 'All' || a.status === filter);

  const withdraw = (id) => {
    const updated = applications.filter(a => a.id !== id);
    setApplications(updated);
    localStorage.setItem('myApplications', JSON.stringify(updated));
    showToast('Application withdrawn');
  };

  const stats = Object.keys(STATUS).map(s => ({
    label:s, count:applications.filter(a=>a.status===s).length, ...STATUS[s]
  }));

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7ff', fontFamily:"'Segoe UI',sans-serif", padding:'28px 32px' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#2d3748', color:'white', padding:'12px 20px', borderRadius:12, zIndex:9999, fontSize:13, fontWeight:600 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <button onClick={()=>onNavigate&&onNavigate('profile')} style={{ background:'none', border:'none', color:BLUE, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:6, padding:0 }}>
          ← Back to Profile
        </button>
        <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>My Applications</h2>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>{applications.length} total applications</p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...CARD, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:20, color:s.color }}>{s.count}</div>
            <div style={{ fontSize:11, color:'#718096', fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'7px 16px', borderRadius:20, border:'1.5px solid',
            borderColor: filter===f ? BLUE : 'rgba(120,100,210,0.2)',
            background: filter===f ? BLUE : 'white',
            color: filter===f ? 'white' : '#4a5568',
            fontSize:12, fontWeight:600, cursor:'pointer'
          }}>{f} {f!=='All' && `(${applications.filter(a=>a.status===f).length})`}</button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ ...CARD, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#2d3748' }}>No applications in this category</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(app => {
            const isExpanded = expandedId === app.id;
            const currentStepIdx = stepsOrder.indexOf(app.status);
            return (
              <div key={app.id} style={{ ...CARD, padding:20, transition:'box-shadow 0.18s' }}>
                {/* Main row */}
                <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:15, flexShrink:0 }}>
                    {app.logo}
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{app.title}</div>
                    <div style={{ fontSize:12, color:'#718096' }}>{app.company} · {app.location}</div>
                    <div style={{ fontSize:11, color:'#a0aec0', marginTop:2 }}>Applied {app.appliedAt}</div>
                  </div>
                  <StatusBadge status={app.status} />
                  {app.status==='Interview' && app.interviewDate && (
                    <span style={{ fontSize:12, color:'#7c4dff', fontWeight:600, background:'rgba(124,77,255,0.08)', padding:'4px 10px', borderRadius:10 }}>
                      📅 {app.interviewDate}
                    </span>
                  )}
                  <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                    <button onClick={()=>setExpandedId(isExpanded?null:app.id)} style={{
                      padding:'7px 14px', background:LIGHT, color:BLUE, border:'none', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600
                    }}>
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                    {app.status!=='Offered' && app.status!=='Rejected' && (
                      <button onClick={()=>withdraw(app.id)} style={{
                        padding:'7px 14px', background:'rgba(229,62,62,0.08)', color:'#e53e3e', border:'none', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600
                      }}>Withdraw</button>
                    )}
                  </div>
                </div>

                {/* Expanded — timeline */}
                {isExpanded && (
                  <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid rgba(200,190,240,0.3)' }}>
                    {/* Progress bar */}
                    {app.status !== 'Rejected' && (
                      <div style={{ marginBottom:20 }}>
                        <div style={{ fontSize:12, color:'#718096', fontWeight:600, marginBottom:12 }}>Application Progress</div>
                        <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
                          <div style={{ position:'absolute', top:13, left:'10%', right:'10%', height:3, background:'#eef2ff', borderRadius:2, zIndex:0 }}>
                            <div style={{ width:`${Math.max(0,(currentStepIdx/3)*100)}%`, height:'100%', background:GRAD, borderRadius:2, transition:'width 0.4s' }} />
                          </div>
                          {stepsOrder.map((step,i) => (
                            <TimelineStep key={step} label={step} done={i<currentStepIdx} active={i===currentStepIdx} />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* History */}
                    <div style={{ fontSize:12, color:'#718096', fontWeight:600, marginBottom:10 }}>Status History</div>
                    {app.statusHistory.map((h,i)=>(
                      <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background: STATUS[h.status]?.color||BLUE, flexShrink:0, marginTop:4 }} />
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'#2d3748' }}>{h.status} — <span style={{ fontWeight:400, color:'#718096' }}>{h.date}</span></div>
                          <div style={{ fontSize:12, color:'#4a5568' }}>{h.note}</div>
                        </div>
                      </div>
                    ))}
                    {/* Skills */}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                      {app.skills.map(s=>(
                        <span key={s} style={{ background:LIGHT, color:BLUE, fontSize:11, fontWeight:600, borderRadius:10, padding:'3px 10px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
