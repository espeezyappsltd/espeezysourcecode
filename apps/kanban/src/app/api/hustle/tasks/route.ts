import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import {
  buildHustleSearchOr,
  HUSTLE_CATEGORIES,
  hustleTaskInputSchema,
  validateHustleTaskRow,
} from '@/lib/hustle/task-validation'

export const dynamic = 'force-dynamic'

const PAGE_SIZE_DEFAULT = 20
const PAGE_SIZE_MAX = 40

// GET /api/hustle/tasks — validated rows, category filter, smart search, cursor pagination
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminDb = getAdminDb()
    const uid = user.id

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'open'
    const mine = searchParams.get('mine') === '1'
    const category = searchParams.get('category')
    const queryStr = searchParams.get('q')?.trim() ?? ''
    const cursor = searchParams.get('cursor')
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? String(PAGE_SIZE_DEFAULT), 10), 1),
      PAGE_SIZE_MAX,
    )

    let query = adminDb
      .from('hustle_tasks')
      .select(Q.hustleTask)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (mine) {
      query = query.eq('poster_id', uid)
    } else {
      query = query.eq('status', status)
    }

    if (category && category !== 'all' && HUSTLE_CATEGORIES.includes(category as (typeof HUSTLE_CATEGORIES)[number])) {
      query = query.eq('category', category)
    }

    const searchOr = buildHustleSearchOr(queryStr)
    if (searchOr) query = query.or(searchOr)

    if (cursor) query = query.lt('created_at', cursor)

    const { data: rows, error: tasksError } = await query
    if (tasksError) throw tasksError

    const validatedRows = (rows ?? [])
      .map((row) => validateHustleTaskRow(row))
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const profileIds = Array.from(
      new Set(validatedRows.flatMap((row) => [row.poster_id, row.assignee_id]).filter(Boolean)),
    )
    const { data: profiles, error: profilesError } =
      profileIds.length > 0
        ? await adminDb.from('profiles').select(Q.profile.card).in('id', profileIds)
        : { data: [], error: null }

    if (profilesError) throw profilesError

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]))
    const tasks = validatedRows.map((data) => ({
      ...data,
      poster: profileMap.get(data.poster_id) ?? null,
      assignee: data.assignee_id ? profileMap.get(data.assignee_id) ?? null : null,
    }))

    const hasMore = tasks.length > limit
    const finalTasks = hasMore ? tasks.slice(0, limit) : tasks
    const nextCursor = hasMore ? finalTasks[finalTasks.length - 1].created_at : null

    return NextResponse.json({
      tasks: finalTasks,
      nextCursor,
      categories: HUSTLE_CATEGORIES,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Hustle Tasks Fetch Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/hustle/tasks — create with full quality validation
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminDb = getAdminDb()
    const uid = user.id

    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('account_status')
      .eq('id', uid)
      .single()

    if (profileError) throw profileError

    if (profile?.account_status !== 'active' && profile?.account_status !== undefined) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = hustleTaskInputSchema.safeParse({
      title: body.title,
      description: body.description,
      category: body.category,
      payout_cents: typeof body.payout_cents === 'number' ? Math.round(body.payout_cents) : Number(body.payout_cents),
      deadline: body.deadline ?? null,
      connection_only: Boolean(body.connection_only),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid task' },
        { status: 400 },
      )
    }

    const input = parsed.data

    const { data: task, error: insertError } = await adminDb
      .from('hustle_tasks')
      .insert({
        poster_id: uid,
        title: input.title,
        description: input.description,
        category: input.category,
        payout_cents: input.payout_cents,
        deadline: input.deadline ? new Date(input.deadline).toISOString() : null,
        connection_only: input.connection_only ?? false,
        status: 'open',
      })
      .select(Q.hustleTask)
      .single()

    if (insertError || !task) {
      throw insertError ?? new Error('Task creation failed')
    }

    const validated = validateHustleTaskRow(task)
    return NextResponse.json({ task: validated ?? task }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Task creation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
