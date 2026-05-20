-- Verifiable marketplace documents with snapshotted party names.

ALTER TABLE public.marketplace_purchases
  ADD COLUMN IF NOT EXISTS verify_token text,
  ADD COLUMN IF NOT EXISTS buyer_display_name text,
  ADD COLUMN IF NOT EXISTS seller_display_name text;

UPDATE public.marketplace_purchases
SET verify_token = encode(gen_random_bytes(24), 'hex')
WHERE verify_token IS NULL;

ALTER TABLE public.marketplace_purchases
  ALTER COLUMN verify_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_purchases_verify_token_uidx
  ON public.marketplace_purchases (verify_token);

COMMENT ON COLUMN public.marketplace_purchases.verify_token IS 'Public verification token for invoice/receipt authenticity.';
COMMENT ON COLUMN public.marketplace_purchases.buyer_display_name IS 'Buyer legal/display name at time of purchase.';
COMMENT ON COLUMN public.marketplace_purchases.seller_display_name IS 'Seller legal/display name at time of purchase.';

-- Credit fund receipts (tier top-ups) — downloadable & verifiable.
ALTER TABLE public.credit_fund_checkouts
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS verify_token text,
  ADD COLUMN IF NOT EXISTS user_display_name text;

UPDATE public.credit_fund_checkouts
SET
  verify_token = COALESCE(verify_token, encode(gen_random_bytes(24), 'hex')),
  receipt_number = COALESCE(
    receipt_number,
    'EZ-CF-' || to_char(COALESCE(completed_at, created_at), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0')
  )
WHERE status = 'completed';

CREATE UNIQUE INDEX IF NOT EXISTS credit_fund_checkouts_verify_token_uidx
  ON public.credit_fund_checkouts (verify_token)
  WHERE verify_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS credit_fund_checkouts_receipt_number_uidx
  ON public.credit_fund_checkouts (receipt_number)
  WHERE receipt_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.profile_display_name(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_username text;
  v_email text;
BEGIN
  SELECT
    NULLIF(trim(full_name), ''),
    NULLIF(trim(username), ''),
    NULLIF(trim(COALESCE(email, espeezy_email)), '')
  INTO v_name, v_username, v_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  IF v_username IS NOT NULL THEN
    IF left(v_username, 1) = '@' THEN
      RETURN v_username;
    END IF;
    RETURN '@' || v_username;
  END IF;
  IF v_email IS NOT NULL THEN
    RETURN split_part(v_email, '@', 1);
  END IF;
  RETURN 'Unknown user';
END;
$$;

-- Snapshot party names + verify token on each purchase.
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
  v_verify text;
  v_purchase_id uuid;
  v_asset_id uuid;
  v_asset_credit integer;
  v_meta jsonb;
  v_qty_left integer;
  v_is_physical boolean;
  v_buyer_name text;
  v_seller_name text;
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

  v_buyer_name := public.profile_display_name(p_buyer_id);
  v_seller_name := public.profile_display_name(v_listing.owner_id);

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
  v_verify := encode(gen_random_bytes(24), 'hex');

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
    'quantity_remaining', v_qty_left,
    'buyer_display_name', v_buyer_name,
    'seller_display_name', v_seller_name
  );

  INSERT INTO public.marketplace_purchases (
    listing_id, buyer_id, seller_id, credits_amount, platform_fee_credits, seller_net_credits,
    invoice_number, listing_title, listing_category, metadata,
    verify_token, buyer_display_name, seller_display_name
  )
  VALUES (
    p_listing_id, p_buyer_id, v_listing.owner_id, v_price, v_fee, v_net, v_invoice,
    v_listing.title, v_listing.category,
    v_meta,
    v_verify, v_buyer_name, v_seller_name
  )
  RETURNING id INTO v_purchase_id;

  IF v_price > 0 THEN
    UPDATE public.profiles SET espeezy_credits = espeezy_credits - v_price WHERE id = p_buyer_id;
    IF v_net > 0 THEN
      UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_net WHERE id = v_listing.owner_id;
    END IF;
    PERFORM public.credit_platform_treasury(
      v_fee, 'marketplace', v_purchase_id, v_price, v_net,
      jsonb_build_object(
        'listing_id', p_listing_id,
        'buyer_id', p_buyer_id,
        'seller_id', v_listing.owner_id,
        'buyer_display_name', v_buyer_name,
        'seller_display_name', v_seller_name
      )
    );
  END IF;

  SELECT espeezy_credits INTO v_buyer_credits FROM public.profiles WHERE id = p_buyer_id;
  SELECT espeezy_credits INTO v_seller_credits FROM public.profiles WHERE id = v_listing.owner_id;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'invoice_number', v_invoice,
    'verify_token', v_verify,
    'buyer_display_name', v_buyer_name,
    'seller_display_name', v_seller_name,
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
