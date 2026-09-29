import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'aiwebcrafter_supabase_url';
const STORAGE_ANON_KEY = 'aiwebcrafter_supabase_anon_key';
const STORAGE_SUPER_KEY = 'aiwebcrafter_super_settings';

export function sanitizeSupabaseUrl(input: string): string {
  if (!input) return '';
  let url = input.trim();

  // Strip wrapping quotes
  url = url.replace(/^['"`]+|['"`]+$/g, '').trim();

  // Strip environment variable prefixes if accidentally pasted
  url = url.replace(/^(?:VITE_SUPABASE_URL|SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL|URL)\s*[:=]\s*/i, '').trim();
  url = url.replace(/^['"`]+|['"`]+$/g, '').trim();

  // Extract project ref if pasted from Supabase Dashboard URL (e.g. https://supabase.com/dashboard/project/abcdefghijk)
  const dashMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashMatch) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  // Extract project ref if pasted from PostgreSQL connection string
  // (e.g. postgresql://postgres.abcdefghijk:password@... or @db.abcdefghijk.supabase.co)
  const dbMatch = url.match(/@(?:db\.)?([a-z0-9_-]+)\.supabase\.co/i) || url.match(/postgres\.([a-z0-9_-]+):/i);
  if (dbMatch) {
    return `https://${dbMatch[1]}.supabase.co`;
  }

  // If user pasted just the project reference code (e.g. "abcxyz123456")
  if (/^[a-z0-9_-]{12,35}$/i.test(url) && !url.includes('.')) {
    return `https://${url.toLowerCase()}.supabase.co`;
  }

  // Add protocol if missing
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  return url;
}

export function sanitizeSupabaseAnonKey(input: string): string {
  if (!input) return '';
  let key = input.trim();

  // Strip wrapping quotes
  key = key.replace(/^['"`]+|['"`]+$/g, '').trim();

  // Strip variable name prefixes if pasted from .env files
  key = key.replace(/^(?:VITE_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|ANON_KEY|SUPABASE_KEY|KEY)\s*[:=]\s*/i, '').trim();
  key = key.replace(/^['"`]+|['"`]+$/g, '').trim();

  // Remove interior whitespace or line breaks
  key = key.replace(/\s+/g, '');

  return key;
}

export function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // 1. Direct Supabase Storage keys (User configured in UI)
  let storedUrl = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
  let storedKey = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_ANON_KEY) || '').trim() : '';

  // 2. Fallback to super settings vault in localStorage
  if ((!storedUrl || !storedKey) && typeof window !== 'undefined') {
    try {
      const superSaved = localStorage.getItem(STORAGE_SUPER_KEY);
      if (superSaved) {
        const parsed = JSON.parse(superSaved);
        if (parsed.supabaseUrl && !storedUrl) storedUrl = parsed.supabaseUrl.trim();
        if (parsed.supabaseAnonKey && !storedKey) storedKey = parsed.supabaseAnonKey.trim();
      }
    } catch (_) {}
  }

  // 3. Environment Variables (Vite/Build-time) fallback
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const rawUrl = storedUrl || envUrl;
  const rawKey = storedKey || envKey;

  const url = sanitizeSupabaseUrl(rawUrl);
  const anonKey = sanitizeSupabaseAnonKey(rawKey);

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = sanitizeSupabaseUrl(url);
    const cleanKey = sanitizeSupabaseAnonKey(anonKey);

    if (cleanUrl) localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (cleanKey) localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    else localStorage.removeItem(STORAGE_ANON_KEY);

    // Also keep super_settings in sync if it exists
    try {
      const superSaved = localStorage.getItem(STORAGE_SUPER_KEY);
      if (superSaved) {
        const parsed = JSON.parse(superSaved);
        parsed.supabaseUrl = cleanUrl;
        parsed.supabaseAnonKey = cleanKey;
        localStorage.setItem(STORAGE_SUPER_KEY, JSON.stringify(parsed));
      }
    } catch (_) {}

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

export interface SupabaseDiagnosticResult {
  hasUrl: boolean;
  hasKey: boolean;
  isUrlValid: boolean;
  isKeyFormatValid: boolean;
  url: string;
  anonKey: string;
  clientReady: boolean;
  message: string;
}

export function getSupabaseDiagnostics(): SupabaseDiagnosticResult {
  const { url, anonKey } = getSupabaseCredentials();
  const hasUrl = Boolean(url && url.length > 0);
  const hasKey = Boolean(anonKey && anonKey.length > 0);
  const isUrlValid = Boolean(hasUrl && isValidHttpUrl(url));
  const isKeyFormatValid = Boolean(hasKey && (anonKey.startsWith('eyJ') || anonKey.startsWith('sbp_') || anonKey.startsWith('sb_') || anonKey.length > 25));
  const client = getSupabaseClient();

  let message = 'Supabase client is configured and ready.';
  if (!hasUrl && !hasKey) {
    message = 'Supabase Project URL and Anon Key are missing.';
  } else if (!hasUrl) {
    message = 'Supabase Project URL is missing.';
  } else if (!isUrlValid) {
    message = 'Supabase Project URL is not a valid HTTP/HTTPS URL.';
  } else if (!hasKey) {
    message = 'Supabase Anon Key is missing.';
  } else if (!client) {
    message = 'Failed to construct Supabase client with current credentials.';
  }

  return {
    hasUrl,
    hasKey,
    isUrlValid,
    isKeyFormatValid,
    url,
    anonKey,
    clientReady: Boolean(client),
    message
  };
}

export async function checkSupabaseConnection(): Promise<{ success: boolean; message: string; url?: string; code?: string; schemaNeeded?: boolean }> {
  const diag = getSupabaseDiagnostics();

  if (!diag.hasUrl || !diag.hasKey) {
    return {
      success: false,
      message: 'لم يتم العثور على بيانات Supabase. يرجى إدخال الرابط (Project URL) ومفتاح (Anon Key).',
      url: diag.url,
      code: 'NO_CREDENTIALS',
    };
  }

  if (!diag.isUrlValid) {
    return {
      success: false,
      message: `رابط Supabase غير صالح: "${diag.url}". يجب أن يكون بالشكل https://your-id.supabase.co`,
      url: diag.url,
      code: 'INVALID_URL',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'تعذر إنشاء عميل Supabase. يرجى التأكد من صحة المفتاح والرابط.',
      url: diag.url,
      code: 'CLIENT_INIT_FAILED',
    };
  }

  try {
    // Ping categories or articles or users table
    const { data, error } = await client.from('categories').select('id').limit(1);
    
    if (error) {
      // 42P01 = table does not exist yet (Database is alive and connected, but schema is not executed)
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        let hostName = diag.url;
        try { hostName = new URL(diag.url).hostname; } catch (_) {}
        return {
          success: true,
          schemaNeeded: true,
          message: `تم الاتصال بنجاح بـ Supabase (${hostName})! قاعدة البيانات نشطة ولكن يلزم تشغيل ملف SQL لإنشاء الجداول.`,
          url: diag.url,
          code: 'SCHEMA_NEEDED',
        };
      }

      // Invalid API key / Auth error
      if (error.code === 'PGRST301' || error.code === '401' || error.message.includes('JWT') || error.message.includes('apikey')) {
        return {
          success: false,
          message: `مفتاح Anon Key غير صالح أو منتهي الصلاحية: ${error.message}`,
          url: diag.url,
          code: 'INVALID_KEY',
        };
      }

      return {
        success: false,
        message: `استجابت Supabase بالخطأ: ${error.message} (رمز الخطأ: ${error.code || 'UNKNOWN'})`,
        url: diag.url,
        code: error.code || 'SUPABASE_ERROR',
      };
    }

    let hostName = diag.url;
    try { hostName = new URL(diag.url).hostname; } catch (_) {}

    return {
      success: true,
      message: `تم الاتصال بنجاح بقاعدة بيانات Supabase المباشرة (${hostName})! الجداول جاهزة.`,
      url: diag.url,
      code: 'OK',
    };
  } catch (e: any) {
    return {
      success: false,
      message: `تعذر الاتصال بـ Supabase (${e?.message || 'خطأ في الشبكة أو CORS'}). يرجى التأكد من الرابط.`,
      url: diag.url,
      code: 'NETWORK_ERROR',
    };
  }
}
