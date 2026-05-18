-- Direct messages between users (marketplace seller contact, network chat)
CREATE TABLE IF NOT EXISTS public.peer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS peer_messages_thread_idx
  ON public.peer_messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);

CREATE INDEX IF NOT EXISTS peer_messages_recipient_unread_idx
  ON public.peer_messages (recipient_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE public.peer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY peer_messages_select ON public.peer_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY peer_messages_insert ON public.peer_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY peer_messages_update_read ON public.peer_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id);
