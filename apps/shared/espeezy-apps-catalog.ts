/**
 * Live app links for marketing footers and docs (canonical hostnames).
 */
import { ESPEEZY_APP_ORIGINS } from './espeezy-app-origins'

export type EspeezyAppLink = {
  href: string
  label: string
  external?: boolean
}

/** Apps shown in site footers and quick-link sections. */
export const ESPEEZY_PUBLIC_APP_LINKS: EspeezyAppLink[] = [
  { href: ESPEEZY_APP_ORIGINS.kanban, label: 'Espeezy Kanban', external: true },
  { href: ESPEEZY_APP_ORIGINS.games, label: 'Espeezy Games', external: true },
  { href: ESPEEZY_APP_ORIGINS.studios, label: 'Espeezy Studio', external: true },
  { href: ESPEEZY_APP_ORIGINS.articles, label: 'Articles', external: true },
  { href: ESPEEZY_APP_ORIGINS.core, label: 'Dev Launch', external: true },
]
