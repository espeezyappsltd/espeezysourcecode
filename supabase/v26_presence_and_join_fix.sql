-- Migration: v26_presence_and_join_fix
-- Description: Hardens the messages table to support team join requests and ensures Realtime is enabled.

-- 1. Ensure core columns exist in messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Update RLS policies for messages
-- Admins need to see join requests (is_system = true) for their group
-- Even if the user who sent it is not in the group yet.
DROP POLICY IF EXISTS "Admins can view group system messages" ON public.messages;
CREATE POLICY "Admins can view group system messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND group_id = messages.group_id AND role = 'admin'
        )
        OR (auth.uid() = user_id)
    );

-- 3. Enable Realtime specifically for messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_system_group ON public.messages(is_system, group_id);
