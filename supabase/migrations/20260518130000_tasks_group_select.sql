-- Allow group members to read tasks on their Kanban board (INSERT/UPDATE existed; SELECT was missing).
DROP POLICY IF EXISTS tasks_group_member_select ON public.tasks;
CREATE POLICY tasks_group_member_select ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  );
