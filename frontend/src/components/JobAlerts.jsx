// frontend/src/components/JobAlerts.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const BLUE  = '#4a6cf7';
const GRAD  = 'linear-gradient(135deg,#4a6cf7,#7c4dff)';
const LIGHT = '#f0f4ff';
const CARD  = { background:'#fff', borderRadius:20, boxShadow:'0 4px 24px rgba(74,108,247,0.09)', border:'1px solid rgba(200,190,240,0.4)' };

const FREQ = ['Instant','Daily','Weekly'];
const TYPES = ['Full Time','Part Time','Remote','Internship','Contract'];

export default function JobAlerts({ onNavigate }) {
  const { user } = useContext(AuthContext);
  const [alerts, setAlerts]       = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState({ keywords:'', location:'', type:'Full Time', frequency:'Daily', salary:'', active:true });
  const [editId, setEditId]       = useState(null);
  const [toast, setToast]         = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3000); };

  useEffect(() => {
    const stored = localStorage.getItem('jobAlerts');
    if (stored) { try { setAlerts(JSON.parse(stored)); return; } catch {} }
    const demo = [
      { id:1, keywords:'React Developer', location:'Jaipur, India', type:'Full Time',  frequency:'Daily',  salary:'₹8L+', active:true,  createdAt:'Feb 20, 2026', matches:12 },
      { id:2, keywords:'UI/UX Designer',  location:'Remote',        type:'Remote',     frequency:'Weekly', salary:'',     active:true,  createdAt:'Feb 18, 2026', matches:7  },
      { id:3, keywords:'Python Intern',   location:'Bangalore',     type:'Internship', frequency:'Instant',salary:'',     active:false, createdAt:'Feb 15, 2026', matches:3  },
    ];
    setAlerts(demo);
    localStorage.setItem('jobAlerts', JSON.stringify(demo));
  }, []);

  const saveAlerts = (updated) => {
    setAlerts(updated);
    localStorage.setItem('jobAlerts', JSON.stringify(updated));
  };

  const createAlert = () => {
    if (!form.keywords.trim()) return;
    if (editId !== null) {
      saveAlerts(alerts.map(a => a.id === editId ? { ...a, ...form } : a));
      showToast('Alert updated!');
    } else {
      const newAlert = { ...form, id:Date.now(), createdAt:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}), matches:0, active:true };
      saveAlerts([...alerts, newAlert]);
      showToast('✅ Alert created! You\'ll get notified for matching jobs.');
    }
    setForm({ keywords:'', location:'', type:'Full Time', frequency:'Daily', salary:'', active:true });
    setShowCreate(false); setEditId(null);
  };

  const toggleAlert = (id) => {
    const updated = alerts.map(a => a.id===id ? {...a, active:!a.active} : a);
    saveAlerts(updated);
    const a = updated.find(x=>x.id===id);
    showToast(a.active ? '🔔 Alert activated' : '🔕 Alert paused');
  };

  const deleteAlert = (id) => {
    saveAlerts(alerts.filter(a=>a.id!==id));
    showToast('Alert deleted');
  };

  const editAlert = (a) => {
    setForm({ keywords:a.keywords, location:a.location, type:a.type, frequency:a.frequency, salary:a.salary||'', active:a.active });
    setEditId(a.id); setShowCreate(true);
  };

  const setF = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7ff', fontFamily:"'Segoe UI',sans-serif", padding:'28px 32px' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#2d3748', color:'white', padding:'12px 20px', borderRadius:12, zIndex:9999, fontSize:13, fontWeight:600 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <button onClick={()=>onNavigate&&onNavigate('profile')} style={{ background:'none', border:'none', color:BLUE, cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:6, padding:0 }}>
            ← Back to Profile
          </button>
          <h2 style={{ margin:0, fontWeight:800, fontSize:22, color:'#2d3748' }}>Job Alerts</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#718096' }}>
            {alerts.filter(a=>a.active).length} active · {alerts.filter(a=>!a.active).length} paused
          </p>
        </div>
        <button onClick={()=>{setEditId(null);setForm({keywords:'',location:'',type:'Full Time',frequency:'Daily',salary:'',active:true});setShowCreate(true);}} style={{
          background:GRAD, color:'white', border:'none', borderRadius:20, padding:'11px 22px', fontWeight:600, cursor:'pointer', fontSize:13,
          display:'flex', alignItems:'center', gap:8
        }}>
          + Create New Alert
        </button>
      </div>

      {/* Create / Edit form */}
      {showCreate && (
        <div style={{ ...CARD, padding:24, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 18px', fontWeight:700, fontSize:16, color:'#2d3748' }}>
            {editId ? 'Edit Alert' : 'Create New Job Alert'}
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {/* Keywords */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:5 }}>Job Keywords *</label>
              <input value={form.keywords} onChange={setF('keywords')} placeholder="e.g. React Developer, UI/UX Designer"
                style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none' }} />
            </div>
            {/* Location */}
            <div>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:5 }}>Location</label>
              <input value={form.location} onChange={setF('location')} placeholder="e.g. Jaipur, Remote, Anywhere"
                style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none' }} />
            </div>
            {/* Salary */}
            <div>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:5 }}>Minimum Salary (optional)</label>
              <input value={form.salary} onChange={setF('salary')} placeholder="e.g. ₹6 LPA"
                style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none' }} />
            </div>
            {/* Job Type */}
            <div>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:5 }}>Job Type</label>
              <select value={form.type} onChange={setF('type')} style={{ width:'100%', border:'1.5px solid rgba(120,100,210,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13, outline:'none', background:'white' }}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            {/* Frequency */}
            <div>
              <label style={{ fontSize:12, color:'#718096', fontWeight:600, display:'block', marginBottom:5 }}>Alert Frequency</label>
              <div style={{ display:'flex', gap:8 }}>
                {FREQ.map(f=>(
                  <button key={f} onClick={()=>setForm(p=>({...p,frequency:f}))} style={{
                    flex:1, padding:'9px', borderRadius:10, border:'1.5px solid',
                    borderColor:form.frequency===f?BLUE:'rgba(120,100,210,0.2)',
                    background:form.frequency===f?LIGHT:'white',
                    color:form.frequency===f?BLUE:'#718096',
                    fontSize:12, fontWeight:600, cursor:'pointer'
                  }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={createAlert} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
              {editId ? 'Update Alert' : 'Create Alert 🔔'}
            </button>
            <button onClick={()=>{setShowCreate(false);setEditId(null);}} style={{ background:'white', color:'#718096', border:'1.5px solid #e2e8f0', borderRadius:20, padding:'10px 18px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div style={{ ...CARD, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔔</div>
          <div style={{ fontWeight:700, fontSize:16, color:'#2d3748', marginBottom:8 }}>No job alerts yet</div>
          <div style={{ fontSize:13, color:'#718096', marginBottom:20 }}>Create alerts to get notified about matching jobs</div>
          <button onClick={()=>setShowCreate(true)} style={{ background:GRAD, color:'white', border:'none', borderRadius:20, padding:'10px 24px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ ...CARD, padding:20, opacity: a.active ? 1 : 0.7, transition:'all 0.18s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:14, background: a.active ? GRAD : '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  🔔
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#2d3748' }}>{a.keywords}</div>
                  <div style={{ fontSize:12, color:'#718096', marginTop:2 }}>
                    {a.location && `📍 ${a.location} · `}
                    {a.type} · {a.frequency}
                    {a.salary && ` · Min ${a.salary}`}
                  </div>
                  <div style={{ fontSize:11, color:'#a0aec0', marginTop:2 }}>Created {a.createdAt}</div>
                </div>
                {/* matches badge */}
                <div style={{ background:LIGHT, borderRadius:12, padding:'8px 14px', textAlign:'center' }}>
                  <div style={{ fontWeight:800, fontSize:18, color:BLUE }}>{a.matches}</div>
                  <div style={{ fontSize:10, color:'#718096', fontWeight:600 }}>Matches</div>
                </div>
                {/* Active toggle */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div onClick={()=>toggleAlert(a.id)} style={{
                    width:42, height:22, borderRadius:20, cursor:'pointer',
                    background: a.active ? BLUE : '#e2e8f0', position:'relative', transition:'background 0.2s'
                  }}>
                    <div style={{
                      width:16, height:16, borderRadius:'50%', background:'white',
                      position:'absolute', top:3, left: a.active ? 22 : 4, transition:'left 0.2s',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize:10, color:'#718096', fontWeight:600 }}>{a.active?'Active':'Paused'}</span>
                </div>
                {/* Actions */}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>editAlert(a)} style={{ padding:'7px 14px', background:LIGHT, color:BLUE, border:'none', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={()=>deleteAlert(a.id)} style={{ padding:'7px 12px', background:'rgba(229,62,62,0.08)', color:'#e53e3e', border:'none', borderRadius:20, cursor:'pointer', fontSize:13 }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{ ...CARD, padding:20, marginTop:24, background:LIGHT }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <span style={{ fontSize:28 }}>💡</span>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#2d3748', marginBottom:4 }}>How Job Alerts Work</div>
            <div style={{ fontSize:12, color:'#718096', lineHeight:1.7 }}>
              We'll notify you when new jobs matching your criteria are posted. Set the frequency — Instant, Daily, or Weekly — and never miss an opportunity!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
