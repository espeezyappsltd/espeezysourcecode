-- Migration: Admin System & Visibility Encryption
-- Enables administrative control and privacy masking

-- 1. Update Profiles with Role
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'collaborator' CHECK (role IN ('admin', 'collaborator'));

-- 2. Update Groups with Encryption Flag
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- 3. Enhance RLS for Administrative Control
-- Admins can update the group_id (kick) and role of anyone in their group
-- Security Rule: Collaborators cannot kick Admins or each other.

-- Policy: Admin can update group profiles for members in the same group
CREATE POLICY "Admins can manage group members" ON public.profiles
FOR UPDATE
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  group_id IN (
    SELECT group_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: The existing "Users can update own profile" policy still applies.
-- We might need to ensure collaborators can't change their own role to admin.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND (
    -- Prevent role escalation: current role must match new role unless they are already admin
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);
