export type DevAppDefinition = {
  id: string
  name: string
  description: string
  packagePath: string
  /** Default local port (overridable via UI or DEV_HUB_PORT_<APP>). */
  port: number
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
    productionUrl: 'https://kanban.espeezy.com',
    accent: '#10b981',
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Skirmish & quiz (Pro tier)',
    packagePath: 'apps/games',
    port: 3002,
    productionUrl: 'https://games.espeezy.com',
    accent: '#6366f1',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Internal product dashboard',
    packagePath: 'apps/dashboard',
    port: 3003,
    accent: '#06b6d4',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Admin console & operations',
    packagePath: 'apps/admin',
    port: 3004,
    accent: '#f59e0b',
  },
  {
    id: 'prereg',
    name: 'Prereg',
    description: 'espeezy.com — registration at /#register',
    packagePath: 'apps/prereg',
    port: 3005,
    productionUrl: 'https://espeezy.com/#register',
    accent: '#8b5cf6',
  },
  {
    id: 'core',
    name: 'Core',
    description: 'Local-first core runtime',
    packagePath: 'apps/core',
    port: 3006,
    productionUrl: 'https://core.espeezy.com',
    accent: '#ec4899',
  },
]

export const HUB_APP: DevAppDefinition = {
  id: 'hub',
  name: 'Monorepo Hub',
  description: 'This control plane (root Next.js app)',
  packagePath: '.',
  port: 3000,
  accent: '#34d399',
}

export function getDevApp(id: string): DevAppDefinition | undefined {
  return DEV_APPS.find((a) => a.id === id)
}

export { localAppUrl, localDevHost, hubListenPort } from './ports'
