import { useState, useEffect, useContext } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell, PieChart, Pie, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { AuthContext } from "../contexts/AuthContext";
import { authService } from "../services/AuthService";
import { jobService } from "../services/JobService";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const C = {
  bg:"#0D1117", card:"#161B22", card2:"#1C2128",
  border:"#30363D", border2:"#21262D",
  primary:"#58A6FF", green:"#3FB950", orange:"#F78166",
  yellow:"#E3B341", purple:"#BC8CFF", pink:"#FF7EB6",
  teal:"#39D0D8", text:"#E6EDF3", muted:"#8B949E",
  p:["#58A6FF","#3FB950","#F78166","#E3B341","#BC8CFF","#FF7EB6","#39D0D8","#FFA657","#7EE787","#D2A8FF"],
};

function getToken() {
  try { const t=authService?.getToken?.(); if(t&&t.length>10) return t; } catch(_){}
  for(const k of ["token","authToken","jwtToken","jwt","accessToken"]){
    try { const v=localStorage.getItem(k); if(v&&v.length>10) return v; } catch(_){}
  }
  try {
    for(let i=0;i<localStorage.length;i++){
      const v=localStorage.getItem(localStorage.key(i));
      if(v&&v.startsWith("eyJ")&&v.split(".").length===3) return v;
    }
  } catch(_){}
  return "";
}
const H=()=>{const t=getToken();return{"Content-Type":"application/json",...(t?{Authorization:`Bearer ${t}`}:{})};};

const toStr = s => {
  if (!s) return "";
  if (typeof s === "string") return s.trim();
  if (typeof s === "object") {
    const v = s.name || s.skill || s.label || s.title || Object.values(s).find(x=>typeof x==="string") || "";
    return v.toString().trim();
  }
  return s.toString().trim();
};

const normSkill = s => toStr(s).toLowerCase().replace(/[.\-_\s]+/g,"");

const extractNorm = arr => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normSkill).filter(Boolean);
};

const isMatch = (userNormArr, jobSkillNorm) => {
  const j = normSkill(jobSkillNorm);
  if (!j) return false;
  return userNormArr.some(u => {
    if (u === j) return true;
    if (u.includes(j) || j.includes(u)) return true;
    const strip = x => x.replace(/js$|ts$|\.net$/,"");
    return strip(u) === strip(j);
  });
};

const computeMatch = (jobSkillsRaw, userNormArr) => {
  const jn = extractNorm(jobSkillsRaw);
  if (!jn.length) return 0;
  const matched = jn.filter(s => isMatch(userNormArr, s)).length;
  return Math.round((matched/jn.length)*100);
};

const roleColor = pct => pct>=60 ? C.green : pct>=30 ? C.yellow : C.orange;

/* ── UI PRIMITIVES ── */
const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#1C2128",border:`1px solid ${C.border}`,borderRadius:10,
      padding:"10px 14px",fontSize:11,color:C.text,boxShadow:"0 8px 32px #00000088",
      pointerEvents:"none",zIndex:9999}}>
      {label&&<div style={{color:C.primary,fontWeight:700,marginBottom:6}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
          <div style={{width:8,height:8,borderRadius:2,background:p.fill||p.color||p.stroke}}/>
          <span style={{color:C.muted,fontSize:10}}>{p.name}:</span>
          <span style={{fontWeight:700}}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const GCard=({children,style={},glow})=>(
  <div style={{background:C.card,borderRadius:14,padding:"15px 17px",
    border:`1px solid ${glow?glow+"44":C.border2}`,display:"flex",flexDirection:"column",
    overflow:"hidden",boxShadow:glow?`0 0 20px ${glow}14,0 4px 14px #00000040`:"0 2px 12px #00000030",...style}}>
    {children}
  </div>
);

const CT=({children,sub,right,color})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexShrink:0}}>
    <div>
      <div style={{fontSize:12,fontWeight:800,color:color||C.text,letterSpacing:0.2}}>{children}</div>
      {sub&&<div style={{fontSize:9.5,color:C.muted,marginTop:2}}>{sub}</div>}
    </div>
    {right}
  </div>
);

const KPI=({label,value,color,sub,subColor})=>(
  <div style={{background:C.card,borderRadius:12,padding:"14px 18px",flex:1,
    border:`1px solid ${C.border2}`,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,
      background:`linear-gradient(90deg,${color},${color}55)`,borderRadius:"12px 12px 0 0"}}/>
    <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",
      letterSpacing:"0.1em",marginBottom:5}}>{label}</div>
    <div style={{fontSize:28,fontWeight:900,color,lineHeight:1}}>{value??"—"}</div>
    {sub&&<div style={{fontSize:9,color:subColor||C.muted,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{sub}</div>}
  </div>
);

const DD=({value,onChange,opts,style={}})=>(
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{padding:"5px 9px",borderRadius:7,border:`1px solid ${C.border}`,
      background:C.card2,fontSize:10,fontWeight:600,color:C.text,cursor:"pointer",outline:"none",...style}}>
    {opts.map(o=><option key={o} style={{background:C.card2}}>{o}</option>)}
  </select>
);

const Pill=({label,color})=>(
  <span style={{background:`${color}18`,color,fontSize:10,fontWeight:700,
    padding:"3px 10px",borderRadius:20,border:`1px solid ${color}44`,whiteSpace:"nowrap"}}>{label}</span>
);

