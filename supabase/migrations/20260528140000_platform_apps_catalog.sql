-- Platform apps catalog: self-hosted product listings for espeezy.com landing.

CREATE TABLE IF NOT EXISTS public.platform_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'development'
    CHECK (status IN ('live', 'beta', 'development', 'coming_soon')),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  price_currency text NOT NULL DEFAULT 'GBP',
  price_label text NOT NULL DEFAULT '',
  stripe_payment_link text,
  download_url text,
  live_url text,
  icon_key text NOT NULL DEFAULT 'layout',
  accent_color text NOT NULL DEFAULT '#6366f1',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  setup_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  db_setup_markdown text NOT NULL DEFAULT '',
  ui_customization_markdown text NOT NULL DEFAULT '',
  includes_source boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_apps_published_sort_idx
  ON public.platform_apps (published, sort_order, name);

ALTER TABLE public.platform_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_apps_select_public ON public.platform_apps;
CREATE POLICY platform_apps_select_public ON public.platform_apps
  FOR SELECT TO anon, authenticated
  USING (published = true);

COMMENT ON TABLE public.platform_apps IS 'Marketing catalog: per-app pricing, download, and self-host setup guides.';

-- Seed default catalog (idempotent on slug).
INSERT INTO public.platform_apps (
  slug, name, tagline, description, status,
  price_cents, price_currency, price_label,
  stripe_payment_link, download_url, live_url,
  icon_key, accent_color, features, setup_sections,
  db_setup_markdown, ui_customization_markdown,
  includes_source, sort_order, published
) VALUES
(
  'kanban',
  'Espeezy Kanban',
  'Scholar workspace — boards, analytics, marketplace, billing.',
  'The main Espeezy workspace: kanban boards, contribution history, hustle gigs, peer network, and institutional tooling. Run our hosted cloud or deploy your own stack with your Supabase project.',
  'live',
  49900, 'GBP', 'GBP 499 one-time · self-host license',
  NULL, NULL, 'https://kanban.espeezy.com',
  'layout-dashboard', '#10b981',
  '["Kanban boards & drag-and-drop columns","Contribution proof & academic exports","Marketplace & hustle credits","Teams, RBAC, and institutional guards","Next.js 16 + Supabase source package"]'::jsonb,
  '[{"title":"Clone & install","steps":["Download the Kanban package after checkout.","Copy apps/kanban and apps/shared into your monorepo or standalone repo.","Run npm install from the repo root."]},{"title":"Environment","steps":["Copy .env.example to .env.local in apps/kanban.","Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.","Set SUPABASE_SERVICE_ROLE_KEY for API routes (server only)."]}]'::jsonb,
  E'## Database (Supabase)\n\n1. Create a new Supabase project.\n2. Run all migrations from `supabase/migrations` in order.\n3. Enable Auth email provider and set Site URL to your Kanban origin.\n4. Point `NEXT_PUBLIC_SUPABASE_*` env vars to your project.\n5. Seed optional demo data with project scripts if needed.\n',
  E'## UI personalisation\n\n- Edit `apps/shared/design/tokens.css` for brand colours.\n- Replace `/public/brand_logo2.svg` and favicons.\n- Adjust `apps/shared/platform-brand.ts` copy for your institution.\n- Configure `NEXT_PUBLIC_APP_URL` to your domain for auth callbacks.\n',
  true, 10, true
),
(
  'games',
  'Espeezy Games',
  'Skirmish quizzes and study games — Pro tier on hosted cloud.',
  'Category-based quiz and skirmish games tied to your Espeezy identity. Hosted at games.espeezy.com; self-host package includes catalog APIs and browse UI.',
  'live',
  29900, 'GBP', 'GBP 299 one-time · self-host license',
  NULL, NULL, 'https://games.espeezy.com',
  'gamepad-2', '#6366f1',
  '["Category & game catalog","Skirmish sessions & leaderboards","Cross-app SSO with Kanban","Supabase-backed game content"]'::jsonb,
  '[{"title":"Quick start","steps":["Purchase and download the Games package.","Apply games migrations to your Supabase project.","Set NEXT_PUBLIC_KANBAN_APP_URL for SSO return paths."]}]'::jsonb,
  E'## Database\n\nRun games catalog migrations (`games`, `categories` tables). Use service role only on the server.\n',
  E'## UI personalisation\n\n- Theme via shared tokens and Games layout CSS.\n- Swap category artwork in `public/` assets.\n',
  true, 20, true
),
(
  'admin',
  'Espeezy Panel',
  'Staff console for launch controls, users, and platform ops.',
  'Internal admin panel (panel.espeezy.com): RBAC staff, marketing controls, audit, and vault. Self-host for your own operators.',
  'beta',
  19900, 'GBP', 'GBP 199 one-time · self-host license',
  NULL, NULL, 'https://panel.espeezy.com',
  'shield', '#0f172a',
  '["Staff RBAC & TOTP","Launch & marketing controls","User analytics & audit log"]'::jsonb,
  '[]'::jsonb,
  E'## Database\n\nRequires `admin_members` and related migrations. Only grant staff rows to trusted operators.\n',
  E'## UI\n\nUses admin-console.css; customise brand in AdminConsoleShell.\n',
  true, 30, true
),
(
  'prereg',
  'Espeezy Marketing',
  'Early access, pricing, checkout, and docs site.',
  'The espeezy.com marketing app: hero, pricing, Stripe checkout, and documentation. Included for white-label campus launches.',
  'live',
  9900, 'GBP', 'GBP 99 one-time · self-host license',
  NULL, NULL, 'https://espeezy.com',
  'globe', '#06b6d4',
  '["Landing & prereg flows","Stripe checkout proxy","Docs site & live metrics"]'::jsonb,
  '[]'::jsonb,
  E'## Database\n\nUses shared Supabase for prereg counts and profiles; configure launch keys in `app_config`.\n',
  E'## UI\n\nEdit `apps/prereg/src/app/page.tsx` and `@shared/platform-brand` strings.\n',
  true, 40, true
),
(
  'core',
  'Espeezy Core Runtime',
  'Local-first core services and dev hub integrations.',
  'Core runtime and dev orchestration layer. In active development — join early access for source drops.',
  'development',
  0, 'GBP', 'Early access · pricing TBA',
  NULL, NULL, NULL,
  'cpu', '#94a3b8',
  '["Dev hub orchestration","Shared auth bridges","Local-first sync experiments"]'::jsonb,
  '[]'::jsonb,
  '', '',
  false, 50, true
),
(
  'studios',
  'Espeezy Studios',
  'Gallery and creative asset lobby for campus media teams.',
  'Lightweight gallery app for studios and media teams. In development.',
  'development',
  0, 'GBP', 'In development',
  NULL, NULL, NULL,
  'palette', '#f59e0b',
  '["Media gallery","Staff lobby views"]'::jsonb,
  '[]'::jsonb,
  '', '',
  false, 60, true
)
ON CONFLICT (slug) DO NOTHING;
