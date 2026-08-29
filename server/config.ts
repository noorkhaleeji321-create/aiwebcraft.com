import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

if (!process.env.ADMIN_SECRET_KEY) {
  console.warn('[Security Notice] ADMIN_SECRET_KEY environment variable is not explicitly set. System will verify admin credentials via encrypted Supabase storage or runtime configuration.');
}
export const ADMIN_SECRET_KEY = 
  process.env.ADMIN_SECRET_KEY || 
  process.env.ADMIN_PASSCODE || 
  process.env.ADMIN_KEY || 
  '';
export const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Encryption helpers
const IV_LENGTH = 16;

const getKeyBuffer = () => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    // Fallback key for missing ENCRYPTION_KEY
    return crypto.createHash('sha256').update(secret || 'aiwebcrafter-secure-encryption-key-32bytes').digest();
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encrypt = (text: string) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getKeyBuffer(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (e: any) {
    console.error('Encryption error:', e);
    throw new Error('Failed to encrypt data safely.');
  }
};

export const decrypt = (text: string) => {
  try {
    if (!text || typeof text !== 'string') return '';
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      return text;
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKeyBuffer(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e: any) {
    console.warn('Decryption error caught (returning fallback text):', e?.message || e);
    return text;
  }
};

export const getEmailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.warn('EMAIL_USER or EMAIL_PASS not set in environment variables.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '')
    }
  });
};

// Initialize Supabase Server Client safely
export const getServerSupabase = () => {
  const rawServerUrl = 
    process.env.SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.PUBLIC_SUPABASE_URL;

  const supabaseUrl = (rawServerUrl && typeof rawServerUrl === 'string' && rawServerUrl.startsWith('http') && !rawServerUrl.includes('test'))
    ? rawServerUrl.trim()
    : null;

  const rawServerKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.PUBLIC_SUPABASE_ANON_KEY;

  const supabaseKey = (rawServerKey && typeof rawServerKey === 'string' && rawServerKey.length > 20 && !rawServerKey.includes('test'))
    ? rawServerKey.trim()
    : null;

  if (supabaseUrl && supabaseKey) {
    try {
      return createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.warn('Warning: Could not initialize serverSupabase client:', e);
      return null;
    }
  }
  return null;
};

export const serverSupabase = getServerSupabase();

// Lazy initialize Gemini Client
export const getAiClient = () => {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.VITE_GEMINI_API_KEY || 
    process.env.VITE_PUBLIC_GEMINI_API_KEY || 
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Gemini features will be limited.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};
