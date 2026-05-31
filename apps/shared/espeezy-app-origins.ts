/**
 * Canonical production hostnames for every Espeezy deployable app.
 * Override per app with NEXT_PUBLIC_<KEY>_APP_URL in that app's env.
 */

export const ESPEEZY_APP_ORIGINS = {
  /** Marketing / apex (apps/prereg) */
  prereg: 'https://espeezy.com',
  /** Monorepo dev hub (repo root Next.js) */
  base: 'https://base.espeezy.com',
  /** Scholar workspace (apps/kanban) */
  kanban: 'https://kanban.espeezy.com',
  /** Skirmish & quiz (apps/games) */
  games: 'https://games.espeezy.com',
  /** Staff console (apps/admin) */
  panel: 'https://panel.espeezy.com',
  /** Studio hub & projects (apps/espeezystudios) */
  studios: 'https://studios.espeezy.com',
  /** Developer launchpad (apps/core) */
  core: 'https://devlaunch.espeezy.com',
  /** Articles reader (apps/espeezyarticles) */
  articles: 'https://articles.espeezy.com',
  /** Blog alias → same app as articles */
  blog: 'https://blog.espeezy.com',
  /** Internal dashboard (apps/dashboard) */
  dashboard: 'https://dashboard.espeezy.com',
} as const

export type EspeezyAppKey = keyof typeof ESPEEZY_APP_ORIGINS

/** Maps repo folder name under apps/ → origin key */
export const APP_FOLDER_TO_ORIGIN_KEY: Record<string, EspeezyAppKey> = {
  prereg: 'prereg',
  kanban: 'kanban',
  games: 'games',
  admin: 'panel',
  espeezystudios: 'studios',
  core: 'core',
  espeezyarticles: 'articles',
  dashboard: 'dashboard',
}

const ENV_OVERRIDES: Partial<Record<EspeezyAppKey, string>> = {
  kanban: 'NEXT_PUBLIC_KANBAN_APP_URL',
  games: 'NEXT_PUBLIC_GAMES_APP_URL',
  panel: 'NEXT_PUBLIC_ADMIN_URL',
  studios: 'NEXT_PUBLIC_STUDIOS_APP_URL',
  core: 'NEXT_PUBLIC_CORE_APP_URL',
  articles: 'NEXT_PUBLIC_ARTICLES_APP_URL',
  blog: 'NEXT_PUBLIC_BLOG_APP_URL',
  base: 'NEXT_PUBLIC_BASE_APP_URL',
  prereg: 'NEXT_PUBLIC_MARKETING_URL',
  dashboard: 'NEXT_PUBLIC_DASHBOARD_APP_URL',
}

export function resolveAppOrigin(key: EspeezyAppKey, fallback?: string): string {
  const envVar = ENV_OVERRIDES[key]
  const fromEnv = envVar ? process.env[envVar]?.trim() : undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (key === 'prereg') {
    const marketing = process.env.NEXT_PUBLIC_PREREG_URL?.trim()
    if (marketing) return marketing.replace(/\/$/, '')
  }
  if (fallback) return fallback.replace(/\/$/, '')
  return ESPEEZY_APP_ORIGINS[key].replace(/\/$/, '')
}

export function buildAppUrl(key: EspeezyAppKey, path = '/'): string {
  const base = resolveAppOrigin(key)
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function hostnameFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname
  } catch {
    return origin.replace(/^https?:\/\//, '').split('/')[0]?.split(':')[0] ?? origin
  }
}

/** All production hostnames that should resolve via DNS/Caddy/Vercel. */
export function allProductionHostnames(): string[] {
  const hosts = Object.values(ESPEEZY_APP_ORIGINS).map(hostnameFromOrigin)
  hosts.push('www.espeezy.com', 'core.espeezy.com')
  return [...new Set(hosts)]
}
