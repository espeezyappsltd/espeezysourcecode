-- ============================================================
-- v34: Global Scale Performance Indexes
-- Run AFTER v35_platform_expansion.sql (which creates posts,
-- post_reactions, post_comments, and adds username/account_status
-- to profiles). Each block skips gracefully if the table doesn't
-- exist yet (EXCEPTION WHEN undefined_table).
-- ============================================================

-- ── profiles (base columns only — username/account_status added by v35) ──────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_profiles_fts
    ON public.profiles USING gin(
      to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(tagline, ''))
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── posts / feed ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_posts_feed_cursor
    ON public.posts (created_at DESC) WHERE is_deleted = false;

  CREATE INDEX IF NOT EXISTS idx_posts_group_feed
    ON public.posts (group_id, created_at DESC)
    WHERE is_deleted = false AND group_id IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_posts_author_feed
    ON public.posts (author_id, created_at DESC) WHERE is_deleted = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── post_reactions ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_post_reactions_post
    ON public.post_reactions (post_id);

  CREATE INDEX IF NOT EXISTS idx_post_reactions_user_post
    ON public.post_reactions (user_id, post_id);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── post_comments ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_post_comments_post
    ON public.post_comments (post_id, created_at ASC);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── tasks ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_status_created
    ON public.tasks (status, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_tasks_created_by
    ON public.tasks (created_by, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_tasks_assignees_gin
    ON public.tasks USING gin(assignees);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── notifications ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications (user_id, created_at DESC) WHERE is_read = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── user_connections ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_connections_user_a
    ON public.user_connections (user_a_id, status);

  CREATE INDEX IF NOT EXISTS idx_connections_user_b
    ON public.user_connections (user_b_id, status);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── groups ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_groups_slug
    ON public.groups (slug) WHERE slug IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_groups_created_by
    ON public.groups (created_by);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── group_members ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_group_members_user
    ON public.group_members (user_id);

  CREATE INDEX IF NOT EXISTS idx_group_members_group_role
    ON public.group_members (group_id, role);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── pre_registrations ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_preregistrations_email_unique
    ON public.pre_registrations (email);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── student_verifications ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_student_verifications_user_year
    ON public.student_verifications (user_id, academic_year, status);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── certificates ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_certificates_user
    ON public.certificates (user_id) WHERE revoked = false;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── Postgres connection pool tuning ──────────────────────────────────────────
-- Set in Supabase dashboard → Settings → Database → Connection Pooling:
--   Mode: Transaction  (for serverless/edge — no persistent connections)
--   Pool size: 15 (Supabase Pro default; increase to 25 for high traffic)

-- ── Vacuum & analyze all affected tables ─────────────────────────────────────
DO $$ BEGIN ANALYZE public.profiles;       EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.posts;          EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.post_reactions; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.post_comments;  EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.tasks;          EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.notifications;  EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.groups;         EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ANALYZE public.group_members;  EXCEPTION WHEN undefined_table THEN NULL; END $$;
