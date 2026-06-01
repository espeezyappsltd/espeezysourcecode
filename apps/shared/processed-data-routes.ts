/**
 * Routes that load aggregated / processed data (analytics, dashboards, reports).
 */

const ANALYTICS_PATH = /\/analytics(\/|$)/

/** Any app: analytics routes and team intelligence views. */
export function isProcessedDataRoute(pathname: string): boolean {
  const path = normalizePath(pathname)
  return ANALYTICS_PATH.test(path)
}

/** Espeezy Studios: dashboard home + analytics. */
export function isStudiosProcessedDataRoute(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (path === '/') return true
  return ANALYTICS_PATH.test(path)
}

/** Admin panel: analytics permission routes. */
export function isAdminProcessedDataRoute(pathname: string): boolean {
  const path = normalizePath(pathname)
  return path.startsWith('/admin/analytics') || ANALYTICS_PATH.test(path)
}

function normalizePath(pathname: string): string {
  const base = pathname.split('?')[0].split('#')[0] || '/'
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1)
  return base
}
