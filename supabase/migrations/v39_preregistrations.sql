-- ──────────────────────────────────────────────────────────────────────────────
-- v39_preregistrations.sql
-- Description: Creates the pre_registrations table for the launch waitlist and 
--              the get_prereg_count RPC function for real-time frontend updates.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pre_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    institution TEXT,
    role TEXT DEFAULT 'student',
    source TEXT,
    campaign_ref TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- No public policies needed because the API route uses createAdminClient (service_role key) 
-- which bypasses RLS for inserting. This ensures the table is completely locked down 
-- from public browser access.

-- RPC to get the total count for the frontend progress bar
CREATE OR REPLACE FUNCTION public.get_prereg_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::int FROM public.pre_registrations;
$$;
