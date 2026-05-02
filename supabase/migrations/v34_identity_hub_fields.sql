-- Migration: v34_identity_hub_fields
-- Description: Add fields for manual avatar protection and phone verification

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS manual_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS protect_avatar BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;

-- Update RLS if necessary (usually profiles updates are already covered by id = auth.uid())
COMMENT ON COLUMN public.profiles.manual_avatar_url IS 'Prioritized profile image that takes precedence over provider data.';
COMMENT ON COLUMN public.profiles.protect_avatar IS 'If true, prevents OAuth provider data from overwriting avatar_url.';
