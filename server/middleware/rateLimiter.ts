import { rateLimit } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Strict limiter for authentication (Login, Registration, OTP, Passcode) to block Brute Force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 authentication requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false, default: false },
});

// Limiter for AI interactions (Gemini Chat, AI Audits) to prevent API quota drain
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a minute before trying again.',
    error: 'Too many AI requests. Please wait a minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
});

// Burst limiter to stop automated rapid loops / bot spams in milliseconds/seconds window
export const burstLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds window
  max: 200, // Limit each IP to 200 requests every 10 seconds
  message: {
    success: false,
    message: 'Burst request rate exceeded. Please slow down your automated requests.',
    error: 'Burst request rate exceeded. Please slow down your automated requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
});

// General API limiter to prevent server flooding and DDoS attacks
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Limit each IP to 1000 API requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this device. Please wait a moment before trying again.',
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
});

// Anti-Carding Shield: Blocks IPs/Emails after repeated payment failures
interface CardingRecord {
  failures: number;
  blockedUntil?: number;
}
const ipCardingTracker = new Map<string, CardingRecord>();
const emailCardingTracker = new Map<string, CardingRecord>();

// Clean up stale carding records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipCardingTracker.entries()) {
    if (record.blockedUntil && record.blockedUntil < now) {
      ipCardingTracker.delete(ip);
    }
  }
  for (const [email, record] of emailCardingTracker.entries()) {
    if (record.blockedUntil && record.blockedUntil < now) {
      emailCardingTracker.delete(email);
    }
  }
}, 10 * 60 * 1000);

export const recordFailedPaymentAttempt = (clientIp: string, email?: string) => {
  const now = Date.now();
  const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes block
  const MAX_ALLOWED_FAILURES = 5;

  // Track IP
  const ipRecord = ipCardingTracker.get(clientIp) || { failures: 0 };
  ipRecord.failures += 1;
  if (ipRecord.failures >= MAX_ALLOWED_FAILURES) {
    ipRecord.blockedUntil = now + BLOCK_DURATION;
    console.warn(`[AntiCarding] IP ${clientIp} BLOCKED for 30m due to ${ipRecord.failures} consecutive failed payments.`);
  }
  ipCardingTracker.set(clientIp, ipRecord);

  // Track Email if provided
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const emailRecord = emailCardingTracker.get(cleanEmail) || { failures: 0 };
    emailRecord.failures += 1;
    if (emailRecord.failures >= MAX_ALLOWED_FAILURES) {
      emailRecord.blockedUntil = now + BLOCK_DURATION;
      console.warn(`[AntiCarding] Email ${cleanEmail} BLOCKED for 30m due to ${emailRecord.failures} consecutive failed payments.`);
    }
    emailCardingTracker.set(cleanEmail, emailRecord);
  }
};

export const cardingShieldMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const buyerEmail = (req.body?.buyerEmail || '').trim().toLowerCase();
  const now = Date.now();

  const ipRecord = ipCardingTracker.get(clientIp);
  if (ipRecord?.blockedUntil && ipRecord.blockedUntil > now) {
    const remainingMins = Math.ceil((ipRecord.blockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      error: `Payment operations temporarily blocked for this IP address due to repeated failed attempts (Anti-Carding Security). Please wait ${remainingMins} minutes.`,
      isCardingBlocked: true
    });
  }

  if (buyerEmail) {
    const emailRecord = emailCardingTracker.get(buyerEmail);
    if (emailRecord?.blockedUntil && emailRecord.blockedUntil > now) {
      const remainingMins = Math.ceil((emailRecord.blockedUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `Payment operations temporarily blocked for this account due to repeated failed attempts (Anti-Carding Security). Please wait ${remainingMins} minutes.`,
        isCardingBlocked: true
      });
    }
  }

  // Check Invisible Bot / CAPTCHA proof token in header or body
  const botProofHeader = req.headers['x-bot-proof'] || req.body?.botProofToken;
  if (!botProofHeader && req.path.includes('/create-')) {
    console.warn(`[AntiCarding] Payment attempt on ${req.path} missing bot proof validation header.`);
  }

  next();
};

// Payment specific strict rate limiter (max 5 payment creations per 10 minutes)
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8, // Limit each IP to 8 payment creation requests per 10 minutes
  message: {
    success: false,
    message: 'Payment request limit exceeded. Anti-carding protection engaged. Please wait 10 minutes before trying again.',
    error: 'Payment request limit exceeded. Anti-carding protection engaged.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
});

// Bot Shield & WAF Headers Middleware: Inspects incoming user-agents and injects security headers
export const botShieldMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Set Security & WAF-style Response Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Bot-Protection', 'Active-Shield-v2');

  const userAgent = req.headers['user-agent'] || '';

  // 2. Detect & block known malicious scrapers or suspicious headless scripts without valid User-Agents
  const suspiciousBotPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /gobuster/i,
    /dirbuster/i,
    /w3af/i,
    /python-requests\/0\./i
  ];

  const isKnownMaliciousBot = suspiciousBotPatterns.some((pattern) => pattern.test(userAgent));

  if (isKnownMaliciousBot) {
    console.warn(`[BotShield] Blocked automated malicious crawler/bot on ${req.method} ${req.path} (UA: ${userAgent})`);
    return res.status(403).json({
      success: false,
      error: 'Access denied: Automated security vulnerability scanners and unauthorized bots are restricted.'
    });
  }

  next();
};

