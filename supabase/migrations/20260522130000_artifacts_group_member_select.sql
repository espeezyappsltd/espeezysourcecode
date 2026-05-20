-- Allow group members to read team artifacts (INSERT/UPDATE existed; SELECT was missing).
DROP POLICY IF EXISTS artifacts_group_member_select ON public.artifacts;
CREATE POLICY artifacts_group_member_select ON public.artifacts
  FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  );
