/**
 * Informational copy and app directory for espeezy.com docs and landing.
 */
import {
  productionAppsForConsumerDocs,
  productionAppsForDeveloperDocs,
  type ProductionAppLink,
} from './platform-production-catalog'

export type AppInUse = ProductionAppLink

/** Primary hosted apps students and teams use today (synced with production catalog). */
export const ESPEEZY_APPS_IN_USE: AppInUse[] = productionAppsForConsumerDocs()

export const ESPEEZY_DEVELOPER_APPS: AppInUse[] = productionAppsForDeveloperDocs()

export const DOCS_HOME_INTRO =
  'Espeezy learning apps help students and teams plan work, study together, and show who contributed. Start with Kanban, then open the other apps with the same account.'

export const DOCS_ESSENTIAL_LINKS = [
  { title: 'Quick start', desc: 'Create an account and open your first board.', href: '/docs/getting-started' },
  { title: 'Apps in use', desc: 'What each live app does and where to open it.', href: '/docs/apps' },
  { title: 'Kanban boards', desc: 'Tasks, teams, and contribution exports.', href: '/docs/features/kanban' },
  { title: 'Installation', desc: 'Browser use and self-host overview.', href: '/docs/installation' },
  { title: 'Pricing', desc: 'Plans and billing on espeezy.com.', href: '/checkout' },
] as const
