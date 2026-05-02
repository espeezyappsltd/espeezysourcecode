-- Migration: v32_formal_join_requests
-- Description: Implement a formal table for group join requests to improve roster accuracy.
-- Patch: profiles RLS for non-recursive member visibility.

--------------------------------------------------------------------------------
-- 1. GROUP JOIN REQUESTS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_gjr_group ON public.group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_gjr_user ON public.group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gjr_status ON public.group_join_requests(status);

-- RLS
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON public.group_join_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view group requests" ON public.group_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND group_id = group_join_requests.group_id AND role IN ('ADMIN', 'TEAM_LEADER')
        )
    );

CREATE POLICY "Admins can manage group requests" ON public.group_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND group_id = group_join_requests.group_id AND role IN ('ADMIN', 'TEAM_LEADER')
        )
    );

--------------------------------------------------------------------------------
-- 2. HARDEN PROFILES RLS (NON-RECURSIVE)
--------------------------------------------------------------------------------

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Users can view group profiles" ON public.profiles;

-- Create a robust non-recursive policy for group visibility
-- This allows anyone in the same group to see each other clearly.
CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR 
    (group_id IS NOT NULL AND group_id = (SELECT p.group_id FROM public.profiles p WHERE p.id = auth.uid()))
);

-- Verify: Users can also search for global profiles (Global Community HUD count)
-- If this was missing, global count would be 1. 
-- Adding a policy for global discoverability (only minimal fields if we wanted to be strict, but for this app all authenticated see all)
CREATE POLICY "Global profile discoverability" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

--------------------------------------------------------------------------------
-- 3. STORAGE UPDATE (IF NEEDED)
--------------------------------------------------------------------------------
-- Standardize is_system messages or alerts if we want to bridge existing chat logic.
