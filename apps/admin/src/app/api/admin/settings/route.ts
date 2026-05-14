import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError, writeAuditLog } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

// All read-only platform_config settings
export async function GET() {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const { data, error } = await ctx.svc
    .from('platform_config')
    .select('*')
    .order('key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data ?? [] })
}

const upsertSchema = z.object({
  updates: z.array(z.object({
    key:      z.string().min(1).max(100),
    value:    z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown())]),
    is_active: z.boolean().optional(),
  })).min(1),
})

export async function PUT(req: Request) {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const rows = parsed.data.updates.map((u) => ({
    key:        u.key,
    value:      u.value,
    is_active:  u.is_active ?? true,
    updated_at: new Date().toISOString(),
    updated_by: ctx.user.id,
  }))

  const { error } = await ctx.svc
    .from('platform_config')
    .upsert(rows, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog(ctx.svc, {
    actor_id:      ctx.user.id,
    actor_email:   ctx.user.email,
    action:        'settings.update',
    resource_type: 'platform_config',
    new_value:     { keys: parsed.data.updates.map(u => u.key) },
    severity:      'warning',
  })

  return NextResponse.json({ success: true })
}
