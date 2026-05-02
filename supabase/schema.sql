-- GroupFlow Initial Schema

-- 1. Create Tables

CREATE TABLE public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    module_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    course_name TEXT DEFAULT 'Independent Researcher',
    enrollment_year INTEGER,
    completion_year INTEGER,
    role TEXT DEFAULT 'collaborator',
    rank TEXT DEFAULT 'Senior',
    badges_count INTEGER DEFAULT 0,
    tagline TEXT,
    biography TEXT,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    total_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Done')),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    is_coding_task BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.commits (
    hash TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    lines_added INTEGER DEFAULT 0,
    lines_deleted INTEGER DEFAULT 0,
    author_email TEXT,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    impact_score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endorsements_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS) Setup

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Group RLS: Anyone can see groups (for assignment)
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);

-- Profiles RLS: Users can view profiles in their own group
CREATE POLICY "Users can view group profiles" ON public.profiles FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid()) OR id = auth.uid()
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Tasks RLS: Users can only see tasks for their assigned group
CREATE POLICY "Users can view group tasks" ON public.tasks FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert group tasks" ON public.tasks FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update group tasks" ON public.tasks FOR UPDATE USING (
    group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid())
);

-- Handle User Creation Trigger (Automatically creates a profile when Auth user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    school_id, 
    role,
    course_name,
    enrollment_year,
    completion_year
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'school_id',
    'collaborator',
    'Independent Researcher',
    extract(year from now())::int,
    (extract(year from now()) + 3)::int
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
