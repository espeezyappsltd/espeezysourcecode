-- Migration: v40_data_api_schema
-- Description: Creates a dedicated api schema and stable read endpoints for Supabase Data API.

CREATE SCHEMA IF NOT EXISTS api;

GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT ON TABLES TO anon, authenticated, service_role;

DO $$
DECLARE
  tbl text;
  view_comment text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'groups',
    'tasks',
    'commits',
    'artifacts',
    'notifications',
    'user_connections',
    'chat_messages',
    'marketplace_listings',
    'payments',
    'reward_ledger',
    'agent_tasks',
    'quiz_categories',
    'quiz_sessions'
  ]
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('CREATE OR REPLACE VIEW api.%I AS SELECT * FROM public.%I', tbl, tbl);

      BEGIN
        EXECUTE format('ALTER VIEW api.%I SET (security_invoker = true)', tbl);
      EXCEPTION
        WHEN OTHERS THEN
          -- Keep migration compatible in environments where this view option is unavailable.
          NULL;
      END;

      EXECUTE format('GRANT SELECT ON api.%I TO anon, authenticated, service_role', tbl);

      view_comment := format('Data API endpoint view for public.%I', tbl);
      EXECUTE format('COMMENT ON VIEW api.%I IS %L', tbl, view_comment);
    END IF;
  END LOOP;
END;
$$;

COMMENT ON SCHEMA api IS 'Dedicated schema for Supabase Data API endpoints.';
