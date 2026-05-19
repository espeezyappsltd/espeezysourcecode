-- Platform fee: 1 credit per 50 credits sold (50 → 1 fee, 100 → 2 fee).

ALTER TABLE public.platform_fee_settings
  ADD COLUMN IF NOT EXISTS credits_per_fee_unit integer NOT NULL DEFAULT 50
    CHECK (credits_per_fee_unit > 0);

COMMENT ON COLUMN public.platform_fee_settings.credits_per_fee_unit IS
  'Platform fee = floor(gross / credits_per_fee_unit) credits (default 50).';

UPDATE public.platform_fee_settings
SET credits_per_fee_unit = 50,
    updated_at = now()
WHERE id = 'main';

CREATE OR REPLACE FUNCTION public.compute_platform_fee_credits(p_gross integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_unit integer;
  v_fee integer;
BEGIN
  IF p_gross IS NULL OR p_gross <= 0 THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(credits_per_fee_unit, 50) INTO v_unit
  FROM public.platform_fee_settings
  WHERE id = 'main';

  IF NOT FOUND OR v_unit IS NULL OR v_unit <= 0 THEN
    v_unit := 50;
  END IF;

  v_fee := p_gross / v_unit;

  IF v_fee <= 0 THEN
    RETURN 0;
  END IF;

  RETURN LEAST(v_fee, p_gross - 1);
END;
$$;

COMMENT ON FUNCTION public.compute_platform_fee_credits(integer) IS
  'Platform fee: floor(gross / credits_per_fee_unit), capped below gross.';
