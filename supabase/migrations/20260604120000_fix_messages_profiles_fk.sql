-- Fix messages foreign key to point to public.profiles instead of auth.users
-- This allows PostgREST to join messages and profiles for the team chat

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_user_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_user_id_fkey;
  END IF;

  ALTER TABLE public.messages
    ADD CONSTRAINT messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END
$$;

-- Force PostgREST to reload the schema cache so the new relationship is available
NOTIFY pgrst, 'reload schema';
