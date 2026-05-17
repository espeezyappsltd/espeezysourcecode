-- user_connections: participants can read/update their rows; requesters can insert.

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_connections_participant_select ON public.user_connections;
CREATE POLICY user_connections_participant_select ON public.user_connections
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR target_id = auth.uid());

DROP POLICY IF EXISTS user_connections_request_insert ON public.user_connections;
CREATE POLICY user_connections_request_insert ON public.user_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_connections_participant_update ON public.user_connections;
CREATE POLICY user_connections_participant_update ON public.user_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR target_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR target_id = auth.uid());

DROP POLICY IF EXISTS user_connections_participant_delete ON public.user_connections;
CREATE POLICY user_connections_participant_delete ON public.user_connections
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR target_id = auth.uid());

-- Profiles: allow recipients to view senders of pending connection requests.
DROP POLICY IF EXISTS profiles_pending_connection_sender_select ON public.profiles;
CREATE POLICY profiles_pending_connection_sender_select ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_connections uc
      WHERE uc.user_id = profiles.id
        AND uc.target_id = auth.uid()
        AND uc.status = 'pending'
    )
  );
