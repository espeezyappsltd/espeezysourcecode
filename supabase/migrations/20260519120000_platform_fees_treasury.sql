-- Platform fee treasury: fees on credit marketplace sales and hustle gig payouts stay on-platform.

CREATE TABLE IF NOT EXISTS public.platform_fee_settings (
  id text PRIMARY KEY DEFAULT 'main',
  fee_bps integer NOT NULL DEFAULT 200 CHECK (fee_bps >= 0 AND fee_bps <= 10000),
  min_fee_credits integer NOT NULL DEFAULT 1 CHECK (min_fee_credits >= 0),
  min_gross_for_fee integer NOT NULL DEFAULT 2 CHECK (min_gross_for_fee >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_fee_settings (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.platform_fee_settings IS 'Singleton fee config (fee_bps=200 → 2%, aligned with Stripe P2P).';

CREATE TABLE IF NOT EXISTS public.platform_treasury (
  id text PRIMARY KEY DEFAULT 'main',
  credits_balance bigint NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_treasury (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.platform_treasury IS 'Espeezy platform credit balance from marketplace + hustle fees.';

CREATE TABLE IF NOT EXISTS public.platform_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('marketplace', 'hustle')),
  reference_id uuid,
  gross_credits integer NOT NULL CHECK (gross_credits >= 0),
  fee_credits integer NOT NULL CHECK (fee_credits >= 0),
  net_credits integer NOT NULL CHECK (net_credits >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_fee_ledger_created_idx
  ON public.platform_fee_ledger (created_at DESC);

ALTER TABLE public.platform_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fee_ledger ENABLE ROW LEVEL SECURITY;

-- Service role only (no client reads/writes)
CREATE POLICY platform_fee_settings_service ON public.platform_fee_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY platform_treasury_service ON public.platform_treasury
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY platform_fee_ledger_service ON public.platform_fee_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.marketplace_purchases
  ADD COLUMN IF NOT EXISTS platform_fee_credits integer NOT NULL DEFAULT 0 CHECK (platform_fee_credits >= 0),
  ADD COLUMN IF NOT EXISTS seller_net_credits integer NOT NULL DEFAULT 0 CHECK (seller_net_credits >= 0);

-- Compute fee from settings (defaults: 2%, min 1 credit, only when gross >= 2)
CREATE OR REPLACE FUNCTION public.compute_platform_fee_credits(p_gross integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_settings public.platform_fee_settings%ROWTYPE;
  v_fee integer;
BEGIN
  IF p_gross IS NULL OR p_gross <= 0 THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_settings FROM public.platform_fee_settings WHERE id = 'main';
  IF NOT FOUND THEN
    v_settings.fee_bps := 200;
    v_settings.min_fee_credits := 1;
    v_settings.min_gross_for_fee := 2;
  END IF;

  IF p_gross < COALESCE(v_settings.min_gross_for_fee, 2) THEN
    RETURN 0;
  END IF;

  v_fee := GREATEST(
    COALESCE(v_settings.min_fee_credits, 1),
    (p_gross * COALESCE(v_settings.fee_bps, 200) + 9999) / 10000
  );

  RETURN LEAST(v_fee, p_gross - 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_platform_treasury(
  p_fee_credits integer,
  p_source text,
  p_reference_id uuid,
  p_gross integer,
  p_net integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_fee_credits IS NULL OR p_fee_credits <= 0 THEN
    RETURN;
  END IF;

  UPDATE public.platform_treasury
  SET credits_balance = credits_balance + p_fee_credits,
      updated_at = now()
  WHERE id = 'main';

  INSERT INTO public.platform_fee_ledger (
    source, reference_id, gross_credits, fee_credits, net_credits, metadata
  )
  VALUES (
    p_source, p_reference_id, COALESCE(p_gross, 0), p_fee_credits, COALESCE(p_net, 0), COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- Marketplace checkout: buyer pays gross; seller receives net; fee → treasury
CREATE OR REPLACE FUNCTION public.marketplace_credit_purchase(
  p_listing_id uuid,
  p_buyer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.marketplace_listings%ROWTYPE;
  v_buyer_credits integer;
  v_seller_credits integer;
  v_price integer;
  v_fee integer;
  v_net integer;
  v_invoice text;
  v_purchase_id uuid;
  v_asset_id uuid;
  v_asset_credit integer;
  v_meta jsonb;
BEGIN
  IF p_buyer_id IS NULL OR p_listing_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF COALESCE(v_listing.status, 'ACTIVE') NOT IN ('ACTIVE', 'active', 'AVAILABLE') THEN
    RAISE EXCEPTION 'listing_unavailable';
  END IF;

  IF v_listing.owner_id = p_buyer_id THEN
    RAISE EXCEPTION 'cannot_buy_own_listing';
  END IF;

  v_price := GREATEST(0, COALESCE(v_listing.price, 0)::integer);

  IF v_price > 100 THEN
    RAISE EXCEPTION 'price_exceeds_cap';
  END IF;

  v_fee := public.compute_platform_fee_credits(v_price);
  v_net := GREATEST(0, v_price - v_fee);

  SELECT espeezy_credits INTO v_buyer_credits FROM public.profiles WHERE id = p_buyer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'buyer_not_found';
  END IF;

  IF v_price > 0 AND COALESCE(v_buyer_credits, 0) < v_price THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  SELECT espeezy_credits INTO v_seller_credits FROM public.profiles WHERE id = v_listing.owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'seller_not_found';
  END IF;

  v_asset_id := NULL;
  v_asset_credit := v_price;

  SELECT pa.id,
         COALESCE(
           NULLIF((pa.metadata->>'credit_value')::integer, 0),
           v_price
         )
  INTO v_asset_id, v_asset_credit
  FROM public.personal_assets pa
  WHERE pa.user_id = v_listing.owner_id
    AND pa.metadata->>'marketplace_listing_id' = p_listing_id::text
  LIMIT 1;

  UPDATE public.marketplace_listings
  SET status = 'SOLD'
  WHERE id = p_listing_id;

  v_invoice := 'EZ-MP-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  v_meta := jsonb_build_object(
    'meetup_zone', v_listing.meetup_zone,
    'payment_method', v_listing.payment_method,
    'asset_credit_value', v_asset_credit,
    'source_personal_asset_id', v_asset_id,
    'platform_fee_credits', v_fee,
    'seller_net_credits', v_net
  );

  INSERT INTO public.marketplace_purchases (
    listing_id, buyer_id, seller_id, credits_amount, platform_fee_credits, seller_net_credits,
    invoice_number, listing_title, listing_category, metadata
  )
  VALUES (
    p_listing_id, p_buyer_id, v_listing.owner_id, v_price, v_fee, v_net, v_invoice,
    v_listing.title, v_listing.category,
    v_meta
  )
  RETURNING id INTO v_purchase_id;

  IF v_price > 0 THEN
    UPDATE public.profiles SET espeezy_credits = espeezy_credits - v_price WHERE id = p_buyer_id;
    IF v_net > 0 THEN
      UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_net WHERE id = v_listing.owner_id;
    END IF;
    PERFORM public.credit_platform_treasury(
      v_fee, 'marketplace', v_purchase_id, v_price, v_net,
      jsonb_build_object('listing_id', p_listing_id, 'buyer_id', p_buyer_id, 'seller_id', v_listing.owner_id)
    );
  END IF;

  SELECT espeezy_credits INTO v_buyer_credits FROM public.profiles WHERE id = p_buyer_id;
  SELECT espeezy_credits INTO v_seller_credits FROM public.profiles WHERE id = v_listing.owner_id;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'invoice_number', v_invoice,
    'credits_amount', v_price,
    'platform_fee_credits', v_fee,
    'seller_net_credits', v_net,
    'buyer_credits', v_buyer_credits,
    'seller_credits', v_seller_credits,
    'seller_id', v_listing.owner_id,
    'listing_title', v_listing.title,
    'asset_credit_value', v_asset_credit,
    'source_personal_asset_id', v_asset_id
  );
END;
$$;

-- Hustle release: worker receives net; fee → treasury
ALTER TABLE public.hustle_task_ledger
  DROP CONSTRAINT IF EXISTS hustle_task_ledger_kind_check;

ALTER TABLE public.hustle_task_ledger
  ADD CONSTRAINT hustle_task_ledger_kind_check
  CHECK (kind IN ('escrow_in', 'release', 'refund', 'platform_fee'));

CREATE OR REPLACE FUNCTION public.hustle_task_release_payment(p_task_id uuid, p_poster_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.hustle_tasks%ROWTYPE;
  v_amount integer;
  v_fee integer;
  v_net integer;
BEGIN
  SELECT * INTO v_task FROM public.hustle_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;
  IF v_task.poster_id <> p_poster_id THEN RAISE EXCEPTION 'not_poster'; END IF;
  IF v_task.assignee_id IS NULL THEN RAISE EXCEPTION 'no_assignee'; END IF;
  IF v_task.status NOT IN ('submitted', 'approved') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  v_amount := v_task.escrow_credits;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'not_funded'; END IF;

  v_fee := public.compute_platform_fee_credits(v_amount);
  v_net := GREATEST(0, v_amount - v_fee);

  IF v_net > 0 THEN
    UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_net WHERE id = v_task.assignee_id;
  END IF;

  PERFORM public.credit_platform_treasury(
    v_fee, 'hustle', p_task_id, v_amount, v_net,
    jsonb_build_object('task_id', p_task_id, 'assignee_id', v_task.assignee_id, 'poster_id', p_poster_id)
  );

  UPDATE public.hustle_tasks
  SET status = 'paid', escrow_credits = 0, updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.hustle_task_ledger (task_id, from_user_id, to_user_id, credits_amount, kind)
  VALUES (p_task_id, p_poster_id, v_task.assignee_id, v_net, 'release');

  IF v_fee > 0 THEN
    INSERT INTO public.hustle_task_ledger (task_id, from_user_id, credits_amount, kind)
    VALUES (p_task_id, p_poster_id, v_fee, 'platform_fee');
  END IF;

  RETURN jsonb_build_object(
    'status', 'paid',
    'gross_credits', v_amount,
    'platform_fee_credits', v_fee,
    'worker_net_credits', v_net,
    'worker_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = v_task.assignee_id),
    'poster_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = p_poster_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.compute_platform_fee_credits(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_platform_treasury(integer, text, uuid, integer, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_platform_fee_credits(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_platform_treasury(integer, text, uuid, integer, integer, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.hustle_task_release_payment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hustle_task_release_payment(uuid, uuid) TO service_role;
