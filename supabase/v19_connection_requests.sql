-- Migration: v19_connection_requests
-- Description: Adds 'request' and 'accepted' statuses to connections and ensures notifications can track them.

-- 1. Update status constraints to include 'pending'
ALTER TABLE public.user_connections DROP CONSTRAINT IF EXISTS user_connections_status_check;
ALTER TABLE public.user_connections ADD CONSTRAINT user_connections_status_check 
    CHECK (status IN ('potential', 'pending', 'connected', 'ignored', 'accepted'));

-- 2. Add metadata columns to notifications for specific actions
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
