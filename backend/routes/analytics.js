// backend/routes/analytics.js — FINAL FIXED
// Fixes:
// 1. requiredSkills stored as ObjectId refs OR plain strings — both handled
// 2. demandScore = how many of YOUR jobs need that skill (no hardcoded Skill.demandScore)
// 3. All routes protected with auth middleware
// 4. KPI overview uses auth'd recruiter's own jobs only
// 5. "All Time" filter works correctly (36500 days)

const express     = require('express');
const router      = express.Router();
const mongoose    = require('mongoose');
const auth        = require('../middleware/auth');
const Application = require('../models/Application');
const Job         = require('../models/Job');
const Skill       = require('../models/Skill');

/* ── helpers ─────────────────────────────────────────────────── */
function dateFilter(tf) {
  const map = {
    'Today':1,'Last 7 Days':7,'Last 14 Days':14,'Last 30 Days':30,
    'Last 60 Days':60,'Last 90 Days':90,'Last 3 Months':90,
    'Last 6 Months':180,'Last 1 Year':365,'Last Year':365,'All Time':36500,
  };
  return new Date(Date.now() - (map[tf] ?? 36500) * 86400000);
}

function computeMatch(userSkills, jobSkillNames) {
  if (!jobSkillNames?.length) return 0;
  const set = new Set((userSkills||[]).map(s => s.toLowerCase().trim()));
  return Math.round(
    jobSkillNames.filter(s => set.has(s.toLowerCase().trim())).length
    / jobSkillNames.length * 100
  );
}

function calcExpYears(exp) {
  if (!exp?.length) return 0;
  const mo = exp.reduce((s,e) => {
    const st = e.startDate ? new Date(e.startDate) : null;
    const en = e.endDate   ? new Date(e.endDate)   : new Date();
    return st ? s + Math.max(0,(en-st)/2592000000) : s;
  },0);
  return Math.round(mo/12*10)/10;
}

function dateMatch(since) {
  return { $or:[{appliedAt:{$gte:since}},{createdAt:{$gte:since}}] };
}

