-- Migration: v21_last_seen_persistence
-- Description: Adds last_seen column to track student activity status.

-- 1. Add column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Initialize existing users
UPDATE public.profiles SET last_seen = created_at WHERE last_seen IS NULL;

-- 3. Comment for clarity
COMMENT ON COLUMN public.profiles.last_seen IS 'Timestamp of the user’s most recent interaction or heartbeat';
