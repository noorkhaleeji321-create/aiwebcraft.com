import { Router, Request, Response } from 'express';
import { GuardBot } from '../../services/guardBotService.js';
import { otpStore, getEmailTransporter } from '../config.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// 1. Send OTP Email via Nodemailer SMTP with strict auth limiter
router.post('/api/auth/send-otp', authLimiter, async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!GuardBot.isRegistrationSafe({ email, userAgent: req.headers['user-agent'] || '', ip: req.ip || '' })) {
    return res.status(403).json({ success: false, error: 'Registration blocked' });
  }

  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const now = Date.now();
    const existingOtp = otpStore.get(email.toLowerCase().trim());
    if (existingOtp && existingOtp.expiresAt > now && (existingOtp.attempts || 0) > 3) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase().trim(), { code: otpCode, expiresAt, attempts: (existingOtp?.attempts || 0) + 1 });

    const transporter = getEmailTransporter();
    if (!transporter) {
      console.warn('[OTP] EMAIL_USER or EMAIL_PASS is not set in environment variables.');
      return res.json({ 
        success: true, 
        message: 'Verification code generated. Notice: Please configure EMAIL_USER and EMAIL_PASS in environment variables for live email delivery.',
        devCode: otpCode 
      });
    }

    const mailOptions = {
      from: `"AI WebCrafter Security" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: '🔒 Your AI WebCrafter Security Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2ddd3; border-radius: 16px; background-color: #fdfcf9;">
          <h2 style="color: #2c2a26; text-align: center; font-family: serif;">AI WebCrafter Security</h2>
          <p style="color: #5d5a53; font-size: 16px;">Hello,</p>
          <p style="color: #5d5a53; font-size: 16px;">You requested to sign in or authenticate your account on AI WebCrafter. Your 6-digit security verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 40px; font-family: monospace; font-weight: bold; background: #2c2a26; color: #f5f2eb; padding: 14px 28px; border-radius: 12px; letter-spacing: 8px; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #8c8275; font-size: 13px; text-align: center;">Valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Successfully sent OTP to ${email}`);
    } catch (smtpErr: any) {
      console.warn(`[SMTP Warning] Gmail sendMail failed for ${email}. Please check SMTP credentials.`);
    }

    return res.json({ success: true, message: 'OTP verification code sent to your email successfully.' });
  } catch (error: any) {
    console.error('[SMTP Error] Failed to send email:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to send email via SMTP.' });
  }
});

// 2. Verify OTP Code
router.post('/api/auth/verify-otp', authLimiter, (req: Request, res: Response): any => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ success: false, error: 'No verification code found for this email. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
    }

    if (record.code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    otpStore.delete(normalizedEmail);
    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error: any) {
    console.error('[Verify OTP Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
