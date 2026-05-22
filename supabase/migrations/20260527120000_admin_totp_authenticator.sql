-- Staff panel: authenticator app (TOTP) instead of emailed/SMS OTP codes

ALTER TABLE public.admin_members
  ADD COLUMN IF NOT EXISTS totp_secret_enc text,
  ADD COLUMN IF NOT EXISTS totp_enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS totp_verify_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS totp_locked_until timestamptz;

COMMENT ON COLUMN public.admin_members.totp_secret_enc IS 'AES-256-GCM encrypted base32 TOTP secret for authenticator apps.';
COMMENT ON COLUMN public.admin_members.totp_enrolled_at IS 'When authenticator MFA was enrolled for panel login.';
COMMENT ON COLUMN public.admin_members.totp_verify_attempts IS 'Failed TOTP attempts since last successful login (reset on success).';
COMMENT ON COLUMN public.admin_members.totp_locked_until IS 'Temporary lockout after too many failed TOTP attempts.';
