-- v32: Add tech stack and skills tracking to researcher profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stack TEXT;

COMMENT ON COLUMN public.profiles.stack IS 'Comma-separated string of technologies or skills (e.g. React, Python, AWS)';
