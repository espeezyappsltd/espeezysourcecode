import { ESPEEZY_APP_ORIGINS } from '../../../apps/shared/espeezy-app-origins'

export type DevAppDefinition = {
  id: string
  name: string
  description: string
  packagePath: string
  /** Default local port (overridable via UI or DEV_HUB_PORT_<APP>). */
  port: number
  /** Iframe preview path (auth-gated apps should use /login). */
  previewPath?: string
  /** Lightweight path for dev-hub HTTP health checks. */
  healthPath?: string
  /** Node inspector port when started in debug mode. */
  inspectPort?: number
  productionUrl?: string
  accent: string
}

/** Espeezy monorepo apps only (under apps/ + this hub on :3000). */
export const DEV_APPS: DevAppDefinition[] = [
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Scholar workspace — kanban.espeezy.com',
    packagePath: 'apps/kanban',
    port: 3001,
    inspectPort: 9231,
    previewPath: '/login',
    healthPath: '/login',
    productionUrl: ESPEEZY_APP_ORIGINS.kanban,
    accent: '#10b981',
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Skirmish & quiz (Pro tier)',
    packagePath: 'apps/games',
    port: 3002,
    inspectPort: 9232,
    previewPath: '/login',
    healthPath: '/login',
    productionUrl: ESPEEZY_APP_ORIGINS.games,
    accent: '#6366f1',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Internal product dashboard',
    packagePath: 'apps/dashboard',
    port: 3003,
    productionUrl: ESPEEZY_APP_ORIGINS.dashboard,
    accent: '#06b6d4',
  },
  {
    id: 'admin',
    name: 'Panel',
    description: 'Staff console — panel.espeezy.com',
    packagePath: 'apps/admin',
    port: 3004,
    inspectPort: 9234,
    previewPath: '/login',
    healthPath: '/login',
    productionUrl: ESPEEZY_APP_ORIGINS.panel,
    accent: '#f59e0b',
  },
  {
    id: 'prereg',
    name: 'Prereg',
    description: 'espeezy.com — registration at /#register',
    packagePath: 'apps/prereg',
    port: 3005,
    productionUrl: `${ESPEEZY_APP_ORIGINS.prereg}/#register`,
    accent: '#8b5cf6',
  },
  {
    id: 'core',
    name: 'Dev Launch',
    description: 'Developer launchpad — devlaunch.espeezy.com',
    packagePath: 'apps/core',
    port: 3006,
    inspectPort: 9236,
    productionUrl: ESPEEZY_APP_ORIGINS.core,
    accent: '#ec4899',
  },
  {
    id: 'espeezystudios',
    name: 'Studios',
    description: 'Marketplace & jobs — studios.espeezy.com',
    packagePath: 'apps/espeezystudios',
    port: 3007,
    inspectPort: 9237,
    previewPath: '/login',
    healthPath: '/login',
    productionUrl: ESPEEZY_APP_ORIGINS.studios,
    accent: '#f59e0b',
  },
  {
    id: 'espeezyarticles',
    name: 'Articles',
    description: 'Articles & blog — articles.espeezy.com / blog.espeezy.com',
    packagePath: 'apps/espeezyarticles',
    port: 3008,
    productionUrl: ESPEEZY_APP_ORIGINS.articles,
    accent: '#06b6d4',
  },
]

export const HUB_APP: DevAppDefinition = {
  id: 'hub',
  name: 'Monorepo Hub',
  description: 'This control plane (root Next.js app) — base.espeezy.com',
  packagePath: '.',
  port: 3000,
  productionUrl: ESPEEZY_APP_ORIGINS.base,
  accent: '#34d399',
}

export function getDevApp(id: string): DevAppDefinition | undefined {
  return DEV_APPS.find((a) => a.id === id)
}

export { localAppUrl, localDevHost, hubListenPort } from './ports'
