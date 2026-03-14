// ─────────────────────────────────────────────
// FILE: src/pages/MyProfile.jsx
// ─────────────────────────────────────────────
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { jobService } from "../services/JobService";

const G = {
  bg:          "#FAF8F4",
  bgAlt:       "#F3EFE8",
  border:      "#E8E0D5",
  borderLight: "#F0EAE0",
  primary:     "#E85D3F",
  primaryLight:"#FDE8E3",
  primaryDark: "#C4442A",
  accent:      "#F5A623",
  accentLight: "#FEF3D9",
  teal:        "#2EC4B6",
  tealLight:   "#E0F7F5",
  sage:        "#6B9E6D",
  sageLight:   "#E8F3E8",
  lavender:    "#7B61FF",
  lavLight:    "#EEE9FF",
  text:        "#1A1207",
  textMed:     "#4A3F35",
  muted:       "#9A8E82",
  chip:        "#F0EAE0",
  shadow:      "0 4px 24px rgba(60,40,20,0.10)",
  shadowLg:    "0 12px 48px rgba(60,40,20,0.14)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Plus Jakarta Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${G.bgAlt}; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 99px; }
  input, textarea, select {
    background: ${G.bgAlt}; color: ${G.text}; border: 1.5px solid ${G.border};
    border-radius: 12px; padding: 11px 16px; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; outline: none; width: 100%; transition: all 0.2s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: ${G.primary}; background: #fff; box-shadow: 0 0 0 3px ${G.primaryLight};
  }
  textarea { resize: vertical; }
  button { cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .fade-in  { animation: fadeIn  0.35s cubic-bezier(.22,1,.36,1); }
  .slide-up { animation: slideUp 0.3s  cubic-bezier(.22,1,.36,1); }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .skeleton {
    background: linear-gradient(90deg,${G.bgAlt} 25%,${G.borderLight} 50%,${G.bgAlt} 75%);
    background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

const AV_COLS = ["#E85D3F","#2EC4B6","#7B61FF","#F5A623","#6B9E6D","#E85D8F"];
const getInitials = (name="") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length>=2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (name.slice(0,2)||"?").toUpperCase();
};
const getAvColor = (name="") => AV_COLS[(name.charCodeAt(0)||0) % AV_COLS.length];

const Btn = ({ children, onClick, variant="primary", small=false, style={}, disabled=false }) => {
  const V = {
    primary:{ background:`linear-gradient(135deg,${G.primary},${G.primaryDark})`,color:"#fff",border:"none",shadow:`0 4px 16px ${G.primary}40`},
    ghost:  { background:"transparent",color:G.muted,border:`1.5px solid ${G.border}`,shadow:"none"},
    soft:   { background:G.primaryLight,color:G.primary,border:"none",shadow:"none"},
  };
  const v=V[variant]||V.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:v.background,color:v.color,border:v.border,
      padding:small?"8px 18px":"11px 24px",borderRadius:99,
      fontSize:small?13:14,fontWeight:600,transition:"all 0.2s",
      opacity:disabled?0.45:1,display:"flex",alignItems:"center",
      gap:7,whiteSpace:"nowrap",boxShadow:v.shadow,...style
    }}>{children}</button>
  );
};

const Toast = ({ msg, type="success", onClose }) => {
  const cfg={
    success:{bg:`linear-gradient(135deg,${G.teal},#1FA89F)`,icon:"✓"},
    error:  {bg:`linear-gradient(135deg,${G.primary},${G.primaryDark})`,icon:"✕"},
  }[type]||{bg:G.teal,icon:"✓"};
  return (
    <div className="slide-up" style={{ position:"fixed",bottom:32,right:32,zIndex:9999,
      background:cfg.bg,color:"#fff",padding:"14px 22px",borderRadius:16,
      fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:10,
      boxShadow:"0 12px 40px rgba(0,0,0,0.18)" }}>
      <span style={{ width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.25)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0 }}>{cfg.icon}</span>
      {msg}
      <button onClick={onClose} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.8)",fontSize:18,marginLeft:6 }}>×</button>
    </div>
  );
};

