-- Migration: v31_connections_logic_fix
-- Description: relaxes RLS for user_connections to allow recipients to accept/decline requests.

-- 1. Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.user_connections;

-- 2. Create bidirectional policies
CREATE POLICY "Users can view relevant connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_id);

CREATE POLICY "Users can manage relevant connections" ON public.user_connections
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = target_id);

-- 3. Ensure status constraint is correct (v19 might have done this, but let's be double sure)
ALTER TABLE public.user_connections DROP CONSTRAINT IF EXISTS user_connections_status_check;
ALTER TABLE public.user_connections ADD CONSTRAINT user_connections_status_check 
    CHECK (status IN ('potential', 'pending', 'connected', 'ignored', 'accepted'));
