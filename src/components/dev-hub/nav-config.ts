/** Client-safe nav metadata (mirrors dev-hub registry). */
export type DevHubNavApp = {
  id: string
  name: string
  accent: string
  port: number
}

export const DEV_HUB_NAV_APPS: DevHubNavApp[] = [
  { id: 'kanban', name: 'Kanban', accent: '#10b981', port: 3001 },
  { id: 'games', name: 'Games', accent: '#6366f1', port: 3002 },
  { id: 'dashboard', name: 'Dashboard', accent: '#06b6d4', port: 3003 },
  { id: 'admin', name: 'Panel', accent: '#f59e0b', port: 3004 },
  { id: 'prereg', name: 'Prereg', accent: '#8b5cf6', port: 3005 },
  { id: 'core', name: 'Local Server', accent: '#ec4899', port: 3006 },
]

export function getNavApp(id: string): DevHubNavApp | undefined {
  return DEV_HUB_NAV_APPS.find((a) => a.id === id)
}

/** Admin console tabs (panel.espeezy.com) — shown in hub sidebar for staff. */
export type DevHubAdminTab = {
  label: string
  path: string
  permission: 'overview' | 'users' | 'analytics' | 'announcements' | 'launch' | 'audit' | 'settings'
}

export const DEV_HUB_ADMIN_TABS: DevHubAdminTab[] = [
  { label: 'Overview', path: '/admin', permission: 'overview' },
  { label: 'Users', path: '/admin/users', permission: 'users' },
  { label: 'Analytics', path: '/admin/analytics', permission: 'analytics' },
  { label: 'Announcements', path: '/admin/announcements', permission: 'announcements' },
  { label: 'Launch', path: '/admin/launch', permission: 'launch' },
  { label: 'Audit log', path: '/admin/audit', permission: 'audit' },
  { label: 'Settings', path: '/admin/settings', permission: 'settings' },
]

const PANEL_PRODUCTION = 'https://panel.espeezy.com'

export function getAdminAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3004'
  }
  return PANEL_PRODUCTION
}

export function adminConsoleHref(path: string): string {
  return `${getAdminAppBaseUrl()}${path}`
}
