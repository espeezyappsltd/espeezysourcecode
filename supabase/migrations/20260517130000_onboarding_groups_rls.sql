-- Onboarding: let signed-in users create/join teams without the service-role key.

-- Groups: create a team you own.
DROP POLICY IF EXISTS groups_owner_insert ON public.groups;
CREATE POLICY groups_owner_insert ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Groups: read teams (join by id / module code, list peers).
DROP POLICY IF EXISTS groups_authenticated_select ON public.groups;
CREATE POLICY groups_authenticated_select ON public.groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: ensure row exists on first sign-in / onboarding.
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Profiles: assign yourself to a team during onboarding.
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
