export { ESPEEZY_PANEL_APP, PANEL_VERCEL_ROOT, isPanelProductionHost } from './panel-app'

/** Canonical production origins for Espeezy apps (used for auth redirects and links). */
export const ESPEEZY_APP_ORIGINS = {
  prereg: 'https://espeezy.com',
  kanban: 'https://kanban.espeezy.com',
  games: 'https://games.espeezy.com',
  panel: 'https://panel.espeezy.com',
} as const

export type EspeezyAppKey = keyof typeof ESPEEZY_APP_ORIGINS

const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

const ALLOWED_HOSTS = new Set([
  'espeezy.com',
  'www.espeezy.com',
  'kanban.espeezy.com',
  'panel.espeezy.com',
  'games.espeezy.com',
  'localhost',
  '127.0.0.1',
])

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.has(hostname)) return true
  return hostname.endsWith('.espeezy.com')
}

/** Resolve request origin from headers (server) or env fallback. */
export function resolveRequestOrigin(
  request?: Request | { headers: Headers } | null,
  fallback: string = ESPEEZY_APP_ORIGINS.kanban,
): string {
  if (request) {
    const headers = request.headers
    const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    const host = forwardedHost || headers.get('host')?.split(',')[0]?.trim()
    if (host) {
      const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
      const hostname = host.split(':')[0]
      if (isAllowedHost(hostname)) {
        return normalizeOrigin(`${proto}://${host}`)
      }
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) return normalizeOrigin(envUrl)

  return normalizeOrigin(fallback)
}

/** Browser-safe origin for client components. */
export function resolveClientOrigin(fallback: string = ESPEEZY_APP_ORIGINS.kanban): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeOrigin(window.location.origin)
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) return normalizeOrigin(envUrl)
  return normalizeOrigin(fallback)
}

export function buildAuthCallbackUrl(
  origin: string,
  options?: { recovery?: boolean; next?: string },
): string {
  const url = new URL('/auth/callback', normalizeOrigin(origin))
  if (options?.recovery) url.searchParams.set('type', 'recovery')
  if (options?.next) url.searchParams.set('next', options.next)
  return url.toString()
}

/** True when the user hit the prereg apex but should finish auth on Kanban. */
export function shouldForwardAuthToKanban(hostname: string, searchParams: URLSearchParams): boolean {
  const isPreregHost = hostname === 'espeezy.com' || hostname === 'www.espeezy.com'
  if (!isPreregHost) return false
  if (searchParams.get('type') === 'recovery') return true
  if (searchParams.get('app') === 'kanban') return true
  return searchParams.has('code') && searchParams.get('redirect_to')?.includes('kanban.espeezy.com') === true
}

/** Admin console origin (panel.espeezy.com in production). */
export function resolvePanelOrigin(
  request?: Request | { headers: Headers } | null,
): string {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (adminUrl) return normalizeOrigin(adminUrl)
  return resolveRequestOrigin(request, ESPEEZY_APP_ORIGINS.panel)
}

/** @deprecated Use resolvePanelOrigin */
export const resolveAdminAppOrigin = resolvePanelOrigin

export function buildAdminLoginUrl(
  request?: Request | { headers: Headers } | null,
  options?: { redirect?: string; error?: string },
): string {
  const base = new URL('/login', resolvePanelOrigin(request))
  if (options?.redirect) base.searchParams.set('redirect', options.redirect)
  if (options?.error) base.searchParams.set('error', options.error)
  return base.toString()
}

/** True when auth should complete on the admin panel host. */
export function shouldForwardAuthToPanel(hostname: string, searchParams: URLSearchParams): boolean {
  const isPreregHost = hostname === 'espeezy.com' || hostname === 'www.espeezy.com'
  if (!isPreregHost) return false
  if (searchParams.get('app') === 'panel' || searchParams.get('app') === 'admin') return true
  return searchParams.has('code') && searchParams.get('redirect_to')?.includes('panel.espeezy.com') === true
}

export function isLocalOrigin(origin: string): boolean {
  try {
    return LOCAL_ORIGIN_PATTERN.test(normalizeOrigin(origin))
  } catch {
    return false
  }
}

/** Reject open-redirect paths; allow only same-origin relative routes. */
export function sanitizeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes(':')) {
    return fallback
  }
  return next
}

const EMBED_QUERY = 'embed'

/** True when rendered inside the dev-hub iframe preview (or explicitly tagged). */
export function isEmbedPreview(searchParams?: URLSearchParams | null): boolean {
  if (searchParams?.get(EMBED_QUERY) === '1') return true
  if (typeof window !== 'undefined' && window.self !== window.top) return true
  return false
}

/** Append embed=1 so login pages fit the dev-hub preview frame. */
export function withEmbedPreviewParam(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set(EMBED_QUERY, '1')
    return parsed.toString()
  } catch {
    return url
  }
}
