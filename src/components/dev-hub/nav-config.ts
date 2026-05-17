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
  { id: 'admin', name: 'Admin', accent: '#f59e0b', port: 3004 },
  { id: 'prereg', name: 'Prereg', accent: '#8b5cf6', port: 3005 },
  { id: 'core', name: 'Local Server', accent: '#ec4899', port: 3006 },
]

export function getNavApp(id: string): DevHubNavApp | undefined {
  return DEV_HUB_NAV_APPS.find((a) => a.id === id)
}
