-- Migration: v23_task_performance
-- Description: Add indexes for group lookup, task filtering, and assignee membership.

CREATE INDEX IF NOT EXISTS idx_groups_module_code ON public.groups(module_code);
CREATE INDEX IF NOT EXISTS idx_profiles_group_id ON public.profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id_status_created_at ON public.tasks(group_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id_created_at ON public.tasks(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignees ON public.tasks USING GIN (assignees);
