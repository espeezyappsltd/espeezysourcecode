import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { enrichHustleTasks } from '@/lib/hustle/task-enrich'
import {
  hustleTaskInputSchema,
  HUSTLE_CATEGORIES,
  normalizeHustlePayoutInput,
} from '@/lib/hustle/task-validation'
import { fundHustleEscrow, refundHustleEscrow } from '@/lib/hustle/trade-service'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

async function loadTask(adminDb: ReturnType<typeof getAdminDb>, id: string) {
  const { data, error } = await adminDb.from('hustle_tasks').select(Q.hustleTask).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [task] = await enrichHustleTasks(adminDb, [data])
  return task ?? null
}

/** GET /api/hustle/tasks/[id] */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const adminDb = getAdminDb()
    const task = await loadTask(adminDb, id)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const { data: applications } = await adminDb
      .from('hustle_task_applications')
      .select('id, task_id, applicant_id, message, status, created_at')
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    const applicantIds = (applications ?? []).map((a) => a.applicant_id)
    const { data: applicants } =
      applicantIds.length > 0
        ? await adminDb.from('profiles').select(Q.profile.card).in('id', applicantIds)
        : { data: [] }

    const applicantMap = new Map((applicants ?? []).map((p) => [p.id as string, p]))

    const myApplication =
      (applications ?? []).find((a) => a.applicant_id === user.id) ?? null

    return NextResponse.json({
      task,
      my_application: myApplication
        ? {
            ...myApplication,
            applicant: applicantMap.get(myApplication.applicant_id) ?? null,
          }
        : null,
      applications: (applications ?? []).map((a) => ({
        ...a,
        applicant: applicantMap.get(a.applicant_id) ?? null,
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load task'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** PATCH /api/hustle/tasks/[id] — edit open task (poster only) */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const adminDb = getAdminDb()
    const existing = await loadTask(adminDb, id)
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (existing.poster_id !== user.id) {
      return NextResponse.json({ error: 'Only the poster can edit this task.' }, { status: 403 })
    }
    if (existing.status !== 'open') {
      return NextResponse.json({ error: 'Only open tasks can be edited.' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = hustleTaskInputSchema.safeParse({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      payout_credits: body.payout_credits ?? existing.payout_credits,
      payout_cents: body.payout_cents ?? existing.payout_cents,
      deadline: body.deadline ?? existing.deadline,
      connection_only: body.connection_only ?? existing.connection_only,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid task' }, { status: 400 })
    }

    const payout = normalizeHustlePayoutInput(parsed.data)

    const { data, error } = await adminDb
      .from('hustle_tasks')
      .update({
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        payout_credits: payout.payout_credits,
        payout_cents: payout.payout_cents,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
        connection_only: parsed.data.connection_only ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(Q.hustleTask)
      .single()

    if (error) throw error
    const [task] = await enrichHustleTasks(adminDb, [data])
    return NextResponse.json({ task })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** DELETE /api/hustle/tasks/[id] — cancel + refund escrow */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const adminDb = getAdminDb()
    const existing = await loadTask(adminDb, id)
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (existing.poster_id !== user.id) {
      return NextResponse.json({ error: 'Only the poster can cancel this task.' }, { status: 403 })
    }

    const result = await refundHustleEscrow(id, user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
