-- Migration: v22_add_stripe_payments
-- Description: Add Stripe payment tracking and subscription fields for GroupFlow pre-registration.

-- 1. Create Stripe payments history table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_session_id TEXT,
    price_type TEXT NOT NULL,
    plan_label TEXT NOT NULL,
    mode TEXT NOT NULL,
    amount_total INTEGER,
    currency TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session_id_idx ON public.payments (stripe_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_subscription_id_idx ON public.payments (stripe_subscription_id);

-- 2. Add subscription fields to profiles for plan state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;
