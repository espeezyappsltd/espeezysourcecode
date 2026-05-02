-- Migration: v12_technical_arsenal
-- Description: Adds achievement tracking for tool integrations.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- Ensure GIN index for performance if we eventually query via tool name
CREATE INDEX IF NOT EXISTS idx_profiles_achievements ON public.profiles USING GIN (achievements);
