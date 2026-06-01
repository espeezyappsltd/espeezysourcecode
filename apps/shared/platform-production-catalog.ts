/**
 * Public marketing catalog: only apps deployed to production (see cloudflare-deploy.ts).
 * Staff-only and internal hosts are excluded from landing/docs consumer lists.
 */
import { ESPEEZY_APP_ORIGINS } from './espeezy-app-origins'
import type { PlatformApp, PlatformAppStatus } from './platform-apps'

/** Shown on espeezy.com app catalog, use cases, and docs "apps in use". */
export const PUBLIC_PRODUCTION_APP_SLUGS = ['kanban', 'games', 'studios', 'articles', 'core'] as const

/** Not listed on the public marketing catalog (staff, apex site, internal tools). */
export const CATALOG_EXCLUDED_SLUGS = ['admin', 'prereg', 'dashboard', 'base'] as const

const HOSTED_LABEL = 'Hosted on espeezy.com · same login'

function app(
  slug: string,
  name: string,
  tagline: string,
  description: string,
  status: PlatformAppStatus,
  originKey: keyof typeof ESPEEZY_APP_ORIGINS,
  icon_key: string,
  accent_color: string,
  features: string[],
  sort_order: number,
): PlatformApp {
  return {
    id: `prod-${slug}`,
    slug,
    name,
    tagline,
    description,
    status,
    price_cents: 0,
    price_currency: 'GBP',
    price_label: HOSTED_LABEL,
    stripe_payment_link: null,
    download_url: null,
    live_url: ESPEEZY_APP_ORIGINS[originKey],
    icon_key,
    accent_color,
    features,
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: false,
    sort_order,
    published: true,
  }
}

/** Authoritative fallback when platform_apps table is unavailable. */
export const PRODUCTION_PLATFORM_APPS: PlatformApp[] = [
  app(
    'kanban',
    'Espeezy Kanban',
    'Shared boards and contribution tracking for group work.',
    'The main workspace at kanban.espeezy.com. Plan tasks, track who contributed, and export records for instructors and teammates.',
    'live',
    'kanban',
    'layout-dashboard',
    '#10b981',
    [
      'Kanban boards and team workspaces',
      'Contribution history and exports',
      'Marketplace and study tools',
      'Premium unlocks Espeezy Studio',
    ],
    10,
  ),
  app(
    'games',
    'Espeezy Games',
    'Study games and quiz rounds with classmates.',
    'Category quizzes and skirmish sessions at games.espeezy.com, linked to your Espeezy account.',
    'live',
    'games',
    'gamepad-2',
    '#6366f1',
    ['Game catalog and categories', 'Skirmish and study sessions', 'Same login as Kanban'],
    20,
  ),
  app(
    'studios',
    'Espeezy Studio',
    'Projects, delivery, and studio operations.',
    'Run client projects, jobs, analytics, and handoffs at studios.espeezy.com. Open from Kanban when you have Premium access.',
    'live',
    'studios',
    'palette',
    '#f59e0b',
    ['Project workspace and jobs', 'Client delivery and documents', 'Studio analytics'],
    30,
  ),
  app(
    'articles',
    'Espeezy Articles',
    'Campus articles and blog publishing.',
    'Read and publish at articles.espeezy.com and blog.espeezy.com.',
    'live',
    'articles',
    'newspaper',
    '#06b6d4',
    ['Article reader', 'Blog at blog.espeezy.com', 'Shared Espeezy sign-in'],
    40,
  ),
  app(
    'core',
    'Dev Launch',
    'Developer docs and self-host guides.',
    'Setup guides, app links, and deployment notes at devlaunch.espeezy.com for technical teams.',
    'live',
    'core',
    'cpu',
    '#64748b',
    ['Links to every production app', 'Self-host and Cloudflare guides', 'Supabase setup docs'],
    50,
  ),
]

export function isPublicCatalogSlug(slug: string): boolean {
  return (PUBLIC_PRODUCTION_APP_SLUGS as readonly string[]).includes(slug)
}

export function filterPublicCatalogApps(apps: PlatformApp[]): PlatformApp[] {
  return apps
    .filter((a) => a.published && isPublicCatalogSlug(a.slug))
    .sort((a, b) => a.sort_order - b.sort_order)
}

const DOCS_FEATURE_PATH: Record<string, string> = {
  kanban: '/docs/features/kanban',
  games: '/docs/features/skirmish',
  studios: '/docs/features/studios',
  articles: '/docs/features/articles',
  core: '/docs/features/dev-launch',
}

/** Student-facing apps for docs and "apps in use" grids (excludes Dev Launch). */
export const CONSUMER_PRODUCTION_SLUGS = ['kanban', 'games', 'studios', 'articles'] as const

export type ProductionAppLink = {
  key: string
  name: string
  href: string
  summary: string
  docsHref?: string
}

export function productionAppsForConsumerDocs(): ProductionAppLink[] {
  return PRODUCTION_PLATFORM_APPS.filter((a) =>
    (CONSUMER_PRODUCTION_SLUGS as readonly string[]).includes(a.slug),
  ).map((a) => ({
    key: a.slug,
    name: a.name,
    href: a.live_url ?? '',
    summary: a.tagline,
    docsHref: DOCS_FEATURE_PATH[a.slug],
  }))
}

export function productionAppsForDeveloperDocs(): ProductionAppLink[] {
  return PRODUCTION_PLATFORM_APPS.filter((a) => a.slug === 'core').map((a) => ({
    key: a.slug,
    name: a.name,
    href: a.live_url ?? '',
    summary: a.tagline,
    docsHref: DOCS_FEATURE_PATH[a.slug],
  }))
}
