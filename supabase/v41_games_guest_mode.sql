-- =============================================================================
-- v41 — Standalone Games Guest Mode
-- Enables public/guest gameplay while preserving member-linked sessions.
-- =============================================================================

-- quiz_sessions: allow guest play sessions with token-based access
ALTER TABLE public.quiz_sessions
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS play_mode text NOT NULL DEFAULT 'member'
    CHECK (play_mode IN ('member', 'guest'));

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS guest_display_name text;

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS access_token text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_sessions_access_token
  ON public.quiz_sessions(access_token)
  WHERE access_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_play_mode
  ON public.quiz_sessions(play_mode, started_at DESC);

COMMENT ON COLUMN public.quiz_sessions.play_mode IS 'member = authenticated profile-linked play, guest = standalone no-account play';
COMMENT ON COLUMN public.quiz_sessions.guest_display_name IS 'Optional public display name for guest sessions';
COMMENT ON COLUMN public.quiz_sessions.access_token IS 'Ephemeral token used to authorize guest answer/summary requests';

-- Ensure member rows still carry user_id
ALTER TABLE public.quiz_sessions
  DROP CONSTRAINT IF EXISTS quiz_sessions_member_requires_user_id;

ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT quiz_sessions_member_requires_user_id
  CHECK ((play_mode = 'guest') OR (play_mode = 'member' AND user_id IS NOT NULL));
