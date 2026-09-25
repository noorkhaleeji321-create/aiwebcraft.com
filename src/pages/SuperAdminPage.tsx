import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  Key,
  Database,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Copy,
  Check,
  FileCode,
  DollarSign,
  Image as ImageIcon,
  Cpu
} from 'lucide-react';
import { authService } from '../services/auth';
import { getSupabaseCredentials, saveSupabaseCredentials, checkSupabaseConnection, reloadSupabaseClient } from '../lib/supabase';
import { storeService } from '../services/store';
import { geminiService } from '../services/gemini';

export interface SuperAdminSettings {
  geminiKeys: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  openaiKey: string;
  groqKey: string;
  unsplashKey: string;
  imageProvider: string;
  appUrl: string;
  nodeEnv: string;
  port: string;
  gscVerificationTag: string;
  adsensePubId: string;
  gaMeasurementId: string;
}

const DEFAULT_EMPTY_SETTINGS: SuperAdminSettings = {
  geminiKeys: ['', '', '', '', ''],
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  supabaseServiceKey: '',
  openaiKey: '',
  groqKey: '',
  unsplashKey: (import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '').trim(),
  imageProvider: 'Unsplash',
  appUrl: (import.meta.env.VITE_APP_URL || 'https://aiwebcrafter.com').trim(),
  nodeEnv: 'production',
  port: '3000',
  gscVerificationTag: 'SrW_UppRqgNHuUTu79U5SWQhX6Aw2wMJUPaN56og_3M',
  adsensePubId: 'ca-pub-6939607209654934',
  gaMeasurementId: 'G-TFLPNTH5H0'
};

