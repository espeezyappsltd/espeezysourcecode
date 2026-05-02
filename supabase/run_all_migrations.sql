-- =============================================================================
-- GroupFlow / Espeezy — Master Migration Runner
-- =============================================================================
-- Idempotent: safe to run on a fresh DB or an existing one.
-- Run this single file in the Supabase SQL Editor (paste & execute).
-- All statements use IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS
-- patterns so re-running is always safe.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEMA v0: Base Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    module_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    course_name TEXT DEFAULT 'Independent Researcher',
    enrollment_year INTEGER,
    completion_year INTEGER,
    role TEXT DEFAULT 'collaborator',
    rank TEXT DEFAULT 'Senior',
    badges_count INTEGER DEFAULT 0,
    tagline TEXT,
    biography TEXT,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    total_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Done')),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    is_coding_task BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.commits (
    hash TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    lines_added INTEGER DEFAULT 0,
    lines_deleted INTEGER DEFAULT 0,
    author_email TEXT,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    impact_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endorsements_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, school_id, role,
    rank, badges_count, course_name, enrollment_year, completion_year
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'school_id',
    'collaborator',
    'Senior',
    0,
    'Independent Researcher',
    extract(year from now())::int,
    (extract(year from now()) + 3)::int
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- v5: Chat Upgrades (messages table columns — skip if messages table missing)
-- ─────────────────────────────────────────────────────────────────────────────
DO $v5$
BEGIN
  ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'v5: messages table not found, skipping chat upgrade columns';
END;
$v5$;

DO $v5b$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'v5: realtime publication: %', SQLERRM;
END;
$v5b$;

-- ─────────────────────────────────────────────────────────────────────────────
-- v6: Admin System & Role
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'collaborator' CHECK (role IN ('admin', 'collaborator'));
ALTER TABLE public.groups   ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

