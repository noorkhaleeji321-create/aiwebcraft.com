-- ==============================================================================
-- 1. جدول الشات المباشر (Direct Chats)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.direct_chats (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    project_name TEXT,
    seller_email TEXT,
    buyer_email TEXT,
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.direct_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access direct chats" ON public.direct_chats;
CREATE POLICY "Public access direct chats" 
ON public.direct_chats FOR ALL 
USING (true) WITH CHECK (true);

-- ==============================================================================
-- 2. جدول تذاكر الدعم الفني (Support Tickets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    sender_name TEXT,
    sender_email TEXT,
    sender_role TEXT,
    subject TEXT,
    category TEXT,
    priority TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access support tickets" ON public.support_tickets;
CREATE POLICY "Public access support tickets" 
ON public.support_tickets FOR ALL 
USING (true) WITH CHECK (true);
