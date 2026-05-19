-- Ensure Kanban task completion can lock seed-point distribution exactly once.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS score_awarded boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_group_done_unawarded
  ON public.tasks (group_id)
  WHERE status = 'Done' AND score_awarded = false;

COMMENT ON COLUMN public.tasks.score_awarded IS 'True after TASK_COMPLETION seed points were granted for this task.';
