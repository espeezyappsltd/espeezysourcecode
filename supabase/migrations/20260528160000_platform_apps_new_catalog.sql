-- Platform catalog: new Articles app and refreshed copy for Studio / Dev Launch / Kanban.

UPDATE public.platform_apps
SET
  features = '["Kanban boards & drag-and-drop columns","Contribution proof & academic exports","Teams, RBAC, and institutional guards","Premium opens Espeezy Studio (jobs & delivery)"]'::jsonb,
  updated_at = now()
WHERE slug = 'kanban';

UPDATE public.platform_apps
SET
  name = 'Dev Launch',
  tagline = 'Developer launchpad and local app links.',
  description = 'Docs, tutorials, and links to every Espeezy app at devlaunch.espeezy.com.',
  live_url = 'https://devlaunch.espeezy.com',
  updated_at = now()
WHERE slug = 'core';

UPDATE public.platform_apps
SET
  name = 'Espeezy Studio',
  tagline = 'Marketplace, jobs, and client delivery for Premium members.',
  description = 'Run gigs, professional jobs, invoices, and delivery docs at studios.espeezy.com.',
  live_url = 'https://studios.espeezy.com',
  features = '["Marketplace hub","Job delivery workspace","Invoices and client email"]'::jsonb,
  updated_at = now()
WHERE slug = 'studios';

INSERT INTO public.platform_apps (
  slug, name, tagline, description, status,
  price_cents, price_currency, price_label,
  stripe_payment_link, download_url, live_url,
  icon_key, accent_color, features, setup_sections,
  db_setup_markdown, ui_customization_markdown,
  includes_source, sort_order, published
) VALUES (
  'articles',
  'Espeezy Articles',
  'Campus articles and blog reader.',
  'Published articles at articles.espeezy.com and blog.espeezy.com.',
  'development',
  0, 'GBP', 'In development',
  NULL, NULL, 'https://articles.espeezy.com',
  'globe', '#06b6d4',
  '["Article reader","Blog alias host","Shared Supabase content"]'::jsonb,
  '[]'::jsonb,
  '', '',
  false, 70, true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  live_url = EXCLUDED.live_url,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
