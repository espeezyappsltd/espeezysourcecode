/**
 * Admin service layer — all admin data operations go through here.
 * Components and pages must NOT call fetch('/api/admin/...') directly.
 */

export interface AdminUser {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  subscription_plan: string | null
  account_status: string | null
  is_banned: boolean | null
  created_at: string
  last_seen: string | null
  avatar_url: string | null
  tagline: string | null
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AnalyticsOverview {
  totalUsers: number
  proUsers: number
  premiumUsers: number
  bannedUsers: number
  totalGroups: number
  activeGroups: number
  totalTasks: number
  doneTasks: number
  mrr: number
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_value: unknown
  new_value: unknown
  severity: 'info' | 'warning' | 'critical'
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  type: string
  target: string
  is_active: boolean
  starts_at: string
  ends_at: string | null
  created_at: string
}

export interface AdminGroup {
  id: string
  name: string
  module_code: string | null
  description: string | null
  capacity: number | null
  status: string
  featured: boolean
  owner_id: string | null
  created_at: string
  is_encrypted: boolean
}

// ── Users ──────────────────────────────────────────────────────────────────────

export async function fetchUsers(params: {
  page?: number
  limit?: number
  search?: string
  role?: string
  plan?: string
  status?: string
  sort?: string
  order?: 'asc' | 'desc'
}): Promise<PaginatedResult<AdminUser> & { users: AdminUser[] }> {
  const sp = new URLSearchParams()
  if (params.page)   sp.set('page',   String(params.page))
  if (params.limit)  sp.set('limit',  String(params.limit))
  if (params.search) sp.set('search', params.search)
  if (params.role)   sp.set('role',   params.role)
  if (params.plan)   sp.set('plan',   params.plan)
  if (params.status) sp.set('status', params.status)
  if (params.sort)   sp.set('sort',   params.sort)
  if (params.order)  sp.set('order',  params.order)

  const res = await fetch(`/api/admin/users?${sp.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch users')
  const json = await res.json()
  return { users: json.users, data: json.users, total: json.total, page: json.page, pageSize: json.pageSize, totalPages: json.totalPages }
}

export async function fetchUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('User not found')
  return res.json() as Promise<{ user: AdminUser & Record<string, unknown>; activeBan: unknown }>
}

export async function updateUser(id: string, updates: Partial<{
  role: string
  subscription_plan: string
  account_status: string
  notes: string
  full_name: string
}>) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to update user')
  }
  return res.json()
}

export async function banUser(id: string, reason: string, ban_type: 'temporary' | 'permanent' = 'permanent', expires_at?: string) {
  const res = await fetch(`/api/admin/users/${id}/ban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ban', reason, ban_type, expires_at }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to ban user')
  }
  return res.json()
}

export async function unbanUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}/ban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unban' }),
  })
  if (!res.ok) throw new Error('Failed to unban user')
  return res.json()
}

export async function deleteUser(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to delete user')
  }
  return res.json()
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function fetchAnalytics() {
  const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json() as Promise<{
    overview: AnalyticsOverview
    roleCounts: Record<string, number>
    planCounts: Record<string, number>
    signupChart: { date: string; count: number }[]
    recentSignups: AdminUser[]
  }>
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function fetchAuditLogs(params: {
  page?: number
  limit?: number
  action?: string
  resource_type?: string
  actor_id?: string
  severity?: string
  since?: string
}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, String(v)) })

  const res = await fetch(`/api/admin/audit?${sp.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch audit logs')
  return res.json() as Promise<{
    logs: AuditLog[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }>
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function fetchGroups(params: { page?: number; limit?: number; search?: string; status?: string }) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, String(v)) })

  const res = await fetch(`/api/admin/groups?${sp.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch groups')
  return res.json() as Promise<{ groups: AdminGroup[]; total: number; page: number; pageSize: number; totalPages: number }>
}

export async function updateGroup(id: string, updates: Partial<{ status: string; featured: boolean; admin_notes: string; capacity: number; description: string }>) {
  const res = await fetch(`/api/admin/groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to update group')
  }
  return res.json()
}

export async function deleteGroup(id: string) {
  const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete group')
  return res.json()
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function fetchAnnouncements() {
  const res = await fetch('/api/admin/announcements', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch announcements')
  return res.json() as Promise<{ announcements: Announcement[] }>
}

export async function createAnnouncement(data: {
  title: string
  body: string
  type?: string
  target?: string
  starts_at?: string
  ends_at?: string
}) {
  const res = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to create announcement')
  }
  return res.json()
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  const res = await fetch(`/api/admin/announcements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update announcement')
  return res.json()
}

export async function deleteAnnouncement(id: string) {
  const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete announcement')
  return res.json()
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function fetchSettings() {
  const res = await fetch('/api/admin/settings', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json() as Promise<{ settings: { key: string; value: unknown; is_active: boolean }[] }>
}

export async function updateSettings(updates: { key: string; value: unknown; is_active?: boolean }[]) {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  })
  if (!res.ok) throw new Error('Failed to update settings')
  return res.json()
}
