// backend/routes/email.js
// POST /api/email/send  — recruiter se candidate ko email bhejo
const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');
const auth       = require('../middleware/auth');

function makeTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/* ── POST /api/email/send ── */
router.post('/send', auth, async (req, res) => {
  const { to, subject, body, candidateName, jobTitle } = req.body;

  if (!to) return res.status(400).json({ message: 'Recipient email (to) is required' });

  const emailSubject = subject || `Regarding your application for ${jobTitle || 'the position'}`;
  const emailBody    = body    || `Hi ${candidateName || 'there'},\n\nThank you for your application.\n\nBest regards,\n${req.user?.username || 'The Recruitment Team'}`;

  // If EMAIL_USER not configured → return mailto fallback URL
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    return res.json({ sent: false, fallback: true, mailtoUrl, message: 'Email config missing — use mailto fallback' });
  }

  try {
    const transporter = makeTransporter();
    await transporter.sendMail({
      from:    `"ELance Recruiter" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailSubject,
      text:    emailBody,
      html:    `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${emailBody.replace(/\n/g,'<br/>')}</pre>`,
    });
    res.json({ sent: true, to });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Return mailto fallback
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    res.json({ sent: false, fallback: true, mailtoUrl, error: err.message });
  }
});

/* ── POST /api/email/interview ── */
// Schedule page se interview email batch send
router.post('/interview', auth, async (req, res) => {
  const { slots } = req.body; // [{to, candidateName, role, date, time, iType, link, notes, group}]

  if (!Array.isArray(slots) || !slots.length)
    return res.status(400).json({ message: 'slots array required' });

  const results = { sent: 0, failed: 0, fallbacks: [] };

  for (const slot of slots) {
    const { to, candidateName, role, date, time, iType, link, notes, group } = slot;
    if (!to) { results.failed++; continue; }

    const dateStr = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    }) : date;

    const subject = `Interview Invitation — ${role} at ELance`;
    const body = [
      `Hi ${candidateName} 👋`,
      ``,
      `You have been invited for an interview!`,
      ``,
      `📋 Role: ${role}`,
      `📅 Date: ${dateStr}`,
      `🕐 Time: ${time}${group ? ` (Group ${group})` : ''}`,
      `🎙️ Type: ${iType}`,
      link   ? `🔗 Link/Venue: ${link}`  : '',
      notes  ? `📝 Notes: ${notes}`      : '',
      ``,
      `Please reply to confirm your attendance.`,
      ``,
      `Best regards,`,
      `${req.user?.username || 'Recruitment Team'} — ELance`,
    ].filter(Boolean).join('\n');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      results.fallbacks.push({ to, mailtoUrl });
      results.failed++;
      continue;
    }

    try {
      const transporter = makeTransporter();
      await transporter.sendMail({
        from:    `"ELance Recruiter" <${process.env.EMAIL_USER}>`,
        to, subject,
        text:    body,
        html:    `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7">${body.replace(/\n/g,'<br/>')}</pre>`,
      });
      results.sent++;
    } catch (err) {
      console.error(`Email failed for ${to}:`, err.message);
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      results.fallbacks.push({ to, mailtoUrl });
      results.failed++;
    }
  }

  res.json(results);
});

module.exports = router;
