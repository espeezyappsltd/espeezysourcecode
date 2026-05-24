/**
 * Admin API guards — require active row in admin_members (not profiles.role alone).
 */
import { NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db'
import type { AdminMember, AdminPermission, AdminStaffRole } from '@/lib/admin-rbac'
import { hasAdminPermission } from '@/lib/admin-rbac'

export type AdminContext = {
  user: { id: string; email?: string }
  member: AdminMember
  role: AdminStaffRole
  svc: Awaited<ReturnType<typeof createAdminClient>>
}

export async function getAdminMemberByUserId(
  userId: string,
  svc?: Awaited<ReturnType<typeof createAdminClient>>,
): Promise<AdminMember | null> {
  const db = svc ?? (await createAdminClient())
  const { data } = await db
    .from('admin_members')
    .select(
      'id, profile_id, username, email, admin_role, display_name, title, phone, is_active, last_seen_at',
    )
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()

  return (data as AdminMember | null) ?? null
}

export async function getAdminMemberByUsername(
  username: string,
  svc?: Awaited<ReturnType<typeof createAdminClient>>,
): Promise<AdminMember | null> {
  const db = svc ?? (await createAdminClient())
  const normalized = username.trim().toLowerCase()
  const { data } = await db
    .from('admin_members')
    .select(
      'id, profile_id, username, email, admin_role, display_name, title, phone, is_active, last_seen_at',
    )
    .eq('username', normalized)
    .eq('is_active', true)
    .maybeSingle()

  return (data as AdminMember | null) ?? null
}

/**
 * Verifies the request is from an active admin staff member.
 */
export async function requireAdmin(
  permission?: AdminPermission,
): Promise<AdminContext | NextResponse> {
  const db = await createServerSupabaseClient()
  const {
    data: { user },
  } = await db.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUserId(user.id, svc)

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const role = member.admin_role as AdminStaffRole
  if (permission && !hasAdminPermission(role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return {
    user: { id: user.id, email: user.email },
    member,
    role,
    svc,
  }
}

/**
 * Moderator-level API access (moderator or admin).
 */
export async function requireModerator(): Promise<AdminContext | NextResponse> {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx
  if (!['admin', 'moderator'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return ctx
}

export function isAuthError(ctx: AdminContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse
}

export async function writeAuditLog(
  svc: AdminContext['svc'],
  params: {
    actor_id: string
    actor_email?: string
    action: string
    resource_type: string
    resource_id?: string
    old_value?: unknown
    new_value?: unknown
    severity?: 'info' | 'warning' | 'critical'
    ip_address?: string
    user_agent?: string
  },
): Promise<void> {
  try {
    await svc.from('audit_logs').insert({
      actor_id: params.actor_id,
      actor_email: params.actor_email ?? null,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id ?? null,
      old_value: params.old_value ?? null,
      new_value: params.new_value ?? null,
      severity: params.severity ?? 'info',
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
    })
  } catch {
    // Non-blocking
  }
}
