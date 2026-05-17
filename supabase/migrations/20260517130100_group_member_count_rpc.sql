-- Capacity check for join onboarding without exposing full profile rows.

CREATE OR REPLACE FUNCTION public.group_member_count(target_group_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.profiles
  WHERE group_id = target_group_id;
$$;

REVOKE ALL ON FUNCTION public.group_member_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.group_member_count(uuid) TO authenticated;
