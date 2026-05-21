-- Team leads with role team_leader (lowercase) must see pending join requests

DROP POLICY IF EXISTS group_join_requests_select_own_or_team_admin ON public.group_join_requests;

CREATE POLICY group_join_requests_select_own_or_team_admin ON public.group_join_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'team_leader', 'team leader')
    )
  );
