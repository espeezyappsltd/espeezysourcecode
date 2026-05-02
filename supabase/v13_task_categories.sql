-- Migration: v13_task_categories
-- Description: Evolves task classification from binary to multi-category.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Implementation';

-- Data Migration
UPDATE public.tasks SET category = 'Implementation' WHERE is_coding_task = true;
UPDATE public.tasks SET category = 'UX/UI Design' WHERE is_coding_task = false;

-- Clean up (optional: we can keep boolean for backwards compatibility if needed, 
-- but let's prioritize the new standard)
COMMENT ON COLUMN public.tasks.is_coding_task IS 'Deprecated in favor of category field.';
