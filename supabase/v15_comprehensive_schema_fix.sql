-- Migration: v15_comprehensive_schema_fix
-- Description: Ensures tasks table matches application requirements and fixes RLS recursion.

-- 1. Ensure columns exist on public.tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignees UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS score_awarded BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Implementation';

-- 2. Create the RLS helper if not exists (bypasses recursion)
CREATE OR REPLACE FUNCTION public.get_my_group_id()
RETURNS uuid AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Reset policies to ensure they use the non-recursive helper
DROP POLICY IF EXISTS "Users can view group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert group tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update group tasks" ON public.tasks;

CREATE POLICY "Users can view group tasks" ON public.tasks FOR SELECT USING (
    group_id = get_my_group_id()
);

CREATE POLICY "Users can insert group tasks" ON public.tasks FOR INSERT WITH CHECK (
    group_id = get_my_group_id()
);

CREATE POLICY "Users can update group tasks" ON public.tasks FOR UPDATE USING (
    group_id = get_my_group_id()
);

-- 4. Fix profiles RLS recursion as well
DROP POLICY IF EXISTS "Users can view group profiles" ON public.profiles;
CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR group_id = get_my_group_id()
);

-- 5. Verification Comment
COMMENT ON TABLE public.tasks IS 'Task orchestration table with multi-assignee support and non-recursive RLS.';
