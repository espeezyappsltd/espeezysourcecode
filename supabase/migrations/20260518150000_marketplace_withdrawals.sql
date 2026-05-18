-- Marketplace cash withdrawals tied to asset value × sales count (tracked per purchase).

CREATE TABLE IF NOT EXISTS public.marketplace_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_withdrawals_user_created_idx
  ON public.marketplace_withdrawals (user_id, created_at DESC);

ALTER TABLE public.marketplace_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_withdrawals_owner_select ON public.marketplace_withdrawals;
CREATE POLICY marketplace_withdrawals_owner_select ON public.marketplace_withdrawals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.marketplace_withdrawals IS 'Cash withdrawals from marketplace earnings (asset value × times sold).';

-- Enrich purchase metadata with linked arsenal asset + credit value at sale time.
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

  IF v_price > 0 THEN
    UPDATE public.profiles SET espeezy_credits = espeezy_credits - v_price WHERE id = p_buyer_id;
    UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_price WHERE id = v_listing.owner_id;
  END IF;

  UPDATE public.marketplace_listings
  SET status = 'SOLD'
  WHERE id = p_listing_id;

  v_invoice := 'EZ-MP-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  v_meta := jsonb_build_object(
    'meetup_zone', v_listing.meetup_zone,
    'payment_method', v_listing.payment_method,
    'asset_credit_value', v_asset_credit,
    'source_personal_asset_id', v_asset_id
  );

  INSERT INTO public.marketplace_purchases (
    listing_id, buyer_id, seller_id, credits_amount, invoice_number,
    listing_title, listing_category, metadata
  )
  VALUES (
    p_listing_id, p_buyer_id, v_listing.owner_id, v_price, v_invoice,
    v_listing.title, v_listing.category,
    v_meta
  )
  RETURNING id INTO v_purchase_id;

  SELECT espeezy_credits INTO v_buyer_credits FROM public.profiles WHERE id = p_buyer_id;
  SELECT espeezy_credits INTO v_seller_credits FROM public.profiles WHERE id = v_listing.owner_id;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'invoice_number', v_invoice,
    'credits_amount', v_price,
    'buyer_credits', v_buyer_credits,
    'seller_credits', v_seller_credits,
    'seller_id', v_listing.owner_id,
    'listing_title', v_listing.title,
    'asset_credit_value', v_asset_credit,
    'source_personal_asset_id', v_asset_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) TO service_role;
