// frontend/src/pages/AboutUS.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Grid, Button,
  TextField, Snackbar, Alert
} from '@mui/material';
import {
  LinkedIn, Twitter, Email, Phone, Send,
  ArrowForward, NorthEast, CheckCircle
} from '@mui/icons-material';

/* ═══════════════════ TOKENS ═══════════════════ */
const T = {
  ivory:   '#faf8f4',
  cream:   '#f2ede4',
  ink:     '#1a1612',
  char:    '#2e2a24',
  sub:     '#6b6560',
  muted:   '#9e9890',
  border:  '#e6e0d5',
  amber:   '#b45309',
  amberLt: '#fef3c7',
  amberMd: '#f59e0b',
  slate:   '#3b4a6b',
  slateLt: '#eef1f8',
  white:   '#ffffff',
};

/* ── scroll reveal ── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } },
      { threshold }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, v];
}
const Reveal = ({ children, delay = 0, dir = 'up' }) => {
  const [ref, v] = useInView();
  const tr = { up:'translateY(28px)', left:'translateX(-28px)', right:'translateX(28px)', none:'none' };
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : tr[dir],
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
};

/* ── input style ── */
const iSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', background: T.ivory,
    '& fieldset': { borderColor: T.border },
    '&:hover fieldset': { borderColor: T.amberMd },
    '&.Mui-focused fieldset': { borderColor: T.amberMd, borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': { color: T.muted, fontSize: '0.87rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: T.amber },
  '& input, & textarea': { color: T.ink, fontSize: '0.92rem' },
};

const features = [
  { num: '01', title: 'AI Skill Matching',       body: 'Intelligent algorithms surface the most relevant roles for your exact profile — no noise, just signal.' },
  { num: '02', title: 'Career Path Planning',     body: 'Personalised roadmaps built around your goals. Clear milestones, not generic templates.' },
  { num: '03', title: 'Real-time Market Insights', body: 'Live salary benchmarks, in-demand skills, and hiring trends — so you always negotiate from strength.' },
  { num: '04', title: 'Learning & Upskilling',    body: 'Curated courses and certifications that close the exact gap between where you are and where you want to be.' },
];

