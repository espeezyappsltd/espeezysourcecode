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
    productionUrl: 'https://kanban.espeezy.com',
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
    name: 'Panel',
    description: 'Staff console — panel.espeezy.com',
    packagePath: 'apps/admin',
    port: 3004,
    inspectPort: 9234,
    previewPath: '/login',
    healthPath: '/login',
    productionUrl: 'https://panel.espeezy.com',
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
    name: 'Local Server',
    description: 'Developer launchpad — docs, tutorials & local app links',
    packagePath: 'apps/core',
    port: 3006,
    inspectPort: 9236,
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