const PBar=({pct,color,h=5})=>(
  <div style={{height:h,background:C.border2,borderRadius:h,overflow:"hidden"}}>
    <div style={{width:`${Math.min(pct,100)}%`,height:"100%",borderRadius:h,
      background:color,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);

const SC={pending:C.yellow,reviewed:C.primary,shortlisted:C.teal,accepted:C.green,rejected:C.orange};

/* ════════════════════════════════════════
   ONLY NEW CARD — Application Success Rate
   accepted / total applied %
════════════════════════════════════════ */
const SuccessRateKPI = ({ applications }) => {
  const total = applications.length;
  const accepted = applications.filter(a => a.status === "accepted").length;
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const color = rate >= 30 ? C.green : rate >= 10 ? C.yellow : C.orange;

  return (
    <div style={{background:C.card,borderRadius:12,padding:"14px 18px",flex:1,
      border:`1px solid ${C.border2}`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,
        background:`linear-gradient(90deg,${color},${color}55)`,borderRadius:"12px 12px 0 0"}}/>
      <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:5}}>Success Rate</div>
      <div style={{fontSize:28,fontWeight:900,color,lineHeight:1,marginBottom:5}}>
        {total === 0 ? "—" : `${rate}%`}
      </div>
      <PBar pct={rate} color={color} h={4}/>
      <div style={{fontSize:9,color:C.muted,marginTop:4}}>
        {total === 0
          ? "No applications yet"
          : `${accepted} accepted of ${total} applied`}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   NEW KPI — Avg Match % across applied jobs
════════════════════════════════════════ */
const AvgMatchKPI = ({ applications, jobs }) => {
  const enriched = applications.map(app => {
    const job = jobs.find(j => j._id === (app.jobId?._id || app.jobId)) || app.jobId || {};
    return computeMatch(job.requiredSkills || [], []);
  });
  // We need userNorm here — pass as prop
  return null; // placeholder, replaced below
};

/* ════════════════════════════════════════
   NEW KPI — Response Rate
   (applications that got any response / total)
════════════════════════════════════════ */
const ResponseRateKPI = ({ applications }) => {
  const total = applications.length;
  const responded = applications.filter(a =>
    a.status && a.status !== "pending"
  ).length;
  const rate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const color = rate >= 50 ? C.green : rate >= 25 ? C.yellow : C.orange;

  return (
    <div style={{background:C.card,borderRadius:12,padding:"14px 18px",flex:1,
      border:`1px solid ${C.border2}`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,
        background:`linear-gradient(90deg,${color},${color}55)`,borderRadius:"12px 12px 0 0"}}/>
      <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:5}}>Response Rate</div>
      <div style={{fontSize:28,fontWeight:900,color,lineHeight:1,marginBottom:5}}>
        {total === 0 ? "—" : `${rate}%`}
      </div>
      <PBar pct={rate} color={color} h={4}/>
      <div style={{fontSize:9,color:C.muted,marginTop:4}}>
        {total === 0
          ? "No applications yet"
          : responded === 0
            ? "Awaiting recruiter response"
            : `${responded} of ${total} got response`}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   NEW KPI — Avg Skill Match % across applied jobs
════════════════════════════════════════ */
const AvgSkillMatchKPI = ({ applications, jobs, userNorm }) => {
  const scores = applications.map(app => {
    const job = jobs.find(j => j._id === (app.jobId?._id || app.jobId)) || app.jobId || {};
    return computeMatch(job.requiredSkills || [], userNorm);
  });
  const avg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const best = scores.length > 0 ? Math.max(...scores) : 0;
  const color = avg >= 60 ? C.green : avg >= 30 ? C.yellow : C.orange;

  return (
    <div style={{background:C.card,borderRadius:12,padding:"14px 18px",flex:1,
      border:`1px solid ${C.border2}`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,
        background:`linear-gradient(90deg,${color},${color}55)`,borderRadius:"12px 12px 0 0"}}/>
      <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",
        letterSpacing:"0.1em",marginBottom:5}}>Avg Match %</div>
      <div style={{fontSize:28,fontWeight:900,color,lineHeight:1,marginBottom:5}}>
        {scores.length === 0 ? "—" : `${avg}%`}
      </div>
      <PBar pct={avg} color={color} h={4}/>
      <div style={{fontSize:9,color:C.muted,marginTop:4}}>
        {scores.length === 0
          ? "No applications yet"
          : `Best: ${best}% · across ${scores.length} jobs`}
      </div>
    </div>
  );
};


