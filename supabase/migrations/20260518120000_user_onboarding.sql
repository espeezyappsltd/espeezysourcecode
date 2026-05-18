-- Per-user onboarding completion tracking and reward flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_reward_claimed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'When the user finished all Espeezy feature onboarding Kanban tasks.';
COMMENT ON COLUMN public.profiles.onboarding_reward_claimed IS 'True after +20 credit reward and report asset were issued.';

CREATE INDEX IF NOT EXISTS profiles_onboarding_reward_idx
  ON public.profiles (onboarding_reward_claimed)
  WHERE onboarding_reward_claimed = false;
