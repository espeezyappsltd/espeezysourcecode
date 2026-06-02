/**
 * Monorepo mapping: `apps/admin` deploys to panel.espeezy.com on Cloudflare Workers.
 * Use this constant in docs, dev-hub, and wrangler — not the legacy "admin" hostname alone.
 * (Do not import from app-url.ts — avoids circular init with ESPEEZY_APP_ORIGINS.)
 */
export const ESPEEZY_PANEL_APP = {
  id: 'panel',
  /** npm workspace folder */
  packagePath: 'apps/admin',
  packageName: 'espeezy-admin',
  productionOrigin: 'https://panel.espeezy.com',
  productionHost: 'panel.espeezy.com',
  localPort: 3004,
  localOrigin: 'http://localhost:3004',
  /** Staff login (username + authenticator app TOTP) */
  loginPath: '/login',
  /** Protected console (requires admin_members row) */
  consolePath: '/admin',
  authCallbackPath: '/auth/callback',
  signOutPath: '/auth/signout',
} as const

/** Cloudflare Workers deploy config for the panel (admin) app. */
export const PANEL_CLOUDFLARE_DEPLOY = {
  workerName: 'espeezy-panel',
  appPath: 'apps/admin',
  wranglerPath: 'apps/admin/wrangler.toml',
  buildCommand: 'npm run cf-build:panel',
  hostnames: ['panel.espeezy.com'] as const,
  zoneName: 'espeezy.com',
}

/** @deprecated Use PANEL_CLOUDFLARE_DEPLOY */
export const PANEL_VERCEL_ROOT = PANEL_CLOUDFLARE_DEPLOY

export function isPanelProductionHost(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase()
  return h === ESPEEZY_PANEL_APP.productionHost || h.startsWith('panel.')
}