DROP POLICY IF EXISTS "Admins can manage group members" ON public.profiles;
CREATE POLICY "Admins can manage group members" ON public.profiles
FOR UPDATE TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- v7: Activity Monitoring
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_log_user  ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_group ON public.activity_log(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type  ON public.activity_log(action_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- v8: Notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification read status" ON public.notifications;
CREATE POLICY "Users can update their own notification read status" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ─────────────────────────────────────────────────────────────────────────────
-- v9: Production Hardening
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- v11: Fix Logging Schema
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- v12: Technical Arsenal
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_profiles_achievements ON public.profiles USING GIN (achievements);

-- ─────────────────────────────────────────────────────────────────────────────
-- v13: Task Categories
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Implementation';

UPDATE public.tasks SET category = 'Implementation' WHERE is_coding_task = true  AND category IS NULL;
UPDATE public.tasks SET category = 'UX/UI Design'   WHERE is_coding_task = false AND category IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- v14: Fix RLS Recursion
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_group_id()
RETURNS uuid AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Users can view group profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users can view group tasks"     ON public.tasks;
DROP POLICY IF EXISTS "Users can insert group tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Users can update group tasks"   ON public.tasks;

CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR group_id = get_my_group_id()
);
CREATE POLICY "Users can view group tasks" ON public.tasks FOR SELECT USING (
    group_id = get_my_group_id()
);
CREATE POLICY "Users can insert group tasks" ON public.tasks FOR INSERT WITH CHECK (
    group_id = get_my_group_id()
);
CREATE POLICY "Users can update group tasks" ON public.tasks FOR UPDATE USING (
    group_id = get_my_group_id()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- v15: Comprehensive Schema Fix
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignees UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS score_awarded BOOLEAN DEFAULT false;

-- Recreate RLS using helper (already done in v14, but ensure they exist)
DROP POLICY IF EXISTS "Users can view group tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Users can insert group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view group profiles" ON public.profiles;

CREATE POLICY "Users can view group tasks" ON public.tasks FOR SELECT USING (
    group_id = get_my_group_id()
);
CREATE POLICY "Users can insert group tasks" ON public.tasks FOR INSERT WITH CHECK (
    group_id = get_my_group_id()
);
CREATE POLICY "Users can update group tasks" ON public.tasks FOR UPDATE USING (
    group_id = get_my_group_id()
);
CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR group_id = get_my_group_id()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- v16: Settings Durability
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_bg_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{"palette": "Google Light"}'::jsonb;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
    id = auth.uid()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- v17: Fix Profile Fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Senior';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges_count INTEGER DEFAULT 0;

UPDATE public.profiles SET rank = 'Senior'                       WHERE rank IS NULL;
UPDATE public.profiles SET badges_count = 0                      WHERE badges_count IS NULL;
UPDATE public.profiles SET role = 'collaborator'                 WHERE role IS NULL;
UPDATE public.profiles SET course_name = 'Independent Researcher' WHERE course_name IS NULL;

-- Update handle_new_user to most robust version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, school_id, role,
    rank, badges_count, course_name, enrollment_year, completion_year
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'school_id',
    'collaborator',
    'Senior',
    0,
    'Independent Researcher',
    extract(year from now())::int,
    (extract(year from now()) + 3)::int
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- v18: User Connections (first version)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'connected' CHECK (status IN ('potential', 'pending', 'connected', 'ignored', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, target_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_connections_user   ON public.user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_target ON public.user_connections(target_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- v19: Connection Requests (status constraint upgrade)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_connections DROP CONSTRAINT IF EXISTS user_connections_status_check;
ALTER TABLE public.user_connections ADD CONSTRAINT user_connections_status_check
    CHECK (status IN ('potential', 'pending', 'connected', 'ignored', 'accepted'));

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- v20: Chat Persistence
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant chat messages" ON public.chat_messages;
CREATE POLICY "Users can view relevant chat messages" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        room_id LIKE '%' || auth.uid()::text || '%'
    );

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room    ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- v21a: Last Seen Persistence
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
UPDATE public.profiles SET last_seen = created_at WHERE last_seen IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- v21b: Connections System (from migrations/)
-- ─────────────────────────────────────────────────────────────────────────────
-- user_connections already created above (v18), just ensure notifications has right columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;

DROP POLICY IF EXISTS "Users can view their connections" ON public.user_connections;
CREATE POLICY "Users can view their connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Users can initiate connections" ON public.user_connections;
CREATE POLICY "Users can initiate connections" ON public.user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their received connections" ON public.user_connections;
CREATE POLICY "Users can update their received connections" ON public.user_connections
    FOR UPDATE USING (auth.uid() = target_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their connections" ON public.user_connections;
CREATE POLICY "Users can delete their connections" ON public.user_connections
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "System/Users can insert notifications" ON public.notifications;
CREATE POLICY "System/Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- v22a: Stripe Payments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_session_id TEXT,
    price_type TEXT NOT NULL,
    plan_label TEXT NOT NULL,
    mode TEXT NOT NULL,
    amount_total INTEGER,
    currency TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session_id_idx      ON public.payments (stripe_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_subscription_id_idx ON public.payments (stripe_subscription_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────────────────────────────────────────
-- v22b: AI Rate Limiting
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_usage;
CREATE POLICY "Users can insert own AI usage" ON public.ai_usage
    FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_usage;
CREATE POLICY "Users can view own AI usage" ON public.ai_usage
    FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own AI usage" ON public.ai_usage;
CREATE POLICY "Users can update own AI usage" ON public.ai_usage
    FOR UPDATE USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own AI usage" ON public.ai_usage;
CREATE POLICY "Users can delete own AI usage" ON public.ai_usage
    FOR DELETE USING (profile_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- v22c: Notification Preferences
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications  BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_emails    BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- v23: Task Performance Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_groups_module_code               ON public.groups(module_code);
CREATE INDEX IF NOT EXISTS idx_profiles_group_id                ON public.profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id_status_created_at ON public.tasks(group_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id_created_at        ON public.tasks(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignees                  ON public.tasks USING GIN (assignees);

-- ─────────────────────────────────────────────────────────────────────────────
-- v24: Tagline & Biography
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tagline  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biography TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- v25: Payment History Hardening
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_num TEXT;
    done BOOL := false;
BEGIN
    WHILE NOT done LOOP
        new_num := 'GF-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 1000000)::text, 6, '0');
        done := NOT EXISTS (SELECT 1 FROM public.payments WHERE invoice_number = new_num);
    END LOOP;
    RETURN new_num;
END;
$$ LANGUAGE plpgsql;

UPDATE public.payments SET invoice_number = generate_invoice_number() WHERE invoice_number IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- v26a: Network Visibility (Global Discovery)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view group profiles"         ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view scholar profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"          ON public.profiles;

CREATE POLICY "Anyone can view scholar profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- v26b: Messages Table — Presence & Join Fix
-- ─────────────────────────────────────────────────────────────────────────────
DO $v26b$
BEGIN
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS group_id   UUID REFERENCES public.groups(id) ON DELETE CASCADE;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system  BOOLEAN DEFAULT false;
  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'v26b: messages table not found, skipping';
END;
$v26b$;

DO $v26b_idx$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_messages_system_group ON public.messages(is_system, group_id);
EXCEPTION WHEN undefined_table THEN NULL;
END;
$v26b_idx$;

-- ─────────────────────────────────────────────────────────────────────────────
-- v27a: Group Capacity
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 5;

-- ─────────────────────────────────────────────────────────────────────────────
-- v27b: Search Optimization
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm  ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id_trgm  ON public.profiles USING gin (school_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm         ON public.tasks    USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_description_trgm   ON public.tasks    USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm         ON public.groups   USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_groups_module_code_trgm  ON public.groups   USING gin (module_code gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.smart_search(search_term TEXT)
RETURNS TABLE (
    id UUID, type TEXT, title TEXT, subtitle TEXT, image_url TEXT, rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, 'profile'::TEXT, p.full_name, p.course_name, p.avatar_url,
           similarity(p.full_name, search_term)
    FROM public.profiles p
    WHERE p.full_name % search_term OR p.school_id % search_term
    UNION ALL
    SELECT t.id, 'task'::TEXT, t.title, t.status, NULL::TEXT,
           similarity(t.title, search_term)
    FROM public.tasks t
    WHERE t.title % search_term OR t.description % search_term
    UNION ALL
    SELECT g.id, 'group'::TEXT, g.name, g.module_code, NULL::TEXT,
           similarity(g.name, search_term)
    FROM public.groups g
    WHERE g.name % search_term OR g.module_code % search_term
    ORDER BY rank DESC
    LIMIT 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- v28: User Feedback
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit feedback" ON public.user_feedback;
CREATE POLICY "Users can submit feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view feedback" ON public.user_feedback;
CREATE POLICY "Admins can view feedback" ON public.user_feedback
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- v29: Fix Logging RLS
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own activity logs"    ON public.activity_log;
DROP POLICY IF EXISTS "Admins can view entire group activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone in group can insert activity logs"  ON public.activity_log;

CREATE POLICY "Users can view their own activity logs" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view entire group activity logs" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND group_id = activity_log.group_id
        )
    );

CREATE POLICY "Anyone in group can insert activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- v30a: Group Metadata
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS rules TEXT;

DROP POLICY IF EXISTS "Group leaders can edit metadata" ON public.groups;
CREATE POLICY "Group leaders can edit metadata" ON public.groups
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND group_id = groups.id)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND group_id = groups.id)
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- v30b: Marketplace & Roles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Standardize roles — update data first to avoid constraint violation
UPDATE public.profiles
SET role = 'MEMBER'
WHERE role IS NULL
   OR role NOT IN ('TEAM_LEADER', 'ADMIN', 'MODERATOR', 'MEMBER', 'collaborator', 'admin');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('TEAM_LEADER', 'ADMIN', 'MODERATOR', 'MEMBER', 'collaborator', 'admin'));

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'MEMBER';

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    group_id UUID REFERENCES public.groups(id),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    meetup_zone TEXT DEFAULT 'Library',
    meetup_details TEXT,
    duration_days INTEGER DEFAULT 7,
    images TEXT[] DEFAULT '{}',
    payment_method TEXT DEFAULT 'CASH',
    status TEXT DEFAULT 'AVAILABLE',
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_owner  ON public.marketplace_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);

CREATE TABLE IF NOT EXISTS public.listing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public available listings viewable by all" ON public.marketplace_listings;
CREATE POLICY "Public available listings viewable by all" ON public.marketplace_listings
    FOR SELECT USING (auth.role() = 'authenticated' AND status != 'ARCHIVED');

DROP POLICY IF EXISTS "Users can create their own listings" ON public.marketplace_listings;
CREATE POLICY "Users can create their own listings" ON public.marketplace_listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.marketplace_listings;
CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Moderators can moderate listings" ON public.marketplace_listings;
CREATE POLICY "Moderators can moderate listings" ON public.marketplace_listings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM_LEADER', 'MODERATOR'))
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- v31: Connections Logic Fix
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own connections"   ON public.user_connections;
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can view relevant connections"    ON public.user_connections;
DROP POLICY IF EXISTS "Users can manage relevant connections"  ON public.user_connections;

CREATE POLICY "Users can view relevant connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_id);

CREATE POLICY "Users can manage relevant connections" ON public.user_connections
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = target_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- v32a: Profile Stack
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stack TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- v32b: Formal Join Requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gjr_group  ON public.group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_gjr_user   ON public.group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gjr_status ON public.group_join_requests(status);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON public.group_join_requests;
CREATE POLICY "Users can view their own requests" ON public.group_join_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view group requests" ON public.group_join_requests;
CREATE POLICY "Admins can view group requests" ON public.group_join_requests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND group_id = group_join_requests.group_id AND role IN ('ADMIN', 'TEAM_LEADER'))
    );

DROP POLICY IF EXISTS "Admins can manage group requests" ON public.group_join_requests;
CREATE POLICY "Admins can manage group requests" ON public.group_join_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND group_id = group_join_requests.group_id AND role IN ('ADMIN', 'TEAM_LEADER'))
    );

-- Harden profiles RLS for global discoverability
DROP POLICY IF EXISTS "Global profile discoverability"    ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view scholar profiles"  ON public.profiles;
CREATE POLICY "Anyone can view scholar profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- v33a: Pre-Registration System, App Config & Donations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.app_config (key, value, description) VALUES
    ('launch_date',       '2025-09-01T00:00:00.000Z',   'Platform public launch date (ISO 8601)'),
    ('launch_message',    'Something big is coming. Join 5 million students shaping the future of collaborative education.', 'Hero message shown on the pre-registration page'),
    ('preregister_goal',  '5000000',                     'Pre-registration target count'),
    ('preregister_open',  'true',                        'Whether pre-registration is currently accepting signups'),
    ('brand_name',        'Espeezy',                     'Current platform brand name'),
    ('platform_version',  '2.0.0',                       'Next major version to be released')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_read_all"    ON public.app_config;
DROP POLICY IF EXISTS "app_config_admin_write" ON public.app_config;
CREATE POLICY "app_config_read_all" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "app_config_admin_write" ON public.app_config FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS public.pre_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    institution TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'educator', 'institution', 'investor', 'other')),
    source TEXT DEFAULT 'organic',
    campaign_ref TEXT,
    is_verified BOOLEAN DEFAULT false,
    unsubscribed BOOLEAN DEFAULT false,
    ip_hash TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    CONSTRAINT pre_registrations_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS pre_registrations_created_at_idx ON public.pre_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS pre_registrations_source_idx     ON public.pre_registrations (source);
CREATE INDEX IF NOT EXISTS pre_registrations_role_idx       ON public.pre_registrations (role);

ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prereg_public_insert" ON public.pre_registrations;
DROP POLICY IF EXISTS "prereg_admin_read"    ON public.pre_registrations;
DROP POLICY IF EXISTS "prereg_admin_update"  ON public.pre_registrations;
CREATE POLICY "prereg_public_insert" ON public.pre_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "prereg_admin_read"    ON public.pre_registrations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "prereg_admin_update"  ON public.pre_registrations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    donor_email TEXT,
    donor_name TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT,
    feature_tag TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS donations_status_idx     ON public.donations (status);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at DESC);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
