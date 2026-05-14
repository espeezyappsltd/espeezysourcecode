import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page:          z.string().optional().default('1'),
  limit:         z.string().optional().default('50'),
  action:        z.string().optional().default(''),
  resource_type: z.string().optional().default(''),
  actor_id:      z.string().uuid().optional(),
  severity:      z.enum(['info', 'warning', 'critical', '']).optional().default(''),
  since:         z.string().optional().default(''),
})

export async function GET(req: Request) {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 422 })
  }

  const { page, limit, action, resource_type, actor_id, severity, since } = parsed.data
  const pageNum  = Math.max(1, parseInt(page, 10))
  const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10)))
  const offset   = (pageNum - 1) * pageSize

  let query = ctx.svc
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (action)        query = query.ilike('action', `%${action}%`)
  if (resource_type) query = query.eq('resource_type', resource_type)
  if (actor_id)      query = query.eq('actor_id', actor_id)
  if (severity)      query = query.eq('severity', severity)
  if (since)         query = query.gte('created_at', since)

  const { data, count, error } = await query.range(offset, offset + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}
