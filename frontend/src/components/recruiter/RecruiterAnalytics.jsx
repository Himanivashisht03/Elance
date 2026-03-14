import { useState, useEffect, useContext, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, ComposedChart, Line, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { AuthContext } from "../../contexts/AuthContext";
import { authService } from "../../services/AuthService";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const C = {
  primary:"#0F2447", accent:"#E85D26", teal:"#0891B2",
  gold:"#D97706", success:"#059669", purple:"#7C3AED",
  soft:"#F1F5FB", border:"#DDE6F0", text:"#0F2447", muted:"#64748B",
  bg:"#EEF2FA", card:"#FFFFFF",
  p:["#0F2447","#0891B2","#E85D26","#D97706","#059669","#7C3AED","#DB2777","#0369A1"],
};

const PERIODS = [
  "All Time","Today","Last 7 Days","Last 14 Days","Last 30 Days",
  "Last 60 Days","Last 90 Days","Last 6 Months","Last 1 Year",
];

function getToken() {
  try { const t = authService?.getToken?.(); if (t && t.length > 10) return t; } catch(_) {}
  const keys = ["token","authToken","auth_token","jwtToken","jwt","accessToken","access_token"];
  for (const k of keys) {
    try { const v = localStorage.getItem(k); if (v && v.length > 10) return v; } catch(_) {}
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const val = localStorage.getItem(localStorage.key(i));
      if (val && val.startsWith("eyJ") && val.split(".").length === 3) return val;
    }
  } catch(_) {}
  return "";
}

function H() {
  const t = getToken();
  return { "Content-Type":"application/json", ...(t ? { Authorization:`Bearer ${t}` } : {}) };
}

/* ─── DATA HOOK ─────────────────────────────────────────────── */
function useAnalytics(period, searchRole) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const { user }              = useContext(AuthContext);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const tf = encodeURIComponent(period);
    const rl = encodeURIComponent(searchRole || "All Roles");
    const h  = H();

    const get = (url) =>
      fetch(url, { headers: h })
        .then(r => {
          if (r.status === 401) { console.error("401 Unauthorized:", url); return {}; }
          if (!r.ok) throw new Error(`${r.status} ${url}`);
          return r.json();
        })
        .catch(e => { console.warn("fetch error:", e.message); return {}; });

    Promise.all([
      get(`${API}/analytics/overview?timeFilter=${tf}`),
      get(`${API}/analytics/candidates?timeFilter=${tf}&role=${rl}`),
      get(`${API}/analytics/pipeline?timeFilter=${tf}&role=${rl}`),
      get(`${API}/analytics/statusBreakdown?timeFilter=${tf}&role=${rl}`),
      get(`${API}/analytics/topSkills`),
      get(`${API}/analytics/applicantSkills?timeFilter=${tf}`),
      get(`${API}/analytics/hireRate?timeFilter=${tf}`),
      get(`${API}/analytics/qualityTrend?timeFilter=${tf}`),
      get(`${API}/analytics/roles`),
    ]).then(([overview,candidates,pipeline,statusBreakdown,
              topSkills,applicantSkills,hireRate,qualityTrend,rolesData]) => {
      if (!cancelled)
        setData({ overview, candidates, pipeline, statusBreakdown,
                  topSkills, applicantSkills, hireRate, qualityTrend, rolesData });
    }).catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period, searchRole, user?._id]);

  return { data, loading, error };
}

