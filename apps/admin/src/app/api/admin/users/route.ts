import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError, writeAuditLog } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page:   z.string().optional().default('1'),
  limit:  z.string().optional().default('20'),
  search: z.string().optional().default(''),
  role:   z.string().optional().default(''),
  plan:   z.string().optional().default(''),
  status: z.string().optional().default(''),
  sort:   z.string().optional().default('created_at'),
  order:  z.enum(['asc', 'desc']).optional().default('desc'),
})

export async function GET(req: Request) {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 422 })
  }

  const { page, limit, search, role, plan, status, sort, order } = parsed.data
  const pageNum  = Math.max(1, parseInt(page, 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)))
  const offset   = (pageNum - 1) * pageSize

  let query = ctx.svc
    .from('profiles')
    .select('id, full_name, email, role, subscription_plan, account_status, is_banned, created_at, last_seen, avatar_url, tagline', { count: 'exact' })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (role)   query = query.eq('role', role)
  if (plan)   query = query.eq('subscription_plan', plan)
  if (status) query = query.eq('account_status', status)

  const validSortCols = ['created_at', 'full_name', 'email', 'last_seen', 'subscription_plan']
  const sortCol = validSortCols.includes(sort) ? sort : 'created_at'

  const { data, count, error } = await query
    .order(sortCol, { ascending: order === 'asc' })
    .range(offset, offset + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    users: data ?? [],
    total: count ?? 0,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}
