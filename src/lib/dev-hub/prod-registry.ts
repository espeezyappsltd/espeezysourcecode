/** Live production deployments (from Caddy / DNS). */
export type ProdDeployment = {
  id: string
  appId: string
  name: string
  hostname: string
  url: string
  /** Optional deep link (e.g. registration form hash route). */
  registerUrl?: string
  tagline: string
  accent: string
}

export const PROD_DEPLOYMENTS: ProdDeployment[] = [
  {
    id: 'prereg',
    appId: 'prereg',
    name: 'Prereg',
    hostname: 'espeezy.com',
    url: 'https://espeezy.com',
    registerUrl: 'https://espeezy.com/#register',
    tagline: 'Marketing site & registration',
    accent: '#8b5cf6',
  },
  {
    id: 'kanban',
    appId: 'kanban',
    name: 'Kanban',
    hostname: 'kanban.espeezy.com',
    url: 'https://kanban.espeezy.com',
    tagline: 'Scholar workspace',
    accent: '#34d399',
  },
  {
    id: 'games',
    appId: 'games',
    name: 'Games',
    hostname: 'games.espeezy.com',
    url: 'https://games.espeezy.com',
    tagline: 'Skirmish & quiz',
    accent: '#6366f1',
  },
  {
    id: 'core',
    appId: 'core',
    name: 'Core',
    hostname: 'core.espeezy.com',
    url: 'https://core.espeezy.com',
    tagline: 'Core runtime API',
    accent: '#ec4899',
  },
]
