import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page:   z.string().optional().default('1'),
  limit:  z.string().optional().default('20'),
  search: z.string().optional().default(''),
  status: z.enum(['active', 'archived', 'suspended', '']).optional().default(''),
})

export async function GET(req: Request) {
  const ctx = await requireAdmin()
  if (isAuthError(ctx)) return ctx

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 422 })
  }

  const { page, limit, search, status } = parsed.data
  const pageNum  = Math.max(1, parseInt(page, 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)))
  const offset   = (pageNum - 1) * pageSize

  let query = ctx.svc
    .from('groups')
    .select('id, name, module_code, description, capacity, created_at, status, featured, owner_id, is_encrypted', { count: 'exact' })

  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    groups: data ?? [],
    total: count ?? 0,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}
