-- Smart marketplace: delivery types, quantity inventory, engagement, download grants.

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS delivery_kind text NOT NULL DEFAULT 'meetup',
  ADD COLUMN IF NOT EXISTS digital_url text,
  ADD COLUMN IF NOT EXISTS digital_content text,
  ADD COLUMN IF NOT EXISTS quantity_available integer,
  ADD COLUMN IF NOT EXISTS purchase_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_platform_seed boolean NOT NULL DEFAULT false;

ALTER TABLE public.marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_listing_type_check;

ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listings_listing_type_check
  CHECK (listing_type IN ('physical', 'digital'));

ALTER TABLE public.marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_delivery_kind_check;

ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listings_delivery_kind_check
  CHECK (delivery_kind IN ('meetup', 'file', 'link'));

UPDATE public.marketplace_listings
SET
  quantity_available = CASE
    WHEN COALESCE(listing_type, 'physical') = 'physical' THEN 1
    ELSE GREATEST(1, COALESCE(quantity, 1))
  END
WHERE quantity_available IS NULL;

UPDATE public.marketplace_listings
SET listing_type = 'physical', delivery_kind = 'meetup'
WHERE listing_type IS NULL OR delivery_kind IS NULL;

CREATE INDEX IF NOT EXISTS marketplace_listings_engagement_idx
  ON public.marketplace_listings (engagement_score DESC, created_at DESC)
  WHERE status IN ('AVAILABLE', 'ACTIVE', 'active');

CREATE INDEX IF NOT EXISTS marketplace_listings_platform_seed_idx
  ON public.marketplace_listings (is_platform_seed, category)
  WHERE is_platform_seed = true;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_purchases_buyer_listing_uidx
  ON public.marketplace_purchases (listing_id, buyer_id);

-- Replace checkout RPC: physical = one sale; digital = quantity-based; duplicate buyer blocked.
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
  v_qty_left integer;
  v_is_physical boolean;
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

  IF EXISTS (
    SELECT 1 FROM public.marketplace_purchases mp
    WHERE mp.listing_id = p_listing_id AND mp.buyer_id = p_buyer_id
  ) THEN
    RAISE EXCEPTION 'already_purchased';
  END IF;

  v_is_physical := COALESCE(v_listing.listing_type, 'physical') = 'physical';

  v_qty_left := COALESCE(
    v_listing.quantity_available,
    CASE WHEN v_is_physical THEN 1 ELSE GREATEST(1, COALESCE(v_listing.quantity, 1)) END
  );

  IF v_qty_left <= 0 THEN
    RAISE EXCEPTION 'listing_unavailable';
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
         COALESCE(NULLIF((pa.metadata->>'credit_value')::integer, 0), v_price)
  INTO v_asset_id, v_asset_credit
  FROM public.personal_assets pa
  WHERE pa.user_id = v_listing.owner_id
    AND pa.metadata->>'marketplace_listing_id' = p_listing_id::text
  LIMIT 1;

  v_qty_left := v_qty_left - 1;

  UPDATE public.marketplace_listings
  SET
    quantity_available = v_qty_left,
    purchase_count = COALESCE(purchase_count, 0) + 1,
    engagement_score = COALESCE(engagement_score, 0) + 10,
    status = CASE WHEN v_qty_left <= 0 THEN 'SOLD' ELSE COALESCE(status, 'AVAILABLE') END
  WHERE id = p_listing_id;

  v_invoice := 'EZ-MP-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  v_meta := jsonb_build_object(
    'meetup_zone', v_listing.meetup_zone,
    'payment_method', v_listing.payment_method,
    'listing_type', COALESCE(v_listing.listing_type, 'physical'),
    'delivery_kind', COALESCE(v_listing.delivery_kind, 'meetup'),
    'digital_url', v_listing.digital_url,
    'has_digital_content', (v_listing.digital_content IS NOT NULL AND length(v_listing.digital_content) > 0),
    'asset_credit_value', v_asset_credit,
    'source_personal_asset_id', v_asset_id,
    'platform_fee_credits', v_fee,
    'seller_net_credits', v_net,
    'quantity_remaining', v_qty_left
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
    'source_personal_asset_id', v_asset_id,
    'listing_type', COALESCE(v_listing.listing_type, 'physical'),
    'delivery_kind', COALESCE(v_listing.delivery_kind, 'meetup'),
    'quantity_remaining', v_qty_left
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) TO service_role;