const MeshBg = ({ color, top, right, size=320 }) => (
  <div style={{ position:"absolute",top,right,width:size,height:size,
    borderRadius:"60% 40% 70% 30%/50% 60% 40% 50%",pointerEvents:"none",zIndex:0,
    background:`radial-gradient(ellipse at center,${color}22 0%,${color}08 60%,transparent 80%)` }}/>
);

const Skeleton = ({ w="100%", h=18, style={} }) => (
  <div className="skeleton" style={{ width:w,height:h,...style }}/>
);

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function MyProfilePage({ onBack }) {
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast,   setToast]   = useState(null);

  // ✅ stats: null = still loading, object = loaded
  const [stats,   setStats]   = useState(null);

  const [profile, setProfile] = useState(null);
  const [draft,   setDraft]   = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3500);
  };

  // ── 1. Seed profile from AuthContext.user ──────────────
  useEffect(()=>{
    if (!user) return;
    const seeded = {
      name:       user.username   || user.name       || user.fullName  || "",
      email:      user.email      || "",
      company:    user.recruiterProfile?.companyName || user.company   || user.organization || "",
      location:   user.location   || "",
      phone:      user.phone      || user.mobile     || "",
      website:    user.website    || "",
      bio:        user.bio        || "",
      role:       user.role       || user.designation|| user.jobTitle  || "Recruiter",
      linkedin:   user.linkedin   || "",
      experience: user.experience || "",
    };
    setProfile(seeded);
    setDraft({...seeded});
    setLoading(false);
  },[user]);

  // ── 2. ✅ Calculate stats from jobService (no broken API) ──
  useEffect(()=>{
    if (!user) return;

    const calcStats = async () => {
      try {
        const jobs   = await jobService.getRecruiterJobs();
        const allJobs = jobs || [];

        let totalApplicants = 0;
        let hiredThisMonth  = 0;
        const matchScores   = [];

        const now        = new Date();
        const thisMonth  = now.getMonth();
        const thisYear   = now.getFullYear();

        for (const job of allJobs) {
          try {
            const apps = await jobService.getJobApplications(job._id);
            const arr  = apps || [];
            totalApplicants += arr.length;

            arr.forEach(a => {
              // hired this month
              if (a.status==="accepted" || a.status==="hired") {
                const d = new Date(a.updatedAt || a.appliedAt || 0);
                if (d.getMonth()===thisMonth && d.getFullYear()===thisYear) {
                  hiredThisMonth++;
                }
              }
              // collect match scores
              const m = a.matchScore ?? a.match ?? null;
              if (m!==null && m!==undefined && !isNaN(Number(m))) {
                matchScores.push(Number(m));
              }
            });
          } catch { /* skip failed job */ }
        }

        const avgMatch = matchScores.length > 0
          ? Math.round(matchScores.reduce((s,v)=>s+v,0) / matchScores.length)
          : null;

        setStats({
          jobsPosted:      allJobs.length,
          totalApplicants,
          hiredThisMonth,
          avgMatchScore:   avgMatch,
        });
      } catch (err) {
        console.warn("Stats calc failed:", err?.message);
        // Show zeros instead of endless skeleton
        setStats({ jobsPosted:0, totalApplicants:0, hiredThisMonth:0, avgMatchScore:null });
      }
    };

    calcStats();
  },[user]);

  // ── 3. Save profile ────────────────────────────────────
  const handleSave = async () => {
    try {
      const res = await fetch("/api/recruiter/profile", {
        method:"PUT",
        headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      setProfile({...draft});
      setEditing(false);
      showToast("Profile saved successfully!");
    } catch {
      showToast("Failed to save profile.","error");
    }
  };

  // ── Loading state ──────────────────────────────────────
  if (!user || loading || !profile) {
    return (
      <div style={{ minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <style>{css}</style>
        <div style={{ textAlign:"center",color:G.muted }}>
          <div style={{ fontSize:32,marginBottom:12 }}>⏳</div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18 }}>Loading profile…</div>
        </div>
      </div>
    );
  }

  const initials    = getInitials(profile.name);
  const avatarColor = getAvColor(profile.name);

  // ── stat display values ──
  const statCards = [
    {
      l:"Jobs Posted",
      v: stats?.jobsPosted ?? null,
      i:"📋", col:G.lavender, light:G.lavLight,
    },
    {
      l:"Total Applicants",
      v: stats?.totalApplicants ?? null,
      i:"👥", col:G.primary,  light:G.primaryLight,
    },
    {
      l:"Hired This Month",
      v: stats?.hiredThisMonth ?? null,
      i:"🎉", col:G.sage,     light:G.sageLight,
    },
    {
      l:"Avg Match Score",
      v: stats?.avgMatchScore != null ? `${stats.avgMatchScore}%` : null,
      i:"⚡", col:G.accent,   light:G.accentLight,
    },
  ];

  return (
    <div className="fade-in" style={{ minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column" }}>
      <style>{css}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}

      {/* ── Top bar ── */}
      <div style={{ background:"#fff",borderBottom:`1px solid ${G.border}`,padding:"0 32px",
        display:"flex",alignItems:"center",height:64,gap:16,boxShadow:"0 1px 0 rgba(0,0,0,0.05)" }}>
        <button onClick={onBack} style={{ background:"none",border:`1.5px solid ${G.border}`,
          borderRadius:99,color:G.muted,fontSize:13,padding:"7px 16px",fontWeight:600,
          display:"flex",alignItems:"center",gap:6 }}>← Back</button>
        <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:G.text }}>
          My Profile
        </span>
        <div style={{ flex:1 }}/>
        {!editing
          ? <Btn onClick={()=>setEditing(true)} variant="soft" small>✏️ Edit Profile</Btn>
          : <>
              <Btn onClick={handleSave} variant="primary" small>✓ Save Changes</Btn>
              <Btn onClick={()=>{ setDraft({...profile}); setEditing(false); }} variant="ghost" small>Discard</Btn>
            </>
        }
      </div>

      <div style={{ maxWidth:820,margin:"36px auto",width:"100%",padding:"0 24px" }}>

        {/* ── Hero card ── */}
        <div style={{ background:"#fff",borderRadius:24,padding:36,marginBottom:24,
          boxShadow:G.shadow,position:"relative",overflow:"hidden" }}>
          <MeshBg color={G.primary} top={-80} right={-60} size={300}/>
          <MeshBg color={G.accent}  top={60}  right={80}  size={180}/>

          <div style={{ display:"flex",gap:28,alignItems:"flex-start",position:"relative",zIndex:1 }}>
            {/* Avatar */}
            <div style={{ position:"relative",flexShrink:0 }}>
              <div style={{ width:96,height:96,borderRadius:"50%",
                background:`linear-gradient(135deg,${avatarColor},${avatarColor}99)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:34,color:"#fff",
                boxShadow:`0 8px 28px ${avatarColor}40` }}>{initials}</div>
              <div style={{ position:"absolute",bottom:4,right:4,width:18,height:18,
                borderRadius:"50%",background:G.teal,border:"3px solid #fff",
                boxShadow:`0 2px 6px ${G.teal}50` }}/>
            </div>

            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:28,
                color:G.text,lineHeight:1.2 }}>
                {editing
                  ? <input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}
                      style={{ fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:700 }}/>
                  : profile.name || "—"
                }
              </h1>
              <p style={{ color:G.primary,fontWeight:600,fontSize:15,marginTop:4 }}>
                {editing
                  ? <input value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})}
                      style={{ marginTop:6 }} placeholder="Role / Title"/>
                  : profile.role || "Recruiter"
                }
              </p>
              {!editing && (
                <div style={{ display:"flex",gap:6,marginTop:8,flexWrap:"wrap" }}>
                  {profile.company&&(
                    <span style={{ background:G.chip,color:G.textMed,fontSize:12,padding:"4px 12px",borderRadius:99,fontWeight:500 }}>
                      🏢 {profile.company}
                    </span>
                  )}
                  {profile.location&&(
                    <span style={{ background:G.chip,color:G.textMed,fontSize:12,padding:"4px 12px",borderRadius:99,fontWeight:500 }}>
                      📍 {profile.location}
                    </span>
                  )}
                  <span style={{ background:G.tealLight,color:G.teal,fontSize:12,padding:"4px 12px",borderRadius:99,fontWeight:600 }}>
                    ✓ Verified Recruiter
                  </span>
                  {profile.experience&&(
                    <span style={{ background:G.accentLight,color:G.accent,fontSize:12,padding:"4px 12px",borderRadius:99,fontWeight:600 }}>
                      🏆 {profile.experience} exp.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginTop:24,paddingTop:24,borderTop:`1px dashed ${G.border}`,position:"relative",zIndex:1 }}>
            <label style={{ fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",letterSpacing:1 }}>About</label>
            {editing
              ? <textarea value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}
                  rows={3} style={{ marginTop:10 }} placeholder="Tell candidates about yourself…"/>
              : <p style={{ marginTop:8,fontSize:14,color:G.textMed,lineHeight:1.7 }}>
                  {profile.bio || <span style={{ color:G.muted,fontStyle:"italic" }}>No bio added yet.</span>}
                </p>
            }
          </div>

          {editing&&(
            <div style={{ marginTop:16,background:`linear-gradient(135deg,${G.primaryLight},${G.accentLight})`,
              borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14,position:"relative",zIndex:1 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:G.shadow }}>📷</div>
              <div>
                <div style={{ fontWeight:700,fontSize:14 }}>Change Profile Photo</div>
                <div style={{ color:G.muted,fontSize:12,marginTop:2 }}>JPG, PNG or GIF · Max 5MB</div>
              </div>
              <button style={{ marginLeft:"auto",background:"#fff",border:`1.5px solid ${G.border}`,
                color:G.text,borderRadius:99,padding:"8px 18px",fontSize:13,fontWeight:600,boxShadow:G.shadow }}>
                Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* ── Contact & Details ── */}
        <div style={{ background:"#fff",borderRadius:24,padding:32,boxShadow:G.shadow,marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18,marginBottom:24,color:G.text }}>
            Contact & Details
          </h3>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
            {[
              {label:"Full Name",  k:"name"      },
              {label:"Role/Title", k:"role"      },
              {label:"Email",      k:"email"     },
              {label:"Phone",      k:"phone"     },
              {label:"Company",    k:"company"   },
              {label:"Location",   k:"location"  },
              {label:"Website",    k:"website"   },
              {label:"LinkedIn",   k:"linkedin"  },
              {label:"Experience", k:"experience"},
            ].map(f=>(
              <div key={f.k}>
                <label style={{ display:"block",fontSize:11,fontWeight:700,color:G.muted,
                  marginBottom:7,textTransform:"uppercase",letterSpacing:.8 }}>{f.label}</label>
                {editing
                  ? <input value={draft[f.k]||""} onChange={e=>setDraft({...draft,[f.k]:e.target.value})}
                      placeholder={f.label}
                      readOnly={f.k==="email"}
                      style={f.k==="email"?{opacity:.7,cursor:"not-allowed"}:{}}/>
                  : <div style={{ background:G.bgAlt,border:`1.5px solid ${G.borderLight}`,
                      borderRadius:12,padding:"11px 16px",fontSize:14,
                      color:profile[f.k]?G.textMed:G.muted,
                      fontStyle:profile[f.k]?"normal":"italic" }}>
                      {profile[f.k]||"Not provided"}
                    </div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:36 }}>
          {statCards.map(s=>(
            <div key={s.l} style={{ background:"#fff",borderRadius:20,padding:"22px 20px",
              boxShadow:G.shadow,position:"relative",overflow:"hidden" }}>
              {/* decorative blob */}
              <div style={{ position:"absolute",top:-16,right:-16,width:72,height:72,
                borderRadius:"50%",background:s.light,zIndex:0 }}/>
              <div style={{ position:"relative",zIndex:1 }}>
                <span style={{ fontSize:26 }}>{s.i}</span>
                {/* ✅ show skeleton ONLY when stats===null (still loading) */}
                {stats === null
                  ? <Skeleton w="60%" h={28} style={{ marginTop:8 }}/>
                  : <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:800,
                      fontSize:26,color:s.col,marginTop:8,lineHeight:1 }}>
                      {s.v !== null && s.v !== undefined ? s.v : "0"}
                    </div>
                }
                <div style={{ color:G.muted,fontSize:12,marginTop:4,fontWeight:500 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
