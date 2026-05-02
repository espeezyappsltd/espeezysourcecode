/**
 * Shared admin authentication helpers.
 * All admin API routes must use these guards — never inline duplicates.
 */
import { NextResponse } from 'next/server'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export type AdminContext = {
  user: { id: string; email?: string }
  svc: Awaited<ReturnType<typeof createAdminClient>>
}

/**
 * Verifies the request is from a logged-in admin.
 * Returns AdminContext on success, or a 401/403 NextResponse on failure.
 */
export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = await createAdminClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user: { id: user.id, email: user.email }, svc }
}

/**
 * Verifies the request is from a logged-in admin OR moderator.
 */
export async function requireModerator(): Promise<AdminContext | NextResponse> {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = await createAdminClient()
  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user: { id: user.id, email: user.email }, svc }
}

/**
 * Type guard — narrows AdminContext | NextResponse to AdminContext.
 * Use: if (isAuthError(ctx)) return ctx
 */
export function isAuthError(ctx: AdminContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse
}

/**
 * Writes an entry to the audit_logs table.
 * Never throws — silently swallows DB errors so the primary action isn't blocked.
 */
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
  }
): Promise<void> {
  await svc
    .from('audit_logs')
    .insert({
      actor_id:      params.actor_id,
      actor_email:   params.actor_email ?? null,
      action:        params.action,
      resource_type: params.resource_type,
      resource_id:   params.resource_id ?? null,
      old_value:     params.old_value ?? null,
      new_value:     params.new_value ?? null,
      severity:      params.severity ?? 'info',
      ip_address:    params.ip_address ?? null,
      user_agent:    params.user_agent ?? null,
    })
    .catch(() => null) // fire-and-forget; audit failure never blocks the action
}
