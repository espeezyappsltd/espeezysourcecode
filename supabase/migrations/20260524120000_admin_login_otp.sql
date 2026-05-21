-- Staff panel login OTP (username + registered phone → code → session)

CREATE TABLE IF NOT EXISTS public.admin_login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_member_id uuid NOT NULL REFERENCES public.admin_members(id) ON DELETE CASCADE,
  username text NOT NULL,
  phone_e164 text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS admin_login_otps_member_created_idx
  ON public.admin_login_otps (admin_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_login_otps_active_idx
  ON public.admin_login_otps (admin_member_id, expires_at DESC)
  WHERE consumed_at IS NULL;

COMMENT ON TABLE public.admin_login_otps IS 'Hashed OTP codes for panel.espeezy.com staff phone login.';

ALTER TABLE public.admin_login_otps ENABLE ROW LEVEL SECURITY;
