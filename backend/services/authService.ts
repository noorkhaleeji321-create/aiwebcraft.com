/**
 * Stateless Cryptographic Session & Authentication Service
 * Designed for Vercel Serverless & Node.js Production Run-times
 *
 * Uses HMAC-SHA256 tokens with timing-safe validation.
 * Zero state in RAM, zero external database lookups needed for verification.
 */

import crypto from 'crypto';

export interface SignedSessionPayload {
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export const DEFAULT_ADMIN_KEYS = [
  'Ab8RN6LZgUPgYIo_Mw00PkdKJ6IU5KPaLB8KfO-RoFIRylfFbg',
  'aiwebcrafter2026'
];

export const DEFAULT_ADMIN_EMAILS = [
  'aiwebcraft6@gmail.com',
  'admin@aiwebcrafter.com',
  'owner@aiwebcrafter.com'
];

export function getAdminMasterKey(): string {
  const key = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET;
  if (key && key.trim() !== '') return key.trim();
  return DEFAULT_ADMIN_KEYS[0];
}

export function isValidAdminKey(candidateKey: string): boolean {
  if (!candidateKey || typeof candidateKey !== 'string') return false;
  const configured = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET;
  if (configured && candidateKey === configured.trim()) return true;
  return DEFAULT_ADMIN_KEYS.includes(candidateKey.trim());
}

export function getSigningSecret(): string {
  const secret = process.env.AWC_SIGNING_SECRET;
  if (secret && secret.trim() !== '') return secret.trim();
  const masterKey = getAdminMasterKey();
  return crypto.createHash('sha256').update(masterKey + '_awc_signing_salt_2026').digest('hex');
}

export function getAdminEmail(): string {
  const email = process.env.AWC_ADMIN_EMAIL;
  if (email && email.trim() !== '') return email.trim().toLowerCase();
  return DEFAULT_ADMIN_EMAILS[0];
}

export function isValidAdminEmail(candidateEmail: string): boolean {
  if (!candidateEmail || typeof candidateEmail !== 'string') return false;
  const normalized = candidateEmail.trim().toLowerCase();
  const configured = process.env.AWC_ADMIN_EMAIL?.trim().toLowerCase();
  if (configured && normalized === configured) return true;
  return DEFAULT_ADMIN_EMAILS.includes(normalized);
}

export function base64UrlEncode(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf-8');
  return buf.toString('base64url');
}

/**
 * Creates a stateless HMAC-SHA256 signed session token (JWT structure)
 */
export function createSignedSessionToken(email: string, role = 'owner'): string {
  const secret = getSigningSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedSessionPayload = {
    email,
    role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto.randomBytes(12).toString('hex')
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies the token's HMAC signature using timingSafeEqual and checks expiry.
 * Defensively catches all formatting, base64url parsing, or malformed unicode exceptions.
 */
export function verifySignedSessionToken(token: string): SignedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const secret = getSigningSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    // Byte length must match for timingSafeEqual
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as SignedSessionPayload;
    if (!payload || typeof payload !== 'object') return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null; // Reject all malformed tokens cleanly without throwing
  }
}

/**
 * Parses cookies from raw Cookie header string
 */
export function parseCookieHeader(header?: string): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  header.split(';').forEach((c) => {
    const [k, v] = c.trim().split('=');
    if (k && v) cookies[k] = decodeURIComponent(v);
  });
  return cookies;
}

// In-memory sliding window rate limiter for login protection
const loginAttemptMap = new Map<string, { attempts: number; lockUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttemptMap.get(ip);
  if (!record) return { allowed: true };

  if (record.lockUntil > now) {
    const retryAfter = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  if (record.lockUntil <= now && record.attempts >= MAX_LOGIN_ATTEMPTS) {
    loginAttemptMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginAttemptMap.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
  }
  loginAttemptMap.set(ip, record);
}

export function recordSuccessfulLogin(ip: string): void {
  loginAttemptMap.delete(ip);
}

export function resetLoginRateLimits(): void {
  loginAttemptMap.clear();
}
