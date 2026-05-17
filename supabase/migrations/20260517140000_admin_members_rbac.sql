-- Admin staff registry (max 20 active). Username aliases map to auth email (pete -> pete@espeezy.com).

CREATE TABLE IF NOT EXISTS public.admin_members (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  email text NOT NULL,
  admin_role text NOT NULL DEFAULT 'viewer',
  display_name text,
  title text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_members_username_format CHECK (username ~ '^[a-z0-9_]{3,24}$'),
  CONSTRAINT admin_members_role_check CHECK (
    admin_role IN ('superuser', 'admin', 'moderator', 'viewer')
  ),
  CONSTRAINT admin_members_username_unique UNIQUE (username),
  CONSTRAINT admin_members_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS admin_members_username_idx ON public.admin_members (username);
CREATE INDEX IF NOT EXISTS admin_members_active_idx ON public.admin_members (is_active) WHERE is_active = true;

COMMENT ON TABLE public.admin_members IS 'Espeezy admin staff (max 20 active). Links auth user + profiles row.';
COMMENT ON COLUMN public.admin_members.username IS 'Login alias (e.g. pete -> pete@espeezy.com).';

CREATE OR REPLACE FUNCTION public.enforce_admin_members_cap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM false
     AND (SELECT count(*)::int FROM public.admin_members WHERE is_active = true) >= 20 THEN
    RAISE EXCEPTION 'Maximum of 20 active admin members allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_members_cap ON public.admin_members;
CREATE TRIGGER admin_members_cap
  BEFORE INSERT OR UPDATE OF is_active ON public.admin_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_members_cap();

CREATE OR REPLACE FUNCTION public.touch_admin_members_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_members_updated_at ON public.admin_members;
CREATE TRIGGER admin_members_updated_at
  BEFORE UPDATE ON public.admin_members
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_admin_members_updated_at();

ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_members_self_read ON public.admin_members;
CREATE POLICY admin_members_self_read ON public.admin_members
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.admin_members am
      WHERE am.id = auth.uid()
        AND am.is_active = true
    )
  );

DROP POLICY IF EXISTS admin_members_self_presence ON public.admin_members;
CREATE POLICY admin_members_self_presence ON public.admin_members
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND is_active = true)
  WITH CHECK (id = auth.uid());

-- Sync profiles.role for legacy checks (least surprise).
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_admin_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.profiles
    SET role = CASE
      WHEN NEW.admin_role = 'superuser' THEN 'admin'
      WHEN NEW.admin_role = 'admin' THEN 'admin'
      WHEN NEW.admin_role = 'moderator' THEN 'moderator'
      ELSE 'member'
    END
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_members_sync_profile_role ON public.admin_members;
CREATE TRIGGER admin_members_sync_profile_role
  AFTER INSERT OR UPDATE OF admin_role, is_active ON public.admin_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_from_admin_member();
