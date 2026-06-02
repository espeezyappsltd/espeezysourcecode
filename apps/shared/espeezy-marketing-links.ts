/**
 * Absolute URLs for docs and marketing hosted on espeezy.com (apps/prereg).
 */
import { buildAppUrl, ESPEEZY_APP_ORIGINS } from './espeezy-app-origins'

export function espeezyMarketingUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${ESPEEZY_APP_ORIGINS.prereg.replace(/\/$/, '')}${normalized}`
}

export function espeezyDocsUrl(path = '/docs'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return espeezyMarketingUrl(normalized)
}

export function espeezyGamesUrl(path = '/'): string {
  return buildAppUrl('games', path)
}
