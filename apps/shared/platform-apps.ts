/**
 * Platform apps catalog — types, status labels, and offline fallback seed.
 */

import { normalizeGbpLabel } from './format-gbp'
import { PRODUCTION_PLATFORM_APPS } from './platform-production-catalog'

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
  'Open any app below with the same Espeezy login. Self-host guides live on Dev Launch for technical teams.'

/** Fallback when Supabase is unavailable — matches production deploys on espeezy.com. */
export const PLATFORM_APPS_FALLBACK: PlatformApp[] = PRODUCTION_PLATFORM_APPS

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
