-- Migration: v35_marketplace_enhancements
-- Description: Add category, quantity, and condition to marketplace listings.

ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Used',
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Index for category search performance
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_listings(category);

-- Ensure profiles are joinable (public profiles for marketplace context)
-- Adjusting RLS to allow viewing seller info for marketplace listings
CREATE POLICY "Public profiles name and avatar viewable for marketplace" ON public.profiles
  FOR SELECT USING (true);
