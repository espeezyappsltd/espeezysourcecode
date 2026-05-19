-- Health probe for profiles Realtime (used by GET /api/health/profile-realtime).
CREATE OR REPLACE FUNCTION public.check_profiles_realtime_setup()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'in_realtime_publication',
    EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'profiles'
    ),
    'replica_identity_full',
    COALESCE(
      (
        SELECT c.relreplident = 'f'
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'profiles'
      ),
      false
    )
  );
$$;

REVOKE ALL ON FUNCTION public.check_profiles_realtime_setup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_profiles_realtime_setup() TO authenticated, service_role;
