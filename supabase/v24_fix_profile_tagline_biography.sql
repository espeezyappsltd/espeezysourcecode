-- Migration: v24_fix_profile_tagline_biography
-- Description: Ensures tagline and biography columns exist for researcher profiles.

-- 1. Add missing identity columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biography TEXT;

-- 2. Add verification comments
COMMENT ON COLUMN public.profiles.tagline IS 'Short professional description or title of the researcher';
COMMENT ON COLUMN public.profiles.biography IS 'Long-form professional summary of research interests and background';
