-- Games catalog: all signed-in users may INSERT games only; categories are read-only for users.

ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_public ON public.categories;
CREATE POLICY categories_select_public ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS games_select_public ON public.games;
CREATE POLICY games_select_public ON public.games
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS games_insert_authenticated ON public.games;
CREATE POLICY games_insert_authenticated ON public.games
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- No INSERT/UPDATE/DELETE policies on categories for authenticated (service_role bypasses RLS for admin/seed).
-- No UPDATE/DELETE policies on games for authenticated.
