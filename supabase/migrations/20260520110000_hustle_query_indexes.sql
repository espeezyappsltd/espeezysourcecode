-- Hot-path indexes for My gigs, browse, and posted lists.

CREATE INDEX IF NOT EXISTS hustle_task_applications_applicant_created_idx
  ON public.hustle_task_applications (applicant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hustle_tasks_assignee_updated_idx
  ON public.hustle_tasks (assignee_id, updated_at DESC)
  WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS hustle_tasks_poster_created_idx
  ON public.hustle_tasks (poster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hustle_tasks_status_created_idx
  ON public.hustle_tasks (status, created_at DESC);

CREATE INDEX IF NOT EXISTS posts_public_feed_idx
  ON public.posts (visibility, created_at DESC)
  WHERE is_deleted = false;
