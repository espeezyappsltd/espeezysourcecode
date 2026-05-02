-- Migration: v16_settings_durability
-- Description: Ensures profile persistence and grants update permissions for settings.

-- 1. Ensure achievements column exists (JSONB for technical arsenal)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;

-- 2. Add custom_bg_url if not present (for immersive dashboard theme)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_bg_url TEXT;

-- 3. Ensure theme_config exists (for palette persistence)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{"palette": "Google Light"}'::jsonb;

-- 4. Explicitly grant UPDATE permissions to users on their own profile
-- This is critical for the "Technical Arsenal" and "Identity" tabs to persist.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
    id = auth.uid()
);

-- 5. Verification Comment
COMMENT ON TABLE public.profiles IS 'Profile table hardened for settings persistence and technical arsenal tracking.';
