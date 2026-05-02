-- Migration: v20_chat_persistence
-- Description: Create a table for permanent storage of private messages, enabling full search and archival.

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Select Policy: Only participants can view messages
-- For groupflow, we derive participants from the room_id (which contains their IDs)
-- Or we check if the user is the sender or if they have an active connection
CREATE POLICY "Users can view relevant chat messages" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        room_id LIKE '%' || auth.uid()::text || '%'
    );

-- Insert Policy: Only the sender can insert
CREATE POLICY "Users can insert their own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Index for room-based lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
