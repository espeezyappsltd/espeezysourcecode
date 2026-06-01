-- Public marketing catalog: live production apps only (see apps/shared/platform-production-catalog.ts).

UPDATE public.platform_apps
SET published = false, updated_at = now()
WHERE slug IN ('admin', 'prereg', 'dashboard', 'base');

UPDATE public.platform_apps
SET
  tagline = 'Shared boards and contribution tracking for group work.',
  description = 'The main workspace at kanban.espeezy.com. Plan tasks, track who contributed, and export records for instructors and teammates.',
  status = 'live',
  price_cents = 0,
  price_label = 'Hosted on espeezy.com · same login',
  live_url = 'https://kanban.espeezy.com',
  features = '["Kanban boards and team workspaces","Contribution history and exports","Marketplace and study tools","Premium unlocks Espeezy Studio"]'::jsonb,
  includes_source = false,
  sort_order = 10,
  published = true,
  updated_at = now()
WHERE slug = 'kanban';

UPDATE public.platform_apps
SET
  tagline = 'Study games and quiz rounds with classmates.',
  description = 'Category quizzes and skirmish sessions at games.espeezy.com, linked to your Espeezy account.',
  status = 'live',
  price_cents = 0,
  price_label = 'Hosted on espeezy.com · same login',
  live_url = 'https://games.espeezy.com',
  features = '["Game catalog and categories","Skirmish and study sessions","Same login as Kanban"]'::jsonb,
  includes_source = false,
  sort_order = 20,
  published = true,
  updated_at = now()
WHERE slug = 'games';

UPDATE public.platform_apps
SET
  name = 'Espeezy Studio',
  tagline = 'Projects, delivery, and studio operations.',
  description = 'Run client projects, jobs, analytics, and handoffs at studios.espeezy.com. Open from Kanban when you have Premium access.',
  status = 'live',
  price_cents = 0,
  price_label = 'Hosted on espeezy.com · same login',
  live_url = 'https://studios.espeezy.com',
  icon_key = 'palette',
  features = '["Project workspace and jobs","Client delivery and documents","Studio analytics"]'::jsonb,
  includes_source = false,
  sort_order = 30,
  published = true,
  updated_at = now()
WHERE slug = 'studios';

UPDATE public.platform_apps
SET
  name = 'Espeezy Articles',
  tagline = 'Campus articles and blog publishing.',
  description = 'Read and publish at articles.espeezy.com and blog.espeezy.com.',
  status = 'live',
  price_cents = 0,
  price_label = 'Hosted on espeezy.com · same login',
  live_url = 'https://articles.espeezy.com',
  icon_key = 'newspaper',
  features = '["Article reader","Blog at blog.espeezy.com","Shared Espeezy sign-in"]'::jsonb,
  includes_source = false,
  sort_order = 40,
  published = true,
  updated_at = now()
WHERE slug = 'articles';

UPDATE public.platform_apps
SET
  name = 'Dev Launch',
  tagline = 'Developer docs and self-host guides.',
  description = 'Setup guides, app links, and deployment notes at devlaunch.espeezy.com for technical teams.',
  status = 'live',
  price_cents = 0,
  price_label = 'Hosted on espeezy.com · same login',
  live_url = 'https://devlaunch.espeezy.com',
  icon_key = 'cpu',
  accent_color = '#64748b',
  features = '["Links to every production app","Self-host and Cloudflare guides","Supabase setup docs"]'::jsonb,
  includes_source = false,
  sort_order = 50,
  published = true,
  updated_at = now()
WHERE slug = 'core';
