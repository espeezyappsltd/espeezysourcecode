-- Migration: v35_admin_initialization
-- Objective: Grant full administrative privileges and permanent premium status to the project owner.

-- 1. Ensure the admin user has the 'admin' role and 'premium' subscription
UPDATE public.profiles
SET 
    role = 'admin',
    subscription_plan = 'premium',
    subscription_status = 'active',
    subscription_started_at = NOW()
WHERE email = 'kedogosospeter36@gmail.com';

-- 2. Add comment for audit trail
COMMENT ON COLUMN public.profiles.role IS 'User permission role (member, admin)';
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Subscription level (free, pro, premium, lifetime)';
