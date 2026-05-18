import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { enrichHustleTasks } from '@/lib/hustle/task-enrich'
import {
  fundHustleEscrow,
  refundHustleEscrow,
  releaseHustlePayment,
} from '@/lib/hustle/trade-service'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }
type TradeAction =
  | 'fund'
  | 'apply'
  | 'accept'
  | 'start'
  | 'submit'
  | 'approve'
  | 'cancel'

/** POST /api/hustle/tasks/[id]/trade — seamless hustle workflow actions */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: taskId } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as {
      action?: TradeAction
      applicant_id?: string
      message?: string
    }

    const action = body.action
    if (!action) {
      return NextResponse.json({ error: 'action is required.' }, { status: 422 })
    }

    const adminDb = getAdminDb()
    const { data: row, error: loadErr } = await adminDb
      .from('hustle_tasks')
      .select(Q.hustleTask)
      .eq('id', taskId)
      .maybeSingle()

    if (loadErr) throw loadErr
    if (!row) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const [task] = await enrichHustleTasks(adminDb, [row])
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const uid = user.id
    let posterCredits: number | undefined
    let workerCredits: number | undefined

    switch (action) {
      case 'fund': {
        if (task.poster_id !== uid) {
          return NextResponse.json({ error: 'Only the poster can fund escrow.' }, { status: 403 })
        }
        const funded = await fundHustleEscrow(taskId, uid)
        posterCredits = funded.poster_credits
        break
      }

      case 'apply': {
        if (task.poster_id === uid) {
          return NextResponse.json({ error: 'You cannot apply to your own task.' }, { status: 400 })
        }
        if (task.status !== 'open') {
          return NextResponse.json({ error: 'This task is no longer open.' }, { status: 400 })
        }
        const { error: appErr } = await adminDb.from('hustle_task_applications').upsert(
          {
            task_id: taskId,
            applicant_id: uid,
            message: typeof body.message === 'string' ? body.message.trim().slice(0, 500) : null,
            status: 'pending',
          },
          { onConflict: 'task_id,applicant_id' },
        )
        if (appErr) {
          if (appErr.message.includes('hustle_task_applications')) {
            return NextResponse.json({ error: 'Applications are not available yet — run migrations.' }, { status: 503 })
          }
          throw appErr
        }
        break
      }

      case 'accept': {
        if (task.poster_id !== uid) {
          return NextResponse.json({ error: 'Only the poster can accept a worker.' }, { status: 403 })
        }
        const applicantId = body.applicant_id
        if (!applicantId) {
          return NextResponse.json({ error: 'applicant_id is required.' }, { status: 422 })
        }
        if (task.status !== 'open' && task.status !== 'assigned') {
          return NextResponse.json({ error: 'Cannot assign worker for this status.' }, { status: 400 })
        }

        await adminDb
          .from('hustle_task_applications')
          .update({ status: 'rejected' })
          .eq('task_id', taskId)
          .neq('applicant_id', applicantId)

        await adminDb
          .from('hustle_task_applications')
          .update({ status: 'accepted' })
          .eq('task_id', taskId)
          .eq('applicant_id', applicantId)

        const { error: updErr } = await adminDb
          .from('hustle_tasks')
          .update({
            assignee_id: applicantId,
            status: 'assigned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)

        if (updErr) throw updErr

        if ((task.escrow_credits ?? 0) < task.payout_credits) {
          try {
            const funded = await fundHustleEscrow(taskId, uid)
            posterCredits = funded.poster_credits
          } catch {
            /* poster can fund manually */
          }
        }
        break
      }

      case 'start': {
        if (task.assignee_id !== uid) {
          return NextResponse.json({ error: 'Only the assigned worker can start.' }, { status: 403 })
        }
        if (task.status !== 'assigned') {
          return NextResponse.json({ error: 'Task must be assigned first.' }, { status: 400 })
        }
        await adminDb
          .from('hustle_tasks')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', taskId)
        break
      }

      case 'submit': {
        if (task.assignee_id !== uid) {
          return NextResponse.json({ error: 'Only the assigned worker can submit.' }, { status: 403 })
        }
        if (task.status !== 'in_progress' && task.status !== 'assigned') {
          return NextResponse.json({ error: 'Start the task before submitting.' }, { status: 400 })
        }
        await adminDb
          .from('hustle_tasks')
          .update({ status: 'submitted', updated_at: new Date().toISOString() })
          .eq('id', taskId)
        break
      }

      case 'approve': {
        if (task.poster_id !== uid) {
          return NextResponse.json({ error: 'Only the poster can approve and pay.' }, { status: 403 })
        }
        const released = await releaseHustlePayment(taskId, uid)
        posterCredits = released.poster_credits
        workerCredits = released.worker_credits
        break
      }

      case 'cancel': {
        if (task.poster_id !== uid) {
          return NextResponse.json({ error: 'Only the poster can cancel.' }, { status: 403 })
        }
        const refunded = await refundHustleEscrow(taskId, uid)
        posterCredits = refunded.poster_credits
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
    }

    const { data: fresh } = await adminDb.from('hustle_tasks').select(Q.hustleTask).eq('id', taskId).single()
    const [updated] = await enrichHustleTasks(adminDb, [fresh])

    return NextResponse.json({
      success: true,
      action,
      task: updated,
      posterCredits,
      workerCredits,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Trade action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
