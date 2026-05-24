export type HubAdminRole = 'admin' | 'moderator' | 'viewer'

const ROLE_PERMISSIONS: Record<HubAdminRole, string[]> = {
  admin: ['*'],
  moderator: ['overview', 'users', 'analytics', 'announcements', 'chat'],
  viewer: ['overview', 'analytics', 'chat'],
}

export function hasHubAdminPermission(role: string, permission: string): boolean {
  const grants = ROLE_PERMISSIONS[role as HubAdminRole]
  if (!grants) return false
  if (grants[0] === '*') return true
  return grants.includes(permission)
}
