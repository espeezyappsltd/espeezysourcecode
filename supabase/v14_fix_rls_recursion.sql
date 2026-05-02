-- Migration: v14_fix_rls_recursion
-- Description: Resolves infinite recursion in RLS policies by using a security definer helper.

-- 1. Create a helper function to bypass RLS for group identification
CREATE OR REPLACE FUNCTION public.get_my_group_id()
RETURNS uuid AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view group profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update group tasks" ON public.tasks;

-- 3. Re-implement cleaned Policies using the helper
-- Profiles: Allow viewing self or anyone in the same group
CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR group_id = get_my_group_id()
);

-- Tasks: Allow viewing tasks in your group
CREATE POLICY "Users can view group tasks" ON public.tasks FOR SELECT USING (
    group_id = get_my_group_id()
);

-- Tasks: Allow inserting tasks into your group
CREATE POLICY "Users can insert group tasks" ON public.tasks FOR INSERT WITH CHECK (
    group_id = get_my_group_id()
);

-- Tasks: Allow updating tasks in your group
CREATE POLICY "Users can update group tasks" ON public.tasks FOR UPDATE USING (
    group_id = get_my_group_id()
);

-- 4. Verification Check
COMMENT ON FUNCTION public.get_my_group_id IS 'Bypasses RLS to allow efficient group-based access control without recursion.';
