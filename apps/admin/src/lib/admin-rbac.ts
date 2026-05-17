/**
 * Admin staff RBAC — backed by public.admin_members (max 20 active).
 * Principle of least privilege: each role only gets explicit section keys.
 */

export type AdminStaffRole = 'superuser' | 'admin' | 'moderator' | 'viewer'

export type AdminPermission =
  | 'overview'
  | 'users'
  | 'analytics'
  | 'announcements'
  | 'launch'
  | 'audit'
  | 'settings'
  | 'chat'

export type AdminMember = {
  id: string
  profile_id: string
  username: string
  email: string
  admin_role: AdminStaffRole
  display_name: string | null
  title: string | null
  phone: string | null
  is_active: boolean
  last_seen_at: string | null
}

const ROLE_PERMISSIONS: Record<AdminStaffRole, AdminPermission[] | ['*']> = {
  superuser: ['*'],
  admin: ['overview', 'users', 'analytics', 'announcements', 'launch', 'audit', 'settings', 'chat'],
  moderator: ['overview', 'users', 'analytics', 'announcements', 'chat'],
  viewer: ['overview', 'analytics', 'chat'],
}

export function normalizeAdminUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
}

export function adminEmailForUsername(username: string): string {
  const u = normalizeAdminUsername(username)
  if (u === 'pete') return 'pete@espeezy.com'
  if (/^admin\d{1,2}$/.test(u)) return `${u}@espeezy.com`
  return `${u}@espeezy.com`
}

export function hasAdminPermission(role: AdminStaffRole, permission: AdminPermission): boolean {
  const grants = ROLE_PERMISSIONS[role]
  if (grants[0] === '*') return true
  return (grants as AdminPermission[]).includes(permission)
}

export function canAccessAdminRoute(role: AdminStaffRole, pathname: string): boolean {
  if (role === 'superuser') return true
  if (pathname === '/admin' || pathname === '/admin/') return hasAdminPermission(role, 'overview')
  if (pathname.startsWith('/admin/users')) return hasAdminPermission(role, 'users')
  if (pathname.startsWith('/admin/analytics')) return hasAdminPermission(role, 'analytics')
  if (pathname.startsWith('/admin/announcements')) return hasAdminPermission(role, 'announcements')
  if (pathname.startsWith('/admin/launch')) return hasAdminPermission(role, 'launch')
  if (pathname.startsWith('/admin/audit')) return hasAdminPermission(role, 'audit')
  if (pathname.startsWith('/admin/settings')) return hasAdminPermission(role, 'settings')
  return hasAdminPermission(role, 'overview')
}

export const ADMIN_NAV_ITEMS: { href: string; label: string; permission: AdminPermission }[] = [
  { href: '/admin', label: 'Overview', permission: 'overview' },
  { href: '/admin/users', label: 'Users', permission: 'users' },
  { href: '/admin/analytics', label: 'Analytics', permission: 'analytics' },
  { href: '/admin/announcements', label: 'Announcements', permission: 'announcements' },
  { href: '/admin/launch', label: 'Launch', permission: 'launch' },
  { href: '/admin/audit', label: 'Audit Log', permission: 'audit' },
  { href: '/admin/settings', label: 'Settings', permission: 'settings' },
]
