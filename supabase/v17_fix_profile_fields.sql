-- Migration: v17_fix_profile_fields
-- Description: Adds missing columns to profiles table and ensures data accuracy for new accounts.
-- This migration moves hardcoded UI data into the database.

-- 1. Add missing identity, roadmap, and status columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course_name TEXT DEFAULT 'Independent Researcher';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enrollment_year INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completion_year INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'collaborator';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'Senior';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges_count INTEGER DEFAULT 0;

-- 2. Update existing entries to have safe defaults
UPDATE public.profiles SET rank = 'Senior' WHERE rank IS NULL;
UPDATE public.profiles SET badges_count = 0 WHERE badges_count IS NULL;
UPDATE public.profiles SET role = 'collaborator' WHERE role IS NULL;
UPDATE public.profiles SET course_name = 'Independent Researcher' WHERE course_name IS NULL;

-- 3. Update the handle_new_user function to be more robust and include all UI data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    school_id,
    role,
    rank,
    badges_count,
    course_name,
    enrollment_year,
    completion_year
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'school_id',
    'collaborator',
    'Senior',
    0,
    'Independent Researcher',
    extract(year from now())::int,
    (extract(year from now()) + 3)::int
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verification Comments
COMMENT ON COLUMN public.profiles.rank IS 'User progress rank displayed on dashboard';
COMMENT ON COLUMN public.profiles.badges_count IS 'Total number of badges earned, initialized to 0 for new accounts';
COMMENT ON COLUMN public.profiles.course_name IS 'Current academic course or degree path';
