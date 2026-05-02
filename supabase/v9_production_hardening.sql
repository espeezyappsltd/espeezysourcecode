-- Production Hardening Migration
-- 1. Add School Identity
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id TEXT;

-- 2. Add Compliance Tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMP WITH TIME ZONE;

-- 3. INDEX for search performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
