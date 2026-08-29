-- =========================================================================
-- SUPABASE ADMIN CONFIGURATION & SECRETS SCHEMA
-- Run this SQL in your Supabase SQL Editor to manage admin credentials securely
-- =========================================================================

-- 1. Create admin_config table
CREATE TABLE IF NOT EXISTS public.admin_config (
    id SERIAL PRIMARY KEY,
    admin_email TEXT UNIQUE NOT NULL,
    admin_passcode TEXT NOT NULL,
    admin_secret_key TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & Restrict Anonymous / Public Access
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Drop insecure legacy policies
DROP POLICY IF EXISTS "Allow public read admin config for verification" ON public.admin_config;
DROP POLICY IF EXISTS "Allow authenticated update admin config" ON public.admin_config;

-- Create strict least-privilege policies
CREATE POLICY "Restrict admin_config to service role only" 
ON public.admin_config FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 3. Insert / Upsert initial admin credentials
INSERT INTO public.admin_config (admin_email, admin_passcode, admin_secret_key)
VALUES ('admin@example.com', 'YOUR_ADMIN_PASSCODE', 'YOUR_ADMIN_SECRET_KEY')
ON CONFLICT (admin_email) DO UPDATE 
SET admin_passcode = EXCLUDED.admin_passcode,
    admin_secret_key = EXCLUDED.admin_secret_key,
    updated_at = NOW();

-- =========================================================================
-- API KEYS & BOTS CONFIGURATION SCHEMA (Least Privilege Enforced)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.bot_keys (
    bot_id TEXT PRIMARY KEY,
    encrypted_key TEXT NOT NULL,
    fallback_keys TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure fallback_keys column exists for upgraded database schemas
ALTER TABLE public.bot_keys ADD COLUMN IF NOT EXISTS fallback_keys TEXT;

-- Enable RLS and isolate access to service_role ONLY
ALTER TABLE public.bot_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read bot keys" ON public.bot_keys;
DROP POLICY IF EXISTS "Allow all access to bot keys" ON public.bot_keys;

-- Strict least privilege policy
CREATE POLICY "Restrict bot_keys to service role only" 
ON public.bot_keys FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- =========================================================================
-- MARKETPLACE LISTINGS & SELLER PROJECTS SCHEMA (Row Level Security Enforced)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id TEXT NOT NULL,
    seller_name TEXT,
    seller_avatar TEXT,
    seller_verified BOOLEAN DEFAULT FALSE,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT DEFAULT 'SaaS',
    price NUMERIC DEFAULT 0,
    monthly_revenue NUMERIC DEFAULT 0,
    monthly_profit NUMERIC DEFAULT 0,
    tech_stack TEXT[],
    demo_url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on listings table to isolate seller data
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 1. Public can ONLY view approved listings on the marketplace
DROP POLICY IF EXISTS "Public can view approved listings" ON public.listings;
CREATE POLICY "Public can view approved listings"
ON public.listings FOR SELECT
USING (status = 'approved');

-- 2. Sellers can view their own projects (including pending/drafts)
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.listings;
CREATE POLICY "Sellers can view own listings"
ON public.listings FOR SELECT
TO authenticated
USING (auth.uid()::text = seller_id);

-- 3. Authenticated sellers can create listings tagged with their seller_id
DROP POLICY IF EXISTS "Sellers can create own listings" ON public.listings;
CREATE POLICY "Sellers can create own listings"
ON public.listings FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = seller_id);

-- 4. Full administrative management via service_role
DROP POLICY IF EXISTS "Service role full access on listings" ON public.listings;
CREATE POLICY "Service role full access on listings"
ON public.listings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


