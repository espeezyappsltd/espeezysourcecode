-- Rename phone_e164 → email for environments that applied the earlier column name

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_login_otps'
      AND column_name = 'phone_e164'
  ) THEN
    ALTER TABLE public.admin_login_otps RENAME COLUMN phone_e164 TO email;
  END IF;
END $$;

COMMENT ON TABLE public.admin_login_otps IS 'Hashed OTP codes for panel.espeezy.com staff email login.';
COMMENT ON COLUMN public.admin_login_otps.email IS 'Roster email the code was sent to (lowercase).';
