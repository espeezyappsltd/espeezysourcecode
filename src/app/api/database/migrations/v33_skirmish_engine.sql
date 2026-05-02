-- SKIRMISH ENGINE & PROGRESSION SYSTEM v33
-- This migration implements persistent storage for AI Skirmish sessions, 
-- user progression (XP/Levels), and Rank Titles.

-- 1. Create Game Sessions Table (for Trophy Receipts & History)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    mode TEXT NOT NULL,
    questions JSONB NOT NULL,
    scores JSONB NOT NULL, -- Array of { userId, userName, points }
    winner_id UUID REFERENCES auth.users(id),
    room_id TEXT NOT NULL
);

-- 2. Create User Game Stats Table (Leveling Engine)
CREATE TABLE IF NOT EXISTS public.user_game_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    total_xp INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    level INTEGER GENERATED ALWAYS AS (floor(sqrt(total_xp / 100)) + 1) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS Policies
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game stats" 
    ON public.user_game_stats FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all game sessions" 
    ON public.game_sessions FOR SELECT 
    USING (true);

-- 4. Function to recalculate updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_game_stats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Seed initial stats for active users (Optional, usually handled by upsert in action)
INSERT INTO public.user_game_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;