DROP POLICY IF EXISTS "donations_user_own"  ON public.donations;
CREATE POLICY "donations_admin_all" ON public.donations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "donations_user_own" ON public.donations FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_prereg_count()
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT COUNT(*)::INTEGER FROM public.pre_registrations WHERE unsubscribed = false;
$$;
GRANT EXECUTE ON FUNCTION public.get_prereg_count() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_donation_total()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT jsonb_build_object('total_cents', COALESCE(SUM(amount_cents), 0), 'count', COUNT(*))
    FROM public.donations WHERE status = 'completed';
$$;
GRANT EXECUTE ON FUNCTION public.get_donation_total() TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- v33b: Student Verification & Certificates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    enrollment_proof TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sv_user_id  ON public.student_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sv_status   ON public.student_verifications(status);
CREATE INDEX IF NOT EXISTS idx_sv_expires  ON public.student_verifications(expires_at);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    graduation_year INT,
    gpa NUMERIC(3,2),
    achievements TEXT[],
    pdf_url TEXT,
    blockchain_hash TEXT,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_user_id ON public.certificates(user_id);

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sv_select_own" ON public.student_verifications;
DROP POLICY IF EXISTS "sv_insert_own" ON public.student_verifications;
DROP POLICY IF EXISTS "sv_admin_all"  ON public.student_verifications;
CREATE POLICY "sv_select_own" ON public.student_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sv_insert_own" ON public.student_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sv_admin_all"  ON public.student_verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cert_select_own" ON public.certificates;
DROP POLICY IF EXISTS "cert_admin_all"  ON public.certificates;
CREATE POLICY "cert_select_own" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cert_admin_all"  ON public.certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_sv_updated_at ON public.student_verifications;
CREATE TRIGGER set_sv_updated_at
    BEFORE UPDATE ON public.student_verifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- v34a: Agent Management System
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    specialisation TEXT NOT NULL CHECK (specialisation IN ('frontend','backend','devops')),
    role          TEXT NOT NULL CHECK (role IN ('builder','validator')),
    pair_id       UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','training')),
    system_prompt TEXT,
    capabilities  TEXT[] DEFAULT '{}',
    tasks_completed INT DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             TEXT NOT NULL,
    description       TEXT,
    priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    status            TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','review','done','blocked')),
    assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    depends_on        UUID[] DEFAULT '{}',
    output_artifacts  JSONB DEFAULT '[]',
    logs              TEXT DEFAULT '',
    created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent  ON public.agent_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS agent_tasks_updated_at ON public.agent_tasks;
