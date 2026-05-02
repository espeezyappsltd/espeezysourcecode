-- =============================================================================
-- v38 — Rewards, Points Engine & Cash Prize Quiz System
-- Safe, idempotent. Gamma's domain.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. REWARDS LEDGER — points, bonuses, cash prizes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_ledger (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            text        NOT NULL CHECK (type IN (
                                'earned_payment_sent',
                                'earned_payment_received',
                                'earned_task_completed',
                                'earned_quiz_win',
                                'earned_referral',
                                'earned_streak',
                                'earned_seasonal_bonus',
                                'redeemed_cash',
                                'redeemed_gift',
                                'admin_grant',
                                'admin_deduct',
                                'prize_cash_awarded'
                              )),
  points          integer     NOT NULL,               -- positive = earn, negative = redeem
  cash_value_cents integer    NOT NULL DEFAULT 0,     -- cash equivalent in cents (for prize awards)
  description     text        NOT NULL,
  reference_id    uuid,                               -- p2p_transfer_id, quiz_session_id, etc.
  reference_type  text,                               -- 'p2p_transfer' | 'quiz_session' | 'task' | etc.
  expires_at      timestamptz,                        -- null = no expiry
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reward_ledger IS 'Immutable event-sourced points ledger. Running balance = SUM(points) for a user.';
COMMENT ON COLUMN public.reward_ledger.points IS 'Positive = earn, negative = redeem/deduct.';
COMMENT ON COLUMN public.reward_ledger.cash_value_cents IS 'When a cash prize is awarded, the USD cent amount recorded here.';

