-- Espeezy credits for campus marketplace checkout
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS espeezy_credits integer NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.profiles.espeezy_credits IS 'Espeezy credits balance (50 ≈ 1 month Pro; max listing 100).';

CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  credits_amount integer NOT NULL DEFAULT 0 CHECK (credits_amount >= 0),
  invoice_number text NOT NULL UNIQUE,
  listing_title text NOT NULL,
  listing_category text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_purchases_buyer_idx ON public.marketplace_purchases (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_purchases_seller_idx ON public.marketplace_purchases (seller_id, created_at DESC);

ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_purchases_party_select ON public.marketplace_purchases
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Atomic credit purchase (service role or authenticated buyer)
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

  IF v_price > 0 THEN
    UPDATE public.profiles SET espeezy_credits = espeezy_credits - v_price WHERE id = p_buyer_id;
    UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_price WHERE id = v_listing.owner_id;
  END IF;

  UPDATE public.marketplace_listings
  SET status = 'SOLD'
  WHERE id = p_listing_id;

  v_invoice := 'EZ-MP-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  INSERT INTO public.marketplace_purchases (
    listing_id, buyer_id, seller_id, credits_amount, invoice_number,
    listing_title, listing_category, metadata
  )
  VALUES (
    p_listing_id, p_buyer_id, v_listing.owner_id, v_price, v_invoice,
    v_listing.title, v_listing.category,
    jsonb_build_object('meetup_zone', v_listing.meetup_zone, 'payment_method', v_listing.payment_method)
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
    'listing_title', v_listing.title
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketplace_credit_purchase(uuid, uuid) TO service_role;
