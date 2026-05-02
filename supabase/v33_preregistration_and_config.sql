-- v33: Pre-Registration System, App Config, and Donations
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. App Config Table (admin-controlled key-value store)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed with default launch config
INSERT INTO public.app_config (key, value, description) VALUES
    ('launch_date', '2025-09-01T00:00:00.000Z', 'Platform public launch date (ISO 8601)'),
    ('launch_message', 'Something big is coming. Join 5 million students shaping the future of collaborative education.', 'Hero message shown on the pre-registration page'),
    ('preregister_goal', '5000000', 'Pre-registration target count'),
    ('preregister_open', 'true', 'Whether pre-registration is currently accepting signups'),
    ('brand_name', 'Espeezy', 'Current platform brand name'),
    ('platform_version', '2.0.0', 'Next major version to be released')
ON CONFLICT (key) DO NOTHING;

-- RLS: Only admins can write; anyone can read
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_read_all" ON public.app_config
    FOR SELECT USING (true);

CREATE POLICY "app_config_admin_write" ON public.app_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 2. Pre-Registration Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pre_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    institution TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'educator', 'institution', 'investor', 'other')),
    source TEXT DEFAULT 'organic',        -- email_campaign, social, direct, etc.
    campaign_ref TEXT,                    -- UTM campaign reference
    is_verified BOOLEAN DEFAULT false,
    unsubscribed BOOLEAN DEFAULT false,
    ip_hash TEXT,                         -- Hashed IP for dedup, not stored raw
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    CONSTRAINT pre_registrations_email_unique UNIQUE (email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS pre_registrations_created_at_idx ON public.pre_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS pre_registrations_source_idx ON public.pre_registrations (source);
CREATE INDEX IF NOT EXISTS pre_registrations_role_idx ON public.pre_registrations (role);

-- RLS: Public insert, admin-only read
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prereg_public_insert" ON public.pre_registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "prereg_admin_read" ON public.pre_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "prereg_admin_update" ON public.pre_registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 3. Donations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    donor_email TEXT,
    donor_name TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT,                         -- Optional donor message
    feature_tag TEXT,                     -- Which feature they're supporting
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS donations_status_idx ON public.donations (status);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at DESC);

-- RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donations_admin_all" ON public.donations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "donations_user_own" ON public.donations
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 4. Helper function: public pre-registration count
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_prereg_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COUNT(*)::INTEGER FROM public.pre_registrations
    WHERE unsubscribed = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_prereg_count() TO anon, authenticated;

-- ============================================================
-- 5. Helper function: public donation total
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_donation_total()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT jsonb_build_object(
        'total_cents', COALESCE(SUM(amount_cents), 0),
        'count', COUNT(*)
    )
    FROM public.donations
    WHERE status = 'completed';
$$;

GRANT EXECUTE ON FUNCTION public.get_donation_total() TO anon, authenticated;
