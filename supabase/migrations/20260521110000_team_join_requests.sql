-- Team join requests, one intro chat message per target team, task board visibility on team change

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  intro_message text,
  intro_message_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_join_requests_one_pending_per_team
  ON public.group_join_requests (group_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_status
  ON public.group_join_requests (group_id, status);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_join_requests_select_own_or_team_admin ON public.group_join_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (
      SELECT p.group_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'TEAM_LEADER')
    )
  );

CREATE POLICY group_join_requests_insert_own ON public.group_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Last team left (for rejoin + profile-only archived tasks)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS archived_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Hide from Kanban board but keep on member profile / export
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS board_visible boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_tasks_group_board_visible
  ON public.tasks (group_id, board_visible)
  WHERE board_visible = true;

COMMENT ON COLUMN public.tasks.board_visible IS 'False when assignee left team; task remains visible on their profile only.';
COMMENT ON TABLE public.group_join_requests IS 'Pending team joins; one intro chat message per request via intro_message_sent.';
