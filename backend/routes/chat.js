// backend/routes/chat.js
// app.js mein: app.use('/api/chat', require('./routes/chat'));
// .env mein: GROQ_API_KEY=gsk_xxxxxxxx

const express = require('express');
const router  = express.Router();

const SYSTEM_PROMPT = `You are Sam, a friendly and expert career assistant for Elance — an AI-powered recruitment platform.
Help job seekers with:
- Resume writing, improvement, formatting tips
- Interview preparation, common questions, answers  
- Career growth strategies and roadmaps
- Job search advice and application tips
- Salary negotiation tactics
- Skill development and learning paths
- Career transitions and pivots
Keep responses concise, practical, warm, and encouraging.
Use bullet points for lists. Be specific and actionable.`;

router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ reply: 'Please send a message.' });
    }

    const msgs = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || m.text || ''),
      })),
      { role: 'user', content: message.trim() },
    ];

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // ── No key configured ──────────────────────────────────────────────────
    if (!groqKey && !openaiKey) {
      console.error('ERROR: No AI API key set in .env!');
      return res.json({
        reply: '⚠️ AI not configured. Please add GROQ_API_KEY=gsk_xxx to your backend .env file and restart server.',
      });
    }

    // ── Try Groq first ─────────────────────────────────────────────────────
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: msgs,
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (!groqRes.ok) {
          const errBody = await groqRes.text().catch(() => '');
          console.error(`Groq error ${groqRes.status}:`, errBody);
          throw new Error(`Groq ${groqRes.status}: ${errBody}`);
        }

        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content;
        if (!reply) throw new Error('Empty Groq response');
        return res.json({ reply });

      } catch (e) {
        console.error('Groq failed:', e.message);
        if (!openaiKey) {
          return res.json({ reply: 'AI service temporarily unavailable. Please try again shortly.' });
        }
      }
    }

    // ── Fallback to OpenAI ─────────────────────────────────────────────────
    if (openaiKey) {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: msgs,
          max_tokens: 800,
        }),
      });

      if (!oRes.ok) throw new Error(`OpenAI ${oRes.status}`);
      const oData = await oRes.json();
      const reply = oData.choices?.[0]?.message?.content;
      return res.json({ reply: reply || 'No response generated.' });
    }

  } catch (err) {
    console.error('Chat route error:', err.message);
    res.json({ reply: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