/* ─── SHARED UI ─────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(15,36,71,0.96)", color:"#fff", padding:"8px 13px",
      borderRadius:8, fontSize:11, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
      {label && <div style={{ fontWeight:700, marginBottom:4, color:"#93C5FD" }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ width:7, height:7, borderRadius:2, background:p.fill||p.color||p.stroke }}/>
          <span style={{ opacity:.75, fontSize:10 }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Card = ({ children, style={} }) => (
  <div style={{ background:C.card, borderRadius:12, padding:"12px 14px",
    border:`1px solid ${C.border}`, boxShadow:"0 2px 8px rgba(15,36,71,0.06)",
    display:"flex", flexDirection:"column", overflow:"hidden", ...style }}>
    {children}
  </div>
);

const CT = ({ children, sub, right }) => (
  <div style={{ flexShrink:0, marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
    <div>
      <div style={{ fontSize:11.5, fontWeight:800, color:C.primary, letterSpacing:"-0.01em" }}>{children}</div>
      {sub && <div style={{ fontSize:9, color:C.muted, marginTop:1 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

const KPI = ({ label, value, accent, sub, icon }) => (
  <div style={{ background:C.card, borderRadius:10, padding:"10px 14px", flex:1,
    border:`1px solid ${C.border}`, position:"relative", overflow:"hidden",
    boxShadow:"0 2px 6px rgba(15,36,71,0.06)" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
      background:accent||C.primary, borderRadius:"10px 10px 0 0" }}/>
    <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
      fontSize:22, opacity:0.06 }}>{icon}</div>
    <div style={{ fontSize:9, color:C.muted, fontWeight:700, textTransform:"uppercase",
      letterSpacing:"0.08em", marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:900, color:accent||C.primary,
      fontFamily:"'SF Mono',monospace", lineHeight:1 }}>{value ?? 0}</div>
    {sub && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{sub}</div>}
  </div>
);

const DDSelect = ({ value, onChange, opts, style={} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`,
      background:"#F7F9FD", fontSize:10, fontWeight:600, color:C.primary,
      cursor:"pointer", outline:"none", ...style }}>
    {opts.map(o => <option key={o}>{o}</option>)}
  </select>
);

/* ─── ROLE SEARCH BAR ────────────────────────────────────────── */
const RoleSearchBar = ({ value, onChange, allRoles }) => {
  const [open,  setOpen]  = useState(false);
  const [input, setInput] = useState(value === "All Roles" ? "" : value);
  const ref = useRef(null);

  useEffect(() => { setInput(value === "All Roles" ? "" : value); }, [value]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = allRoles.filter(r => r.toLowerCase().includes(input.toLowerCase()));
  const select   = r => { onChange(r); setInput(r); setOpen(false); };

  return (
    <div ref={ref} style={{ position:"relative", zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
        background:"#fff", borderRadius:8, border:`1px solid ${open ? C.accent : C.border}`,
        cursor:"pointer", minWidth:160, boxShadow:"0 1px 4px rgba(15,36,71,0.07)" }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize:11, color:value === "All Roles" ? C.muted : C.accent,
          fontWeight:value === "All Roles" ? 500 : 700, flex:1 }}>
          {value === "All Roles" ? "All Roles" : value}
        </span>
        {value !== "All Roles" && (
          <span onClick={e => { e.stopPropagation(); onChange("All Roles"); setInput(""); }}
            style={{ fontSize:13, color:C.muted, lineHeight:1, cursor:"pointer", padding:"0 2px" }}>×</span>
        )}
        <span style={{ fontSize:10, color:C.muted }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", right:0, background:"#fff",
          borderRadius:10, border:`1px solid ${C.border}`, boxShadow:"0 8px 32px rgba(15,36,71,0.14)",
          minWidth:200, overflow:"hidden" }}>
          <div style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}` }}>
            <input autoFocus value={input} onChange={e => { setInput(e.target.value); setOpen(true); }}
              placeholder="Search roles…"
              style={{ width:"100%", border:"none", outline:"none", fontSize:11, color:C.text, background:"transparent" }}/>
          </div>
          <div onClick={() => select("All Roles")}
            style={{ padding:"9px 14px", fontSize:11, cursor:"pointer",
              fontWeight:value === "All Roles" ? 700 : 500,
              color:value === "All Roles" ? C.accent : C.text,
              background:value === "All Roles" ? "#FFF3EE" : "transparent",
              borderBottom:`1px solid ${C.border}` }}>
            🌐 All Roles
          </div>
          <div style={{ maxHeight:210, overflowY:"auto" }}>
            {filtered.length === 0
              ? <div style={{ padding:"18px 14px", textAlign:"center", color:C.muted, fontSize:11 }}>
                  No roles match "{input}"
                </div>
              : filtered.map((r, i) => (
                  <div key={r} onClick={() => select(r)}
                    style={{ padding:"9px 14px", fontSize:11, cursor:"pointer",
                      fontWeight:value === r ? 700 : 500, color:value === r ? C.accent : C.text,
                      background:value === r ? "#FFF3EE" : "transparent",
                      borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ width:7, height:7, borderRadius:"50%",
                      background:C.p[i % C.p.length], display:"inline-block", marginRight:8 }}/>
                    {r}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Funnel ─────────────────────────────────────────────────── */
const FunnelViz = ({ data }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:4 }}>
      {data.map(d => {
        const pct = Math.round(d.value / max * 100);
        return (
          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:72, fontSize:9.5, color:C.text, fontWeight:600, textAlign:"right", flexShrink:0 }}>{d.name}</div>
            <div style={{ width:`${12 + pct * 0.85}%`, background:d.fill, borderRadius:4, height:22,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"0 9px", boxShadow:`0 2px 6px ${d.fill}44` }}>
              <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>{d.value}</span>
              <span style={{ color:"rgba(255,255,255,0.75)", fontSize:9 }}>{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Status Table ────────────────────────────────────────────── */
const StatusTable = ({ rows }) => {
  const total  = rows.reduce((s, r) => s + r.count, 0);
  const colors = { accepted:C.success, shortlisted:C.teal, reviewed:C.gold, rejected:C.accent, pending:C.purple };
  return (
    <div style={{ flex:1, overflow:"auto" }}>
      {rows.length === 0
        ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            height:"100%", color:C.muted, fontSize:11 }}>No applications yet</div>
        : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                {["Status","Count","Share"].map(h => (
                  <th key={h} style={{ padding:"6px 8px", fontSize:9, fontWeight:800, color:C.muted,
                    textTransform:"uppercase", letterSpacing:"0.06em",
                    textAlign:h === "Count" ? "center" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const color = colors[row.statusRaw || row.status?.toLowerCase()] || C.muted;
                const pct   = total > 0 ? ((row.count / total) * 100).toFixed(1) : 0;
                return (
                  <tr key={row.status} style={{ borderBottom:`1px solid ${C.border}`,
                    background:i % 2 === 0 ? "#FAFBFD" : "#fff" }}>
                    <td style={{ padding:"7px 8px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:color }}/>
                        <span style={{ fontWeight:700, color:C.text }}>{row.status}</span>
                      </div>
                    </td>
                    <td style={{ padding:"7px 8px", textAlign:"center", fontWeight:900,
                      color, fontSize:14, fontFamily:"monospace" }}>{row.count}</td>
                    <td style={{ padding:"7px 8px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ flex:1, height:5, background:"#EEF2FA", borderRadius:3 }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:9, fontWeight:700, color:C.muted, minWidth:34 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:`2px solid ${C.border}`, background:C.soft }}>
                <td style={{ padding:"6px 8px", fontWeight:800, fontSize:10, color:C.primary }}>TOTAL</td>
                <td style={{ padding:"6px 8px", textAlign:"center", fontWeight:900,
                  fontSize:14, color:C.primary, fontFamily:"monospace" }}>{total}</td>
                <td/>
              </tr>
            </tfoot>
          </table>}
    </div>
  );
};

/* ══════ SLIDE 1 — OVERVIEW ════════════════════════════════════ */
const SlideOverview = ({ data }) => {
  const pipeline   = data?.pipeline?.pipeline || [];
  const statusBD   = data?.statusBreakdown?.statusBreakdown || [];
  const candidates = data?.candidates?.candidates || [];
  const hireRaw    = data?.hireRate?.byRole || [];
  const skillMatch = data?.applicantSkills?.byJob || [];

  const pd = pipeline.length > 0 ? pipeline
    : Array.from({ length:5 }, (_, i) => ({ week:`W${i+1}`, applications:0, qualified:0, hired:0 }));

  const fColors = { Accepted:C.success, Shortlisted:C.teal, Reviewed:C.gold, Pending:C.purple, Rejected:C.accent };
  const funnel  = statusBD.filter(s => s.count > 0)
    .map(s => ({ name:s.status, value:s.count, fill:fColors[s.status] || s.color || C.muted }));
  const total   = funnel.reduce((s, f) => s + f.value, 0);
  const acc     = funnel.find(f => f.name === "Accepted")?.value || 0;
  const conv    = total > 0 ? ((acc / total) * 100).toFixed(1) : "0.0";

  // Candidates per role
  const rm = {};
  candidates.forEach(c => {
    if (!rm[c.role]) rm[c.role] = { role:c.role, total:0, active:0, hired:0 };
    rm[c.role].total++;
    if (["shortlisted","reviewed"].includes(c.status)) rm[c.role].active++;
    if (c.status === "accepted") rm[c.role].hired++;
  });
  hireRaw.forEach(r => {
    if (!rm[r.role]) rm[r.role] = { role:r.role, total:r.total, active:r.shortlisted, hired:r.hired };
  });
  const perRole = Object.values(rm).sort((a, b) => b.total - a.total).slice(0, 6);

  const smHasData = skillMatch.some(j => j.total > 0);

  const hd = hireRaw.slice(0, 6).map(r => ({
    role: r.role.length > 12 ? r.role.slice(0, 11) + "…" : r.role,
    shortlisted: r.shortlisted,
    accepted:    r.hired,
    rejected:    r.rejected,
    pending:     r.pending || 0,
    total:       r.total,
  }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr 1fr 1fr",
      gridTemplateRows:"1fr 1fr", gap:8, flex:1, minHeight:0 }}>

      {/* ── Application Funnel ── */}
      <Card style={{ gridRow:"1/3" }}>
        <CT>Application Funnel</CT>
        {funnel.length > 0 ? <FunnelViz data={funnel}/>
          : <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:36 }}>📭</div>
              <div style={{ color:C.muted, fontSize:11, textAlign:"center" }}>
                No applications yet.<br/>Post jobs to see funnel.
              </div>
            </div>}
        <div style={{ marginTop:"auto", padding:"8px 10px",
          background:"linear-gradient(135deg,#F1F5FB,#E8F5EE)", borderRadius:8, marginTop:10 }}>
          <div style={{ fontSize:9, color:C.muted, fontWeight:600 }}>Applied → Accepted</div>
          <div style={{ fontSize:24, fontWeight:900, color:C.success, fontFamily:"monospace" }}>{conv}%</div>
        </div>
      </Card>

      {/* ── Pipeline Trend ── */}
      <Card style={{ gridColumn:"2/3" }}>
        <CT sub="Weekly applications & shortlisted">Pipeline Trend</CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pd} margin={{ top:4, right:6, bottom:0, left:-12 }}>
              <defs>
                <linearGradient id="ga1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.success} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.success} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
              <XAxis dataKey="week" tick={{ fontSize:8, fill:C.muted }}/>
              <YAxis tick={{ fontSize:8, fill:C.muted }} width={20}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="applications" stroke={C.primary} strokeWidth={2}
                fill="url(#ga1)" name="Applications" dot={{ fill:C.primary, r:3 }}/>
              <Area type="monotone" dataKey="qualified" stroke={C.success} strokeWidth={2}
                fill="url(#ga2)" name="Shortlisted" dot={{ fill:C.success, r:3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Role Breakdown ── */}
      <Card style={{ gridColumn:"3/4" }}>
        <CT sub="Applications by role & status">Role Breakdown</CT>
        <div style={{ flex:1, minHeight:0 }}>
          {hd.length === 0
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:28 }}>📊</div>
                <div style={{ fontSize:11, color:C.muted, textAlign:"center" }}>No applications yet</div>
              </div>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hd} layout="vertical" barSize={9}
                  margin={{ top:4, right:6, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA" horizontal={false}/>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize:8, fill:C.muted }}/>
                  <YAxis dataKey="role" type="category" tick={{ fontSize:8, fill:C.muted }} width={56}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="shortlisted" name="Shortlisted" fill={C.teal}    stackId="s"/>
                  <Bar dataKey="accepted"    name="Accepted"    fill={C.success} stackId="s"/>
                  <Bar dataKey="rejected"    name="Rejected"    fill={C.accent}  stackId="s" radius={[0,3,3,0]}/>
                </BarChart>
              </ResponsiveContainer>}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0, marginTop:3, flexWrap:"wrap" }}>
          {[["Shortlisted",C.teal],["Accepted",C.success],["Rejected",C.accent]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
              <div style={{ width:6, height:6, borderRadius:2, background:c }}/>
              <span style={{ fontSize:8, color:C.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Match Quality ── */}
      <Card style={{ gridColumn:"4/5" }}>
        <CT sub="Applicant skill match % per role">Match Quality</CT>
        <div style={{ flex:1, minHeight:0 }}>
          {!smHasData
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:28 }}>🎯</div>
                <span style={{ fontSize:11, color:C.muted, textAlign:"center" }}>No applicants yet</span>
              </div>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillMatch.slice(0, 5).map(j => ({
                    ...j,
                    role: j.role.length > 12 ? j.role.slice(0, 11) + "…" : j.role,
                  }))}
                  layout="vertical" barSize={9}
                  margin={{ top:4, right:6, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA" horizontal={false}/>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize:8, fill:C.muted }}/>
                  <YAxis dataKey="role" type="category" tick={{ fontSize:8, fill:C.muted }} width={56}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="76-100" name="76-100%" fill={C.success}  stackId="m"/>
                  <Bar dataKey="51-75"  name="51-75%"  fill={C.teal}     stackId="m"/>
                  <Bar dataKey="26-50"  name="26-50%"  fill={C.gold}     stackId="m"/>
                  <Bar dataKey="0-25"   name="0-25%"   fill={C.accent}   stackId="m" radius={[0,3,3,0]}/>
                </BarChart>
              </ResponsiveContainer>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0, marginTop:3, flexWrap:"wrap" }}>
          {[["76-100%",C.success],["51-75%",C.teal],["26-50%",C.gold],["0-25%",C.accent]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
              <div style={{ width:6, height:6, borderRadius:2, background:c }}/>
              <span style={{ fontSize:8, color:C.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Candidates per Role ── */}
      <Card style={{ gridColumn:"2/3" }}>
        <CT sub="Total · Shortlisted · Hired">Candidates per Role</CT>
        <div style={{ flex:1, minHeight:0, position:"relative" }}>
          {perRole.length === 0
            ? <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                justifyContent:"center", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:28 }}>👥</div>
                <span style={{ fontSize:11, color:C.muted }}>No data yet</span>
              </div>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perRole} barSize={8}
                  margin={{ top:4, right:6, bottom:22, left:-12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
                  <XAxis dataKey="role" tick={{ fontSize:8, fill:C.muted }} interval={0} angle={-18} textAnchor="end"/>
                  <YAxis tick={{ fontSize:8, fill:C.muted }} width={20}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="total"  fill="#D0DCF0"   name="Total"       radius={[2,2,0,0]}/>
                  <Bar dataKey="active" fill={C.teal}    name="Shortlisted" radius={[2,2,0,0]}/>
                  <Bar dataKey="hired"  fill={C.success} name="Hired"       radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>}
        </div>
      </Card>

      {/* ── Application Status Table ── */}
      <Card style={{ gridColumn:"3/5" }}>
        <CT sub="Real-time status breakdown">Application Status</CT>
        <StatusTable rows={statusBD}/>
      </Card>
    </div>
  );
};

/* ══════ SLIDE 2 — CANDIDATES ══════════════════════════════════ */
const SlideCandidates = ({ data }) => {
  const cands  = data?.candidates?.candidates || [];
  const skills = data?.topSkills?.skills || [];
  const [fRole, setFRole] = useState("All");

  const eb = { "0-1 yrs":0, "1-3 yrs":0, "3-5 yrs":0, "5+ yrs":0 };
  cands.forEach(c => {
    const y = c.expYears || 0;
    if (y < 1) eb["0-1 yrs"]++; else if (y < 3) eb["1-3 yrs"]++;
    else if (y < 5) eb["3-5 yrs"]++; else eb["5+ yrs"]++;
  });

  const hs = { "0-20":0, "20-40":0, "40-60":0, "60-80":0, "80-100":0 };
  cands.forEach(c => {
    const m = c.match || 0;
    if (m < 20) hs["0-20"]++; else if (m < 40) hs["20-40"]++;
    else if (m < 60) hs["40-60"]++; else if (m < 80) hs["60-80"]++; else hs["80-100"]++;
  });

  const allRoles    = ["All", ...new Set(cands.map(c => c.role).filter(Boolean))];
  const filtered    = fRole === "All" ? cands : cands.filter(c => c.role === fRole);
  const scatterData = filtered.map(c => ({
    name: c.name, exp: c.expYears || 0, match: c.match || 0,
    skills: c.skillsMatched || 0, z: Math.max((c.skillsMatched || 1) * 6 + 12, 20),
  }));

  const bands = ["0-40","40-60","60-80","80-100"];
  const rSet  = [...new Set(cands.map(c => c.role).filter(Boolean))].slice(0, 5);
  const hGrid = rSet.map(role => {
    const ms = cands.filter(c => c.role === role).map(c => c.match || 0);
    return { role,
      "0-40":  ms.filter(v => v < 40).length,
      "40-60": ms.filter(v => v >= 40 && v < 60).length,
      "60-80": ms.filter(v => v >= 60 && v < 80).length,
      "80-100":ms.filter(v => v >= 80).length };
  });
  const hMax = Math.max(1, ...hGrid.flatMap(r => bands.map(b => r[b])));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
      gridTemplateRows:"1fr 1.2fr", gap:8, flex:1, minHeight:0 }}>

      <Card>
        <CT>Experience Distribution</CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(eb).map(([range, count]) => ({ range, count }))}
              barSize={26} margin={{ top:4, right:6, bottom:4, left:-12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
              <XAxis dataKey="range" tick={{ fontSize:9, fill:C.muted }}/>
              <YAxis tick={{ fontSize:9, fill:C.muted }} width={22}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="count" radius={[4,4,0,0]} name="Candidates">
                {Object.keys(eb).map((_, i) => <Cell key={i} fill={C.p[i % C.p.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CT sub="Score buckets 0–100%">Match Score Distribution</CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(hs).map(([range, count]) => ({ range, count }))}
              barSize={28} margin={{ top:4, right:6, bottom:4, left:-12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
              <XAxis dataKey="range" tick={{ fontSize:9, fill:C.muted }}/>
              <YAxis tick={{ fontSize:9, fill:C.muted }} width={22}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="count" radius={[4,4,0,0]} name="Candidates">
                {Object.keys(hs).map((_, i) => <Cell key={i} fill={C.p[i % C.p.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Top Skills — FROM RECRUITER'S REAL JOBS ── */}
      <Card>
        <CT sub="Skills required in your posted jobs">Top Skills Demand</CT>
        <div style={{ flex:1, overflow:"auto" }}>
          {skills.length === 0
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:28 }}>🛠️</div>
                <div style={{ color:C.muted, fontSize:11, textAlign:"center" }}>
                  No skills data.<br/>
                  <span style={{ fontSize:10 }}>Add required skills to your job postings.</span>
                </div>
              </div>
            : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                    {["#","Skill","# Jobs Req.","Applicants w/ Skill"].map(h => (
                      <th key={h} style={{ padding:"5px 7px", fontSize:9, fontWeight:800, color:C.muted,
                        textTransform:"uppercase",
                        textAlign:["#","# Jobs Req.","Applicants w/ Skill"].includes(h) ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skills.map((row, i) => (
                    <tr key={row.name} style={{ borderBottom:`1px solid ${C.border}`,
                      background:i % 2 === 0 ? "#FAFBFD" : "#fff" }}>
                      <td style={{ padding:"6px 7px", textAlign:"center", fontWeight:800, color:C.muted }}>{i+1}</td>
                      <td style={{ padding:"6px 7px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:C.p[i % C.p.length] }}/>
                          <span style={{ fontWeight:700, color:C.text }}>{row.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"6px 7px", textAlign:"center" }}>
                        <span style={{ background:C.soft, borderRadius:4, padding:"1px 6px",
                          fontSize:9, fontWeight:800, color:C.primary }}>{row.demandScore}</span>
                      </td>
                      <td style={{ padding:"6px 7px", textAlign:"center", fontWeight:800,
                        color:C.teal, fontFamily:"monospace" }}>{row.candidateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </div>
      </Card>

      <Card style={{ gridColumn:"1/3", gridRow:"2/3" }}>
        <CT sub="Bubble size = skills matched"
          right={<DDSelect value={fRole} onChange={setFRole} opts={allRoles}/>}>
          Match % vs Experience
        </CT>
        <div style={{ flex:1, minHeight:0 }}>
          {scatterData.length === 0
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:36 }}>🫧</div>
                <div style={{ color:C.muted, fontSize:12 }}>No applicants yet.</div>
              </div>
            : <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top:8, right:20, bottom:20, left:-8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
                  <XAxis dataKey="exp" type="number" tick={{ fontSize:9, fill:C.muted }}
                    label={{ value:"Experience (yrs)", position:"insideBottom", offset:-12, fontSize:9, fill:C.muted }}/>
                  <YAxis dataKey="match" type="number" domain={[0,100]}
                    tick={{ fontSize:9, fill:C.muted }}
                    label={{ value:"Match %", angle:-90, position:"insideLeft", fontSize:9, fill:C.muted }}/>
                  <ZAxis dataKey="z" range={[30,400]}/>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background:"rgba(15,36,71,0.95)", color:"#fff",
                        padding:"8px 12px", borderRadius:8, fontSize:11 }}>
                        <div style={{ fontWeight:700, marginBottom:3 }}>{d.name}</div>
                        <div>Match: {d.match}% · Exp: {d.exp}y · Skills: {d.skills}</div>
                      </div>
                    );
                  }}/>
                  <Scatter data={scatterData} fill={C.teal} fillOpacity={0.75}/>
                </ScatterChart>
              </ResponsiveContainer>}
        </div>
        <div style={{ display:"flex", gap:14, flexShrink:0, marginTop:2 }}>
          <span style={{ fontSize:8, color:C.muted }}>Total: {filtered.length}</span>
          <span style={{ fontSize:8, color:C.muted }}>
            Avg Match: <strong style={{ color:C.teal }}>
              {filtered.length ? Math.round(filtered.reduce((s,c) => s + (c.match||0), 0) / filtered.length) : 0}%
            </strong>
          </span>
          <span style={{ fontSize:8, color:C.muted }}>
            Avg Exp: <strong style={{ color:C.primary }}>
              {filtered.length ? (filtered.reduce((s,c) => s + (c.expYears||0), 0) / filtered.length).toFixed(1) : 0} yrs
            </strong>
          </span>
        </div>
      </Card>

      {/* ── Score Heatmap ── */}
      <Card style={{ gridColumn:"3/4", gridRow:"2/3" }}>
        <CT sub="Match score grid by role">Score Heatmap</CT>
        <div style={{ flex:1, overflow:"auto" }}>
          {hGrid.length === 0
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", color:C.muted, fontSize:11 }}>No data</div>
            : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:9 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                    <th style={{ padding:"4px 6px", fontWeight:700, color:C.muted, textAlign:"left" }}>Role</th>
                    {bands.map(b => (
                      <th key={b} style={{ padding:"4px 6px", fontWeight:700, color:C.muted, textAlign:"center" }}>{b}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hGrid.map((row, ri) => (
                    <tr key={row.role} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"5px 6px", fontWeight:600, color:C.text,
                        maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {row.role}
                      </td>
                      {bands.map((b, bi) => {
                        const v = row[b];
                        const bColors = ["#FEE2E2","#FEF3C7","#DCFCE7","#DBEAFE"];
                        const tColors = ["#DC2626","#D97706","#15803D","#1D4ED8"];
                        return (
                          <td key={b} style={{ padding:"5px 6px", textAlign:"center",
                            background:v > 0 ? bColors[bi] : "transparent",
                            color:v > 0 ? tColors[bi] : C.muted,
                            fontWeight:v > 0 ? 900 : 400 }}>
                            {v > 0 ? v : "·"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>}
        </div>
      </Card>
    </div>
  );
};

/* ══════ SLIDE 3 — TRENDS ══════════════════════════════════════ */
const SlideTrends = ({ data }) => {
  const pipeline  = data?.pipeline?.pipeline || [];
  const qualRaw   = data?.qualityTrend?.trend || [];
  const hireRaw   = data?.hireRate?.byRole || [];
  const [tv, setTv] = useState("Applications");

  const pd = pipeline.length > 0 ? pipeline
    : Array.from({ length:5 }, (_, i) => ({ week:`W${i+1}`, applications:0, qualified:0, hired:0 }));
  const tk = tv === "Applications" ? "applications" : tv === "Shortlisted" ? "qualified" : "hired";
  const vd = pd.map(d => ({ ...d, convRate: d.applications > 0 ? Math.round(((d.hired||0)/d.applications)*100) : 0 }));
  const qd = qualRaw.length > 0 ? qualRaw : pd.map(d => ({ week:d.week, avgMatch:0, qualified:0 }));

  const hd = hireRaw.map(r => ({
    role: r.role.length > 14 ? r.role.slice(0, 13) + "…" : r.role,
    applications: r.total,
    shortlisted:  r.shortlisted,
    hired:        r.hired,
  }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
      gridTemplateRows:"1fr 1fr", gap:8, flex:1, minHeight:0 }}>

      <Card>
        <CT sub="Weekly pipeline + conversion"
          right={<DDSelect value={tv} onChange={setTv} opts={["Applications","Shortlisted","Hired"]}/>}>
          Hiring Velocity
        </CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={vd} margin={{ top:4, right:32, bottom:4, left:-12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
              <XAxis dataKey="week" tick={{ fontSize:10, fill:C.muted }}/>
              <YAxis yAxisId="left"  tick={{ fontSize:10, fill:C.muted }} width={24}/>
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`}
                tick={{ fontSize:9, fill:C.muted }} width={32}/>
              <Tooltip content={<Tip/>}/>
              <Bar yAxisId="left" dataKey={tk} fill={C.primary} radius={[4,4,0,0]} name={tv} barSize={18}/>
              <Line yAxisId="right" type="monotone" dataKey="convRate"
                stroke={C.accent} strokeWidth={2.5} dot={{ fill:C.accent, r:3.5 }} name="Conv %"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CT sub="Applications, shortlisted & hired per role">Applications per Role</CT>
        <div style={{ flex:1, minHeight:0 }}>
          {hd.length === 0
            ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:32 }}>📋</div>
                <div style={{ color:C.muted, fontSize:12, textAlign:"center" }}>No jobs posted yet.</div>
              </div>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hd} layout="vertical" barSize={9}
                  margin={{ top:4, right:10, bottom:4, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize:9, fill:C.muted }}/>
                  <YAxis dataKey="role" type="category" tick={{ fontSize:9, fill:C.muted }} width={90}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="applications" name="Applied"     radius={[0,3,3,0]} barSize={10}>
                    {hd.map((_, i) => <Cell key={i} fill={C.p[i % C.p.length]}/>)}
                  </Bar>
                  <Bar dataKey="shortlisted"  name="Shortlisted" radius={[0,3,3,0]} barSize={10} fill={C.teal}/>
                  <Bar dataKey="hired"        name="Hired"       radius={[0,3,3,0]} barSize={10} fill={C.success}/>
                </BarChart>
              </ResponsiveContainer>}
        </div>
        <div style={{ display:"flex", gap:12, flexShrink:0, marginTop:2 }}>
          {[["Applied",C.primary],["Shortlisted",C.teal],["Hired",C.success]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
              <span style={{ fontSize:8, color:C.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CT sub="Avg match % + qualified over time">Candidate Quality Trend</CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={qd} margin={{ top:4, right:32, bottom:4, left:-12 }}>
              <defs>
                <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA"/>
              <XAxis dataKey="week" tick={{ fontSize:10, fill:C.muted }}/>
              <YAxis yAxisId="left"  domain={[0,100]} tickFormatter={v => `${v}%`}
                tick={{ fontSize:10, fill:C.muted }} width={30}/>
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize:9, fill:C.muted }} width={24}/>
              <Tooltip content={<Tip/>}/>
              <Area yAxisId="left" type="monotone" dataKey="avgMatch"
                stroke={C.teal} strokeWidth={2.5} fill="url(#gq)" name="Avg Match %"/>
              <Bar yAxisId="right" dataKey="qualified" fill={C.success} fillOpacity={0.7}
                radius={[3,3,0,0]} name="Shortlisted" barSize={12}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CT sub="Stage proportions over time">Application Stage Flow</CT>
        <div style={{ flex:1, minHeight:0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pd} margin={{ top:4, right:10, bottom:4, left:-12 }} stackOffset="expand">
              <defs>
                {[C.primary, C.teal, C.success].map((c, i) => (
                  <linearGradient key={i} id={`gs${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.85}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0.55}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,210,230,0.5)"/>
              <XAxis dataKey="week" tick={{ fontSize:10, fill:C.muted }}/>
              <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fontSize:9, fill:C.muted }} width={30}/>
              <Tooltip content={<Tip/>} formatter={(v,n) => [`${(v*100).toFixed(1)}%`, n]}/>
              <Area type="monotone" dataKey="applications" stackId="1" stroke={C.primary} fill="url(#gs0)" name="Applied"/>
              <Area type="monotone" dataKey="qualified"    stackId="1" stroke={C.teal}    fill="url(#gs1)" name="Shortlisted"/>
              <Area type="monotone" dataKey="hired"        stackId="1" stroke={C.success} fill="url(#gs2)" name="Hired"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"2px 12px", flexShrink:0, marginTop:2 }}>
          {[["Applied",C.primary],["Shortlisted",C.teal],["Hired",C.success]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
              <span style={{ fontSize:8, color:C.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
const SLIDES = [
  { id:"overview",   label:"Overview",   component:SlideOverview },
  { id:"candidates", label:"Candidates", component:SlideCandidates },
  { id:"trends",     label:"Trends",     component:SlideTrends },
];

export default function RecruiterAnalytics() {
  const [slide,      setSlide]      = useState(0);
  const [period,     setPeriod]     = useState("All Time");
  const [searchRole, setSearchRole] = useState("All Roles");

  const { data, loading, error } = useAnalytics(period, searchRole);

  const activeRoles = data?.rolesData?.roles || [];
  const ov          = data?.overview || {};
  const ActiveSlide = SLIDES[slide].component;

  const hasToken = !!getToken();

  return (
    <div style={{ fontFamily:"'Segoe UI',-apple-system,sans-serif", background:C.bg,
      height:"100vh", display:"flex", flexDirection:"column", padding:"10px 16px",
      boxSizing:"border-box", color:C.text, overflow:"hidden" }}>

      {error && (
        <div style={{ background:"#FEF3C7", color:"#92400E", borderRadius:8,
          padding:"8px 14px", marginBottom:7, fontSize:11, fontWeight:700, flexShrink:0 }}>
          ⚠️ {error} — Check backend is running.
        </div>
      )}

      {!hasToken && (
        <div style={{ background:"#FEE2E2", color:"#991B1B", borderRadius:8,
          padding:"8px 14px", marginBottom:7, fontSize:11, fontWeight:700, flexShrink:0 }}>
          🔑 Not authenticated — please log in again.
        </div>
      )}

      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:7, flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:900, margin:0, color:C.primary, letterSpacing:"-0.03em" }}>
            Recruiter <span style={{ color:C.accent }}>Analytics</span>
          </h1>
          <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>
            {searchRole} · {period}
            {ov.activeJobs > 0 && <span style={{ color:C.success, fontWeight:700, marginLeft:6 }}>
              ● {ov.activeJobs} active job{ov.activeJobs !== 1 ? "s" : ""}
            </span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`,
              background:"#fff", fontSize:11, fontWeight:700, color:C.primary,
              cursor:"pointer", outline:"none" }}>
            {PERIODS.map(o => <option key={o}>{o}</option>)}
          </select>
          <RoleSearchBar
            value={searchRole}
            onChange={setSearchRole}
            allRoles={activeRoles}
          />
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"flex", gap:8, marginBottom:7, flexShrink:0 }}>
        {loading
          ? <div style={{ color:C.muted, fontSize:12, padding:"8px 0", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:16, height:16, borderRadius:"50%",
                border:`2px solid ${C.primary}`, borderTopColor:"transparent",
                animation:"spin 0.8s linear infinite" }}/>
              Loading analytics...
            </div>
          : <>
              <KPI label="Total Applicants" value={ov.totalApplicants ?? 0} accent={C.primary}  sub="All candidates"       icon="👥"/>
              <KPI label="Avg Skill Match"  value={`${ov.avgMatch ?? 0}%`} accent={C.teal}     sub="vs job requirements"  icon="🎯"/>
              <KPI label="Shortlisted"      value={ov.shortlisted ?? 0}    accent={C.success}  sub="In pipeline"          icon="⭐"/>
              <KPI label="Hired / Accepted" value={ov.accepted ?? 0}       accent={C.gold}     sub="Successfully placed"  icon="✅"/>
              <KPI label="Active Jobs"      value={ov.activeJobs ?? 0}     accent={C.accent}   sub="Open positions"       icon="💼"/>
            </>}
      </div>

      {/* TABS */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:7, flexShrink:0 }}>
        <div style={{ display:"flex", gap:4, background:"#fff", borderRadius:9, padding:3,
          border:`1px solid ${C.border}`, boxShadow:"0 1px 4px rgba(15,36,71,0.07)" }}>
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => setSlide(i)}
              style={{ padding:"5px 18px", borderRadius:7, border:"none", cursor:"pointer",
                fontWeight:800, fontSize:11,
                background:slide === i ? C.primary : "transparent",
                color:slide === i ? "#fff" : C.muted, transition:"all 0.2s" }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setSlide(s => Math.max(0, s-1))} disabled={slide === 0}
            style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`,
              background:slide === 0 ? "#f5f5f5" : "#fff", cursor:slide === 0 ? "not-allowed" : "pointer",
              fontSize:14, color:slide === 0 ? C.muted : C.primary, fontWeight:700 }}>‹</button>
          <div style={{ display:"flex", gap:6 }}>
            {SLIDES.map((_, i) => (
              <div key={i} onClick={() => setSlide(i)} style={{
                width:slide === i ? 22 : 7, height:7, borderRadius:4,
                background:slide === i ? C.primary : C.border,
                cursor:"pointer", transition:"all 0.3s" }}/>
            ))}
          </div>
          <button onClick={() => setSlide(s => Math.min(SLIDES.length-1, s+1))}
            disabled={slide === SLIDES.length-1}
            style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`,
              background:slide === SLIDES.length-1 ? "#f5f5f5" : "#fff",
              cursor:slide === SLIDES.length-1 ? "not-allowed" : "pointer",
              fontSize:14, color:slide === SLIDES.length-1 ? C.muted : C.primary, fontWeight:700 }}>›</button>
          <span style={{ fontSize:10, color:C.muted, fontWeight:700 }}>{slide+1} / {SLIDES.length}</span>
        </div>
      </div>

      {/* SLIDE */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>
        <ActiveSlide data={data}/>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select, button { font-family: inherit; }
      `}</style>
    </div>
  );
}
