-- Kanban: allow group peers to read profiles and group members to manage tasks/artifacts.

-- Profiles: teammates in the same group can read each other (network, chat, assignees).
DROP POLICY IF EXISTS profiles_group_peers_select ON public.profiles;
CREATE POLICY profiles_group_peers_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      group_id IS NOT NULL
      AND group_id IN (
        SELECT p.group_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.group_id IS NOT NULL
      )
    )
  );

-- Tasks: group members can create and update tasks for their group.
DROP POLICY IF EXISTS tasks_group_member_insert ON public.tasks;
CREATE POLICY tasks_group_member_insert ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS tasks_group_member_update ON public.tasks;
CREATE POLICY tasks_group_member_update ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS tasks_group_member_delete ON public.tasks;
CREATE POLICY tasks_group_member_delete ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
    AND (
      created_by = auth.uid()
      OR auth.uid() = ANY (assignees)
      OR EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = tasks.group_id
          AND g.owner_id = auth.uid()
      )
    )
  );

-- Artifacts: group members can upload evidence for their group.
DROP POLICY IF EXISTS artifacts_group_member_insert ON public.artifacts;
CREATE POLICY artifacts_group_member_insert ON public.artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS artifacts_group_member_update ON public.artifacts;
CREATE POLICY artifacts_group_member_update ON public.artifacts
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR group_id IN (
      SELECT p.group_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS artifacts_group_member_delete ON public.artifacts;
CREATE POLICY artifacts_group_member_delete ON public.artifacts
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());
