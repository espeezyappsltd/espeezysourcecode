import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/hustle/tasks  -  list tasks (with filters)
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
    const cursor = searchParams.get('cursor')
    const PAGE_SIZE = 20

    let query = adminDb
      .from('hustle_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (mine) {
      query = query.eq('poster_id', uid)
    } else {
      query = query.eq('status', status)
    }

    if (category) query = query.eq('category', category)
    if (cursor) query = query.lt('created_at', cursor)

    const { data: rows, error: tasksError } = await query

    if (tasksError) {
      throw tasksError
    }

    const profileIds = Array.from(new Set((rows ?? []).flatMap((row: any) => [row.poster_id, row.assignee_id]).filter(Boolean)))
    const { data: profiles, error: profilesError } = profileIds.length > 0
      ? await adminDb.from('profiles').select('*').in('id', profileIds)
      : { data: [], error: null }

    if (profilesError) {
      throw profilesError
    }

    const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
    const tasks = (rows ?? []).map((data: any) => {
      return {
        ...data,
        created_at: data.created_at,
        poster: profileMap.get(data.poster_id) ?? null,
        assignee: profileMap.get(data.assignee_id) ?? null
      }
    })

    const hasMore = tasks.length > PAGE_SIZE
    const finalTasks = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks
    const nextCursor = hasMore ? finalTasks[finalTasks.length - 1].created_at : null

    return NextResponse.json({ tasks: finalTasks, nextCursor })
  } catch (err: any) {
    console.error('Hustle Tasks Fetch Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/hustle/tasks  -  create a task
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

    if (profileError) {
      throw profileError
    }

    if (profile?.account_status !== 'active' && profile?.account_status !== undefined) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }

    const { title, description, category, payout_cents, deadline, connection_only } = await req.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }
    if (!payout_cents || payout_cents < 100 || payout_cents > 500000) {
      return NextResponse.json({ error: 'Payout must be between $1 and $5,000' }, { status: 400 })
    }

    const VALID_CATEGORIES = ['design', 'writing', 'coding', 'tutoring', 'research', 'admin', 'marketing', 'video', 'photography', 'other']
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { data: task, error: insertError } = await adminDb
      .from('hustle_tasks')
      .insert({
        poster_id: uid,
        title: title.trim(),
        description: description.trim(),
        category,
        payout_cents: Math.round(payout_cents),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        connection_only: !!connection_only,
        status: 'open',
      })
      .select('*')
      .single()

    if (insertError || !task) {
      throw insertError ?? new Error('Task creation failed')
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (err: any) {
    console.error('Task creation error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
