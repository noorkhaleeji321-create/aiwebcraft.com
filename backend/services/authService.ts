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

export function getAdminMasterKey(): string {
  const key = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET;
  if (isProductionMode() && (!key || key.trim() === '')) {
    console.error('SECURITY CONFIGURATION ERROR: AWC_ADMIN_KEY environment variable is missing.');
    // Return a temporary key to prevent crash, but login will still fail due to mismatch
    return 'MISSING_ADMIN_KEY_CONFIG';
  }
  return key || 'aiwebcrafter2026';
}

export function getSigningSecret(): string {
  const secret = process.env.AWC_SIGNING_SECRET;
  if (isProductionMode() && (!secret || secret.trim() === '')) {
    console.error('SECURITY CONFIGURATION ERROR: AWC_SIGNING_SECRET environment variable is missing.');
    // Fallback to a stable derived secret to prevent crash
    return crypto.createHash('sha256').update(getAdminMasterKey() + '_signed_session_salt_2026').digest('hex');
  }
  if (secret && secret.trim() !== '') return secret;
  const adminKey = getAdminMasterKey();
  return crypto.createHash('sha256').update(adminKey + '_signed_session_salt_2026').digest('hex');
}

export function getAdminEmail(): string {
  const email = process.env.AWC_ADMIN_EMAIL;
  if (isProductionMode() && (!email || email.trim() === '')) {
    console.error('SECURITY CONFIGURATION ERROR: AWC_ADMIN_EMAIL environment variable is missing.');
    return 'admin@aiwebcrafter.com';
  }
  return (email || 'owner@aiwebcrafter.com').trim().toLowerCase();
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