CREATE TRIGGER agent_tasks_updated_at BEFORE UPDATE ON public.agent_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_admin_all"      ON public.agents;
DROP POLICY IF EXISTS "agent_tasks_admin_all" ON public.agent_tasks;
CREATE POLICY "agents_admin_all" ON public.agents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "agent_tasks_admin_all" ON public.agent_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed agents
INSERT INTO public.agents (name, specialisation, role, status, capabilities, system_prompt) VALUES
  ('Alpha',   'frontend', 'builder',   'active',
   ARRAY['React','Next.js','Tailwind','Framer Motion','Accessibility'],
   'You are Alpha, the frontend UI architect. Build React/Next.js components following the design system. Prioritise accessibility, performance, and mobile-first layouts.'),
  ('Beta',    'frontend', 'validator', 'active',
   ARRAY['Playwright','Lighthouse','WCAG','Visual Regression','Cross-browser'],
   'You are Beta, the frontend validator. Review all UI built by Alpha. Write Playwright tests, run Lighthouse audits, and check WCAG 2.1 AA compliance.'),
  ('Gamma',   'backend',  'builder',   'active',
   ARRAY['Next.js API','Supabase','PostgreSQL','RLS','Stripe','Webhooks'],
   'You are Gamma, the API engineer. Build Next.js API routes, Supabase queries, RLS policies, and database migrations following existing patterns.'),
  ('Delta',   'backend',  'validator', 'active',
   ARRAY['Security','OWASP','SQL Injection','Rate Limiting','Load Testing'],
   'You are Delta, the backend security validator. Audit all API routes for OWASP Top 10 vulnerabilities, validate RLS policies, and write load test scripts.'),
  ('Epsilon', 'devops',   'builder',   'active',
   ARRAY['GitHub Actions','Vercel','CI/CD','Environment Config','Monitoring'],
   'You are Epsilon, the infrastructure engineer. Build CI/CD workflows, Vercel configurations, and monitoring setups.'),
  ('Zeta',    'devops',   'validator', 'active',
   ARRAY['Secret Scanning','Cost Optimisation','Uptime','Disaster Recovery','Dependencies'],
   'You are Zeta, the DevOps security and reliability validator. Scan for credential leaks, analyse cloud costs, and document disaster recovery.')