/* ════════════════════════════════════════════════════════════ */
export default function AboutUS() {
  const [form, setForm]       = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [snack, setSnack]     = useState({ open: false, type: 'success', msg: '' });
  const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      setSnack({ open: true, type: 'error', msg: 'Please fill in your name and message.' }); return;
    }
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setSnack({ open: true, type: 'success', msg: "Message sent! We'll respond within 24 hours." });
      setForm({ name: '', email: '', message: '' });
    } catch { setSnack({ open: true, type: 'error', msg: 'Could not send. Email us directly.' }); }
    finally { setSending(false); }
  };

  return (
    <Box sx={{ background: T.ivory, minHeight: '100vh', fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,600;1,400;1,600&display=swap');
        @keyframes floatBlob { 0%,100%{transform:translateY(0) scale(1);opacity:.18} 50%{transform:translateY(-20px) scale(1.08);opacity:.28} }
        .feat-row { border-top: 1px solid ${T.border}; transition: background .2s; }
        .feat-row:last-child { border-bottom: 1px solid ${T.border}; }
        .feat-row:hover { background: ${T.cream}; }
        .feat-row:hover .fn { color: ${T.amberMd}; }
        .feat-row:hover .fa { opacity:1; transform:translate(0,0); }
        .fa { opacity:0; transform:translate(-6px,6px); transition:all .2s; }
        .soc:hover { transform:translateY(-2px); }
      `}</style>

      {/* ══ HERO ══ */}
      <Box sx={{
        background: T.ink, pt: { xs:10, md:14 }, pb: { xs:11, md:15 },
        position:'relative', overflow:'hidden',
      }}>
        {[
          {s:280,t:-100,r:-80,d:0},  {s:140,t:60,r:200,d:1.6},
          {s:90, t:200,r:100,d:3},   {s:180,b:-50,l:-50,d:2.1},
          {s:70, b:70, l:230,d:0.9},
        ].map((c,i) => (
          <Box key={i} sx={{
            position:'absolute', width:c.s, height:c.s, borderRadius:'50%', pointerEvents:'none',
            background:`radial-gradient(circle,${T.amberMd}26 0%,transparent 70%)`,
            top:c.t, right:c.r, bottom:c.b, left:c.l,
            animation:`floatBlob ${4.5+i*0.6}s ease-in-out infinite`,
            animationDelay:`${c.d}s`,
          }}/>
        ))}

        <Container maxWidth="lg" sx={{ position:'relative', zIndex:1 }}>
          <Reveal>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:4 }}>
              <Box sx={{ width:28, height:2, background:T.amberMd, borderRadius:1 }}/>
              <Typography sx={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:2.5, color:T.amberMd, textTransform:'uppercase' }}>
                About Elance
              </Typography>
            </Box>
          </Reveal>

          <Grid container spacing={5} alignItems="flex-end">
            <Grid item xs={12} md={7}>
              <Reveal delay={80}>
                <Typography sx={{
                  fontFamily:"'Lora',Georgia,serif", fontWeight:600, color:T.ivory,
                  fontSize:{xs:'3rem',md:'5rem',lg:'5.6rem'},
                  lineHeight:1.06, letterSpacing:'-2px',
                }}>
                  Where Great<br/>
                  <Box component="span" sx={{ fontStyle:'italic', color:T.amberMd, fontWeight:400 }}>
                    Careers
                  </Box>{' '}Begin
                </Typography>
              </Reveal>
            </Grid>
            <Grid item xs={12} md={5}>
              <Reveal delay={160} dir="left">
                <Box sx={{ pl:{md:4}, borderLeft:{md:`2px solid ${T.amber}40`} }}>
                  <Typography sx={{ color:'rgba(250,248,244,.62)', fontSize:'1.03rem', lineHeight:1.85, mb:3.5 }}>
                    Elance is an AI-powered recruitment platform connecting
                    professionals with meaningful work — and companies with
                    exceptional talent. Fast, intelligent, human.
                  </Typography>

                </Box>
              </Reveal>
            </Grid>
          </Grid>

          <Reveal delay={220}>
            <Box sx={{ display:'flex', gap:2, mt:7, flexWrap:'wrap' }}>
              {['AI-Powered Matching','Career Planning','Live Market Insights','Upskilling Paths'].map(tag => (
                <Box key={tag} sx={{
                  px:2.2, py:0.7, borderRadius:20,
                  border:`1px solid rgba(250,248,244,.13)`,
                  background:'rgba(250,248,244,.06)',
                }}>
                  <Typography sx={{ fontSize:'0.77rem', color:'rgba(250,248,244,.60)', fontWeight:500 }}>
                    {tag}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Reveal>
        </Container>
      </Box>

      {/* ══ FEATURES ══ */}
      <Box sx={{ background:T.ivory, py:12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={7}>
            <Grid item xs={12} md={4}>
              <Reveal dir="left">
                <Box sx={{ position:'sticky', top:100 }}>
                  <Typography sx={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:2.5,
                    color:T.amber, textTransform:'uppercase', mb:1.5 }}>
                    What We Offer
                  </Typography>
                  <Typography sx={{
                    fontFamily:"'Lora',Georgia,serif", fontWeight:600, color:T.ink,
                    fontSize:{xs:'2rem',md:'2.5rem'}, lineHeight:1.2, letterSpacing:'-0.8px', mb:2,
                  }}>
                    Built for the<br/>
                    <Box component="span" sx={{ fontStyle:'italic', color:T.sub, fontWeight:400 }}>
                      Modern Job Seeker
                    </Box>
                  </Typography>
                  <Typography sx={{ color:T.sub, fontSize:'0.91rem', lineHeight:1.8 }}>
                    Everything you need to find, land, and grow in a career you love — under one roof.
                  </Typography>
                </Box>
              </Reveal>
            </Grid>

            <Grid item xs={12} md={8}>
              {features.map((f, i) => (
                <Reveal key={f.num} delay={i * 70}>
                  <Box className="feat-row" sx={{ py:3.5, px:2, cursor:'default' }}>
                    <Box sx={{ display:'flex', gap:3, alignItems:'flex-start' }}>
                      <Typography className="fn" sx={{
                        fontFamily:"'Lora',Georgia,serif", fontSize:'0.78rem', fontWeight:600,
                        color:T.muted, letterSpacing:1, pt:0.3, minWidth:26, transition:'color .2s',
                      }}>{f.num}</Typography>
                      <Box sx={{ flex:1 }}>
                        <Typography sx={{ fontWeight:700, color:T.ink, fontSize:'1.05rem', mb:0.7, letterSpacing:'-0.2px' }}>
                          {f.title}
                        </Typography>
                        <Typography sx={{ color:T.sub, fontSize:'0.89rem', lineHeight:1.75 }}>
                          {f.body}
                        </Typography>
                      </Box>
                      <NorthEast className="fa" sx={{ color:T.amberMd, fontSize:17, mt:0.4 }}/>
                    </Box>
                  </Box>
                </Reveal>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ══ MISSION — horizontal strip (no separate dark card) ══ */}
      <Box sx={{ background:T.cream, py:11 }}>
        <Container maxWidth="lg">
          <Reveal>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{
                  display:'inline-flex', px:1.8, py:0.6, borderRadius:20,
                  background:T.amberLt, mb:2.5,
                }}>
                  <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color:T.amber, letterSpacing:2, textTransform:'uppercase' }}>
                    Our Mission
                  </Typography>
                </Box>
                <Typography sx={{
                  fontFamily:"'Lora',Georgia,serif", fontWeight:600, color:T.ink,
                  fontSize:{xs:'2.2rem',md:'2.8rem'}, lineHeight:1.15, letterSpacing:'-1px', mb:2.5,
                }}>
                  Careers for{' '}
                  <Box component="span" sx={{ fontStyle:'italic', color:T.amber, fontWeight:400 }}>
                    Everyone
                  </Box>
                </Typography>
                <Typography sx={{ color:T.sub, lineHeight:1.85, fontSize:'0.93rem', mb:2 }}>
                  We're democratising career growth — giving every professional AI-powered insights,
                  personalised learning, and direct access to opportunities that match their unique potential.
                </Typography>
                <Typography sx={{ color:T.sub, lineHeight:1.85, fontSize:'0.93rem' }}>
                  We believe everyone deserves a fulfilling career, and we're building the technology
                  to make that real for millions.
                </Typography>
              </Grid>

              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  {[
                    'AI-curated job matches',
                    'Personalised skill development',
                    'Real-time market insights',
                    'Career progression tracking',
                    'Vetted company listings',
                    'One-click applications',
                  ].map((item, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Box sx={{
                        display:'flex', alignItems:'center', gap:1.5,
                        p:2, borderRadius:'12px',
                        background:T.white, border:`1.5px solid ${T.border}`,
                        transition:'all .22s',
                        '&:hover':{ borderColor:T.amberMd, boxShadow:`0 4px 16px ${T.amberMd}20` },
                      }}>
                        <Box sx={{
                          width:28, height:28, borderRadius:'50%',
                          background:T.amberLt, flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          <CheckCircle sx={{ fontSize:15, color:T.amber }}/>
                        </Box>
                        <Typography sx={{ color:T.char, fontSize:'0.88rem', fontWeight:600 }}>
                          {item}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Reveal>
        </Container>
      </Box>

      {/* ══ CONTACT FORM — full width, beautiful ══ */}
      <Box sx={{ background:T.ink, py:12 }}>
        <Container maxWidth="lg">
          <Reveal>
            <Box sx={{ textAlign:'center', mb:8 }}>
              <Box sx={{ display:'inline-flex', alignItems:'center', gap:1.5, mb:2 }}>
                <Box sx={{ width:24, height:1.5, background:T.amberMd }}/>
                <Typography sx={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:2.5,
                  color:T.amberMd, textTransform:'uppercase' }}>
                  Get in Touch
                </Typography>
                <Box sx={{ width:24, height:1.5, background:T.amberMd }}/>
              </Box>
              <Typography sx={{
                fontFamily:"'Lora',Georgia,serif", fontWeight:600, color:T.ivory,
                fontSize:{xs:'2.2rem',md:'3rem'}, letterSpacing:'-1px', lineHeight:1.15, mb:1.5,
              }}>
                We'd Love to{' '}
                <Box component="span" sx={{ fontStyle:'italic', color:T.amberMd, fontWeight:400 }}>
                  Hear From You
                </Box>
              </Typography>
              <Typography sx={{ color:'rgba(250,248,244,.55)', fontSize:'0.97rem', maxWidth:480, mx:'auto' }}>
                Have a question or issue? Drop us a message and we'll respond within 24 hours.
              </Typography>
            </Box>
          </Reveal>

          {/* Big form card */}
          <Reveal delay={100}>
            <Box sx={{
              background:'rgba(250,248,244,.04)',
              border:`1px solid rgba(250,248,244,.09)`,
              borderRadius:'24px',
              p:{ xs:4, md:6 },
              backdropFilter:'blur(12px)',
            }}>
              <Grid container spacing={5}>

                {/* LEFT — form fields */}
                <Grid item xs={12} md={7}>
                  <Typography sx={{ fontWeight:700, color:T.ivory, fontSize:'1.1rem', mb:3 }}>
                    Send a Message
                  </Typography>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2.5 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Your Name *" name="name" value={form.name}
                          onChange={onChange} fullWidth size="small" sx={iSx}/>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Email (optional)" name="email" value={form.email}
                          onChange={onChange} fullWidth size="small" sx={iSx} type="email"/>
                      </Grid>
                    </Grid>
                    <TextField label="Your Message *" name="message" value={form.message}
                      onChange={onChange} fullWidth multiline rows={5}
                      placeholder="Describe your question or issue in detail..."
                      size="small" sx={iSx}/>
                    <Box>
                      <Button onClick={onSubmit} disabled={sending}
                        endIcon={<Send sx={{ fontSize:15 }}/>}
                        sx={{
                          px:5, py:1.5, borderRadius:'10px', textTransform:'none',
                          fontWeight:700, fontSize:'0.95rem', fontFamily:"'Outfit',sans-serif",
                          background:T.amberMd, color:T.ink,
                          '&:hover':{ background:'#f59e0b', boxShadow:`0 6px 22px ${T.amberMd}45` },
                          '&:disabled':{ opacity:.5 },
                        }}>
                        {sending ? 'Sending…' : 'Send Message'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>

                {/* RIGHT — contact + social */}
                <Grid item xs={12} md={5}>
                  {/* Vertical divider on md+ */}
                  <Box sx={{
                    pl:{ md:5 }, borderLeft:{ md:`1px solid rgba(250,248,244,.10)` },
                    height:'100%', display:'flex', flexDirection:'column', gap:4,
                  }}>
                    {/* Contact */}
                    <Box>
                      <Typography sx={{ fontSize:'0.67rem', fontWeight:700, letterSpacing:2,
                        color:'rgba(250,248,244,.35)', textTransform:'uppercase', mb:2.5 }}>
                        Contact Details
                      </Typography>
                      {[
                        { icon:<Email sx={{ fontSize:17 }}/>, label:'support@elance.io', sub:'Email support', color:T.amberMd, bg:`${T.amberMd}18` },
                        { icon:<Phone sx={{ fontSize:17 }}/>, label:'+1 (800) ELANCE-1', sub:'Mon–Fri, 9am–6pm', color:'#67e8f9', bg:'rgba(103,232,249,.12)' },
                      ].map((c,i) => (
                        <Box key={i} sx={{
                          display:'flex', alignItems:'center', gap:2, mb:2.5,
                          p:2, borderRadius:'12px',
                          background:`rgba(250,248,244,.04)`,
                          border:`1px solid rgba(250,248,244,.08)`,
                        }}>
                          <Box sx={{
                            width:38, height:38, borderRadius:'10px', flexShrink:0,
                            background:c.bg, color:c.color,
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>{c.icon}</Box>
                          <Box>
                            <Typography sx={{ color:T.ivory, fontSize:'0.9rem', fontWeight:600 }}>{c.label}</Typography>
                            <Typography sx={{ color:'rgba(250,248,244,.40)', fontSize:'0.75rem' }}>{c.sub}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Social */}
                    <Box>
                      <Typography sx={{ fontSize:'0.67rem', fontWeight:700, letterSpacing:2,
                        color:'rgba(250,248,244,.35)', textTransform:'uppercase', mb:2.5 }}>
                        Follow Us
                      </Typography>
                      {[
                        { icon:<LinkedIn sx={{ fontSize:18 }}/>, label:'LinkedIn',    sub:'Connect with us',  href:'https://linkedin.com/company/elance', color:'#0a66c2', bg:'#e8f1fb' },
                        { icon:<Twitter  sx={{ fontSize:18 }}/>, label:'Twitter / X', sub:'Latest updates',   href:'https://twitter.com/elance',           color:'#0ea5e9', bg:'#e0f5fe' },
                        { icon:<Email    sx={{ fontSize:18 }}/>, label:'Email Us',    sub:'Direct mail',       href:'mailto:support@elance.io',              color:T.amberMd, bg:T.amberLt },
                      ].map((s,i) => (
                        <Box key={i} component="a" href={s.href} target="_blank" rel="noopener noreferrer"
                          className="soc"
                          sx={{
                            display:'flex', alignItems:'center', gap:2, mb:1.5,
                            p:1.8, borderRadius:'12px', textDecoration:'none',
                            background:'rgba(250,248,244,.04)',
                            border:`1px solid rgba(250,248,244,.08)`,
                            transition:'all .2s',
                            '&:hover':{ background:'rgba(250,248,244,.09)', borderColor:'rgba(250,248,244,.18)' },
                          }}>
                          <Box sx={{
                            width:36, height:36, borderRadius:'9px', flexShrink:0,
                            background:s.bg, color:s.color,
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>{s.icon}</Box>
                          <Box sx={{ flex:1 }}>
                            <Typography sx={{ color:T.ivory, fontSize:'0.88rem', fontWeight:600 }}>{s.label}</Typography>
                            <Typography sx={{ color:'rgba(250,248,244,.38)', fontSize:'0.73rem' }}>{s.sub}</Typography>
                          </Box>
                          <NorthEast sx={{ fontSize:14, color:'rgba(250,248,244,.25)' }}/>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>

              </Grid>
            </Box>
          </Reveal>
        </Container>
      </Box>



      {/* ══ FOOTER STRIP ══ */}
      <Box sx={{ background:T.ink, py:3, px:2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:2 }}>
            <Typography sx={{ fontFamily:"'Lora',Georgia,serif", fontStyle:'italic',
              color:'rgba(250,248,244,.35)', fontSize:'0.87rem' }}>
              Elance — Where great careers begin.
            </Typography>
            <Typography sx={{ color:'rgba(250,248,244,.22)', fontSize:'0.76rem' }}>
              © {new Date().getFullYear()} Elance. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={5000}
        onClose={() => setSnack(p => ({...p, open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.type} onClose={() => setSnack(p => ({...p, open:false}))}
          sx={{ fontWeight:600, borderRadius:2, fontFamily:"'Outfit',sans-serif" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
