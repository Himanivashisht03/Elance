// backend/utils/sendInterviewEmail.js
const nodemailer = require('nodemailer');

const sendInterviewEmail = async ({ toEmail, candidateName, role, date, time, iType, link, notes, group, recruiterName, companyName }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing in .env');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const dateStr = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const groupLine = group ? `<p><strong>👥 Group:</strong> Group ${group}</p>` : '';
  const linkLine  = link  ? `<p><strong>🔗 Meeting Link:</strong> <a href="${link}">${link}</a></p>` : '';
  const notesLine = notes ? `<p><strong>📝 Notes:</strong> ${notes}</p>` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #1a2f4e, #163d5e); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">🎯 Interview Invitation</h1>
        <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 14px;">${companyName || 'Elance Portal'}</p>
      </div>

      <div style="background: #fff; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
        <p style="font-size: 16px; color: #0f172a;">Hi <strong>${candidateName}</strong> 👋,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You have been shortlisted for an interview. Please find the details below:
        </p>

        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>📋 Role:</strong> ${role}</p>
          <p style="margin: 0 0 10px;"><strong>📅 Date:</strong> ${dateStr}</p>
          <p style="margin: 0 0 10px;"><strong>🕐 Time:</strong> ${time}</p>
          <p style="margin: 0 0 10px;"><strong>🎙️ Interview Type:</strong> ${iType}</p>
          ${groupLine}
          ${linkLine}
          ${notesLine}
        </div>

        <p style="color: #475569; font-size: 14px;">
          Please reply to this email to confirm your availability or reach out if you have any questions.
        </p>

        <p style="color: #0f172a; font-size: 14px; margin-top: 24px;">
          Best regards,<br/>
          <strong>${recruiterName}</strong><br/>
          <span style="color: #64748b;">${companyName || ''}</span>
        </p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        This is an automated message from Elance Portal. © ${new Date().getFullYear()} Elance Portal.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${companyName || 'Elance Portal'}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Interview Invitation – ${role} at ${companyName || 'Elance Portal'}`,
    html,
  });
};

module.exports = sendInterviewEmail;
