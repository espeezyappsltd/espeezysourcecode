-- =============================================================================
-- GroupFlow Fix: Missing Columns for 'groups' Table
-- =============================================================================
-- This script ensures the 'groups' table has all necessary columns defined 
-- in the v6, v27, and v30 migrations.
-- Run this in the Supabase SQL Editor.
-- =============================================================================

ALTER TABLE public.groups 
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS rules TEXT,
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Optional: If the table was already partially updated, we ensure defaults are set
UPDATE public.groups SET is_encrypted = false WHERE is_encrypted IS NULL;
UPDATE public.groups SET capacity = 5 WHERE capacity IS NULL;

-- Trigger a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verification Query
-- =============================================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'groups' AND table_schema = 'public';
