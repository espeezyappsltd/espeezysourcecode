/** Static mark for favicons, push notifications, and img src fallbacks. */
export const ESPEEZY_APP_MARK_ICON_PATH = '/espeezy-app-mark.svg'

export type EspeezyAppLogoSlug =  | 'kanban'
  | 'studios'
  | 'games'
  | 'articles'
  | 'devlaunch'
  | 'devhub'
  | 'admin'
  | 'marketing'
  | 'platform'

export type EspeezyAppLogoConfig = {
  word: string
  label: string
  ruleWidth: number
}

export const ESPEEZY_APP_LOGO_CONFIG: Record<EspeezyAppLogoSlug, EspeezyAppLogoConfig> = {
  kanban: { word: 'KANBAN', label: 'Espeezy Kanban', ruleWidth: 88 },
  studios: { word: 'STUDIOS', label: 'Espeezy Studios', ruleWidth: 92 },
  games: { word: 'GAMES', label: 'Espeezy Games', ruleWidth: 78 },
  articles: { word: 'ARTICLES', label: 'Espeezy Articles', ruleWidth: 98 },
  devlaunch: { word: 'LAUNCH', label: 'Dev Launch', ruleWidth: 82 },
  devhub: { word: 'DEV HUB', label: 'Dev Hub', ruleWidth: 88 },
  admin: { word: 'PANEL', label: 'Espeezy Panel', ruleWidth: 72 },
  marketing: { word: 'ESPEEZY', label: 'Espeezy', ruleWidth: 88 },
  platform: { word: 'ESPEEZY', label: 'Espeezy', ruleWidth: 88 },
}

export function isEspeezyAppLogoSlug(value: string): value is EspeezyAppLogoSlug {
  return value in ESPEEZY_APP_LOGO_CONFIG
}

/** Map platform catalog slugs to logo slugs */
export function platformSlugToLogoSlug(slug: string): EspeezyAppLogoSlug | null {
  const map: Record<string, EspeezyAppLogoSlug> = {
    kanban: 'kanban',
    games: 'games',
    admin: 'admin',
    prereg: 'marketing',
    core: 'devlaunch',
    studios: 'studios',
    articles: 'articles',
  }
  return map[slug] ?? null
}
