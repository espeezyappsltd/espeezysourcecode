/**
 * Platform apps catalog — types, status labels, and offline fallback seed.
 */

import { normalizeGbpLabel } from './format-gbp'

export type PlatformAppStatus = 'live' | 'beta' | 'development' | 'coming_soon'

export type PlatformAppSetupSection = {
  title: string
  steps: string[]
}

export type PlatformApp = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  status: PlatformAppStatus
  price_cents: number
  price_currency: string
  price_label: string
  stripe_payment_link: string | null
  download_url: string | null
  live_url: string | null
  icon_key: string
  accent_color: string
  features: string[]
  setup_sections: PlatformAppSetupSection[]
  db_setup_markdown: string
  ui_customization_markdown: string
  includes_source: boolean
  sort_order: number
  published: boolean
  created_at?: string
  updated_at?: string
}

export const PLATFORM_APP_STATUS_LABEL: Record<PlatformAppStatus, string> = {
  live: 'Available now',
  beta: 'Public beta',
  development: 'In development',
  coming_soon: 'Coming soon',
}

export const PLATFORM_HERO_INTRO =
  'It runs in your browser today. You can also self-host any app on your own database, branding, and domain.'

/** Fallback when Supabase is unavailable (matches migration seed). */
export const PLATFORM_APPS_FALLBACK: PlatformApp[] = [
  {
    id: 'seed-kanban',
    slug: 'kanban',
    name: 'Espeezy Kanban',
    tagline: 'The main app: shared boards that track who contributes to each project.',
    description:
      'The main Espeezy workspace. Plan group projects on shared boards, keep a record of every contribution, and export it for grades and portfolios.',
    status: 'live',
    price_cents: 49900,
    price_currency: 'GBP',
    price_label: '£499 one-time · self-host license',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://kanban.espeezy.com',
    icon_key: 'layout-dashboard',
    accent_color: '#10b981',
    features: [
      'Kanban boards & drag-and-drop columns',
      'Contribution proof & academic exports',
      'Teams, RBAC, and institutional guards',
      'Premium opens Espeezy Studio (projects & delivery)',
    ],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: true,
    sort_order: 10,
    published: true,
  },
  {
    id: 'seed-games',
    slug: 'games',
    name: 'Espeezy Games',
    tagline: 'Quiz games and head-to-head study battles.',
    description: 'Quiz games and head-to-head matches that use your Espeezy account.',
    status: 'live',
    price_cents: 29900,
    price_currency: 'GBP',
    price_label: '£299 one-time · self-host license',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://games.espeezy.com',
    icon_key: 'gamepad-2',
    accent_color: '#6366f1',
    features: ['Category & game catalog', 'Skirmish sessions', 'Cross-app SSO with Kanban'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: true,
    sort_order: 20,
    published: true,
  },
  {
    id: 'seed-admin',
    slug: 'admin',
    name: 'Espeezy Panel',
    tagline: 'Staff console for platform operations.',
    description: 'Internal admin panel: RBAC staff, marketing controls, audit, and vault.',
    status: 'beta',
    price_cents: 19900,
    price_currency: 'GBP',
    price_label: '£199 one-time · self-host license',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://panel.espeezy.com',
    icon_key: 'shield',
    accent_color: '#0f172a',
    features: ['Staff RBAC & TOTP', 'Launch & marketing controls', 'User analytics'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: true,
    sort_order: 30,
    published: true,
  },
  {
    id: 'seed-prereg',
    slug: 'prereg',
    name: 'Espeezy Marketing',
    tagline: 'Early access, pricing, checkout, and docs.',
    description: 'The espeezy.com marketing application for product launches, documentation, and checkout.',
    status: 'live',
    price_cents: 9900,
    price_currency: 'GBP',
    price_label: '£99 one-time · self-host license',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://espeezy.com',
    icon_key: 'globe',
    accent_color: '#06b6d4',
    features: ['Landing & prereg', 'Stripe checkout', 'Docs site'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: true,
    sort_order: 40,
    published: true,
  },
  {
    id: 'seed-core',
    slug: 'core',
    name: 'Dev Launch',
    tagline: 'Developer launchpad and local app links.',
    description: 'Docs, tutorials, and links to every Espeezy app at devlaunch.espeezy.com.',
    status: 'development',
    price_cents: 0,
    price_currency: 'GBP',
    price_label: 'Early access · pricing TBA',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://devlaunch.espeezy.com',
    icon_key: 'cpu',
    accent_color: '#94a3b8',
    features: ['Dev hub orchestration', 'Shared auth bridges'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: false,
    sort_order: 50,
    published: true,
  },
  {
    id: 'seed-studios',
    slug: 'studios',
    name: 'Espeezy Studio',
    tagline: 'Studio hub, projects, and client delivery for Premium members.',
    description: 'Run gigs, professional projects, invoices, and delivery docs at studios.espeezy.com.',
    status: 'development',
    price_cents: 0,
    price_currency: 'GBP',
    price_label: 'In development',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://studios.espeezy.com',
    icon_key: 'palette',
    accent_color: '#f59e0b',
    features: ['Studio hub', 'Project delivery workspace', 'Invoices and client email'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: false,
    sort_order: 60,
    published: true,
  },
  {
    id: 'seed-articles',
    slug: 'articles',
    name: 'Espeezy Articles',
    tagline: 'Campus articles and blog reader.',
    description: 'Published articles at articles.espeezy.com and blog.espeezy.com.',
    status: 'development',
    price_cents: 0,
    price_currency: 'GBP',
    price_label: 'In development',
    stripe_payment_link: null,
    download_url: null,
    live_url: 'https://articles.espeezy.com',
    icon_key: 'globe',
    accent_color: '#06b6d4',
    features: ['Article reader', 'Blog alias host', 'Shared Supabase content'],
    setup_sections: [],
    db_setup_markdown: '',
    ui_customization_markdown: '',
    includes_source: false,
    sort_order: 70,
    published: true,
  },
]

export function formatPlatformAppPrice(app: Pick<PlatformApp, 'price_cents' | 'price_currency' | 'price_label'>): string {
  if (app.price_label?.trim()) return normalizeGbpLabel(app.price_label.trim())
  if (app.price_cents <= 0) return 'Free'
  const major = app.price_cents / 100
  const formatted = major % 1 === 0 ? major.toFixed(0) : major.toFixed(2)
  return `£${formatted}`
}

export function platformAppProductPath(slug: string): string {
  return `/apps/${encodeURIComponent(slug)}`
}

function parseFeatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string')
}

function parseSetupSections(raw: unknown): PlatformAppSetupSection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const title = typeof row.title === 'string' ? row.title : ''
      const steps = Array.isArray(row.steps)
        ? row.steps.filter((s): s is string => typeof s === 'string')
        : []
      if (!title) return null
      return { title, steps }
    })
    .filter((x): x is PlatformAppSetupSection => x !== null)
}

export function normalizePlatformAppRow(row: Record<string, unknown>): PlatformApp {
  return {
    id: String(row.id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? ''),
    tagline: String(row.tagline ?? ''),
    description: String(row.description ?? ''),
    status: (row.status as PlatformAppStatus) ?? 'development',
    price_cents: Number(row.price_cents ?? 0),
    price_currency: String(row.price_currency ?? 'GBP'),
    price_label: String(row.price_label ?? ''),
    stripe_payment_link:
      typeof row.stripe_payment_link === 'string' ? row.stripe_payment_link : null,
    download_url: typeof row.download_url === 'string' ? row.download_url : null,
    live_url: typeof row.live_url === 'string' ? row.live_url : null,
    icon_key: String(row.icon_key ?? 'layout'),
    accent_color: String(row.accent_color ?? '#6366f1'),
    features: parseFeatures(row.features),
    setup_sections: parseSetupSections(row.setup_sections),
    db_setup_markdown: String(row.db_setup_markdown ?? ''),
    ui_customization_markdown: String(row.ui_customization_markdown ?? ''),
    includes_source: Boolean(row.includes_source),
    sort_order: Number(row.sort_order ?? 0),
    published: Boolean(row.published ?? true),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  }
}