CREATE INDEX IF NOT EXISTS idx_reward_user     ON public.reward_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_type     ON public.reward_ledger(type);
CREATE INDEX IF NOT EXISTS idx_reward_ref      ON public.reward_ledger(reference_id) WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. REWARD RULES — configurable earn/spend rules (admin-managed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action          text        NOT NULL UNIQUE,        -- matches type in reward_ledger
  label           text        NOT NULL,
  points_awarded  integer     NOT NULL DEFAULT 0,
  cash_bonus_cents integer    NOT NULL DEFAULT 0,     -- flat cash bonus on top of points
  multiplier      numeric(5,2) NOT NULL DEFAULT 1.0,
  is_active       boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reward_rules IS 'Admin-configurable rules for how many points each action awards.';

-- Seed default rules
INSERT INTO public.reward_rules (action, label, points_awarded, cash_bonus_cents, multiplier) VALUES
  ('earned_payment_sent',       'Sent a P2P payment',               10, 0,    1.0),
  ('earned_payment_received',   'Received a P2P payment',           5,  0,    1.0),
  ('earned_task_completed',     'Completed a hustle task',          50, 0,    1.0),
  ('earned_quiz_win',           'Won a quiz game',                  100,0,    1.0),
  ('earned_referral',           'Referred a new member',            200,500,  1.0),  -- +$5 cash bonus
  ('earned_streak',             'Daily activity streak',            20, 0,    1.0),
  ('earned_seasonal_bonus',     'Seasonal event bonus',             500,1000, 2.0)   -- 2x during events
ON CONFLICT (action) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. QUIZ CATEGORIES & QUESTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_categories (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE,
  name            text        NOT NULL,
  description     text,
  icon            text,
  difficulty_tier text        NOT NULL DEFAULT 'medium'
                    CHECK (difficulty_tier IN ('easy','medium','hard','expert','legendary')),
  prize_pool_cents integer    NOT NULL DEFAULT 0,
  is_seasonal     boolean     NOT NULL DEFAULT false,
  season_start    timestamptz,
  season_end      timestamptz,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quiz_categories IS 'Quiz categories. Higher difficulty tiers have larger prize pools.';

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     uuid        NOT NULL REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
  question        text        NOT NULL,
  option_a        text        NOT NULL,
  option_b        text        NOT NULL,
  option_c        text        NOT NULL,
  option_d        text        NOT NULL,
  correct_answer  text        NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  difficulty      text        NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy','medium','hard','expert','legendary')),
  points_value    integer     NOT NULL DEFAULT 10,    -- points per correct answer
  time_limit_secs integer     NOT NULL DEFAULT 30,
  explanation     text,                               -- shown after answer
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quiz_questions IS 'Question bank. Legendary questions award most points and cash.';

CREATE INDEX IF NOT EXISTS idx_quiz_questions_cat    ON public.quiz_questions(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_diff   ON public.quiz_questions(difficulty) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 4. QUIZ SESSIONS — individual play sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id               uuid        NOT NULL REFERENCES public.quiz_categories(id),
  tournament_id             uuid,                    -- FK added after tournament table
  status                    text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','completed','expired','disqualified')),
  questions_total           integer     NOT NULL DEFAULT 10,
  questions_answered        integer     NOT NULL DEFAULT 0,
  correct_answers           integer     NOT NULL DEFAULT 0,
  score                     integer     NOT NULL DEFAULT 0,           -- total points earned
  prize_cents_won           integer     NOT NULL DEFAULT 0,           -- cash prize in cents
  stripe_checkout_session_id text       UNIQUE,                       -- entry fee checkout
  prize_transfer_id         text        UNIQUE,                       -- Stripe transfer for prize
  prize_paid_out            boolean     NOT NULL DEFAULT false,
  metadata                  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  started_at                timestamptz NOT NULL DEFAULT now(),
  completed_at              timestamptz,
  expires_at                timestamptz NOT NULL DEFAULT now() + interval '1 hour'
);

COMMENT ON TABLE public.quiz_sessions IS 'Each play session. Score and prize are computed server-side.';

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user   ON public.quiz_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_cat    ON public.quiz_sessions(category_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_payout ON public.quiz_sessions(prize_paid_out) WHERE prize_cents_won > 0;

-- ---------------------------------------------------------------------------
-- 5. QUIZ SESSION ANSWERS — per-question audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_session_answers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id     uuid        NOT NULL REFERENCES public.quiz_questions(id),
  answer_given    text        NOT NULL CHECK (answer_given IN ('a','b','c','d')),
  is_correct      boolean     NOT NULL,
  points_earned   integer     NOT NULL DEFAULT 0,
  time_taken_ms   integer,
  answered_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

COMMENT ON TABLE public.quiz_session_answers IS 'Per-question answers for audit trail and anti-cheat verification.';

CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON public.quiz_session_answers(session_id);

-- ---------------------------------------------------------------------------
-- 6. QUIZ TOURNAMENTS — seasonal / special events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_tournaments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE,
  name            text        NOT NULL,
  description     text,
  category_id     uuid        REFERENCES public.quiz_categories(id),
  prize_pool_cents integer    NOT NULL DEFAULT 0,
  entry_fee_cents integer     NOT NULL DEFAULT 0,          -- 0 = free entry
  max_participants integer,
  difficulty      text        NOT NULL DEFAULT 'hard'
                    CHECK (difficulty IN ('easy','medium','hard','expert','legendary')),
  status          text        NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','active','completed','cancelled')),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  prize_distribution jsonb    NOT NULL DEFAULT '{"1st":50,"2nd":30,"3rd":20}'::jsonb,
  is_seasonal     boolean     NOT NULL DEFAULT false,
  season_name     text,                                    -- e.g. 'Christmas 2026'
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quiz_tournaments IS 'Tournament events with prize pools. Seasonal events have is_seasonal=true.';
COMMENT ON COLUMN public.quiz_tournaments.prize_distribution IS 'JSON: percentage of prize_pool_cents per rank. {"1st":50,"2nd":30,"3rd":20}';

-- Back-fill FK
ALTER TABLE public.quiz_sessions
  ADD CONSTRAINT fk_quiz_sessions_tournament
  FOREIGN KEY (tournament_id) REFERENCES public.quiz_tournaments(id) ON DELETE SET NULL
  NOT VALID;

CREATE INDEX IF NOT EXISTS idx_tournaments_status  ON public.quiz_tournaments(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_seasonal ON public.quiz_tournaments(is_seasonal, status);

-- ---------------------------------------------------------------------------
-- 7. TOURNAMENT PARTICIPANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_tournament_participants (
  tournament_id   uuid        NOT NULL REFERENCES public.quiz_tournaments(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id      uuid        REFERENCES public.quiz_sessions(id),
  rank            integer,
  prize_cents_won integer     NOT NULL DEFAULT 0,
  entry_paid      boolean     NOT NULL DEFAULT false,
  entry_checkout_session_id text,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, user_id)
);

COMMENT ON TABLE public.quiz_tournament_participants IS 'Maps participants to tournaments. Rank populated after tournament ends.';

CREATE INDEX IF NOT EXISTS idx_participants_tournament ON public.quiz_tournament_participants(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_participants_user       ON public.quiz_tournament_participants(user_id);

-- ---------------------------------------------------------------------------
-- 8. RLS — rewards, quiz (admin all + user own pattern)
-- ---------------------------------------------------------------------------
ALTER TABLE public.reward_ledger            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_tournaments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_tournament_participants ENABLE ROW LEVEL SECURITY;

-- reward_ledger
DROP POLICY IF EXISTS reward_ledger_admin_all ON public.reward_ledger;
CREATE POLICY reward_ledger_admin_all ON public.reward_ledger FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS reward_ledger_user_own ON public.reward_ledger;
CREATE POLICY reward_ledger_user_own ON public.reward_ledger FOR SELECT
  USING (user_id = auth.uid());

-- reward_rules — public read, admin write
DROP POLICY IF EXISTS reward_rules_public_read ON public.reward_rules;
CREATE POLICY reward_rules_public_read ON public.reward_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS reward_rules_admin_write ON public.reward_rules;
CREATE POLICY reward_rules_admin_write ON public.reward_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_categories — public read
DROP POLICY IF EXISTS quiz_categories_public_read ON public.quiz_categories;
CREATE POLICY quiz_categories_public_read ON public.quiz_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS quiz_categories_admin_all ON public.quiz_categories;
CREATE POLICY quiz_categories_admin_all ON public.quiz_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_questions — auth read only (no peeking answer keys from client)
DROP POLICY IF EXISTS quiz_questions_auth_read ON public.quiz_questions;
CREATE POLICY quiz_questions_auth_read ON public.quiz_questions FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);
DROP POLICY IF EXISTS quiz_questions_admin_all ON public.quiz_questions;
CREATE POLICY quiz_questions_admin_all ON public.quiz_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_sessions — user own + admin all
DROP POLICY IF EXISTS quiz_sessions_user_own ON public.quiz_sessions;
CREATE POLICY quiz_sessions_user_own ON public.quiz_sessions FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS quiz_sessions_admin_all ON public.quiz_sessions;
CREATE POLICY quiz_sessions_admin_all ON public.quiz_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_session_answers — user own
DROP POLICY IF EXISTS quiz_answers_user_own ON public.quiz_session_answers;
CREATE POLICY quiz_answers_user_own ON public.quiz_session_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quiz_sessions WHERE id = session_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS quiz_answers_admin_all ON public.quiz_session_answers;
CREATE POLICY quiz_answers_admin_all ON public.quiz_session_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- quiz_tournaments — public read active/upcoming
DROP POLICY IF EXISTS quiz_tournaments_public_read ON public.quiz_tournaments;
CREATE POLICY quiz_tournaments_public_read ON public.quiz_tournaments FOR SELECT
  USING (status IN ('upcoming','active','completed'));
DROP POLICY IF EXISTS quiz_tournaments_admin_all ON public.quiz_tournaments;
CREATE POLICY quiz_tournaments_admin_all ON public.quiz_tournaments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- tournament participants
DROP POLICY IF EXISTS participants_user_own ON public.quiz_tournament_participants;
CREATE POLICY participants_user_own ON public.quiz_tournament_participants FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS participants_admin_all ON public.quiz_tournament_participants;
CREATE POLICY participants_admin_all ON public.quiz_tournament_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------------------
-- 9. Helper function: get user point balance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(points), 0)::integer
  FROM public.reward_ledger
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now());
$$;

COMMENT ON FUNCTION public.get_user_points IS 'Returns current non-expired points balance for a user.';

-- ---------------------------------------------------------------------------
-- 10. Seed quiz categories
-- ---------------------------------------------------------------------------
INSERT INTO public.quiz_categories (slug, name, description, difficulty_tier, prize_pool_cents, is_seasonal) VALUES
  ('general-knowledge',  'General Knowledge',        'Everyday trivia for everyone.',                          'easy',      500,   false),
  ('science-tech',       'Science & Technology',     'STEM, coding, and how the world works.',                 'medium',    1000,  false),
  ('mathematics',        'Mathematics',              'From algebra to calculus — prove your numerical mind.',  'hard',      2500,  false),
  ('world-history',      'World History',            'Events, empires, and epochs across all of civilisation.','medium',    1000,  false),
  ('advanced-coding',    'Advanced Programming',     'Algorithms, data structures, system design.',            'expert',    5000,  false),
  ('legendary-gauntlet', 'Legendary Gauntlet',       'Elite multi-domain questions for top scholars only.',    'legendary', 10000, false),
  ('christmas-challenge','Christmas Cash Challenge',  'Seasonal special — biggest prizes of the year!',        'hard',      50000, true),
  ('new-year-sprint',    'New Year Sprint',          'Fast-paced questions to kick off the new year.',         'medium',    25000, true)
ON CONFLICT (slug) DO NOTHING;
