import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError, writeAuditLog } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const { data, error } = await ctx.svc
    .from('system_announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data ?? [] })
}

const createSchema = z.object({
  title:     z.string().min(1).max(200),
  body:      z.string().min(1).max(5000),
  type:      z.enum(['info', 'warning', 'maintenance', 'feature', 'critical']).default('info'),
  target:    z.enum(['all', 'pro', 'premium', 'admin']).default('all'),
  starts_at: z.string().datetime().optional(),
  ends_at:   z.string().datetime().optional(),
})

export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await ctx.svc
    .from('system_announcements')
    .insert({ ...parsed.data, created_by: ctx.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog(ctx.svc, {
    actor_id:      ctx.user.id,
    actor_email:   ctx.user.email,
    action:        'announcement.create',
    resource_type: 'announcement',
    resource_id:   data.id,
    new_value:     parsed.data,
    severity:      parsed.data.type === 'critical' ? 'critical' : 'info',
  })

  return NextResponse.json({ announcement: data }, { status: 201 })
}
