/**
 * Admin staff RBAC — backed by public.admin_members (max 20 active).
 */

export type AdminStaffRole = 'admin' | 'moderator' | 'viewer'

export type AdminPermission =
  | 'overview'
  | 'users'
  | 'analytics'
  | 'announcements'
  | 'launch'
  | 'audit'
  | 'settings'
  | 'chat'
  | 'learn'
  | 'files'

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
  totp_secret_enc?: string | null
  totp_enrolled_at?: string | null
  totp_verify_attempts?: number | null
  totp_locked_until?: string | null
}

/** Full panel access — shared equally by every `admin` staff member (no superuser tier). */
const ROLE_PERMISSIONS: Record<AdminStaffRole, AdminPermission[] | ['*']> = {
  admin: ['*'],
  moderator: ['overview', 'users', 'analytics', 'announcements', 'chat', 'learn', 'files'],
  viewer: ['overview', 'analytics', 'chat', 'learn'],
}

export const VAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024

export function normalizeAdminUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
}

export function hasAdminPermission(role: AdminStaffRole, permission: AdminPermission): boolean {
  const grants = ROLE_PERMISSIONS[role]
  if (grants[0] === '*') return true
  return (grants as AdminPermission[]).includes(permission)
}

export function canAccessAdminRoute(role: AdminStaffRole, pathname: string): boolean {
  if (pathname === '/admin' || pathname === '/admin/') return hasAdminPermission(role, 'overview')
  if (pathname.startsWith('/admin/users')) return hasAdminPermission(role, 'users')
  if (pathname.startsWith('/admin/analytics')) return hasAdminPermission(role, 'analytics')
  if (pathname.startsWith('/admin/announcements')) return hasAdminPermission(role, 'announcements')
  if (pathname.startsWith('/admin/launch')) return hasAdminPermission(role, 'launch')
  if (pathname.startsWith('/admin/apps')) return hasAdminPermission(role, 'launch')
  if (pathname.startsWith('/admin/audit')) return hasAdminPermission(role, 'audit')
  if (pathname.startsWith('/admin/settings')) return hasAdminPermission(role, 'settings')
  if (pathname.startsWith('/admin/learn')) return hasAdminPermission(role, 'learn')
  if (pathname.startsWith('/admin/files')) return hasAdminPermission(role, 'files')
  return hasAdminPermission(role, 'overview')
}

export type AdminNavItem = {
  href: string
  label: string
  permission: AdminPermission
  description?: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Home', permission: 'overview', description: 'Dashboard overview' },
  { href: '/admin/users', label: 'Users', permission: 'users', description: 'User management' },
  { href: '/admin/analytics', label: 'Analytics', permission: 'analytics', description: 'Metrics & charts' },
  { href: '/admin/files', label: 'Files', permission: 'files', description: 'Private vault (5GB)' },
  { href: '/admin/learn', label: 'Dev learning', permission: 'learn', description: 'Guides & onboarding' },
  { href: '/admin/announcements', label: 'Announcements', permission: 'announcements' },
  { href: '/admin/launch', label: 'Launch', permission: 'launch' },
  { href: '/admin/apps', label: 'Apps catalog', permission: 'launch', description: 'Landing app listings' },
  { href: '/admin/audit', label: 'Audit log', permission: 'audit' },
  { href: '/admin/settings', label: 'Settings', permission: 'settings' },
]
