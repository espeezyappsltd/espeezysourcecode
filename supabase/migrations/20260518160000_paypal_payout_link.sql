-- PayPal payout account linking + withdrawal method on marketplace cash-outs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS paypal_account_status text NOT NULL DEFAULT 'unlinked',
  ADD COLUMN IF NOT EXISTS paypal_linked_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_payout_method text NOT NULL DEFAULT 'stripe';

COMMENT ON COLUMN public.profiles.paypal_email IS 'PayPal account email for marketplace withdrawals.';
COMMENT ON COLUMN public.profiles.paypal_account_status IS 'unlinked | linked | pending';
COMMENT ON COLUMN public.profiles.preferred_payout_method IS 'stripe | paypal — default cash-out rail.';

ALTER TABLE public.marketplace_withdrawals
  ADD COLUMN IF NOT EXISTS payout_method text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS paypal_payout_batch_id text,
  ADD COLUMN IF NOT EXISTS paypal_payout_item_id text;

COMMENT ON COLUMN public.marketplace_withdrawals.payout_method IS 'stripe | paypal';
