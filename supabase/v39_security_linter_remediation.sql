-- Migration: v39_security_linter_remediation
-- Description: Remediates Supabase linter warnings for mutable function search_path,
-- permissive RLS policies, extension placement, and public bucket listing.

-- 1) Pin function search paths to immutable, safe paths
DO $$
BEGIN
  IF to_regprocedure('public.generate_invoice_number()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.generate_invoice_number() SET search_path = public, pg_temp';
  END IF;

  IF to_regprocedure('public.calculate_user_level()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.calculate_user_level() SET search_path = public, pg_temp';
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp';
  END IF;

  -- smart_search relies on pg_trgm operators/functions, so include extensions schema explicitly
  IF to_regprocedure('public.smart_search(text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.smart_search(text) SET search_path = public, extensions, pg_temp';
  END IF;
END;
$$;

-- 2) Move pg_trgm extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'ALTER EXTENSION pg_trgm SET SCHEMA extensions';
  ELSE
    EXECUTE 'CREATE EXTENSION pg_trgm WITH SCHEMA extensions';
  END IF;
END;
$$;

-- 3) Remove overly permissive policies (USING/WITH CHECK = true) from flagged tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['artifacts', 'commits', 'groups', 'notifications', 'tasks'])
      AND (
        (
          cmd IN ('ALL', 'UPDATE', 'DELETE')
          AND lower(coalesce(qual, '')) IN ('true', '(true)')
        )
        OR
        (
          cmd IN ('ALL', 'INSERT')
          AND lower(coalesce(with_check, '')) IN ('true', '(true)')
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- 4) Harden table policies
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- groups
DROP POLICY IF EXISTS groups_authenticated_select ON public.groups;
CREATE POLICY groups_authenticated_select
ON public.groups
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS groups_authenticated_insert ON public.groups;
CREATE POLICY groups_authenticated_insert
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS groups_admin_update ON public.groups;
CREATE POLICY groups_admin_update
ON public.groups
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.group_id = groups.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.group_id = groups.id
  )
);

DROP POLICY IF EXISTS groups_admin_delete ON public.groups;
CREATE POLICY groups_admin_delete
ON public.groups
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.group_id = groups.id
  )
);

-- tasks
DROP POLICY IF EXISTS tasks_group_member_select ON public.tasks;
CREATE POLICY tasks_group_member_select
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.group_id = tasks.group_id
  )
);

DROP POLICY IF EXISTS tasks_group_member_insert ON public.tasks;
CREATE POLICY tasks_group_member_insert
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.group_id = tasks.group_id
  )
);

DROP POLICY IF EXISTS tasks_group_member_update ON public.tasks;
CREATE POLICY tasks_group_member_update
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.group_id = tasks.group_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.group_id = tasks.group_id
  )
);

DROP POLICY IF EXISTS tasks_group_member_delete ON public.tasks;
CREATE POLICY tasks_group_member_delete
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.group_id = tasks.group_id
  )
);

-- commits
DROP POLICY IF EXISTS commits_group_member_select ON public.commits;
CREATE POLICY commits_group_member_select
ON public.commits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = commits.task_id
  )
);

DROP POLICY IF EXISTS commits_group_member_insert ON public.commits;
CREATE POLICY commits_group_member_insert
ON public.commits
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = commits.task_id
  )
);

DROP POLICY IF EXISTS commits_group_member_update ON public.commits;
CREATE POLICY commits_group_member_update
ON public.commits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = commits.task_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = commits.task_id
  )
);

DROP POLICY IF EXISTS commits_group_member_delete ON public.commits;
CREATE POLICY commits_group_member_delete
ON public.commits
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = commits.task_id
  )
);

-- artifacts
DROP POLICY IF EXISTS artifacts_group_member_select ON public.artifacts;
CREATE POLICY artifacts_group_member_select
ON public.artifacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = artifacts.task_id
  )
);

DROP POLICY IF EXISTS artifacts_group_member_insert ON public.artifacts;
CREATE POLICY artifacts_group_member_insert
ON public.artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = artifacts.task_id
  )
);

DROP POLICY IF EXISTS artifacts_group_member_update ON public.artifacts;
CREATE POLICY artifacts_group_member_update
ON public.artifacts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = artifacts.task_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = artifacts.task_id
  )
);

DROP POLICY IF EXISTS artifacts_group_member_delete ON public.artifacts;
CREATE POLICY artifacts_group_member_delete
ON public.artifacts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.group_id = t.group_id
    WHERE p.id = auth.uid()
      AND t.id = artifacts.task_id
  )
);

-- notifications
DROP POLICY IF EXISTS notifications_owner_select ON public.notifications;
CREATE POLICY notifications_owner_select
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_owner_insert ON public.notifications;
CREATE POLICY notifications_owner_insert
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5) Remove broad SELECT listing policies on public bucket groupflow_assets
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        lower(coalesce(qual, '')) IN ('true', '(true)')
        OR lower(coalesce(qual, '')) LIKE '%bucket_id = ''groupflow_assets''%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to avoid extension_in_public linter warnings.';