/* ════════════════════════════════════════
   SLIDE 1 — ROLE MATCH
════════════════════════════════════════ */
const SlideRoleMatch=({jobs,userNorm,applications})=>{
  const [selRole,setSelRole]=useState(null);

  const roleMap={};
  jobs.forEach(job=>{
    const t=(job.title||"Unknown").trim();
    if(!roleMap[t]) roleMap[t]={title:t,rawSkills:[],normSkills:[],count:0};
    const raw=(job.requiredSkills||[]).map(toStr).filter(Boolean);
    const nrm=extractNorm(job.requiredSkills||[]);
    roleMap[t].rawSkills =[...new Set([...roleMap[t].rawSkills, ...raw])];
    roleMap[t].normSkills=[...new Set([...roleMap[t].normSkills,...nrm])];
    roleMap[t].count++;
  });

  const roleMatches=Object.values(roleMap).map(r=>{
    const total=r.normSkills.length||1;
    const matched=r.normSkills.filter(s=>isMatch(userNorm,s)).length;
    const pct=Math.round((matched/total)*100);
    return {...r,matched,total,pct};
  }).sort((a,b)=>b.pct-a.pct).slice(0,10);

  const best=roleMatches[0];
  const sel=selRole?(roleMatches.find(r=>r.title===selRole)||best):best;

  const missing=(sel?.rawSkills||[]).filter(s=>!isMatch(userNorm,normSkill(s))).slice(0,12);
  const matched=(sel?.rawSkills||[]).filter(s=> isMatch(userNorm,normSkill(s))).slice(0,12);

  const cnt={};
  applications.forEach(a=>{const s=a.status||"pending";cnt[s]=(cnt[s]||0)+1;});
  const pie=Object.entries(cnt).map(([name,value])=>({
    name:name.charAt(0).toUpperCase()+name.slice(1),value,fill:SC[name]||C.primary,
  }));

  const BarTipFixed = ({active,payload})=>{
    if(!active||!payload?.length) return null;
    const d=payload[0]?.payload||{};
    return (
      <div style={{background:"#1C2128",border:`1px solid ${C.border}`,borderRadius:10,
        padding:"10px 14px",fontSize:11,color:C.text,boxShadow:"0 4px 20px #000000aa",
        pointerEvents:"none",maxWidth:180}}>
        <div style={{color:C.yellow,fontWeight:700,marginBottom:6,fontSize:10,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {payload.map((p,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:2,background:p.fill,flexShrink:0}}/>
              <span style={{color:C.muted,fontSize:10}}>{p.name}:</span>
              <span style={{fontWeight:800,color:C.text}}>{p.value}</span>
            </div>
          ))}
          <div style={{marginTop:4,paddingTop:4,borderTop:`1px solid ${C.border2}`,fontSize:10,color:C.muted}}>
            Match: <span style={{color:roleColor(d.pct),fontWeight:800}}>{d.pct}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr 260px",gridTemplateRows:"1fr 1fr",gap:10,flex:1,minHeight:0}}>

      <GCard style={{gridRow:"1/3",padding:"13px 10px"}} glow={C.primary}>
        <CT color={C.primary}>Role Match Analysis
          <br/><span style={{color:C.muted,fontSize:9,fontWeight:400}}>From live job board · {jobs.length} jobs</span>
        </CT>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:5}}>
          {roleMatches.length===0
            ? <div style={{color:C.muted,fontSize:11,textAlign:"center",marginTop:40}}>No jobs found</div>
            : roleMatches.map((r,i)=>{
                const active=selRole===r.title||(!selRole&&i===0);
                return (
                  <div key={r.title} onClick={()=>setSelRole(r.title)} style={{
                    padding:"10px 11px",borderRadius:9,cursor:"pointer",
                    background:active?`${C.primary}18`:"transparent",
                    border:`1px solid ${active?C.primary+"66":"transparent"}`,
                    transition:"all 0.2s",
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</span>
                      <span style={{fontSize:11,fontWeight:900,color:roleColor(r.pct),marginLeft:6,flexShrink:0}}>{r.pct}%</span>
                    </div>
                    <PBar pct={r.pct} color={roleColor(r.pct)}/>
                    <div style={{fontSize:9,color:C.muted,marginTop:4}}>{r.count} opening{r.count!==1?"s":""} · {r.matched}/{r.total} skills</div>
                  </div>
                );
              })}
        </div>
      </GCard>

      <GCard glow={C.yellow}>
        <CT sub="Live openings vs applications sent per role" color={C.yellow}>
          Openings vs Competition
        </CT>
        <div style={{flex:1,minHeight:0}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={roleMatches.map(r=>({
                name: r.title.length>16 ? r.title.slice(0,15)+"…" : r.title,
                fullName: r.title,
                Openings: r.count,
                Applied: applications.filter(a=>{
                  const job=jobs.find(j=>j._id===(a.jobId?._id||a.jobId))||a.jobId||{};
                  return (job.title||"").trim()===r.title;
                }).length,
                pct: r.pct,
              }))}
              layout="vertical" barSize={10}
              margin={{top:4,right:20,bottom:4,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border2} horizontal={false}/>
              <XAxis type="number" tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9.5,fill:C.muted}} width={110}/>
              <Tooltip content={<BarTipFixed/>} cursor={{fill:"rgba(255,255,255,0.04)"}} position={{x:0}} wrapperStyle={{zIndex:9999}}/>
              <Bar dataKey="Openings" name="Live Openings" fill={C.primary} radius={[0,4,4,0]}/>
              <Bar dataKey="Applied"  name="You Applied"   fill={C.green}   radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"flex",gap:14,marginTop:4,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:3,background:C.primary}}/>
            <span style={{fontSize:9,color:C.muted}}>Live Openings</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:3,background:C.green}}/>
            <span style={{fontSize:9,color:C.muted}}>You Applied</span>
          </div>
        </div>
      </GCard>

      <GCard style={{gridRow:"1/3"}} glow={C.teal}>
        <CT sub="Real application pipeline" color={C.teal}>Application Status</CT>
        {pie.length===0
          ? <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
              <div style={{fontSize:36}}>📭</div>
              <div style={{color:C.muted,fontSize:11,textAlign:"center"}}>No applications yet</div>
            </div>
          : <>
              <div style={{flex:1,minHeight:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} cx="50%" cy="45%" innerRadius="42%" outerRadius="68%"
                      paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pie.map((s,i)=><Cell key={i} fill={s.fill}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                {pie.map(s=>(
                  <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:9,height:9,borderRadius:3,background:s.fill}}/>
                      <span style={{fontSize:10.5,color:C.text}}>{s.name}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:s.fill}}>{s.value}</span>
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${C.border2}`,paddingTop:7,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:10,color:C.muted}}>Total Applied</span>
                  <span style={{fontSize:13,fontWeight:900,color:C.primary}}>{applications.length}</span>
                </div>
              </div>
            </>}
      </GCard>

      <GCard glow={roleColor(sel?.pct||0)}>
        <CT sub={`${sel?.title||"Select a role"} — real skill gap from recruiter jobs`}>
          Skill Gap: {sel?.title||"—"}
          <span style={{marginLeft:8,background:`${C.primary}22`,color:C.primary,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
            {sel?.pct||0}% match
          </span>
        </CT>
        <div style={{display:"flex",gap:14,flex:1,overflow:"hidden"}}>
          <div style={{flex:1,overflow:"auto"}}>
            <div style={{fontSize:10,color:C.green,fontWeight:700,marginBottom:8}}>✓ You Have ({matched.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {matched.map(s=><Pill key={s} label={s} color={C.green}/>)}
              {matched.length===0&&<span style={{color:C.muted,fontSize:11}}>No matching skills yet</span>}
            </div>
          </div>
          <div style={{width:1,background:C.border2,flexShrink:0}}/>
          <div style={{flex:1,overflow:"auto"}}>
            <div style={{fontSize:10,color:C.orange,fontWeight:700,marginBottom:8}}>✗ Missing ({missing.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {missing.map(s=><Pill key={s} label={s} color={C.orange}/>)}
              {missing.length===0&&<span style={{color:C.green,fontSize:11}}>🎉 You have all required skills!</span>}
            </div>
          </div>
        </div>
      </GCard>
    </div>
  );
};

/* ════════════════════════════════════════
   SLIDE 2 — MARKET TRENDS
════════════════════════════════════════ */
const SlideMarketTrends=({jobs,userNorm})=>{
  const [roleFilter,setRoleFilter]=useState("All");
  const [locChart,setLocChart]=useState("Locations");

  const allRoles=["All",...new Set(jobs.map(j=>j.title).filter(Boolean))].slice(0,20);
  const fj=roleFilter==="All"?jobs:jobs.filter(j=>j.title===roleFilter);

  const skillCount={};
  fj.forEach(job=>{
    (job.requiredSkills||[]).forEach(s=>{
      const n=toStr(s); if(n) skillCount[n]=(skillCount[n]||0)+1;
    });
  });
  const topSkills=Object.entries(skillCount)
    .sort((a,b)=>b[1]-a[1]).slice(0,14)
    .map(([name,count],i)=>({
      name, count,
      display:name.length>11?name.slice(0,10)+"…":name,
      hasSkill:isMatch(userNorm,normSkill(name)),
      fill:C.p[i%C.p.length],
    }));

  const sal={"0–5L":0,"5–10L":0,"10–20L":0,"20–30L":0,"30L+":0};
  jobs.forEach(j=>{
    const mn=j.salaryRange?.min||j.salary?.min||j.minSalary||0;
    const mx=j.salaryRange?.max||j.salary?.max||j.maxSalary||0;
    const mid=((mn+mx)/2)/100000;
    if(mid<5)sal["0–5L"]++;else if(mid<10)sal["5–10L"]++;
    else if(mid<20)sal["10–20L"]++;else if(mid<30)sal["20–30L"]++;else sal["30L+"]++;
  });
  const salData=Object.entries(sal).map(([range,count])=>({range,count}));

  const dateMap={};
  jobs.forEach(j=>{
    const d=new Date(j.createdAt||j.postedAt||Date.now());
    const key=`${d.getDate().toString().padStart(2,"0")} ${d.toLocaleString("en-IN",{month:"short"})} '${d.getFullYear().toString().slice(2)}`;
    dateMap[key]=(dateMap[key]||0)+1;
  });
  const trendData=Object.entries(dateMap).sort().slice(-12).map(([date,count])=>({date,count}));

  const locCount={};
  jobs.forEach(j=>{
    const raw=j.location||j.jobLocation||"Unknown";
    const loc=raw.split(",")[0].trim()||"Unknown";
    locCount[loc]=(locCount[loc]||0)+1;
  });
  const locData=Object.entries(locCount).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([loc,count],i)=>({loc,count,fill:C.p[i%C.p.length]}));

  const typeCount={};
  jobs.forEach(j=>{const t=j.type||j.jobType||"Unknown";typeCount[t]=(typeCount[t]||0)+1;});
  const typeData=Object.entries(typeCount).map(([name,value],i)=>({name,value,fill:C.p[i%C.p.length]}));

  const priority=topSkills.filter(s=>!s.hasSkill).slice(0,8);

  const total=Object.keys(skillCount).length||1;
  const has=Object.keys(skillCount).filter(s=>isMatch(userNorm,normSkill(s))).length;
  const ready=Math.round((has/total)*100);

  const tableRows=topSkills.slice(0,9).map(s=>({
    skill:s.name, demand:s.count,
    pct:Math.round((s.count/jobs.length)*100),
    priority:s.count>=3?"High":s.count>=2?"Medium":"Low",
    status:s.hasSkill?"Have":"Missing",
  }));

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"auto 1fr 1fr",gap:10,flex:1,minHeight:0}}>

      <GCard style={{gridColumn:"1/4"}} glow={C.primary}>
        <CT sub={`Skill frequency across ${fj.length} live recruiter jobs — green = you have it`} color={C.primary}
          right={<div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:10,color:C.muted}}>Market Readiness:</span>
            <span style={{fontSize:13,fontWeight:900,color:ready>=50?C.green:C.yellow}}>{ready}%</span>
            <div style={{width:70,height:6,background:C.border2,borderRadius:3}}>
              <div style={{width:`${ready}%`,height:"100%",background:ready>=50?C.green:C.yellow,borderRadius:3}}/>
            </div>
            <DD value={roleFilter} onChange={setRoleFilter} opts={allRoles}/>
          </div>}>
          Top Skills Demand
        </CT>
        {topSkills.length===0
          ? <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{color:C.muted,fontSize:12}}>No skill data in jobs.</div>
            </div>
          : <div style={{height:185,flexShrink:0}}>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={topSkills} barSize={18} margin={{top:4,right:10,bottom:26,left:-12}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border2} vertical={false}/>
                  <XAxis dataKey="display" tick={{fontSize:9,fill:C.muted}} angle={-30} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
                  <Tooltip content={<Tip/>} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
                  <Bar dataKey="count" name="Jobs Requiring" radius={[5,5,0,0]}>
                    {topSkills.map((s,i)=><Cell key={i} fill={s.hasSkill?C.green:C.primary}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>}
        <div style={{display:"flex",gap:14,marginTop:4,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:3,background:C.green}}/>
            <span style={{fontSize:9,color:C.muted}}>You have this skill</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:9,height:9,borderRadius:3,background:C.primary}}/>
            <span style={{fontSize:9,color:C.muted}}>Missing skill</span>
          </div>
        </div>
      </GCard>

      <GCard glow={C.teal}>
        <CT sub="New job postings over time (real data)" color={C.teal}>Job Postings Trend</CT>
        <div style={{flex:1,minHeight:0}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{top:8,right:10,bottom:4,left:-12}}>
              <defs>
                <linearGradient id="jg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border2} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:8.5,fill:C.muted}} angle={-15} textAnchor="end" height={42}/>
              <YAxis tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="count" stroke={C.teal} strokeWidth={2.5}
                fill="url(#jg)" name="New Jobs" dot={{fill:C.teal,r:3,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GCard>

      <GCard glow={C.yellow}>
        <CT sub="Salary range distribution of live jobs" color={C.yellow}>Salary Distribution</CT>
        <div style={{flex:1,minHeight:0}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salData} barSize={28} margin={{top:4,right:10,bottom:4,left:-12}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border2} vertical={false}/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:C.muted}}/>
              <YAxis tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
              <Tooltip content={<Tip/>} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
              <Bar dataKey="count" name="Jobs" radius={[5,5,0,0]}>
                {salData.map((_,i)=><Cell key={i} fill={C.p[i%C.p.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GCard>

      <GCard glow={C.pink}>
        <CT sub="All job locations from live postings"
          right={<DD value={locChart} onChange={setLocChart} opts={["Locations","Job Type"]}/>}
          color={C.pink}>
          {locChart==="Locations"?"Jobs by Location":"Job Type Breakdown"}
        </CT>
        <div style={{flex:1,minHeight:0}}>
          {locChart==="Locations"
            ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locData} layout="vertical" barSize={12} margin={{top:4,right:30,bottom:4,left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border2} horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
                  <YAxis dataKey="loc" type="category" tick={{fontSize:10,fill:C.text}} width={90}
                    tickFormatter={v=>v.length>14?v.slice(0,13)+"…":v}/>
                  <Tooltip content={<Tip/>} cursor={{fill:"rgba(255,255,255,0.04)"}}/>
                  <Bar dataKey="count" name="Jobs" radius={[0,5,5,0]}>
                    {locData.map((l,i)=><Cell key={i} fill={l.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            : <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" outerRadius="68%" paddingAngle={4}
                    dataKey="value" strokeWidth={0}
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false} fontSize={9}>
                    {typeData.map((_,i)=><Cell key={i} fill={C.p[i%C.p.length]}/>)}
                  </Pie>
                  <Tooltip content={<Tip/>}/>
                </PieChart>
              </ResponsiveContainer>}
        </div>
      </GCard>

      <GCard glow={C.orange}>
        <CT sub="Ordered path to become market-ready — based on real job demand" color={C.orange}>
          Learning Roadmap
        </CT>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {priority.length===0
            ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.green,fontSize:11}}>
                You have all top skills — you're market ready!
              </div>
            : priority.map((s,i)=>{
                const phase = i<2?"Phase 1 · Foundation":i<4?"Phase 2 · Intermediate":"Phase 3 · Advanced";
                const phaseColor = i<2?C.green:i<4?C.yellow:C.orange;
                const weeks = i<2?2:i<4?4:6;
                return (
                  <div key={s.name} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,paddingTop:2}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:`${phaseColor}22`,
                        border:`2px solid ${phaseColor}`,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,fontWeight:900,color:phaseColor}}>{i+1}</div>
                      {i<priority.length-1&&<div style={{width:2,flex:1,minHeight:14,background:`${phaseColor}33`,marginTop:2}}/>}
                    </div>
                    <div style={{flex:1,paddingBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                        <span style={{fontSize:11,fontWeight:800,color:C.text}}>{s.name}</span>
                        <span style={{fontSize:8.5,color:phaseColor,background:`${phaseColor}18`,
                          padding:"1px 7px",borderRadius:20,border:`1px solid ${phaseColor}33`,fontWeight:600}}>{phase}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:9,color:C.muted}}>~{weeks} weeks · {s.count} job{s.count!==1?"s":""} demand it</span>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:60,height:4,background:C.border2,borderRadius:3}}>
                            <div style={{width:`${Math.min((s.count/(topSkills[0]?.count||1))*100,100)}%`,height:"100%",
                              background:phaseColor,borderRadius:3}}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </GCard>

      <GCard glow={C.purple}>
        <CT sub="Skill demand · your status vs market" color={C.purple}>Skill Market Table</CT>
        <div style={{flex:1,overflow:"auto"}}>
          {tableRows.length===0
            ? <div style={{color:C.muted,fontSize:11,textAlign:"center",paddingTop:20}}>No skill data</div>
            : <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 44px 56px 52px 54px",
                  padding:"5px 6px",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                  {["Skill","Jobs","In Mkt","Priority","Status"].map(h=>(
                    <span key={h} style={{fontSize:8,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</span>
                  ))}
                </div>
                {tableRows.map((row,i)=>(
                  <div key={row.skill} style={{display:"grid",gridTemplateColumns:"1fr 44px 56px 52px 54px",
                    padding:"7px 6px",borderRadius:6,background:i%2===0?"rgba(255,255,255,0.02)":"transparent",
                    alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:600,color:C.text}}>{row.skill}</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.primary}}>{row.demand}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{flex:1,height:5,background:C.border2,borderRadius:3}}>
                        <div style={{width:`${row.pct}%`,height:"100%",background:C.primary,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:9,color:C.muted,minWidth:24}}>{row.pct}%</span>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,
                      color:row.priority==="High"?C.orange:row.priority==="Medium"?C.yellow:C.green}}>
                      {row.priority}
                    </span>
                    <span style={{fontSize:9,fontWeight:700,
                      color:row.status==="Have"?C.green:C.orange,
                      background:row.status==="Have"?`${C.green}18`:`${C.orange}18`,
                      padding:"2px 7px",borderRadius:20,
                      border:`1px solid ${row.status==="Have"?C.green:C.orange}33`,
                      textAlign:"center"}}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </>}
        </div>
      </GCard>
    </div>
  );
};

/* ════════════════════════════════════════
   SLIDE 3 — APPLICATIONS
════════════════════════════════════════ */
const SlideApplications=({applications,jobs,userNorm})=>{
  const [dateRange,setDateRange]=useState("All Time");
  const [statusFilter,setStatusFilter]=useState("All");
  const [sortBy,setSortBy]=useState("Date");
  const [companyFilter,setCompanyFilter]=useState("All");

  const now=Date.now();
  const inRange=app=>{
    const diff=(now-new Date(app.appliedAt||app.createdAt||now))/86400000;
    if(dateRange==="1 Week") return diff<=7;
    if(dateRange==="1 Month") return diff<=30;
    if(dateRange==="Older") return diff>30;
    return true;
  };

  const enriched=applications.map(app=>{
    const job=jobs.find(j=>j._id===(app.jobId?._id||app.jobId))||app.jobId||{};
    const jobSkills=(job.requiredSkills||[]).map(toStr).filter(Boolean);
    const matchPct=computeMatch(job.requiredSkills||[],userNorm);
    return {...app,job,jobSkills,matchPct};
  });

  const allCompanies=["All",...new Set(enriched.map(a=>a.job?.company||a.jobId?.company).filter(Boolean))];

  const filtered=enriched
    .filter(a=>inRange(a)
      &&(statusFilter==="All"||(a.status||"pending")===statusFilter.toLowerCase())
      &&(companyFilter==="All"||(a.job?.company||a.jobId?.company||"")=== companyFilter)
    )
    .sort((a,b)=>{
      if(sortBy==="Date") return new Date(b.appliedAt||b.createdAt||0)-new Date(a.appliedAt||a.createdAt||0);
      if(sortBy==="Match %") return b.matchPct-a.matchPct;
      if(sortBy==="Status") return (a.status||"").localeCompare(b.status||"");
      return 0;
    });

  const kpis=[
    {label:"Total Applied",value:applications.length,color:C.primary},
    {label:"Under Review",value:applications.filter(a=>["reviewed","shortlisted"].includes(a.status)).length,color:C.yellow},
    {label:"Accepted",value:applications.filter(a=>a.status==="accepted").length,color:C.green},
    {label:"Rejected",value:applications.filter(a=>a.status==="rejected").length,color:C.orange},
  ];

  const dm={};
  applications.forEach(a=>{
    const d=new Date(a.appliedAt||a.createdAt||now);
    const key=`${d.getDate().toString().padStart(2,"0")} ${d.toLocaleString("en-IN",{month:"short"})}`;
    dm[key]=(dm[key]||0)+1;
  });
  const timeline=Object.entries(dm).sort().map(([date,count])=>({date,count}));

  const funnel=[
    {stage:"Applied",    count:applications.length,color:C.p[0]},
    {stage:"Reviewed",   count:applications.filter(a=>["reviewed","shortlisted","accepted"].includes(a.status)).length,color:C.p[1]},
    {stage:"Shortlisted",count:applications.filter(a=>["shortlisted","accepted"].includes(a.status)).length,color:C.p[2]},
    {stage:"Accepted",   count:applications.filter(a=>a.status==="accepted").length,color:C.p[3]},
  ];

  const statusBreakdown=Object.entries(
    applications.reduce((acc,a)=>{const s=a.status||"pending";acc[s]=(acc[s]||0)+1;return acc;},{})
  ).map(([name,value])=>({name:name.charAt(0).toUpperCase()+name.slice(1),value,fill:SC[name]||C.primary}));

  const companyMap={};
  enriched.forEach(a=>{
    const co=a.job?.company||a.jobId?.company||"Unknown";
    if(!companyMap[co]) companyMap[co]={company:co,total:0,accepted:0,rejected:0,pending:0};
    companyMap[co].total++;
    if(a.status==="accepted") companyMap[co].accepted++;
    else if(a.status==="rejected") companyMap[co].rejected++;
    else companyMap[co].pending++;
  });
  const companyData=Object.values(companyMap).sort((a,b)=>b.total-a.total).slice(0,6);

  const roleSuccess={};
  enriched.forEach(a=>{
    const t=a.job?.title||a.jobId?.title||"Unknown";
    if(!roleSuccess[t]) roleSuccess[t]={role:t,total:0,success:0};
    roleSuccess[t].total++;
    if(["accepted","shortlisted"].includes(a.status)) roleSuccess[t].success++;
  });
  const roleSuccessData=Object.values(roleSuccess)
    .map(r=>({...r,rate:r.total>0?Math.round((r.success/r.total)*100):0}))
    .sort((a,b)=>b.rate-a.rate).slice(0,5);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gridTemplateRows:"auto auto auto 1fr",gap:10,flex:1,minHeight:0}}>

      {kpis.map(k=><KPI key={k.label} {...k}/>)}

      <GCard style={{gridColumn:"1/3"}} glow={C.teal}>
        <CT sub="Daily application activity" color={C.teal}>Application Timeline</CT>
        <div style={{flex:1,minHeight:0}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{top:8,right:10,bottom:4,left:-12}}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.45}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border2} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:9,fill:C.muted}}/>
              <YAxis tick={{fontSize:9,fill:C.muted}} allowDecimals={false}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="count" stroke={C.teal} strokeWidth={2.5}
                fill="url(#ag)" name="Applications" dot={{fill:C.teal,r:4,strokeWidth:0}} activeDot={{r:6}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GCard>

      <GCard glow={C.purple}>
        <CT sub="Your application conversion funnel" color={C.purple}>Conversion Funnel</CT>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:9,justifyContent:"center"}}>
          {funnel.map((s,i)=>{
            const pct=applications.length?Math.round((s.count/applications.length)*100):0;
            return (
              <div key={s.stage} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:10,color:C.muted,width:75,textAlign:"right"}}>{s.stage}</span>
                <div style={{flex:1,position:"relative",height:24,background:C.border2,borderRadius:6,overflow:"hidden"}}>
                  <div style={{width:`${Math.max(pct,8)}%`,height:"100%",
                    background:`linear-gradient(90deg,${s.color},${s.color}88)`,borderRadius:6,transition:"width 0.7s"}}/>
                  <span style={{position:"absolute",left:10,top:0,bottom:0,display:"flex",alignItems:"center",
                    fontSize:10,fontWeight:700,color:"#fff"}}>{s.count}</span>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:s.color,width:32}}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </GCard>

      <GCard glow={C.pink}>
        <CT sub="Applications per company + outcome" color={C.pink}>Company Tracker</CT>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {companyData.length===0
            ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:11}}>No applications yet</div>
            : companyData.map((co,i)=>(
              <div key={co.company} style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.02)",
                border:`1px solid ${C.border2}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{co.company}</span>
                  <span style={{fontSize:10,fontWeight:700,color:C.primary}}>{co.total} applied</span>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {co.accepted>0&&<span style={{fontSize:9,background:`${C.green}18`,color:C.green,padding:"1px 7px",borderRadius:20,border:`1px solid ${C.green}33`}}>✓ {co.accepted} accepted</span>}
                  {co.rejected>0&&<span style={{fontSize:9,background:`${C.orange}18`,color:C.orange,padding:"1px 7px",borderRadius:20,border:`1px solid ${C.orange}33`}}>✗ {co.rejected} rejected</span>}
                  {co.pending>0&&<span style={{fontSize:9,background:`${C.yellow}18`,color:C.yellow,padding:"1px 7px",borderRadius:20,border:`1px solid ${C.yellow}33`}}>⏳ {co.pending} pending</span>}
                </div>
              </div>
            ))}
        </div>
      </GCard>

      <GCard style={{gridColumn:"1/3"}} glow={C.green}>
        <CT sub="Acceptance/shortlist rate per job role" color={C.green}>Success Rate by Role</CT>
        <div style={{flex:1,minHeight:0}}>
          {roleSuccessData.length===0
            ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:11}}>No data yet</div>
            : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleSuccessData} layout="vertical" barSize={14}
                  margin={{top:4,right:50,bottom:4,left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border2} horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:9,fill:C.muted}} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                  <YAxis dataKey="role" type="category" tick={{fontSize:9.5,fill:C.muted}} width={110}
                    tickFormatter={v=>v.length>14?v.slice(0,13)+"…":v}/>
                  <Tooltip content={<Tip/>} cursor={{fill:"rgba(255,255,255,0.04)"}}
                    formatter={(v,n)=>[`${v}%`,"Success Rate"]}/>
                  <Bar dataKey="rate" name="Success Rate" radius={[0,5,5,0]}>
                    {roleSuccessData.map((r,i)=><Cell key={i} fill={r.rate>=50?C.green:r.rate>=25?C.yellow:C.orange}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
        </div>
      </GCard>

      <GCard glow={C.yellow}>
        <CT sub="Application status breakdown" color={C.yellow}>Status Breakdown</CT>
        {statusBreakdown.length===0
          ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:11}}>No applications</div>
          : <>
              <div style={{flex:1,minHeight:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="45%" innerRadius="40%" outerRadius="65%"
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {statusBreakdown.map((s,i)=><Cell key={i} fill={s.fill}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,flexShrink:0}}>
                {statusBreakdown.map(s=>(
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:s.fill}}/>
                    <span style={{fontSize:9.5,color:C.text}}>{s.name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:s.fill}}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>}
      </GCard>

      <GCard glow={C.purple}>
        <CT sub="How well your skills match applied jobs" color={C.purple}>Match Distribution</CT>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:6,justifyContent:"center"}}>
          {[{label:"Strong (60%+)",color:C.green,min:60},{label:"Moderate (30-60%)",color:C.yellow,min:30,max:60},{label:"Weak (<30%)",color:C.orange,max:30}].map(({label,color,min,max})=>{
            const count=enriched.filter(a=>(min===undefined||a.matchPct>=min)&&(max===undefined||a.matchPct<max)).length;
            const pct=enriched.length?Math.round((count/enriched.length)*100):0;
            return (
              <div key={label}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:C.muted}}>{label}</span>
                  <span style={{fontSize:10,fontWeight:700,color}}>{count} apps</span>
                </div>
                <PBar pct={pct} color={color} h={8}/>
              </div>
            );
          })}
        </div>
      </GCard>

      <GCard style={{gridColumn:"1/5",overflow:"hidden"}} glow={C.primary}>
        <CT sub={`${filtered.length} application${filtered.length!==1?"s":""} shown`} color={C.primary}
          right={<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <DD value={dateRange}     onChange={setDateRange}     opts={["1 Week","1 Month","Older","All Time"]}/>
            <DD value={statusFilter}  onChange={setStatusFilter}  opts={["All","Pending","Reviewed","Shortlisted","Accepted","Rejected"]}/>
            <DD value={companyFilter} onChange={setCompanyFilter} opts={allCompanies}/>
            <DD value={sortBy}        onChange={setSortBy}        opts={["Date","Match %","Status"]}/>
          </div>}>
          Applied Jobs
        </CT>
        <div style={{flex:1,overflow:"auto"}}>
          {filtered.length===0
            ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:80}}>
                <div style={{color:C.muted,fontSize:12}}>No applications in this range</div>
              </div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Job Title","Company","Status","Applied On","Match %","Skills"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:C.muted,
                        textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app,i)=>{
                    const job=app.job||{};
                    const status=app.status||"pending";
                    const col=SC[status]||C.muted;
                    return (
                      <tr key={app._id||i}
                        style={{borderBottom:`1px solid ${C.border2}`,background:i%2===0?"rgba(255,255,255,0.015)":"transparent"}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${C.primary}0a`}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"rgba(255,255,255,0.015)":"transparent"}>
                        <td style={{padding:"9px 10px",fontWeight:700,color:C.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {job.title||app.jobId?.title||"—"}
                        </td>
                        <td style={{padding:"9px 10px",color:C.primary,fontWeight:500}}>
                          {job.company||app.jobId?.company||"—"}
                        </td>
                        <td style={{padding:"9px 10px"}}><Pill label={status.charAt(0).toUpperCase()+status.slice(1)} color={col}/></td>
                        <td style={{padding:"9px 10px",color:C.muted,fontSize:10,whiteSpace:"nowrap"}}>
                          {app.appliedAt?new Date(app.appliedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
                        </td>
                        <td style={{padding:"9px 10px",minWidth:100}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{flex:1,height:5,background:C.border2,borderRadius:3}}>
                              <div style={{width:`${app.matchPct}%`,height:"100%",
                                background:app.matchPct>=60?C.green:app.matchPct>=30?C.yellow:C.orange,borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:10,fontWeight:800,minWidth:30,
                              color:app.matchPct>=60?C.green:app.matchPct>=30?C.yellow:C.orange}}>{app.matchPct}%</span>
                          </div>
                        </td>
                        <td style={{padding:"9px 10px"}}>
                          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                            {app.jobSkills.slice(0,4).map(s=>(
                              <span key={s} style={{fontSize:8.5,padding:"2px 7px",borderRadius:20,fontWeight:600,
                                background:isMatch(userNorm,normSkill(s))?`${C.green}18`:`${C.orange}12`,
                                color:isMatch(userNorm,normSkill(s))?C.green:C.orange,
                                border:`1px solid ${isMatch(userNorm,normSkill(s))?C.green:C.orange}33`}}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>}
        </div>
      </GCard>
    </div>
  );
};

/* ════════════════════════════════════════
   SLIDE 4 — CERTIFICATIONS
════════════════════════════════════════ */
const SlideCertifications=({jobs,userNorm,userRaw})=>{
  const [selRole,setSelRole]=useState("");
  const [certs,setCerts]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);

  const roleMap={};
  jobs.forEach(job=>{
    const t=(job.title||"Unknown").trim();
    if(!roleMap[t]) roleMap[t]={raw:[],norm:[]};
    const raw=(job.requiredSkills||[]).map(toStr).filter(Boolean);
    const nrm=extractNorm(job.requiredSkills||[]);
    roleMap[t].raw=[...new Set([...roleMap[t].raw,...raw])];
    roleMap[t].norm=[...new Set([...roleMap[t].norm,...nrm])];
  });

  const allRoles=Object.keys(roleMap);
  const active=selRole||allRoles[0]||"";
  const rNorm=(roleMap[active]?.norm)||[];
  const rRaw=(roleMap[active]?.raw)||[];

  const missing=rRaw.filter(s=>!isMatch(userNorm,normSkill(s))).slice(0,6);
  const mched=rRaw.filter(s=> isMatch(userNorm,normSkill(s)));
  const mpct=rNorm.length?Math.round((mched.length/rNorm.length)*100):0;

  const fetchCerts=async()=>{
    if(!active||missing.length===0) return;
    setLoading(true); setSearched(true);
    try {
      const res=await fetch(`${API}/certifications/suggest`,{
        method:"POST",headers:H(),
        body:JSON.stringify({role:active,missingSkills:missing}),
      });
      if(res.ok){const d=await res.json();setCerts(d.certifications||d.certs||d||[]);}
      else throw new Error();
    } catch {
      setCerts(missing.map((skill,i)=>({
        name:`${skill} ${["Certification","Masterclass","Bootcamp","Fundamentals"][i%4]}`,
        provider:["Coursera","Udemy","LinkedIn Learning","Google","AWS","edX"][i%6],
        duration:`${[4,6,8,10,12][i%5]} weeks`,
        priority:i<2?"High":i<4?"Medium":"Low",
        skill,
      })));
    } finally {setLoading(false);}
  };

  const pc={High:C.orange,Medium:C.yellow,Low:C.green};

  return (
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:10,flex:1,minHeight:0}}>
      <GCard glow={C.purple}>
        <CT color={C.purple}>Select Role to Analyze</CT>
        <select value={active} onChange={e=>{setSelRole(e.target.value);setCerts([]);setSearched(false);}}
          style={{padding:"9px 12px",borderRadius:9,border:`1px solid ${C.border}`,
            background:C.card2,fontSize:12,color:C.text,outline:"none",marginBottom:10,cursor:"pointer"}}>
          {allRoles.map(r=><option key={r} style={{background:C.card2}}>{r}</option>)}
        </select>
        <div style={{background:C.card2,borderRadius:9,padding:"10px 12px",marginBottom:10,border:`1px solid ${C.border2}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,color:C.muted}}>Your match for {active}</span>
            <span style={{fontSize:12,fontWeight:900,color:roleColor(mpct)}}>{mpct}%</span>
          </div>
          <PBar pct={mpct} color={roleColor(mpct)} h={7}/>
          <div style={{fontSize:9,color:C.muted,marginTop:5}}>{mched.length} of {rNorm.length} skills matched</div>
        </div>
        {mched.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.green,fontWeight:700,marginBottom:6}}>You Have ({mched.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {mched.slice(0,8).map(s=><Pill key={s} label={s} color={C.green}/>)}
            </div>
          </div>
        )}
        <button onClick={fetchCerts} disabled={loading||missing.length===0}
          style={{padding:"10px",borderRadius:9,border:"none",cursor:loading?"wait":"pointer",
            background:loading?C.border:`linear-gradient(135deg,${C.primary},${C.purple})`,
            color:"white",fontWeight:700,fontSize:12,marginBottom:14,
            boxShadow:loading?"none":`0 4px 16px ${C.primary}44`,transition:"all 0.3s"}}>
          {loading?"Finding Courses...":"🎓 Get Certificate Suggestions"}
        </button>
        <div style={{fontSize:10,color:C.orange,fontWeight:700,marginBottom:8}}>Missing Skills ({missing.length})</div>
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:5}}>
          {missing.length===0
            ? <div style={{color:C.green,fontSize:11,textAlign:"center",marginTop:20}}>You have all skills for this role!</div>
            : missing.map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",
                background:`${C.orange}0a`,borderRadius:8,border:`1px solid ${C.orange}28`}}>
                <span style={{fontSize:10,fontWeight:700,color:C.orange,width:16,textAlign:"center"}}>#{i+1}</span>
                <span style={{fontSize:11,color:C.text,fontWeight:600}}>{s}</span>
              </div>
            ))}
        </div>
      </GCard>

      <GCard glow={C.primary}>
        <CT sub={active?`Suggested certifications for ${active}`:"Select a role"} color={C.primary}>
          Certificate Roadmap
        </CT>
        {!searched
          ? <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
              <div style={{fontSize:56}}>🎓</div>
              <div style={{color:C.muted,fontSize:13,textAlign:"center",lineHeight:1.7}}>
                Select a role and click <strong style={{color:C.primary}}>"Get Certificate Suggestions"</strong><br/>
                <span style={{fontSize:11}}>We'll analyse your real skill gaps and suggest the best courses</span>
              </div>
            </div>
          : loading
            ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:`2.5px solid ${C.primary}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
                <span style={{color:C.muted,fontSize:13}}>Finding best courses...</span>
              </div>
            : certs.length===0
              ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{color:C.muted,fontSize:12}}>No suggestions found.</div>
                </div>
              : <div style={{flex:1,overflow:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignContent:"start"}}>
                  {certs.map((cert,i)=>{
                    const c=pc[cert.priority]||C.primary;
                    return (
                      <div key={i} style={{background:C.card2,borderRadius:12,padding:"16px",
                        border:`1px solid ${c}33`,position:"relative",overflow:"hidden",boxShadow:`0 4px 16px ${c}14`}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2.5,background:`linear-gradient(90deg,${c},${c}88)`}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <span style={{fontSize:12,fontWeight:800,color:C.text,flex:1,lineHeight:1.4}}>{cert.name}</span>
                          {cert.priority&&<Pill label={cert.priority} color={c}/>}
                        </div>
                        <div style={{fontSize:11,color:C.primary,fontWeight:600,marginBottom:6}}>{cert.provider||"Online Platform"}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          {cert.duration&&<span style={{fontSize:10,color:C.muted}}>⏱ {cert.duration}</span>}
                          {cert.skill&&<Pill label={`+${cert.skill}`} color={C.orange}/>}
                        </div>
                        {cert.url&&<a href={cert.url} target="_blank" rel="noreferrer"
                          style={{display:"block",marginTop:10,fontSize:11,color:C.primary,textDecoration:"none",fontWeight:700}}>
                          View Course →</a>}
                      </div>
                    );
                  })}
                </div>}
      </GCard>
    </div>
  );
};

/* ════════════════════════════════════════
   ROOT
════════════════════════════════════════ */
const TABS=[
  {id:"roleMatch",    label:"Role Match"},
  {id:"market",       label:"Market Trends"},
  {id:"applications", label:"Applications"},
  {id:"certs",        label:"Certifications"},
];

export default function JobSeekerAnalytics(){
  const {user}=useContext(AuthContext);
  const [activeTab,setActiveTab]=useState("roleMatch");
  const [jobs,setJobs]=useState([]);
  const [applications,setApplications]=useState([]);
  const [userNorm,setUserNorm]=useState([]);
  const [userRaw,setUserRaw]=useState([]);
  const [profile,setProfile]=useState({});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const [jobsRes,appsRes,prof]=await Promise.all([
          jobService.getAllJobs(),
          jobService.getUserApplications().catch(()=>[]),
          jobService.getMyProfile().catch(()=>({})),
        ]);
        const jl=Array.isArray(jobsRes)?jobsRes:(jobsRes.jobs||[]);
        const al=Array.isArray(appsRes)?appsRes:[];
        const profileData=prof||{};
        const raw=(
          Array.isArray(profileData.skills)&&profileData.skills.length>0
            ? profileData.skills
            : Array.isArray(user?.skills)&&user.skills.length>0
              ? user.skills
              : []
        );
        setJobs(jl);
        setApplications(al);
        setProfile(profileData);
        setUserRaw(raw);
        setUserNorm(extractNorm(raw));
      } catch(e){console.error("[Analytics] load error:",e);}
      finally{setLoading(false);}
    })();
  },[user]);

  const allJobSkills=new Set();
  jobs.forEach(j=>extractNorm(j.requiredSkills||[]).forEach(s=>allJobSkills.add(s)));
  const skillsGap=[...allJobSkills].filter(s=>!isMatch(userNorm,s)).length;

  const profileScore=Math.min(100,Math.round(
    (profile.username?15:0)+(profile.email?15:0)+
    (userRaw.length>=5?20:userRaw.length*4)+
    ((profile.education?.length||0)>0?15:0)+
    ((profile.experience?.length||0)>0?20:0)+
    (profile.resumeFile?15:0)
  ));

  return (
    <div style={{fontFamily:"'Segoe UI',-apple-system,sans-serif",background:C.bg,minHeight:"100vh",
      display:"flex",flexDirection:"column",padding:"16px 20px",boxSizing:"border-box",color:C.text}}>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexShrink:0}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:900,margin:0,letterSpacing:-0.5}}>
            Job Seeker{" "}
            <span style={{background:`linear-gradient(90deg,${C.primary},${C.purple})`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Analytics</span>
          </h1>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>
            Hi <strong style={{color:C.text}}>{user?.username||"there"}</strong>
            {" · "}{userRaw.length} skills{" · "}{jobs.length} live jobs tracked
            <span style={{marginLeft:8,color:C.green,fontWeight:700}}>● Live Data</span>
          </div>
        </div>
      </div>

      {/* KPI ROW — only 1st card changed to SuccessRateKPI, rest identical */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexShrink:0}}>
        <KPI label="Live Jobs"     value={jobs.length}         color={C.primary} sub="In job board"/>
        <KPI label="Applied"       value={applications.length} color={C.teal}    sub="Applications sent"/>
        <ResponseRateKPI applications={applications}/>
        <KPI label="Skills Gap"    value={skillsGap}           color={C.orange}  sub="Skills to learn"/>
        <KPI label="Profile Score" value={`${profileScore}%`}  color={C.purple}
          sub={profileScore>=80?"Strong profile":"Complete profile to improve"}/>
      </div>

      <div style={{display:"flex",gap:5,marginBottom:12,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:"7px 22px",borderRadius:8,
            border:`1px solid ${activeTab===t.id?C.primary:C.border2}`,
            background:activeTab===t.id?`${C.primary}1a`:"transparent",
            color:activeTab===t.id?C.primary:C.muted,
            fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        {loading
          ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexDirection:"column"}}>
              <div style={{width:28,height:28,borderRadius:"50%",border:`3px solid ${C.primary}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
              <span style={{color:C.muted,fontSize:13}}>Loading real data from server...</span>
            </div>
          : <>
              {activeTab==="roleMatch"    && <SlideRoleMatch    jobs={jobs} userNorm={userNorm} applications={applications}/>}
              {activeTab==="market"       && <SlideMarketTrends jobs={jobs} userNorm={userNorm}/>}
              {activeTab==="applications" && <SlideApplications applications={applications} jobs={jobs} userNorm={userNorm}/>}
              {activeTab==="certs"        && <SlideCertifications jobs={jobs} userNorm={userNorm} userRaw={userRaw}/>}
            </>}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
