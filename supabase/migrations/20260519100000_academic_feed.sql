-- Academic Journeys feed (posts, reactions, comments) + optional subscription ledger.

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  post_type text NOT NULL DEFAULT 'general',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'connections')),
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS posts_visibility_created_idx
  ON public.posts (visibility, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS posts_author_created_idx
  ON public.posts (author_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like', 'love', 'fire', 'clap', 'insightful', 'celebrate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions (post_id);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS post_comments_post_created_idx
  ON public.post_comments (post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_subscriptions_plan_idx
  ON public.user_subscriptions (plan_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_public_read ON public.posts
  FOR SELECT TO authenticated
  USING (is_deleted = false AND (visibility = 'public' OR author_id = auth.uid()));

DROP POLICY IF EXISTS posts_author_write ON public.posts;
CREATE POLICY posts_author_write ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS posts_author_update ON public.posts;
CREATE POLICY posts_author_update ON public.posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS post_reactions_read ON public.post_reactions;
CREATE POLICY post_reactions_read ON public.post_reactions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS post_reactions_write ON public.post_reactions;
CREATE POLICY post_reactions_write ON public.post_reactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS post_comments_read ON public.post_comments;
CREATE POLICY post_comments_read ON public.post_comments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS post_comments_write ON public.post_comments;
CREATE POLICY post_comments_write ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS user_subscriptions_self_read ON public.user_subscriptions;
CREATE POLICY user_subscriptions_self_read ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.posts IS 'Academic Journeys feed posts.';
COMMENT ON TABLE public.user_subscriptions IS 'Stripe/plan entitlements (e.g. lifetime seats).';
