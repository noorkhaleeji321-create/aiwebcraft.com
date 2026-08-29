import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  // 1. Try Node.js process.env first (safe check for server environment)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    const viteKey = `VITE_${key}`;
    if (process.env[viteKey]) return process.env[viteKey];
  }
  
  // 2. Try Vite's import.meta.env (for browser environment)
  try {
    // @ts-ignore
    const metaEnv = import.meta.env;
    if (metaEnv) {
      if (metaEnv[key]) return metaEnv[key];
      const viteKey = `VITE_${key}`;
      if (metaEnv[viteKey]) return metaEnv[viteKey];
    }
  } catch {
    // Fail silently in environments where import.meta is not defined
  }

  return undefined;
};

const rawUrl = getEnv('SUPABASE_URL');
const supabaseUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) 
  ? rawUrl.trim() 
  : 'https://placeholder-project.supabase.co';

const rawKey = getEnv('SUPABASE_ANON_KEY');
const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.length > 20)
  ? rawKey.trim()
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIn0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

