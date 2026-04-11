const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(email, displayName, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Dev fallback — log to console
    console.log(`[EMAIL] Verification code for ${email}: ${code}`);
    return;
  }
  const t = createTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || '"Podwires Community" <noreply@podwires.com>',
    to: email,
    subject: 'Your Podwires Community verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0e2a;color:#fff;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;width:40px;height:40px;background:#4840B0;border-radius:10px;line-height:40px;font-size:20px;">🎙️</div>
          <h2 style="margin:16px 0 4px;font-size:22px;">Verify your email</h2>
          <p style="color:#8e8ca4;margin:0;">Hi ${displayName}, welcome to Podwires Community!</p>
        </div>
        <div style="background:#15142e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#8e8ca4;margin:0 0 12px;font-size:14px;">Your verification code is:</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#fff;">${code}</div>
          <p style="color:#5C5A72;margin:12px 0 0;font-size:12px;">Expires in 15 minutes</p>
        </div>
        <p style="color:#5C5A72;font-size:12px;text-align:center;margin:0;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
