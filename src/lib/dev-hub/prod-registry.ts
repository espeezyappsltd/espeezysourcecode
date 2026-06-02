import { ESPEEZY_APP_ORIGINS, hostnameFromOrigin } from '../../../apps/shared/espeezy-app-origins'

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

function deployment(
  id: string,
  appId: string,
  name: string,
  originKey: keyof typeof ESPEEZY_APP_ORIGINS,
  tagline: string,
  accent: string,
  registerUrl?: string,
): ProdDeployment {
  const url = ESPEEZY_APP_ORIGINS[originKey]
  return {
    id,
    appId,
    name,
    hostname: hostnameFromOrigin(url),
    url,
    registerUrl,
    tagline,
    accent,
  }
}

export const PROD_DEPLOYMENTS: ProdDeployment[] = [
  deployment('prereg', 'prereg', 'Marketing', 'prereg', 'Marketing site & registration', '#8b5cf6', 'https://espeezy.com/#register'),
  deployment('base', 'hub', 'Dev Hub', 'base', 'Monorepo control plane', '#34d399'),
  deployment('kanban', 'kanban', 'Kanban', 'kanban', 'Scholar workspace', '#10b981'),
  deployment('games', 'games', 'Games', 'games', 'Skirmish & quiz', '#6366f1'),
  deployment('studios', 'espeezystudios', 'Studios', 'studios', 'Marketplace & jobs', '#f59e0b'),
  deployment('core', 'core', 'Dev Launch', 'core', 'Developer launchpad', '#ec4899'),
  deployment('articles', 'espeezyarticles', 'Articles', 'articles', 'Articles reader', '#06b6d4'),
  deployment('blog', 'espeezyarticles', 'Blog', 'blog', 'Blog (articles alias)', '#0891b2'),
  deployment('panel', 'admin', 'Panel', 'panel', 'Staff console', '#0f172a'),
  deployment('dashboard', 'dashboard', 'Dashboard', 'dashboard', 'Internal product dashboard', '#64748b'),
]
