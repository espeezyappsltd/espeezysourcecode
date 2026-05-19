-- Allow PostgREST embeds: activity_logs.user_id → profiles.id
-- Safe to run if constraint already exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'activity_logs_user_id_fkey'
    ) THEN
      ALTER TABLE public.activity_logs
        ADD CONSTRAINT activity_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
