-- Migration: v26_network_visibility
-- Description: Relax RLS on profiles to enable global academic discovery and cross-team networking.

-- 1. Drop the restrictive group-only policy
DROP POLICY IF EXISTS "Users can view group profiles" ON public.profiles;

-- 2. Create a high-visibility policy (Global Discovery)
-- This allows any authenticated user to view scholar profiles, which is 
-- necessary for the "Global Discovery" and "Personal Network" circular sections.
CREATE POLICY "Anyone can view scholar profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Ensure users can update their own data (Harden existing)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- 4. Comment for schema clarity
COMMENT ON TABLE public.profiles IS 'Student and researcher profiles with global visibility for academic networking.';
