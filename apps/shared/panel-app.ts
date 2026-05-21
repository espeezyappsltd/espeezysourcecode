import { ESPEEZY_APP_ORIGINS } from './app-url'

/**
 * Monorepo mapping: `apps/admin` deploys to panel.espeezy.com.
 * Use this constant in docs, dev-hub, and Vercel — not the legacy "admin" hostname alone.
 */
export const ESPEEZY_PANEL_APP = {
  id: 'panel',
  /** npm workspace folder */
  packagePath: 'apps/admin',
  packageName: 'espeezy-admin',
  productionOrigin: ESPEEZY_APP_ORIGINS.panel,
  productionHost: 'panel.espeezy.com',
  localPort: 3004,
  localOrigin: 'http://localhost:3004',
  /** Staff OTP login (username → roster email) */
  loginPath: '/login',
  /** Protected console (requires admin_members row) */
  consolePath: '/admin',
  authCallbackPath: '/auth/callback',
  signOutPath: '/auth/signout',
} as const

/** Root `vercel.json` in this repo is for the panel Vercel project only. */
export const PANEL_VERCEL_ROOT = {
  rootDirectory: '.' as const,
  buildCommand: 'npm run vercel-build:panel',
  installCommand: 'npm install',
  outputDirectory: 'apps/admin/.next',
}

export function isPanelProductionHost(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase()
  return h === ESPEEZY_PANEL_APP.productionHost || h.startsWith('panel.')
}
