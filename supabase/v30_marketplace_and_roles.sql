-- Migration: v30_marketplace_and_roles
-- Description: Modernize team roles and implement the Share & Borrow marketplace architecture.

--------------------------------------------------------------------------------
-- 1. TEAM ROLES & HIERARCHY
--------------------------------------------------------------------------------

-- Add group_owner_id to track the Team Leader source of truth
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Standardize roles in profiles table
-- Values: 'TEAM_LEADER', 'ADMIN', 'MODERATOR', 'MEMBER'

-- FIRST: Standardize existing data to prevent constraint violations
UPDATE public.profiles 
SET role = 'MEMBER' 
WHERE role IS NULL 
   OR role NOT IN ('TEAM_LEADER', 'ADMIN', 'MODERATOR', 'MEMBER', 'collaborator', 'admin');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('TEAM_LEADER', 'ADMIN', 'MODERATOR', 'MEMBER', 'collaborator', 'admin'));

-- Set default role for new users
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'MEMBER';

--------------------------------------------------------------------------------
-- 2. MARKETPLACE ECOSYSTEM
--------------------------------------------------------------------------------

-- Marketplace Listings table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  group_id UUID REFERENCES public.groups(id), -- Optional: can be restricted to group or global
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0, -- 0 = Free
  is_free BOOLEAN DEFAULT false,
  
  -- Logistics
  meetup_zone TEXT DEFAULT 'Library', -- Library, Student Union, Science Hub, Custom
  meetup_details TEXT,
  duration_days INTEGER DEFAULT 7, -- Handover duration
  
  -- Images & Payments
  images TEXT[] DEFAULT '{}', -- Array of Supabase storage paths
  payment_method TEXT DEFAULT 'CASH', -- CASH, STRIPE, BOTH
  
  -- State
  status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, PENDING, BORROWED, SOLD, ARCHIVED
  reports_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Marketplace Metadata indexing
CREATE INDEX IF NOT EXISTS idx_marketplace_owner ON public.marketplace_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);

-- Marketplace Reports (Human Review)
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------------------------------
-- 3. RLS POLICIES (MARKETPLACE)
--------------------------------------------------------------------------------

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view available listings
CREATE POLICY "Public available listings viewable by all" ON public.marketplace_listings
  FOR SELECT USING (auth.role() = 'authenticated' AND status != 'ARCHIVED');

-- Users can insert their own listings
CREATE POLICY "Users can create their own listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own listings
CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = owner_id);

-- Moderators and Admins can update any listing (to archive/moderate)
CREATE POLICY "Moderators can moderate listings" ON public.marketplace_listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM_LEADER', 'MODERATOR')
    )
  );

--------------------------------------------------------------------------------
-- 4. STORAGE BUCKET (MARKETPLACE)
--------------------------------------------------------------------------------
-- Note: Buckets are usually created via Supabase Console or API, 
-- but we include the policy logic here for reference.
-- Bucket name: 'marketplace'
