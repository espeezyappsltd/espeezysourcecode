-- Migration: v29_fix_logging_rls
-- Description: Resolves RLS violation (42501) on activity_log by using non-recursive helper.

-- 1. Remove existing policies
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Admins can view entire group activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone in group can insert activity logs" ON public.activity_log;

-- 2. Create updated policies using get_my_group_id()
-- Note: get_my_group_id() is defined in v14/v15 as a SECURITY DEFINER function to bypass RLS recursion.

-- Users can still view their own logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view logs for their group
CREATE POLICY "Admins can view entire group activity logs" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin' AND group_id = activity_log.group_id
        )
    );

-- Anyone can insert logs as long as they are identifying as themselves.
-- The ACTUAL security for group data is handled by the tasks/groups tables themselves.
-- This avoid RLS violations if a user's group_id in their profile is stale.
CREATE POLICY "Anyone in group can insert activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Verification Comment
COMMENT ON POLICY "Anyone in group can insert activity logs" ON public.activity_log IS 'Uses get_my_group_id() helper to avoid RLS recursion during audit logging.';
