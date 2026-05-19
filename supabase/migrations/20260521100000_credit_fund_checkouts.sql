-- Idempotent Stripe credit top-up ledger (credits applied only after webhook confirms paid)

CREATE TABLE IF NOT EXISTS public.credit_fund_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  amount_gbp numeric(10, 2) NOT NULL CHECK (amount_gbp >= 2),
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  return_path text,
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_credit_fund_checkouts_user_id ON public.credit_fund_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_fund_checkouts_status ON public.credit_fund_checkouts(status);

ALTER TABLE public.credit_fund_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_fund_checkouts_select_own ON public.credit_fund_checkouts
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.credit_fund_checkouts IS 'Stripe credit account funding sessions; balance updates only when status=completed via webhook.';
