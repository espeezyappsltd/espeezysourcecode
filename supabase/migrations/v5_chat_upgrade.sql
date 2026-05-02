-- Migration: WhatsApp-style Chat Enhancements
-- Adds support for media attachments and message replies

-- 1. Add new columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Update RLS (Ensure real-time is enabled)
-- Note: Real-time is usually enabled at the table level in the Supabase Dashboard.
-- The following SQL ensures the table is included in the 'supabase_realtime' publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
