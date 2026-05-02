-- Migration: v33_skirmish_engine
-- Description: Database infrastructure for the Skirmish Zone, Leveling, and persistent Game History.

--------------------------------------------------------------------------------
-- 1. USER PROGRESSION (XP & LEVELS)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_game_stats (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    rank_title TEXT DEFAULT 'Novice Scholar',
    wins INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    best_category TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view game stats" ON public.user_game_stats;
CREATE POLICY "Anyone can view game stats" ON public.user_game_stats
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_game_stats;
CREATE POLICY "Users can update their own stats" ON public.user_game_stats
    FOR UPDATE USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 2. GAME ARCHIVE (RECEIPTS & HISTORY)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) NOT NULL,
    topic_id TEXT NOT NULL,
    difficulty TEXT NOT NULL, -- Easy, Medium, Hard
    mode TEXT NOT NULL, -- Skirmish, Recall, Evaluated
    winner_id UUID REFERENCES public.profiles(id),
    score_summary JSONB DEFAULT '{}'::jsonb, -- Cache scores for fast receipt generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in game can view sessions" ON public.game_sessions;
CREATE POLICY "Anyone in game can view sessions" ON public.game_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creator can insert session" ON public.game_sessions;
CREATE POLICY "Creator can insert session" ON public.game_sessions
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

--------------------------------------------------------------------------------
-- 3. INITIAL DATA / TRIGGERS
--------------------------------------------------------------------------------

-- Ensure every user has a stats row (optional, can be upserted in app logic)
-- But let's create a trigger to handle XP to Level mapping
CREATE OR REPLACE FUNCTION public.calculate_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := floor(sqrt(NEW.total_xp / 100)) + 1;
    
    -- Update Rank Titles
    IF NEW.level >= 50 THEN NEW.rank_title := 'Arch-Sage';
    ELSIF NEW.level >= 30 THEN NEW.rank_title := 'Grand Master';
    ELSIF NEW.level >= 15 THEN NEW.rank_title := 'Senior Analyst';
    ELSIF NEW.level >= 5 THEN NEW.rank_title := 'Scholar';
    ELSE NEW.rank_title := 'Novice Explorer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_level_up ON public.user_game_stats;
CREATE TRIGGER trigger_user_level_up
BEFORE UPDATE ON public.user_game_stats
FOR EACH ROW EXECUTE FUNCTION public.calculate_user_level();