ON CONFLICT DO NOTHING;

-- Set pair assignments
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Beta')    WHERE name = 'Alpha'   AND pair_id IS NULL;
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Alpha')   WHERE name = 'Beta'    AND pair_id IS NULL;
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Delta')   WHERE name = 'Gamma'   AND pair_id IS NULL;
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Gamma')   WHERE name = 'Delta'   AND pair_id IS NULL;
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Zeta')    WHERE name = 'Epsilon' AND pair_id IS NULL;
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Epsilon') WHERE name = 'Zeta'    AND pair_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- v34b: Identity Hub Fields (from migrations/)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manual_avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS protect_avatar    BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- v34c: Marketplace Enhancements (from migrations/)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'Other';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS quantity     INTEGER DEFAULT 1;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS condition    TEXT DEFAULT 'Used';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS contact_info TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS location     TEXT;

CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_listings(category);

DROP POLICY IF EXISTS "Public profiles name and avatar viewable for marketplace" ON public.profiles;
CREATE POLICY "Public profiles name and avatar viewable for marketplace" ON public.profiles
    FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- v35: Platform Expansion (Posts, Side Hustle, Stripe Connect)
-- ─────────────────────────────────────────────────────────────────────────────

-- Activity log (v35 redefines with BIGSERIAL — drop/recreate only if schema changed)
DO $v35_activity$
BEGIN
  -- Check if activity_log already has BIGSERIAL (id column type bigint)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_log'
      AND column_name = 'id' AND data_type = 'bigint'
  ) THEN
    -- Original activity_log was UUID; v35 wants BIGSERIAL — add new columns only
    ALTER TABLE public.activity_log
      ADD COLUMN IF NOT EXISTS session_id TEXT,
      ADD COLUMN IF NOT EXISTS action     TEXT,
      ADD COLUMN IF NOT EXISTS resource   TEXT,
      ADD COLUMN IF NOT EXISTS resource_id TEXT,
      ADD COLUMN IF NOT EXISTS ip_hash    TEXT,
      ADD COLUMN IF NOT EXISTS user_agent TEXT,
      ADD COLUMN IF NOT EXISTS severity   TEXT NOT NULL DEFAULT 'info';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'v35 activity_log upgrade: %', SQLERRM;
