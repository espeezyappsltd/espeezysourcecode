-- Adds AI usage tracking so rate limiting can be enforced per user.

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own AI usage" ON public.ai_usage
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view own AI usage" ON public.ai_usage
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update own AI usage" ON public.ai_usage
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own AI usage" ON public.ai_usage
  FOR DELETE USING (profile_id = auth.uid());
