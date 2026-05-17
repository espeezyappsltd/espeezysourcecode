-- Extend live chat to admin command center channels; restrict admin/hub scopes to admin_members.

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_app_scope_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_app_scope_check
  CHECK (app_scope IN ('prereg', 'games', 'kanban', 'admin', 'hub'));

ALTER TABLE public.chat_events DROP CONSTRAINT IF EXISTS chat_events_app_scope_check;
ALTER TABLE public.chat_events ADD CONSTRAINT chat_events_app_scope_check
  CHECK (app_scope IN ('prereg', 'games', 'kanban', 'admin', 'hub'));

DROP POLICY IF EXISTS chat_messages_admin_staff_scope ON public.chat_messages;
CREATE POLICY chat_messages_admin_staff_scope ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (
    app_scope NOT IN ('admin', 'hub')
    OR EXISTS (
      SELECT 1
      FROM public.admin_members am
      WHERE am.id = auth.uid()
        AND am.is_active = true
    )
  )
  WITH CHECK (
    app_scope NOT IN ('admin', 'hub')
    OR EXISTS (
      SELECT 1
      FROM public.admin_members am
      WHERE am.id = auth.uid()
        AND am.is_active = true
    )
  );

DROP POLICY IF EXISTS chat_events_admin_staff_scope ON public.chat_events;
CREATE POLICY chat_events_admin_staff_scope ON public.chat_events
  FOR ALL
  TO authenticated
  USING (
    app_scope NOT IN ('admin', 'hub')
    OR EXISTS (
      SELECT 1
      FROM public.admin_members am
      WHERE am.id = auth.uid()
        AND am.is_active = true
    )
  )
  WITH CHECK (
    app_scope NOT IN ('admin', 'hub')
    OR EXISTS (
      SELECT 1
      FROM public.admin_members am
      WHERE am.id = auth.uid()
        AND am.is_active = true
    )
  );
