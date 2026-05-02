-- Migration: Spotify Integration
-- Adds columns for Spotify OAuth tokens to the profiles table.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;

-- RLS Update (Assuming public.profiles already has RLS, which it should)
-- Users can only see/edit their own Spotify tokens.
-- (Existing policies usually cover 'id = auth.uid()')
