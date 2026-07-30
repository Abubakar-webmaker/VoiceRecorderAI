import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@config/env';
import { logger } from '@utils/logger';

interface MailOptions {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
}

const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const sendEmail = async (options: MailOptions): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from:    `"AI Voice Recorder" <${env.EMAIL_FROM ?? 'noreply@aivoicerecorder.com'}>`,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
    text:    options.text ?? '',
  });

  logger.info(`Email sent to: ${options.to} | Subject: ${options.subject}`);
};

// ─── Email Templates ──────────────────────────────────────────────

const baseTemplate = (content: string, accentColor: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #f0f2f5; padding: 24px; }
    .wrapper { max-width: 580px; margin: 0 auto; }
    .card { background: #ffffff; border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: ${accentColor}; padding: 36px 32px; text-align: center; }
    .header h1 { color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .body { padding: 40px 32px; }
    .body h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 16px; }
    .body p { font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 36px; background: ${accentColor};
           color: white; text-decoration: none; border-radius: 10px;
           font-weight: 600; font-size: 16px; margin: 8px 0; }
    .info-box { background: #f7fafc; border-left: 4px solid ${accentColor};
                border-radius: 4px; padding: 16px 20px; margin: 20px 0;
                font-size: 14px; color: #4a5568; }
    .footer { padding: 24px 32px; background: #f7fafc;
              text-align: center; color: #a0aec0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} AI Voice Recorder · All rights reserved</p>
        <p style="margin-top: 6px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (
  email: string,
  name:  string,
  token: string,
): Promise<void> => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  const html = baseTemplate(
    `
    <div class="header">
      <h1>🎙️ AI Voice Recorder</h1>
      <p>Verify your email address</p>
    </div>
    <div class="body">
      <h2>Hello, ${name}! 👋</h2>
      <p>Thank you for creating an account. To get started, please verify your email address by clicking the button below.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <div class="info-box">
        ⏰ This link will expire in <strong>24 hours</strong>.
      </div>
      <p>Or copy this URL into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #6c63ff;">${verifyUrl}</p>
    </div>
    `,
    'linear-gradient(135deg, #6C63FF 0%, #4ECDC4 100%)',
  );

  await sendEmail({
    to:      email,
    subject: '🎙️ Verify your AI Voice Recorder account',
    html,
    text:    `Hello ${name}! Please verify your email: ${verifyUrl}`,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name:  string,
  token: string,
): Promise<void> => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  const html = baseTemplate(
    `
    <div class="header">
      <h1>🔐 Password Reset</h1>
      <p>AI Voice Recorder</p>
    </div>
    <div class="body">
      <h2>Reset your password</h2>
      <p>Hi <strong>${name}</strong>, we received a request to reset your password.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <div class="info-box">
        ⚠️ This link expires in <strong>1 hour</strong>. For security, this link can only be used once.
      </div>
      <p>If you did not request a password reset, please ignore this email — your password will remain unchanged.</p>
    </div>
    `,
    'linear-gradient(135deg, #FF6584 0%, #FF8E53 100%)',
  );

  await sendEmail({
    to:      email,
    subject: '🔐 Reset your AI Voice Recorder password',
    html,
    text:    `Hello ${name}! Reset your password here: ${resetUrl} (expires in 1 hour)`,
  });
};