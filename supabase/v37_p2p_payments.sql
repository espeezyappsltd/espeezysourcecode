-- =============================================================================
-- v37 — Peer-to-Peer Payment Infrastructure
-- Safe, idempotent. Run against Supabase Postgres.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add espeezy_email alias column to profiles
--    Derived from full_name: e.g. john_doe -> john_doe@espeezy.com
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS espeezy_email text GENERATED ALWAYS AS (
    CASE WHEN full_name IS NOT NULL THEN full_name || '@espeezy.com' ELSE NULL END
  ) STORED;

COMMENT ON COLUMN public.profiles.espeezy_email IS 'Virtual Espeezy platform email: full_name@espeezy.com. Used for transaction receipts and platform identity.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_espeezy_email
  ON public.profiles(espeezy_email)
  WHERE espeezy_email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. p2p_transfers — core ledger for all peer-to-peer payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.p2p_transfers (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recipient_id              uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_cents              integer     NOT NULL CHECK (amount_cents >= 100),   -- min $1.00
  fee_cents                 integer     NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  net_cents                 integer     NOT NULL CHECK (net_cents > 0),
  currency                  text        NOT NULL DEFAULT 'usd',
  note                      text        CHECK (char_length(note) <= 280),
  status                    text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','completed','failed','refunded')),
  -- Stripe artefacts
  stripe_checkout_session_id text       UNIQUE,
  stripe_payment_intent_id   text       UNIQUE,
  stripe_transfer_id         text       UNIQUE,
  -- Platform email snapshots at time of transfer
  sender_espeezy_email      text,
  recipient_espeezy_email   text,
  -- Timestamps
  created_at                timestamptz NOT NULL DEFAULT now(),
  completed_at              timestamptz,
  failed_at                 timestamptz,
  metadata                  jsonb       NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE public.p2p_transfers IS 'Immutable ledger of all peer-to-peer money transfers between Espeezy members.';
COMMENT ON COLUMN public.p2p_transfers.amount_cents IS 'Gross amount charged to sender in cents (USD).';
COMMENT ON COLUMN public.p2p_transfers.fee_cents IS 'Platform fee retained (2% of amount_cents, rounded up, min 25 cents).';
COMMENT ON COLUMN public.p2p_transfers.net_cents IS 'Amount received by recipient = amount_cents - fee_cents.';
COMMENT ON COLUMN public.p2p_transfers.sender_espeezy_email IS 'Snapshot of sender espeezy_email at transfer time for audit trail.';
COMMENT ON COLUMN public.p2p_transfers.recipient_espeezy_email IS 'Snapshot of recipient espeezy_email at transfer time for audit trail.';

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_p2p_sender    ON public.p2p_transfers(sender_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_p2p_recipient ON public.p2p_transfers(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_p2p_status    ON public.p2p_transfers(status);
CREATE INDEX IF NOT EXISTS idx_p2p_session   ON public.p2p_transfers(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.p2p_transfers ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything
DROP POLICY IF EXISTS p2p_transfers_admin_all ON public.p2p_transfers;
CREATE POLICY p2p_transfers_admin_all ON public.p2p_transfers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Members can only see their own transfers (sent or received)
DROP POLICY IF EXISTS p2p_transfers_user_own ON public.p2p_transfers;
CREATE POLICY p2p_transfers_user_own ON public.p2p_transfers
  FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Members cannot INSERT/UPDATE/DELETE directly — all writes via service-role
-- (no INSERT/UPDATE/DELETE user policy = denied by default)

-- ---------------------------------------------------------------------------
-- 4. Realtime publication
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'p2p_transfers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.p2p_transfers;
  END IF;
END $$;
