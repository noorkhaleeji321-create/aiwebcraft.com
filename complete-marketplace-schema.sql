-- =========================================================================
-- COMPLETE AIWEBCRAFTER MARKETPLACE & ADMIN DATABASE SCHEMA FOR SUPABASE
-- Copy and run this entire script in your Supabase SQL Editor to enable 
-- 100% real-time cross-device synchronization between Buyer, Seller, and Admin.
-- =========================================================================

-- 1. System Settings (Platform Commission, etc.)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read system_settings" ON public.system_settings;
CREATE POLICY "Public read system_settings" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role write system_settings" ON public.system_settings;
CREATE POLICY "Service role write system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- Initial default commission setting
INSERT INTO public.system_settings (key, value) VALUES ('platform_commission', '20')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Custom Build Requests & Calculator Submissions
CREATE TABLE IF NOT EXISTS public.custom_requests (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_type TEXT,
    buyer_email TEXT NOT NULL,
    buyer_name TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW',
    budget TEXT,
    timeline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access custom_requests" ON public.custom_requests;
CREATE POLICY "Public all access custom_requests" ON public.custom_requests FOR ALL USING (true) WITH CHECK (true);

-- 3. Marketplace Listings & Seller Projects
CREATE TABLE IF NOT EXISTS public.listings (
    id TEXT PRIMARY KEY,
    seller_id TEXT,
    seller_name TEXT,
    seller_email TEXT,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    long_description TEXT,
    asking_price NUMERIC DEFAULT 0,
    monthly_revenue NUMERIC DEFAULT 0,
    monthly_profit NUMERIC DEFAULT 0,
    monthly_visitors INTEGER DEFAULT 0,
    category TEXT DEFAULT 'SaaS',
    platform TEXT DEFAULT 'React',
    image_url TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access listings" ON public.listings;
CREATE POLICY "Public all access listings" ON public.listings FOR ALL USING (true) WITH CHECK (true);

-- 4. Orders & Escrow Transactions
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    buyer_email TEXT,
    seller_email TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access orders" ON public.orders;
CREATE POLICY "Public all access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 5. Direct Messages & Chat
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    sender_email TEXT,
    recipient_email TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access messages" ON public.messages;
CREATE POLICY "Public all access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Sellers Profile
CREATE TABLE IF NOT EXISTS public.sellers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access sellers" ON public.sellers;
CREATE POLICY "Public all access sellers" ON public.sellers FOR ALL USING (true) WITH CHECK (true);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all access audit_logs" ON public.audit_logs;
CREATE POLICY "Public all access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