END;
$v35_activity$;

-- Social Feed Tables
CREATE TABLE IF NOT EXISTS public.posts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content    TEXT NOT NULL CHECK (char_length(content) <= 2000),
    media_urls TEXT[] DEFAULT '{}',
    post_type  TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general','achievement','hustle','announcement')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','connections','group')),
    group_id   UUID,
    edited_at  TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_feed   ON public.posts(visibility, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_group  ON public.posts(group_id, created_at DESC) WHERE group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.post_reactions (
    post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction   TEXT NOT NULL CHECK (reaction IN ('like','love','fire','clap','insightful','celebrate')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.post_reactions(post_id);

CREATE TABLE IF NOT EXISTS public.post_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id  UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content    TEXT NOT NULL CHECK (char_length(content) <= 500),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.post_comments(post_id, created_at ASC);

ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (
    NOT is_deleted AND (
        visibility = 'public'
        OR author_id = auth.uid()
        OR (visibility = 'connections' AND EXISTS (
            SELECT 1 FROM public.user_connections uc
            WHERE uc.status = 'accepted'
              AND ((uc.user_id = auth.uid() AND uc.target_id = author_id)
                OR (uc.target_id = auth.uid() AND uc.user_id = author_id))
        ))
    )
);

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "reactions_select" ON public.post_reactions;
CREATE POLICY "reactions_select" ON public.post_reactions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "reactions_insert" ON public.post_reactions;
CREATE POLICY "reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_delete" ON public.post_reactions;
CREATE POLICY "reactions_delete" ON public.post_reactions FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "comments_select" ON public.post_comments;
CREATE POLICY "comments_select" ON public.post_comments FOR SELECT USING (NOT is_deleted);

DROP POLICY IF EXISTS "comments_insert" ON public.post_comments;
CREATE POLICY "comments_insert" ON public.post_comments FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments_update" ON public.post_comments;
CREATE POLICY "comments_update" ON public.post_comments FOR UPDATE USING (author_id = auth.uid());

-- Enable realtime for feed
DO $v35_realtime$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'posts realtime: %', SQLERRM;
END;
$v35_realtime$;

DO $v35_realtime2$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'post_reactions realtime: %', SQLERRM;
END;
$v35_realtime2$;

DO $v35_realtime3$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'post_comments realtime: %', SQLERRM;
END;
$v35_realtime3$;

-- Stripe Connect columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_id     TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'none'
    CHECK (stripe_account_status IN ('none','pending','active','restricted','disabled'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username              TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status        TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active','suspended','deactivated'));

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe   ON public.profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Hustle Tasks
CREATE TABLE IF NOT EXISTS public.hustle_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignee_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title               TEXT NOT NULL CHECK (char_length(title) <= 200),
    description         TEXT NOT NULL CHECK (char_length(description) <= 2000),
    category            TEXT NOT NULL DEFAULT 'general'
        CHECK (category IN ('writing','design','research','coding','tutoring','data_entry','translation','social_media','general')),
    payout_cents        INT NOT NULL CHECK (payout_cents >= 100 AND payout_cents <= 500000),
    platform_fee_cents  INT GENERATED ALWAYS AS (FLOOR(payout_cents * 0.10)::INT) STORED,
    net_payout_cents    INT GENERATED ALWAYS AS (FLOOR(payout_cents * 0.90)::INT) STORED,
    currency            TEXT NOT NULL DEFAULT 'usd',
    deadline            TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','assigned','in_progress','submitted','approved','paid','disputed','cancelled')),
    submission_url      TEXT,
    submission_note     TEXT,
    rejection_note      TEXT,
    connection_only     BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_transfer_id  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hustle_open     ON public.hustle_tasks(status, created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_hustle_poster   ON public.hustle_tasks(poster_id);
CREATE INDEX IF NOT EXISTS idx_hustle_assignee ON public.hustle_tasks(assignee_id);

CREATE TABLE IF NOT EXISTS public.hustle_applications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES public.hustle_tasks(id) ON DELETE CASCADE,
    applicant_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.hustle_earnings (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id                  UUID NOT NULL REFERENCES public.hustle_tasks(id),
    earner_id                UUID NOT NULL REFERENCES public.profiles(id),
    payer_id                 UUID NOT NULL REFERENCES public.profiles(id),
    gross_cents              INT NOT NULL,
    platform_fee_cents       INT NOT NULL,
    net_cents                INT NOT NULL,
    currency                 TEXT NOT NULL DEFAULT 'usd',
    stripe_transfer_id       TEXT,
    stripe_payment_intent_id TEXT,
    status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','refunded')),
    paid_at                  TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_earner ON public.hustle_earnings(earner_id);
CREATE INDEX IF NOT EXISTS idx_earnings_task   ON public.hustle_earnings(task_id);

CREATE TABLE IF NOT EXISTS public.admin_payouts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id           UUID NOT NULL REFERENCES public.profiles(id),
    recipient_id       UUID NOT NULL REFERENCES public.profiles(id),
    amount_cents       INT NOT NULL CHECK (amount_cents >= 100),
    currency           TEXT NOT NULL DEFAULT 'usd',
    note               TEXT,
    stripe_transfer_id TEXT,
    status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hustle_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_earnings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payouts       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hustle_tasks_select" ON public.hustle_tasks;
CREATE POLICY "hustle_tasks_select" ON public.hustle_tasks FOR SELECT USING (
    status = 'open'
    OR poster_id = auth.uid()
    OR assignee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "hustle_tasks_insert" ON public.hustle_tasks;
CREATE POLICY "hustle_tasks_insert" ON public.hustle_tasks FOR INSERT WITH CHECK (
    poster_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_status = 'active')
);

DROP POLICY IF EXISTS "hustle_tasks_update" ON public.hustle_tasks;
CREATE POLICY "hustle_tasks_update" ON public.hustle_tasks FOR UPDATE USING (
    poster_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "hustle_apps_select" ON public.hustle_applications;
CREATE POLICY "hustle_apps_select" ON public.hustle_applications FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.hustle_tasks WHERE id = task_id AND poster_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "hustle_apps_insert" ON public.hustle_applications;
CREATE POLICY "hustle_apps_insert" ON public.hustle_applications FOR INSERT WITH CHECK (
    applicant_id = auth.uid()
);

DROP POLICY IF EXISTS "earnings_select" ON public.hustle_earnings;
CREATE POLICY "earnings_select" ON public.hustle_earnings FOR SELECT USING (
    earner_id = auth.uid() OR payer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin_payouts_admin" ON public.admin_payouts;
CREATE POLICY "admin_payouts_admin" ON public.admin_payouts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- v35b: Admin Initialization
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.profiles
SET
    role = 'admin',
    subscription_plan = 'premium',
    subscription_status = 'active',
    subscription_started_at = NOW()
WHERE email = 'kedogosospeter36@gmail.com';

-- ─────────────────────────────────────────────────────────────────────────────
-- v36: Marketing Orchestration (platform_config)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_config (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key        TEXT UNIQUE NOT NULL,
    value      JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active  BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access"   ON public.platform_config;
DROP POLICY IF EXISTS "Admin Control Access" ON public.platform_config;
CREATE POLICY "Public Read Access" ON public.platform_config
    FOR SELECT USING (true);
CREATE POLICY "Admin Control Access" ON public.platform_config
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

INSERT INTO public.platform_config (key, value, is_active) VALUES
    ('main_banner',         '{"text": "30% OFF ALL CLEARANCE TIERS", "code": "ELITE30", "expiry": "August 31st"}', true),
    ('global_announcement', '{"title": "Institutional Upgrade", "message": "Espeezy nodes have been upgraded to Bank-Level Security.", "style": "elite"}', false),
    ('promo_logic',         '{"discount_percent": 30, "is_global": true}', true)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- v37: Spotify Integration
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_access_token    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_refresh_token   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotify_connected        BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL: Global Scale Performance Indexes (run last)
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles FTS
DO $perf_profiles_fts$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_profiles_fts ON public.profiles
    USING gin(to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(school_id,'') || ' ' || coalesce(course_name,'')));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_profiles_fts: %', SQLERRM;
END;
$perf_profiles_fts$;

-- Posts performance
DO $perf_posts$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_posts_feed_perf   ON public.posts(created_at DESC) WHERE NOT is_deleted AND visibility = 'public';
  CREATE INDEX IF NOT EXISTS idx_posts_group_perf  ON public.posts(group_id, created_at DESC) WHERE group_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_posts_author_perf ON public.posts(author_id, created_at DESC);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'posts performance indexes skipped: table not found';
WHEN OTHERS THEN
  RAISE NOTICE 'posts perf: %', SQLERRM;
END;
$perf_posts$;

-- Notifications performance
DO $perf_notifs$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC) WHERE NOT read;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notifications perf: %', SQLERRM;
END;
$perf_notifs$;

-- Tasks performance
DO $perf_tasks$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_assignees_perf ON public.tasks(group_id, status) WHERE status != 'Done';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tasks perf: %', SQLERRM;
END;
$perf_tasks$;

-- User connections performance
DO $perf_connections$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_connections_accepted ON public.user_connections(user_id, target_id) WHERE status = 'accepted';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'connections perf: %', SQLERRM;
END;
$perf_connections$;

-- Hustle tasks performance
DO $perf_hustle$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_hustle_category_open ON public.hustle_tasks(category, created_at DESC) WHERE status = 'open';
EXCEPTION WHEN undefined_table THEN NULL;
WHEN OTHERS THEN
  RAISE NOTICE 'hustle perf: %', SQLERRM;
END;
$perf_hustle$;

-- Run ANALYZE on key tables
DO $analyze$
BEGIN
  ANALYZE public.profiles;
  ANALYZE public.tasks;
  ANALYZE public.groups;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'analyze: %', SQLERRM;
END;
$analyze$;

-- =============================================================================
-- AGENT HELPER FUNCTIONS
-- =============================================================================

-- Increment tasks_completed counter for an agent (called by complete endpoint)
CREATE OR REPLACE FUNCTION public.increment_agent_tasks(agent_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agents SET tasks_completed = COALESCE(tasks_completed, 0) + 1 WHERE id = agent_id;
$$;

-- =============================================================================
-- END OF MASTER MIGRATION SCRIPT
-- All tables created, all policies idempotent, all indexes safe to re-run.
-- =============================================================================