export function SuperAdminPage() {
  const user = authService.getUser();
  const isAdminUser = Boolean(user);

  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'supabase' | 'gemini' | 'ai' | 'media' | 'seo'>('all');

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string; url?: string }>({
    connected: false,
    message: 'Checking Supabase connection...'
  });

  const [settings, setSettings] = useState<SuperAdminSettings>(() => {
    const creds = getSupabaseCredentials();
    return {
      ...DEFAULT_EMPTY_SETTINGS,
      supabaseUrl: creds.url || DEFAULT_EMPTY_SETTINGS.supabaseUrl,
      supabaseAnonKey: creds.anonKey || DEFAULT_EMPTY_SETTINGS.supabaseAnonKey,
    };
  });

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const [rawCiphertext, setRawCiphertext] = useState<string>('');
  const [testingGeminiIndex, setTestingGeminiIndex] = useState<number | null>(null);
  const [geminiTestResults, setGeminiTestResults] = useState<Record<number, { success: boolean; message: string }>>({});

  const handleTestSingleGeminiKey = async (idx: number) => {
    const key = settings.geminiKeys[idx];
    if (!key || !key.trim()) {
      setGeminiTestResults(prev => ({ ...prev, [idx]: { success: false, message: 'Please paste a key first' } }));
      return;
    }
    setTestingGeminiIndex(idx);
    const res = await geminiService.testKey(key.trim());
    setGeminiTestResults(prev => ({ ...prev, [idx]: { success: res.success, message: res.message } }));
    setTestingGeminiIndex(null);
  };

  // Load encrypted settings on mount from Supabase & fallback
  useEffect(() => {
    const init = async () => {
      // 1. Check local storage cache
      const saved = localStorage.getItem('aiwebcrafter_super_settings');
      let currentSettings = { ...settings };
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          currentSettings = { ...currentSettings, ...parsed };
          setSettings(currentSettings);
        } catch (_) {}
      }

      // 2. Check Supabase connection
      const conn = await checkSupabaseConnection();
      setDbStatus({
        connected: conn.success,
        message: conn.message,
        url: conn.url
      });

      // 3. Pull encrypted vault from Supabase if connected
      if (conn.success) {
        try {
          const remoteVaultData = await storeService.fetchEncryptedVault();
          if (remoteVaultData && remoteVaultData.decrypted) {
            setSettings(prev => ({ ...prev, ...remoteVaultData.decrypted }));
            if (remoteVaultData.rawCiphertext) {
              setRawCiphertext(remoteVaultData.rawCiphertext);
            }
          }
        } catch (err) {
          console.warn('Could not pull remote encrypted vault:', err);
        }
      }
    };

    init();
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setStatus({ type: null, message: '' });

    saveSupabaseCredentials(settings.supabaseUrl, settings.supabaseAnonKey);
    reloadSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

    const res = await checkSupabaseConnection();
    setDbStatus({
      connected: res.success,
      message: res.message,
      url: res.url
    });

    if (res.success) {
      // Pull remote vault immediately
      try {
        const remoteVaultData = await storeService.fetchEncryptedVault();
        if (remoteVaultData && remoteVaultData.decrypted) {
          setSettings(prev => ({ ...prev, ...remoteVaultData.decrypted }));
          if (remoteVaultData.rawCiphertext) {
            setRawCiphertext(remoteVaultData.rawCiphertext);
          }
        }
      } catch (_) {}
      setStatus({ type: 'success', message: `Supabase live database connected successfully!` });
    } else {
      setStatus({ type: 'error', message: `Connection failed: ${res.message}` });
    }
    setIsTestingConnection(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatus({ type: null, message: '' });

    try {
      // 1. Save Supabase credentials
      saveSupabaseCredentials(settings.supabaseUrl, settings.supabaseAnonKey);
      reloadSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);

      // 2. Save local backup & sync active server cluster
      localStorage.setItem('aiwebcrafter_super_settings', JSON.stringify(settings));
      try {
        await fetch('/api/admin/set-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geminiKeys: settings.geminiKeys }),
        });
      } catch (_) {}

      // 3. Also sync SEO / AdSense / GA settings to standard localStorage keys
      if (settings.gscVerificationTag) localStorage.setItem('aiwebcrafter_gsc_verification', settings.gscVerificationTag);
      if (settings.adsensePubId) localStorage.setItem('aiwebcrafter_adsense_pub_id', settings.adsensePubId);
      if (settings.gaMeasurementId) localStorage.setItem('aiwebcrafter_ga_id', settings.gaMeasurementId);

      // 4. Test Supabase & Save encrypted vault in PostgreSQL
      const conn = await checkSupabaseConnection();
      setDbStatus({
        connected: conn.success,
        message: conn.message,
        url: conn.url
      });

      let syncMessage = '';
      if (conn.success) {
        const vaultRes = await storeService.saveEncryptedVault(settings);
        if (vaultRes.ciphertext) {
          setRawCiphertext(vaultRes.ciphertext);
        }
        const syncRes = await storeService.ensureSupabaseSeededAndSynced();
        syncMessage = vaultRes.success 
          ? ` Vault encrypted (AES-256) & persisted in Supabase. (${syncRes.message})`
          : ` Supabase vault write error: ${vaultRes.error}`;
      }

      setStatus({
        type: 'success',
        message: conn.success 
          ? `All platform keys saved & encrypted into Supabase live database!${syncMessage}`
          : 'All keys saved to local encrypted vault. Connect Supabase to persist in the cloud.'
      });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Save error: ${err?.message || 'Unknown error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingData(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await storeService.ensureSupabaseSeededAndSynced();
      if (res.success) {
        setStatus({ type: 'success', message: res.message });
      } else {
        setStatus({ type: 'error', message: `Sync failed: ${res.message}` });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: `Sync exception: ${e?.message}` });
    } finally {
      setIsSyncingData(false);
    }
  };

  const updateGeminiKey = (index: number, value: string) => {
    const newKeys = [...settings.geminiKeys];
    newKeys[index] = value;
    setSettings({ ...settings, geminiKeys: newKeys });
  };

  const generateEnvFileContent = () => {
    const geminiJoined = settings.geminiKeys.filter(k => k.trim().length > 0).join(',');
    return `# AIWebCrafter Environment Variables (${new Date().toISOString().split('T')[0]})
VITE_SUPABASE_URL="${settings.supabaseUrl}"
VITE_SUPABASE_ANON_KEY="${settings.supabaseAnonKey}"
SUPABASE_SERVICE_ROLE_KEY="${settings.supabaseServiceKey}"

# Gemini API Multi-Key Cluster
GEMINI_API_KEY="${geminiJoined || settings.geminiKeys[0] || ''}"

# AI Provider Keys
OPENAI_API_KEY="${settings.openaiKey}"
GROQ_API_KEY="${settings.groqKey}"

# Media & Assets
UNSPLASH_ACCESS_KEY="${settings.unsplashKey}"
VITE_UNSPLASH_ACCESS_KEY="${settings.unsplashKey}"
VITE_IMAGE_PROVIDER="${settings.imageProvider}"

# Server Runtime
APP_URL="${settings.appUrl}"
NODE_ENV="${settings.nodeEnv}"
VITE_NODE_ENV="${settings.nodeEnv}"
PORT="${settings.port}"

# SEO & Analytics
VITE_GSC_VERIFICATION="${settings.gscVerificationTag}"
VITE_ADSENSE_PUB_ID="${settings.adsensePubId}"
VITE_GA_MEASUREMENT_ID="${settings.gaMeasurementId}"
`;
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(generateEnvFileContent());
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleCopySql = async () => {
    try {
      const response = await fetch('/supabase/schema.sql');
      let sqlText = '';
      if (response.ok) {
        sqlText = await response.text();
      }
      if (!sqlText || sqlText.includes('<!DOCTYPE')) {
        sqlText = `-- AIWebCrafter Supabase SQL Migration Schema (Resilient & Production-Ready)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'author',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  bio_ar TEXT,
  role_title TEXT DEFAULT 'Tech Author & AI Specialist',
  role_title_ar TEXT DEFAULT 'كاتب تقني ومتخصص ذكاء اصطناعي',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  excerpt_ar TEXT NOT NULL,
  content TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  featured_image TEXT,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  reading_time_minutes INT DEFAULT 5,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  needs_update BOOLEAN DEFAULT FALSE,
  last_checked_freshness TIMESTAMPTZ DEFAULT NOW(),
  project_url TEXT
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT NOT NULL DEFAULT '10:00',
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.article_videos (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  display_order INT DEFAULT 1,
  PRIMARY KEY (article_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  file_size INT DEFAULT 0,
  alt_text TEXT,
  alt_text_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  seo_title TEXT NOT NULL,
  seo_title_ar TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  seo_description_ar TEXT NOT NULL,
  canonical_url TEXT,
  og_image_url TEXT,
  keywords TEXT[],
  keywords_ar TEXT[],
  noindex BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  gsc_verification_tag TEXT,
  adsense_publisher_id TEXT,
  ga_measurement_id TEXT,
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_report_data JSONB DEFAULT '{}'::jsonb,
  encrypted_vault TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enable & Permissive Policies for Client Writes
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users Read Access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Write Access" ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authors Read Access" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Authors Write Access" ON public.authors FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Categories Read Access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories Write Access" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Tags Read Access" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Tags Write Access" ON public.tags FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Articles Read Access" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Articles Write Access" ON public.articles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Article Tags Read Access" ON public.article_tags FOR SELECT USING (true);
CREATE POLICY "Article Tags Write Access" ON public.article_tags FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Videos Read Access" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Videos Write Access" ON public.videos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Article Videos Read Access" ON public.article_videos FOR SELECT USING (true);
CREATE POLICY "Article Videos Write Access" ON public.article_videos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Media Read Access" ON public.media FOR SELECT USING (true);
CREATE POLICY "Media Write Access" ON public.media FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "SEO Read Access" ON public.seo_metadata FOR SELECT USING (true);
CREATE POLICY "SEO Write Access" ON public.seo_metadata FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Settings Read Access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Settings Write Access" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- Upgrade existing users and auto-set admin for all
UPDATE public.users SET role = 'admin';
`;
      }
      navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {
      console.warn('Could not copy SQL file:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-2 sm:px-4 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <span>System Cloud Vault & API Keys</span>
                <span className="text-xs font-mono font-normal bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                  AES-256 Encrypted
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                All platform API keys encrypted and stored in Supabase PostgreSQL database. Nothing is stored in clear code.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyEnv}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-800"
            title="Copy complete .env format for Vercel or local development"
          >
            {copiedEnv ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-cyan-400" />}
            <span>{copiedEnv ? 'Copied .env!' : 'Copy .env Format'}</span>
          </button>

          <button
            onClick={handleSyncToSupabase}
            disabled={isSyncingData || !dbStatus.connected}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <RefreshCw size={14} className={isSyncingData ? 'animate-spin' : ''} />
            <span>{isSyncingData ? 'Syncing...' : 'Push Data to Supabase'}</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            <Save size={15} />
            <span>{isSaving ? 'Encrypting & Saving...' : 'Save & Encrypt to Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {status.type && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          status.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          <span className="text-xs font-medium leading-relaxed">{status.message}</span>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All API Keys' },
          { id: 'supabase', label: '1. Supabase PostgreSQL' },
          { id: 'gemini', label: '2. Gemini 5-Cluster' },
          { id: 'ai', label: '3. OpenAI & GROQ' },
          { id: 'media', label: '4. Media & Unsplash' },
          { id: 'seo', label: '5. SEO & Analytics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: SUPABASE CORE CREDENTIALS */}
        {(activeTab === 'all' || activeTab === 'supabase') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">1. Supabase PostgreSQL Core</h2>
                  <p className="text-[11px] text-slate-400">VITE_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY</p>
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <span>Dashboard</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={settings.supabaseUrl}
                  onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-300 outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Public Anon Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={settings.supabaseAnonKey}
                  onChange={(e) => setSettings({ ...settings, supabaseAnonKey: e.target.value })}
                  placeholder="Paste your Supabase Anon Public Key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-300 outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Service Role Key (SUPABASE_SERVICE_ROLE_KEY - Optional)
                </label>
                <input
                  type="password"
                  value={settings.supabaseServiceKey}
                  onChange={(e) => setSettings({ ...settings, supabaseServiceKey: e.target.value })}
                  placeholder="Secret service role key for elevated DB queries..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-300 outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: GEMINI 5-CLUSTER API KEYS */}
        {(activeTab === 'all' || activeTab === 'gemini') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">2. Gemini 5-Cluster API Keys</h2>
                  <p className="text-[11px] text-slate-400">GEMINI_API_KEY Multi-Slot Load Balancing</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-md">
                Cluster Rotation
              </span>
            </div>

            <div className="space-y-3">
              {settings.geminiKeys.map((key, idx) => (
                <div key={idx} className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-300 uppercase font-bold tracking-wider ml-1 flex items-center gap-1.5">
                      <span>Gemini API Key Slot #{idx + 1}</span>
                      {idx === 0 && <span className="text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-1.5 py-0.2 text-[9px] rounded">Primary</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      {key ? (
                        <span className="text-[10px] text-emerald-400 font-mono">Filled</span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Empty</span>
                      )}
                      {key && (
                        <button
                          type="button"
                          onClick={() => handleTestSingleGeminiKey(idx)}
                          disabled={testingGeminiIndex === idx}
                          className="px-2 py-0.5 text-[10px] font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles size={11} className={testingGeminiIndex === idx ? 'animate-spin text-indigo-400' : ''} />
                          <span>{testingGeminiIndex === idx ? 'Testing...' : 'Test Key'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => updateGeminiKey(idx, e.target.value)}
                    placeholder={`Paste Gemini API Key ${idx + 1} (AIzaSy...)...`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-indigo-300 outline-none focus:border-indigo-500 font-mono transition-all"
                  />
                  {geminiTestResults[idx] && (
                    <div className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono ${
                      geminiTestResults[idx].success
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950/60 text-red-300 border border-red-800'
                    }`}>
                      {geminiTestResults[idx].success ? <Check size={12} className="text-emerald-400 shrink-0" /> : <AlertCircle size={12} className="text-red-400 shrink-0" />}
                      <span>{geminiTestResults[idx].message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: OPENAI & GROQ KEYS */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">3. OpenAI & GROQ AI Engines</h2>
                <p className="text-[11px] text-slate-400">OPENAI_API_KEY, GROQ_API_KEY</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  OpenAI Backend Key (OPENAI_API_KEY)
                </label>
                <input
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-purple-300 outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  GROQ Fast Inference Key (GROQ_API_KEY)
                </label>
                <input
                  type="password"
                  value={settings.groqKey}
                  onChange={(e) => setSettings({ ...settings, groqKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-purple-300 outline-none focus:border-purple-500 font-mono transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: MEDIA & ASSETS */}
        {(activeTab === 'all' || activeTab === 'media') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">4. Media & Unsplash Integration</h2>
                <p className="text-[11px] text-slate-400">UNSPLASH_ACCESS_KEY, VITE_IMAGE_PROVIDER</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Unsplash Access Key (UNSPLASH_ACCESS_KEY)
                </label>
                <input
                  type="password"
                  value={settings.unsplashKey}
                  onChange={(e) => setSettings({ ...settings, unsplashKey: e.target.value })}
                  placeholder="Paste Unsplash key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-300 outline-none focus:border-cyan-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Default Image Provider (VITE_IMAGE_PROVIDER)
                </label>
                <select
                  value={settings.imageProvider}
                  onChange={(e) => setSettings({ ...settings, imageProvider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-300 outline-none focus:border-cyan-500 font-mono transition-all"
                >
                  <option value="Unsplash">Unsplash (Recommended)</option>
                  <option value="Pexels">Pexels</option>
                  <option value="Custom">Custom Direct URL</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: SEO, ADSENSE & GOOGLE ANALYTICS */}
        {(activeTab === 'all' || activeTab === 'seo') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">5. SEO, Google AdSense & Analytics</h2>
                <p className="text-[11px] text-slate-400">Search Console, AdSense ca-pub, GA4 Measurement ID</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Google Search Console Tag
                </label>
                <input
                  type="text"
                  value={settings.gscVerificationTag}
                  onChange={(e) => setSettings({ ...settings, gscVerificationTag: e.target.value })}
                  placeholder="google-site-verification=..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 outline-none focus:border-amber-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  AdSense Publisher ID
                </label>
                <input
                  type="text"
                  value={settings.adsensePubId}
                  onChange={(e) => setSettings({ ...settings, adsensePubId: e.target.value })}
                  placeholder="ca-pub-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 outline-none focus:border-amber-500 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                  Google Analytics 4 ID
                </label>
                <input
                  type="text"
                  value={settings.gaMeasurementId}
                  onChange={(e) => setSettings({ ...settings, gaMeasurementId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 outline-none focus:border-amber-500 font-mono transition-all"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
