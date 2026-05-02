-- Add description and rules columns to groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS rules TEXT;

-- Update RLS policies to allow group leaders (admins) to update these fields
CREATE POLICY "Group leaders can edit metadata" 
ON public.groups 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND group_id = groups.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND group_id = groups.id
  )
);

COMMENT ON COLUMN public.groups.description IS 'Scientific mission or project overview set by the leader.';
COMMENT ON COLUMN public.groups.rules IS 'Protocol and group rules set by the leader.';
