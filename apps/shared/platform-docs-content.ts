/**
 * Informational copy and app directory for espeezy.com docs and landing.
 */
import { ESPEEZY_APP_ORIGINS } from './espeezy-app-origins'

export type AppInUse = {
  key: string
  name: string
  href: string
  summary: string
  docsHref?: string
}

/** Primary hosted apps students and teams use today. */
export const ESPEEZY_APPS_IN_USE: AppInUse[] = [
  {
    key: 'kanban',
    name: 'Espeezy Kanban',
    href: ESPEEZY_APP_ORIGINS.kanban,
    summary: 'Shared boards, tasks, and contribution records for group work.',
    docsHref: '/docs/features/kanban',
  },
  {
    key: 'games',
    name: 'Espeezy Games',
    href: ESPEEZY_APP_ORIGINS.games,
    summary: 'Study sessions and quiz-style rounds with classmates.',
    docsHref: '/docs/features/skirmish',
  },
  {
    key: 'studios',
    name: 'Espeezy Studio',
    href: ESPEEZY_APP_ORIGINS.studios,
    summary: 'Freelance and client projects, handoffs, and delivery.',
    docsHref: '/docs/features/studios',
  },
  {
    key: 'articles',
    name: 'Articles',
    href: ESPEEZY_APP_ORIGINS.articles,
    summary: 'Long-form posts and campus writing.',
    docsHref: '/docs/features/articles',
  },
]

export const ESPEEZY_DEVELOPER_APPS: AppInUse[] = [
  {
    key: 'core',
    name: 'Dev Launch',
    href: ESPEEZY_APP_ORIGINS.core,
    summary: 'Self-host guides and app links for technical teams.',
    docsHref: '/docs/features/dev-launch',
  },
  {
    key: 'hub',
    name: 'Dev Hub',
    href: ESPEEZY_APP_ORIGINS.base,
    summary: 'Internal developer tools and deployment access.',
  },
]

export const DOCS_HOME_INTRO =
  'Espeezy learning apps help students and teams plan work, study together, and show who contributed. Start with Kanban, then open the other apps with the same account.'

export const DOCS_ESSENTIAL_LINKS = [
  { title: 'Quick start', desc: 'Create an account and open your first board.', href: '/docs/getting-started' },
  { title: 'Apps in use', desc: 'What each live app does and where to open it.', href: '/docs/apps' },
  { title: 'Kanban boards', desc: 'Tasks, teams, and contribution exports.', href: '/docs/features/kanban' },
  { title: 'Installation', desc: 'Browser use and self-host overview.', href: '/docs/installation' },
  { title: 'Pricing', desc: 'Plans and billing on espeezy.com.', href: '/checkout' },
] as const
