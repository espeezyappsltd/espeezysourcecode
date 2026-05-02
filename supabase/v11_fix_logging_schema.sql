-- Migration: v11_fix_logging_schema
-- Description: Adds the missing 'role' column required by RLS policies.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Re-verify RLS status
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
