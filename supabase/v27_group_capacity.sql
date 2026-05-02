-- Migration: v27_group_capacity
-- Description: Add capacity limits to research teams.

-- 1. Add capacity column to groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 5;

-- 2. Add comment for clarity
COMMENT ON COLUMN public.groups.capacity IS 'Maximum number of members allowed in the research group.';

-- 3. (Optional) Harden groupjoining logic with a constraint/trigger would be complex in SQL, 
-- but we will handle it in the application logic (actions.ts) for better error feedback.
