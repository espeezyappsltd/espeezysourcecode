-- Fix infinite RLS recursion: never SELECT from the same table inside its own policy.
-- Use SECURITY DEFINER helpers that bypass RLS for stable auth context lookups.

-- Current user's group (bypasses profiles RLS).
CREATE OR REPLACE FUNCTION public.current_user_group_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Whether the signed-in user is an active admin staff member (bypasses admin_members RLS).
CREATE OR REPLACE FUNCTION public.auth_is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_members
    WHERE id = auth.uid()
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_group_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_group_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_active_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_group_peers_select ON public.profiles;
CREATE POLICY profiles_group_peers_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id <> auth.uid()
    AND group_id IS NOT NULL
    AND public.current_user_group_id() IS NOT NULL
    AND group_id = public.current_user_group_id()
  );

-- ---------------------------------------------------------------------------
-- tasks (group_id from helper, not profiles subquery)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tasks_group_member_insert ON public.tasks;
CREATE POLICY tasks_group_member_insert ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  );

DROP POLICY IF EXISTS tasks_group_member_update ON public.tasks;
CREATE POLICY tasks_group_member_update ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  )
  WITH CHECK (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  );

DROP POLICY IF EXISTS tasks_group_member_delete ON public.tasks;
CREATE POLICY tasks_group_member_delete ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
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

-- ---------------------------------------------------------------------------
-- artifacts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS artifacts_group_member_insert ON public.artifacts;
CREATE POLICY artifacts_group_member_insert ON public.artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND group_id IS NOT DISTINCT FROM public.current_user_group_id()
    AND public.current_user_group_id() IS NOT NULL
  );

DROP POLICY IF EXISTS artifacts_group_member_update ON public.artifacts;
CREATE POLICY artifacts_group_member_update ON public.artifacts
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR (
      group_id IS NOT DISTINCT FROM public.current_user_group_id()
      AND public.current_user_group_id() IS NOT NULL
    )
  );

DROP POLICY IF EXISTS artifacts_group_member_delete ON public.artifacts;
CREATE POLICY artifacts_group_member_delete ON public.artifacts
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- ---------------------------------------------------------------------------
-- admin_members (no self-referential EXISTS)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_members_self_read ON public.admin_members;
CREATE POLICY admin_members_self_read ON public.admin_members
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.auth_is_active_admin());

-- ---------------------------------------------------------------------------
-- chat (admin/hub scopes)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS chat_messages_admin_staff_scope ON public.chat_messages;
CREATE POLICY chat_messages_admin_staff_scope ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (
    app_scope NOT IN ('admin', 'hub')
    OR public.auth_is_active_admin()
  )
  WITH CHECK (
    app_scope NOT IN ('admin', 'hub')
    OR public.auth_is_active_admin()
  );

DROP POLICY IF EXISTS chat_events_admin_staff_scope ON public.chat_events;
CREATE POLICY chat_events_admin_staff_scope ON public.chat_events
  FOR ALL
  TO authenticated
  USING (
    app_scope NOT IN ('admin', 'hub')
    OR public.auth_is_active_admin()
  )
  WITH CHECK (
    app_scope NOT IN ('admin', 'hub')
    OR public.auth_is_active_admin()
  );

-- ---------------------------------------------------------------------------
-- admin vault storage
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_vault_storage_owner ON storage.objects;
CREATE POLICY admin_vault_storage_owner ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'admin-vault'
    AND public.auth_is_active_admin()
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'admin-vault'
    AND public.auth_is_active_admin()
    AND name LIKE auth.uid()::text || '/%'
  );
