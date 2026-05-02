-- =============================================================================
-- v35: collab.space — Platform Expansion
-- Social Feed, Side Hustle, Stripe Connect, Activity Logs, User Storage
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ACTIVITY LOG — every user action is recorded
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id   TEXT,
  action       TEXT NOT NULL,          -- e.g. 'post.create', 'hustle.task.accept'
  resource     TEXT,                   -- table or feature name
  resource_id  TEXT,                   -- row id touched
  ip_hash      TEXT,
  user_agent   TEXT,
  metadata     JSONB DEFAULT '{}',
  severity     TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','error','critical')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_user    ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action  ON public.activity_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- Only admins can read; system (service role) can insert
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_admin_read ON public.activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 2. SOCIAL FEED — posts, reactions, comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) <= 2000),
  media_urls   TEXT[] DEFAULT '{}',
  post_type    TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general','achievement','hustle','announcement')),
  visibility   TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','connections','group')),
  group_id     UUID,
  edited_at    TIMESTAMPTZ,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_feed    ON public.posts(visibility, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_posts_author  ON public.posts(author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction     TEXT NOT NULL CHECK (reaction IN ('like','love','fire','clap','insightful','celebrate')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.post_reactions(post_id);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.post_comments(post_id, created_at ASC);

-- RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_select ON public.posts FOR SELECT USING (
  NOT is_deleted AND (
    visibility = 'public'
    OR author_id = auth.uid()
    OR (visibility = 'connections' AND EXISTS (
      SELECT 1 FROM public.user_connections uc
      WHERE uc.status = 'accepted'
        AND ((uc.requester_id = auth.uid() AND uc.receiver_id = author_id)
          OR (uc.receiver_id = auth.uid() AND uc.requester_id = author_id))
    ))
  )
);
CREATE POLICY posts_insert ON public.posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY posts_update ON public.posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY posts_delete ON public.posts FOR DELETE USING (
  author_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY reactions_select ON public.post_reactions FOR SELECT USING (TRUE);
CREATE POLICY reactions_insert ON public.post_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reactions_delete ON public.post_reactions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY comments_select ON public.post_comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY comments_insert ON public.post_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_update ON public.post_comments FOR UPDATE USING (author_id = auth.uid());

-- Enable realtime for feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- ---------------------------------------------------------------------------
-- 3. SIDE HUSTLE — task marketplace + earnings + Stripe Connect
-- ---------------------------------------------------------------------------

-- Stripe Connect accounts (one per user who wants to earn)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_account_status   TEXT DEFAULT 'none'
    CHECK (stripe_account_status IN ('none','pending','active','restricted','disabled')),
  ADD COLUMN IF NOT EXISTS stripe_onboarding_url   TEXT,
  ADD COLUMN IF NOT EXISTS username                TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS account_status          TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active','suspended','deactivated'));

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe   ON public.profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Hustle tasks (posted by any user, completed by another)
CREATE TABLE IF NOT EXISTS public.hustle_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  description     TEXT NOT NULL CHECK (char_length(description) <= 2000),
  category        TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('writing','design','research','coding','tutoring','data_entry','translation','social_media','general')),
  payout_cents    INT NOT NULL CHECK (payout_cents >= 100 AND payout_cents <= 500000),  -- $1–$5000
  platform_fee_cents INT GENERATED ALWAYS AS (FLOOR(payout_cents * 0.10)::INT) STORED,
  net_payout_cents   INT GENERATED ALWAYS AS (FLOOR(payout_cents * 0.90)::INT) STORED,
  currency        TEXT NOT NULL DEFAULT 'usd',
  deadline        TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','assigned','in_progress','submitted','approved','paid','disputed','cancelled')),
  submission_url  TEXT,
  submission_note TEXT,
  rejection_note  TEXT,
  connection_only BOOLEAN NOT NULL DEFAULT FALSE,  -- only connections can apply
  stripe_transfer_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hustle_open     ON public.hustle_tasks(status, created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_hustle_poster   ON public.hustle_tasks(poster_id);
CREATE INDEX IF NOT EXISTS idx_hustle_assignee ON public.hustle_tasks(assignee_id);

-- Hustle task applications
CREATE TABLE IF NOT EXISTS public.hustle_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.hustle_tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, applicant_id)
);

-- Earnings ledger (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.hustle_earnings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID NOT NULL REFERENCES public.hustle_tasks(id),
  earner_id        UUID NOT NULL REFERENCES public.profiles(id),
  payer_id         UUID NOT NULL REFERENCES public.profiles(id),
  gross_cents      INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  net_cents        INT NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'usd',
  stripe_transfer_id TEXT,
  stripe_payment_intent_id TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','refunded')),
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_earnings_earner ON public.hustle_earnings(earner_id);
CREATE INDEX IF NOT EXISTS idx_earnings_task   ON public.hustle_earnings(task_id);

-- Admin payouts (platform → user)
CREATE TABLE IF NOT EXISTS public.admin_payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id         UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id     UUID NOT NULL REFERENCES public.profiles(id),
  amount_cents     INT NOT NULL CHECK (amount_cents >= 100),
  currency         TEXT NOT NULL DEFAULT 'usd',
  note             TEXT,
  stripe_transfer_id TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for hustle
ALTER TABLE public.hustle_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_earnings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payouts       ENABLE ROW LEVEL SECURITY;

CREATE POLICY hustle_tasks_select ON public.hustle_tasks FOR SELECT USING (
  status = 'open'
  OR poster_id = auth.uid()
  OR assignee_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY hustle_tasks_insert ON public.hustle_tasks FOR INSERT WITH CHECK (
  poster_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_status = 'active')
);
CREATE POLICY hustle_tasks_update ON public.hustle_tasks FOR UPDATE USING (
  poster_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY hustle_apps_select ON public.hustle_applications FOR SELECT USING (
  applicant_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.hustle_tasks WHERE id = task_id AND poster_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY hustle_apps_insert ON public.hustle_applications FOR INSERT WITH CHECK (
  applicant_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_status = 'active')
);
CREATE POLICY hustle_apps_update ON public.hustle_applications FOR UPDATE USING (
  applicant_id = auth.uid()
);

CREATE POLICY earnings_select ON public.hustle_earnings FOR SELECT USING (
  earner_id = auth.uid()
  OR payer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY payouts_admin ON public.admin_payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY payouts_recipient_read ON public.admin_payouts FOR SELECT USING (
  recipient_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- 4. USER STORAGE — per-user media bucket tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket       TEXT NOT NULL DEFAULT 'user-media',   -- supabase storage bucket
  path         TEXT NOT NULL,                        -- storage path
  file_name    TEXT NOT NULL,
  file_type    TEXT,
  size_bytes   BIGINT NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('cv','portfolio','assignment','media','document','general')),
  is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_files_user ON public.user_files(user_id, created_at DESC);

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_files_own ON public.user_files FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_files_admin ON public.user_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 5. SUPPORT CHAT — AI + human escalation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject      TEXT,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','ai_handled','escalated','resolved','closed')),
  channel      TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('chat','email')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender       TEXT NOT NULL CHECK (sender IN ('user','ai','human_agent')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tickets_own    ON public.support_tickets FOR ALL USING (user_id = auth.uid());
CREATE POLICY tickets_admin  ON public.support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY messages_own   ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY messages_insert ON public.support_messages FOR INSERT WITH CHECK (
  sender = 'user'
  AND EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY messages_admin ON public.support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enable realtime for support
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- ---------------------------------------------------------------------------
-- 6. HELPER: log_activity() — callable from server-side only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id    UUID,
  p_action     TEXT,
  p_resource   TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata   JSONB DEFAULT '{}',
  p_severity   TEXT DEFAULT 'info',
  p_ip_hash    TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activity_log
    (user_id, action, resource, resource_id, metadata, severity, ip_hash, user_agent, session_id)
  VALUES
    (p_user_id, p_action, p_resource, p_resource_id, p_metadata, p_severity, p_ip_hash, p_user_agent, p_session_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. ADMIN VIEWS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_user_overview AS
  SELECT
    p.id, p.email, p.full_name, p.username, p.role,
    p.account_status, p.stripe_account_status,
    p.stripe_account_id,
    p.created_at,
    p.last_seen,
    COUNT(DISTINCT ht.id)  FILTER (WHERE ht.poster_id   = p.id) AS tasks_posted,
    COUNT(DISTINCT ht2.id) FILTER (WHERE ht2.assignee_id = p.id) AS tasks_worked,
    COALESCE(SUM(he.net_cents),0)::BIGINT AS total_earned_cents
  FROM public.profiles p
  LEFT JOIN public.hustle_tasks ht  ON ht.poster_id   = p.id
  LEFT JOIN public.hustle_tasks ht2 ON ht2.assignee_id = p.id
  LEFT JOIN public.hustle_earnings he ON he.earner_id  = p.id
  GROUP BY p.id;

-- Trigger to update hustle_tasks.updated_at
CREATE OR REPLACE FUNCTION public.hustle_tasks_set_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS hustle_tasks_updated ON public.hustle_tasks;
CREATE TRIGGER hustle_tasks_updated
  BEFORE UPDATE ON public.hustle_tasks
  FOR EACH ROW EXECUTE FUNCTION public.hustle_tasks_set_updated();

-- ---------------------------------------------------------------------------
-- 8. SEED: Supabase Storage bucket for user media (manual via dashboard or CLI)
-- ---------------------------------------------------------------------------
-- Run in Supabase Storage section or via CLI:
-- supabase storage create user-media --public=false
-- Policy: INSERT/SELECT/UPDATE/DELETE where bucket_id = 'user-media' AND (storage.foldername(name))[1] = auth.uid()::text
