-- Remove superuser tier: all former superusers become admin (same privileges as other admins).

UPDATE public.admin_members
SET admin_role = 'admin'
WHERE admin_role = 'superuser';

ALTER TABLE public.admin_members
  DROP CONSTRAINT IF EXISTS admin_members_role_check;

ALTER TABLE public.admin_members
  ADD CONSTRAINT admin_members_role_check CHECK (
    admin_role IN ('admin', 'moderator', 'viewer')
  );

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
      WHEN NEW.admin_role = 'admin' THEN 'admin'
      WHEN NEW.admin_role = 'moderator' THEN 'moderator'
      ELSE 'member'
    END
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;