// KEY: requiredSkills can be stored as ObjectId refs (populated to {_id,name})
// OR as plain strings (when job was created with skill names directly)
function extractSkillNames(requiredSkills) {
  if (!requiredSkills?.length) return [];
  return requiredSkills.map(s => {
    if (typeof s === 'string') return s.trim();
    if (typeof s === 'object' && s !== null) {
      return (s.name || s.skillName || s.title || '').trim();
    }
    return '';
  }).filter(Boolean);
}

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/overview
══════════════════════════════════════════════════════════════ */
router.get('/overview', auth, async (req,res) => {
  try {
    const { timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter);

    const allJobs = await Job.find({ postedBy:rid })
      .populate('requiredSkills','name')
      .lean();
    const activeJobs = allJobs.filter(j => j.status === 'active').length;
    const jobIds     = allJobs.map(j => j._id);

    if (!jobIds.length)
      return res.json({ totalApplicants:0, avgMatch:0, shortlisted:0, accepted:0, activeJobs:0 });

    const skillMap = Object.fromEntries(
      allJobs.map(j => [String(j._id), extractSkillNames(j.requiredSkills)])
    );

    const apps = await Application.find({
      jobId: {$in:jobIds}, ...dateMatch(since),
    }).populate('applicantId','skills').lean();

    let matchSum=0, shortlisted=0, accepted=0;
    apps.forEach(app => {
      const userSkills = app.applicantId?.skills || [];
      const jobSkills  = skillMap[String(app.jobId)] || [];
      matchSum += computeMatch(userSkills, jobSkills);
      if (app.status === 'shortlisted') shortlisted++;
      if (app.status === 'accepted')    accepted++;
    });

    res.json({
      totalApplicants: apps.length,
      avgMatch:        apps.length ? Math.round(matchSum/apps.length) : 0,
      shortlisted, accepted, activeJobs,
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/candidates
══════════════════════════════════════════════════════════════ */
router.get('/candidates', auth, async (req,res) => {
  try {
    const { role, timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter);

    const jobFilter = { postedBy:rid };
    if (role && role !== 'All Roles') jobFilter.title = { $regex:role, $options:'i' };

    const jobs = await Job.find(jobFilter)
      .populate('requiredSkills','name category')
      .lean();
    if (!jobs.length) return res.json({ candidates:[], avgMatch:0, totalCount:0 });

    const jobIds = jobs.map(j => j._id);
    const jobMap = Object.fromEntries(jobs.map(j => [String(j._id), j]));

    const apps = await Application.find({
      jobId: {$in:jobIds}, ...dateMatch(since),
    }).populate('applicantId','username email skills experience').lean();

    const seen = new Map();
    apps.forEach(app => {
      const user = app.applicantId;
      if (!user) return;
      const job       = jobMap[String(app.jobId)];
      if (!job) return;
      const jobSkills = extractSkillNames(job.requiredSkills);
      const matchPct  = computeMatch(user.skills, jobSkills);
      const expYears  = calcExpYears(user.experience);
      const matched   = (user.skills||[]).filter(us =>
        jobSkills.some(js => js.toLowerCase() === us.toLowerCase())
      ).length;
      const key = String(user._id)+String(app.jobId);
      const ex  = seen.get(key);
      if (!ex || matchPct > ex.match) {
        seen.set(key, {
          _id: String(app._id), applicationId: String(app._id),
          name: user.username||user.email, email: user.email,
          role: job.title, company: job.company, status: app.status,
          match: matchPct, matchPct, expYears, skillsMatched: matched,
          skillList: user.skills||[], jobSkills,
          appliedAt: app.appliedAt||app.createdAt,
        });
      }
    });

    const ranked = [...seen.values()]
      .sort((a,b) => b.match-a.match)
      .map((c,i) => ({...c, rank:i+1}));

    res.json({
      candidates: ranked,
      avgMatch:   ranked.length ? Math.round(ranked.reduce((s,c)=>s+c.match,0)/ranked.length) : 0,
      totalCount: ranked.length,
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/statusBreakdown
══════════════════════════════════════════════════════════════ */
router.get('/statusBreakdown', auth, async (req,res) => {
  try {
    const { role, timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter);

    const jobFilter = { postedBy:rid };
    if (role && role !== 'All Roles') jobFilter.title = { $regex:role, $options:'i' };

    const jobs   = await Job.find(jobFilter,'_id').lean();
    const jobIds = jobs.map(j => j._id);
    if (!jobIds.length) return res.json({ statusBreakdown:[] });

    const breakdown = await Application.aggregate([
      { $match:{ jobId:{$in:jobIds}, ...dateMatch(since) } },
      { $group:{ _id:'$status', count:{$sum:1} } },
    ]);

    const colorMap = {
      pending:'#F59E0B', reviewed:'#60A5FA', shortlisted:'#A78BFA',
      rejected:'#F87171', accepted:'#34D399',
    };
    const statusBreakdown = breakdown
      .filter(b => b._id)
      .map(b => ({
        status: b._id.charAt(0).toUpperCase()+b._id.slice(1),
        statusRaw: b._id, count: b.count, color: colorMap[b._id]||'#94A3B8',
      }))
      .sort((a,b) => b.count-a.count);

    res.json({ statusBreakdown });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/pipeline
══════════════════════════════════════════════════════════════ */
router.get('/pipeline', auth, async (req,res) => {
  try {
    const { role, timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter||'Last 30 Days');

    const jobFilter = { postedBy:rid };
    if (role && role !== 'All Roles') jobFilter.title = { $regex:role, $options:'i' };

    const jobs   = await Job.find(jobFilter,'_id').lean();
    const jobIds = jobs.map(j => j._id);
    if (!jobIds.length) return res.json({ pipeline:[] });

    const results = await Application.aggregate([
      { $match:{ jobId:{$in:jobIds}, ...dateMatch(since) } },
      { $addFields:{ dateUsed:{ $ifNull:['$appliedAt','$createdAt'] } } },
      { $group:{
        _id:{ year:{$year:'$dateUsed'}, week:{$week:'$dateUsed'} },
        applications:{ $sum:1 },
        qualified:{ $sum:{ $cond:[{$in:['$status',['shortlisted','accepted']]},1,0] } },
        hired:{    $sum:{ $cond:[{$eq:['$status','accepted']},1,0] } },
        reviewed:{ $sum:{ $cond:[{$eq:['$status','reviewed']},1,0] } },
        rejected:{ $sum:{ $cond:[{$eq:['$status','rejected']},1,0] } },
        firstDay:{ $min:'$dateUsed' },
      }},
      { $sort:{ '_id.year':1,'_id.week':1 } },
    ]);

    const pipeline = results.map((r,i) => ({
      week: `W${i+1}`,
      weekLabel: new Date(r.firstDay).toLocaleDateString('en-IN',{month:'short',day:'numeric'}),
      applications: r.applications, qualified: r.qualified,
      hired: r.hired, reviewed: r.reviewed, rejected: r.rejected,
    }));

    res.json({ pipeline });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/hireRate
══════════════════════════════════════════════════════════════ */
router.get('/hireRate', auth, async (req,res) => {
  try {
    const { timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter);

    const jobs   = await Job.find({ postedBy:rid },'_id title').lean();
    const jobIds = jobs.map(j => j._id);
    const tm     = Object.fromEntries(jobs.map(j => [String(j._id),j.title]));
    if (!jobIds.length) return res.json({ byRole:[] });

    const apps = await Application.find({ jobId:{$in:jobIds}, ...dateMatch(since) }).lean();

    const rm = {};
    jobs.forEach(j => { rm[j.title]={total:0,hired:0,shortlisted:0,rejected:0,pending:0}; });
    apps.forEach(app => {
      const r = tm[String(app.jobId)]||'Unknown';
      if (!rm[r]) rm[r]={total:0,hired:0,shortlisted:0,rejected:0,pending:0};
      rm[r].total++;
      if (app.status==='accepted')    rm[r].hired++;
      if (app.status==='shortlisted') rm[r].shortlisted++;
      if (app.status==='rejected')    rm[r].rejected++;
      if (app.status==='pending')     rm[r].pending++;
    });

    res.json({
      byRole: Object.entries(rm).map(([role,d]) => ({
        role, total:d.total, hired:d.hired, shortlisted:d.shortlisted,
        rejected:d.rejected, pending:d.pending,
        rate: d.total>0 ? d.hired/d.total : 0,
      })).sort((a,b) => b.total-a.total),
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/topSkills
   REAL DATA: demandScore = number of YOUR jobs that require this skill
   candidateCount = unique applicants with this skill
   No hardcoded Skill.demandScore used at all.
══════════════════════════════════════════════════════════════ */
router.get('/topSkills', auth, async (req,res) => {
  try {
    const rid  = req.user._id;
    const jobs = await Job.find({ postedBy:rid })
      .populate('requiredSkills','name category')
      .lean();
    if (!jobs.length) return res.json({ skills:[] });

    // Count skills from THIS recruiter's jobs only — real demand
    const sm = {};
    jobs.forEach(job => {
      const names = extractSkillNames(job.requiredSkills);
      [...new Set(names.map(n => n.toLowerCase()))].forEach(key => {
        const displayName = names.find(n => n.toLowerCase() === key) || key;
        if (!sm[key]) sm[key] = { name:displayName, jobCount:0, candidateCount:0 };
        sm[key].jobCount++;
      });
    });

    if (!Object.keys(sm).length) return res.json({ skills:[] });

    // Count unique applicants per skill
    const jobIds = jobs.map(j => j._id);
    const apps   = await Application.find({ jobId:{$in:jobIds} })
      .populate('applicantId','skills')
      .lean();

    const skillApplicants = {};
    apps.forEach(app => {
      if (!app.applicantId) return;
      const uid = String(app.applicantId._id);
      (app.applicantId.skills||[]).forEach(s => {
        const k = s.toLowerCase().trim();
        if (!skillApplicants[k]) skillApplicants[k] = new Set();
        skillApplicants[k].add(uid);
      });
    });

    Object.keys(sm).forEach(key => {
      sm[key].candidateCount = skillApplicants[key]?.size || 0;
    });

    const sorted = Object.values(sm)
      .sort((a,b) => b.jobCount-a.jobCount || b.candidateCount-a.candidateCount)
      .slice(0,10)
      // demandScore = jobCount (real count, not hardcoded from Skill model)
      .map(s => ({ ...s, demandScore: s.jobCount }));

    res.json({ skills:sorted });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/qualityTrend
══════════════════════════════════════════════════════════════ */
router.get('/qualityTrend', auth, async (req,res) => {
  try {
    const { timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter||'Last 30 Days');

    const jobs = await Job.find({ postedBy:rid })
      .populate('requiredSkills','name')
      .lean();
    const jobIds = jobs.map(j => j._id);
    const jm     = Object.fromEntries(
      jobs.map(j => [String(j._id), extractSkillNames(j.requiredSkills)])
    );
    if (!jobIds.length) return res.json({ trend:[] });

    const apps = await Application.find({
      jobId:{$in:jobIds}, ...dateMatch(since),
    }).populate('applicantId','skills').sort({appliedAt:1}).lean();

    const wm = {};
    apps.forEach(app => {
      if (!app.applicantId) return;
      const d  = new Date(app.appliedAt||app.createdAt);
      const ws = new Date(d); ws.setDate(d.getDate()-d.getDay());
      const key= ws.toISOString().slice(0,10);
      const m  = computeMatch(app.applicantId.skills, jm[String(app.jobId)]||[]);
      if (!wm[key]) wm[key]={matches:[],qualified:0,hired:0};
      wm[key].matches.push(m);
      if (['shortlisted','accepted'].includes(app.status)) wm[key].qualified++;
      if (app.status==='accepted') wm[key].hired++;
    });

    res.json({
      trend: Object.entries(wm).sort(([a],[b])=>a.localeCompare(b)).map(([,d],i)=>({
        week:`W${i+1}`,
        avgMatch:Math.round(d.matches.reduce((s,v)=>s+v,0)/d.matches.length),
        qualified:d.qualified, hired:d.hired,
      })),
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/applicantSkills
   Match distribution by role (0-25%, 26-50%, 51-75%, 76-100%)
══════════════════════════════════════════════════════════════ */
router.get('/applicantSkills', auth, async (req,res) => {
  try {
    const { timeFilter } = req.query;
    const rid   = req.user._id;
    const since = dateFilter(timeFilter||'All Time');

    const jobs = await Job.find({ postedBy:rid })
      .populate('requiredSkills','name')
      .lean();
    if (!jobs.length) return res.json({ byJob:[] });

    const jobIds = jobs.map(j => j._id);
    const jobMap = Object.fromEntries(jobs.map(j => [String(j._id), j]));

    const apps = await Application.find({
      jobId:{$in:jobIds}, ...dateMatch(since),
    }).populate('applicantId','skills').lean();

    const rm = {};
    jobs.forEach(j => {
      rm[j.title] = { role:j.title,'0-25':0,'26-50':0,'51-75':0,'76-100':0,total:0 };
    });

    apps.forEach(app => {
      const job = jobMap[String(app.jobId)];
      if (!job||!app.applicantId) return;
      const jobSkills = extractSkillNames(job.requiredSkills);
      const match = computeMatch(app.applicantId.skills, jobSkills);
      const t     = job.title;
      if (!rm[t]) rm[t]={role:t,'0-25':0,'26-50':0,'51-75':0,'76-100':0,total:0};
      rm[t].total++;
      if      (match<=25) rm[t]['0-25']++;
      else if (match<=50) rm[t]['26-50']++;
      else if (match<=75) rm[t]['51-75']++;
      else                rm[t]['76-100']++;
    });

    res.json({ byJob:Object.values(rm).sort((a,b)=>b.total-a.total) });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/analytics/roles
══════════════════════════════════════════════════════════════ */
router.get('/roles', auth, async (req,res) => {
  try {
    const rid   = req.user._id;
    const roles = await Job.distinct('title',{postedBy:rid});
    res.json({ roles });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

module.exports = router;
