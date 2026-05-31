-- Espeezy Studios page content (CRUD-backed UI)

CREATE TABLE IF NOT EXISTS public.studio_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Ongoing',
  status_color text NOT NULL DEFAULT '#2e7d32',
  symbol text NOT NULL DEFAULT '🟢',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_progress_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value int NOT NULL DEFAULT 0 CHECK (value >= 0 AND value <= 100),
  color text NOT NULL DEFAULT '#6366f1',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_analytics_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL DEFAULT '0',
  hint text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed defaults (idempotent)
INSERT INTO public.studio_team_members (name, role, sort_order)
SELECT * FROM (VALUES
  ('Pete', 'Lead Dev', 0),
  ('EspeezyTeam', 'Designer', 1),
  ('dev Pete', 'Product', 2),
  ('EvryBady Digital', 'Marketing', 3)
) AS v(name, role, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.studio_team_members LIMIT 1);

INSERT INTO public.studio_projects (title, status, status_color, symbol, sort_order)
SELECT * FROM (VALUES
  ('Kanban Board', 'Ongoing', '#2e7d32', '🟢', 0),
  ('Hustle Marketplace', 'Finished', '#1565c0', '🔵', 1)
) AS v(title, status, status_color, symbol, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.studio_projects LIMIT 1);

INSERT INTO public.studio_progress_items (label, value, color, sort_order)
SELECT * FROM (VALUES
  ('Jobs Progress', 70, '#6366f1', 0),
  ('Projects Complete', 40, '#22c55e', 1),
  ('Team Onboarded', 90, '#10b981', 2)
) AS v(label, value, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.studio_progress_items LIMIT 1);

INSERT INTO public.studio_quick_actions (label, href, sort_order)
SELECT * FROM (VALUES
  ('Jobs queue', '/jobs', 0),
  ('Analytics', '/analytics', 1),
  ('Team', '/team', 2)
) AS v(label, href, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.studio_quick_actions LIMIT 1);

ALTER TABLE public.studio_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_progress_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_analytics_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY studio_team_members_read ON public.studio_team_members
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY studio_team_members_write ON public.studio_team_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY studio_projects_read ON public.studio_projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY studio_projects_write ON public.studio_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY studio_progress_read ON public.studio_progress_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY studio_progress_write ON public.studio_progress_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY studio_quick_actions_read ON public.studio_quick_actions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY studio_quick_actions_write ON public.studio_quick_actions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY studio_analytics_kpis_read ON public.studio_analytics_kpis
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY studio_analytics_kpis_write ON public.studio_analytics_kpis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
