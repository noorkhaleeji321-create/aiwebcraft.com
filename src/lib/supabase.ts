import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'aiwebcrafter_supabase_url';
const STORAGE_ANON_KEY = 'aiwebcrafter_supabase_anon_key';
const STORAGE_SUPER_KEY = 'aiwebcrafter_super_settings';

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // 1. Environment Variables (Vite/Build-time)
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // 2. Direct Supabase Storage keys (User configured from Super Admin UI)
  let storedUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
  let storedKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_ANON_KEY) || '').trim() : '';

  // 3. Fallback to super settings vault in localStorage
  if ((!storedUrl || !storedKey) && typeof window !== 'undefined') {
    try {
      const superSaved = localStorage.getItem(STORAGE_SUPER_KEY);
      if (superSaved) {
        const parsed = JSON.parse(superSaved);
        if (parsed.supabaseUrl) storedUrl = parsed.supabaseUrl.trim();
        if (parsed.supabaseAnonKey) storedKey = parsed.supabaseAnonKey.trim();
      }
    } catch (_) {}
  }

  let url = storedUrl || envUrl;
  let anonKey = storedKey || envKey;

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    let cleanUrl = url.trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (cleanUrl) localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (anonKey) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_ANON_KEY);

    // Flush cache so next getSupabaseClient() uses new creds
    cachedClient = null;
    lastCreds = '';
  }
}

let cachedClient: SupabaseClient | null = null;
let lastCreds = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !isValidHttpUrl(url)) {
    return null;
  }

  const credKey = `${url}::${anonKey}`;
  if (cachedClient && lastCreds === credKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastCreds = credKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    cachedClient = null;
    lastCreds = '';
    return null;
  }
}

export function reloadSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  cachedClient = null;
  lastCreds = '';
  if (url !== undefined && anonKey !== undefined) {
    saveSupabaseCredentials(url, anonKey);
  }
  return getSupabaseClient();
}

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string; url?: string }> {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'No valid Supabase credentials configured. Please provide URL & Anon Key.',
      url: '',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Failed to initialize Supabase client instance.',
      url,
    };
  }

  try {
    // Ping articles or categories or users table
    const { data, error } = await client.from('categories').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, try another query
      if (error.code === '42P01') {
        return {
          success: true,
          message: `Connected to Supabase (${new URL(url).hostname}), but tables need schema setup from /supabase/schema.sql.`,
          url,
        };
      }
      return {
        success: false,
        message: `Supabase returned error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`,
        url,
      };
    }
    return {
      success: true,
      message: `Successfully connected to live Supabase database (${new URL(url).hostname})!`,
      url,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Connection test failed: ${e?.message || 'Network / CORS error'}`,
      url,
    };
  }
}
