-- Migration: v7_activity_monitoring
-- Description: Creates the verifiable activity log table and RLS policies.

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'task_created', 'message_sent', 'setting_updated'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own activity logs" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view entire group activity logs" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin' AND group_id = activity_log.group_id
        )
    );

CREATE POLICY "Anyone in group can insert activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        (group_id IS NULL OR group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid()))
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_group ON public.activity_log(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.activity_log(action_type);
