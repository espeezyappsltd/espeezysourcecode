/**
 * Canonical Cloudflare Workers deployment map for Espeezy apps.
 * Each app is an OpenNext-on-Cloudflare worker with custom-domain routing on espeezy.com.
 */
import { ESPEEZY_APP_ORIGINS, type EspeezyAppKey, hostnameFromOrigin } from './espeezy-app-origins'

export type CloudflareAppDeploy = {
  /** Stable worker name in Cloudflare (wrangler `name`) */
  workerName: string
  /** Repo folder under apps/ */
  appFolder: string
  /** Origin key in ESPEEZY_APP_ORIGINS */
  originKey: EspeezyAppKey
  /** Production hostnames routed to this worker */
  hostnames: string[]
  /** npm script at repo root, e.g. cf-build:kanban */
  rootBuildScript: string
  /** Relative path to wrangler.toml from repo root */
  wranglerPath: string
  /** Cloudflare zone for custom-domain routes */
  zoneName: string
}

const ZONE = 'espeezy.com'

function hosts(...keys: EspeezyAppKey[]): string[] {
  return keys.map((key) => hostnameFromOrigin(ESPEEZY_APP_ORIGINS[key]))
}

/** All production Next.js apps deployed to Cloudflare Workers (not Docker/Caddy). */
export const CLOUDFLARE_APP_DEPLOYS: CloudflareAppDeploy[] = [
  {
    workerName: 'espeezy-prereg',
    appFolder: 'prereg',
    originKey: 'prereg',
    hostnames: ['espeezy.com', 'www.espeezy.com'],
    rootBuildScript: 'cf-build:prereg',
    wranglerPath: 'apps/prereg/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-kanban',
    appFolder: 'kanban',
    originKey: 'kanban',
    hostnames: hosts('kanban'),
    rootBuildScript: 'cf-build:kanban',
    wranglerPath: 'apps/kanban/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-games',
    appFolder: 'games',
    originKey: 'games',
    hostnames: hosts('games'),
    rootBuildScript: 'cf-build:games',
    wranglerPath: 'apps/games/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-panel',
    appFolder: 'admin',
    originKey: 'panel',
    hostnames: hosts('panel'),
    rootBuildScript: 'cf-build:panel',
    wranglerPath: 'apps/admin/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-studios',
    appFolder: 'espeezystudios',
    originKey: 'studios',
    hostnames: hosts('studios'),
    rootBuildScript: 'cf-build:espeezystudios',
    wranglerPath: 'apps/espeezystudios/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-dashboard',
    appFolder: 'dashboard',
    originKey: 'dashboard',
    hostnames: hosts('dashboard'),
    rootBuildScript: 'cf-build:dashboard',
    wranglerPath: 'apps/dashboard/wrangler.toml',
    zoneName: ZONE,
  },
  {
    workerName: 'espeezy-base',
    appFolder: '.',
    originKey: 'base',
    hostnames: hosts('base'),
    rootBuildScript: 'cf-build:base',
    wranglerPath: 'wrangler.toml',
    zoneName: ZONE,
  },
]

export function cloudflareDeployByFolder(folder: string): CloudflareAppDeploy | undefined {
  return CLOUDFLARE_APP_DEPLOYS.find((d) => d.appFolder === folder)
}

export function cloudflareDeployByWorker(name: string): CloudflareAppDeploy | undefined {
  return CLOUDFLARE_APP_DEPLOYS.find((d) => d.workerName === name)
}

export function allCloudflareProductionHostnames(): string[] {
  const hosts = CLOUDFLARE_APP_DEPLOYS.flatMap((d) => d.hostnames)
  hosts.push('core.espeezy.com')
  return [...new Set(hosts)]
}
