-- Migration: v27_search_optimization
-- Description: Enables fuzzy search capabilities and optimized text indexing.

-- 1. Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN indices for high-performance text search
-- Profiles Search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id_trgm ON public.profiles USING gin (school_id gin_trgm_ops);

-- Tasks Search
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON public.tasks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_description_trgm ON public.tasks USING gin (description gin_trgm_ops);

-- Groups Search
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm ON public.groups USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_groups_module_code_trgm ON public.groups USING gin (module_code gin_trgm_ops);

-- 3. Optimized Search Function (Optional, but useful for app-wide scoring)
CREATE OR REPLACE FUNCTION public.smart_search(search_term TEXT)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    -- Profiles
    SELECT 
        p.id, 
        'profile' as type, 
        p.full_name as title, 
        p.course_name as subtitle, 
        p.avatar_url as image_url,
        similarity(p.full_name, search_term) as rank
    FROM public.profiles p
    WHERE p.full_name % search_term OR p.school_id % search_term
    
    UNION ALL
    
    -- Tasks
    SELECT 
        t.id, 
        'task' as type, 
        t.title as title, 
        t.status as subtitle, 
        NULL as image_url,
        similarity(t.title, search_term) as rank
    FROM public.tasks t
    WHERE t.title % search_term OR t.description % search_term
    
    UNION ALL
    
    -- Groups
    SELECT 
        g.id, 
        'group' as type, 
        g.name as title, 
        g.module_code as subtitle, 
        NULL as image_url,
        similarity(g.name, search_term) as rank
    FROM public.groups g
    WHERE g.name % search_term OR g.module_code % search_term
    
    ORDER BY rank DESC
    LIMIT 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
