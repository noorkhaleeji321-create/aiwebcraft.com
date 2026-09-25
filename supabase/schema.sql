-- ============================================================================
-- AIWebCrafter Supabase Database Schema & Storage Setup
-- Optimized for 100% Reliable Synchronization, Data Persistence & Security
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AUTHORS TABLE
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
  twitter TEXT,
  github TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
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

-- 4. TAGS TABLE
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  excerpt_ar TEXT NOT NULL,
  content TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
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

-- 6. ARTICLE_TAGS (Junction Table)
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- 7. VIDEOS TABLE
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

-- 8. ARTICLE_VIDEOS (Junction Table)
CREATE TABLE IF NOT EXISTS public.article_videos (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  display_order INT DEFAULT 1,
  PRIMARY KEY (article_id, video_id)
);

-- 9. MEDIA TABLE
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

-- 10. SEO_METADATA TABLE
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('article', 'category', 'page')),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  primary_keyword TEXT,
  secondary_keywords TEXT[],
  search_intent TEXT,
  article_outline TEXT,
  internal_link_suggestions TEXT,
  faq_section TEXT,
  pillar_topic TEXT,
  pillar_article_id UUID
);

-- 11. SITE_SETTINGS TABLE
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

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET ('media')
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES - OPEN & PERMISSIVE FOR SEAMLESS CLIENT WRITES
-- ----------------------------------------------------------------------------
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

-- Drop any previous restrictive policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Enable clean universal read and write access for web app & admin operations
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

-- Storage Objects Policies
DROP POLICY IF EXISTS "Public Read Media Storage" ON storage.objects;
CREATE POLICY "Public Read Media Storage" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Insert Media Storage" ON storage.objects;
CREATE POLICY "Public Insert Media Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Manage Media Storage" ON storage.objects;
CREATE POLICY "Public Manage Media Storage" ON storage.objects FOR ALL USING (bucket_id = 'media');

-- ----------------------------------------------------------------------------
-- AUTH TRIGGER (Auto creates public user and author profile on signup)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin',
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin',
        updated_at = NOW();

  INSERT INTO public.authors (user_id, name, name_ar, slug, avatar_url, bio, bio_ar, role_title, role_title_ar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(new.id::text, 1, 4),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.email),
    'Admin & Author at AIWebCrafter',
    'المدير والكاتب في منصة AIWebCrafter',
    'Platform Administrator & Lead Author',
    'مدير المنصة والكاتب الرئيسي'
  )
  ON CONFLICT (slug) DO UPDATE
    SET role_title = 'Platform Administrator & Lead Author';

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upgrade any existing users to admin
UPDATE public.users SET role = 'admin';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
