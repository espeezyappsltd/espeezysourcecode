-- Referral program: 30% off Pro for friends using a referrer's code (max 5 per code).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_pro_redemptions_count integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referral_pro_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_pro_redemptions_session_unique UNIQUE (stripe_checkout_session_id),
  CONSTRAINT referral_pro_redemptions_referred_unique UNIQUE (referred_profile_id)
);

CREATE INDEX IF NOT EXISTS referral_pro_redemptions_referrer_idx
  ON public.referral_pro_redemptions (referrer_profile_id);

COMMENT ON COLUMN public.profiles.referral_pro_redemptions_count IS
  'Number of Pro checkouts that used this user''s referral code (max 5 for 30% discount).';

ALTER TABLE public.referral_pro_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_pro_redemptions_select_own ON public.referral_pro_redemptions;
CREATE POLICY referral_pro_redemptions_select_own ON public.referral_pro_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_profile_id OR auth.uid() = referred_profile_id);

-- Atomic redemption after successful Pro checkout (service role / webhook).
CREATE OR REPLACE FUNCTION public.record_referral_pro_redemption(
  p_referrer_id uuid,
  p_referred_id uuid,
  p_session_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_new_id uuid;
BEGIN
  IF p_referrer_id IS NULL OR p_referred_id IS NULL OR p_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  SELECT referral_pro_redemptions_count INTO v_count
  FROM public.profiles
  WHERE id = p_referrer_id
  FOR UPDATE;

  IF v_count IS NULL OR v_count >= 5 THEN
    RETURN false;
  END IF;

  INSERT INTO public.referral_pro_redemptions (
    referrer_profile_id,
    referred_profile_id,
    stripe_checkout_session_id
  )
  VALUES (p_referrer_id, p_referred_id, p_session_id)
  ON CONFLICT (referred_profile_id) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET referral_pro_redemptions_count = referral_pro_redemptions_count + 1
  WHERE id = p_referrer_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_referral_pro_redemption(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_referral_pro_redemption(uuid, uuid, text) TO service_role;
