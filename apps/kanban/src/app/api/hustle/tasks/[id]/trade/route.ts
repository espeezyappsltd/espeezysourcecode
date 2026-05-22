import { NextRequest, NextResponse } from 'next/server'
import { Q } from '@/lib/query-columns'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { enrichHustleTasks } from '@/lib/hustle/task-enrich'
import {
  fundHustleEscrow,
  refundHustleEscrow,
  releaseHustlePayment,
} from '@/lib/hustle/trade-service'
import { validateTradeAction } from '@/lib/hustle/lifecycle'

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

    const lifecycleError = validateTradeAction(action, task, uid)
    if (lifecycleError) {
      return NextResponse.json({ error: lifecycleError }, { status: 400 })
    }

    let posterCredits: number | undefined
    let workerCredits: number | undefined
    let application: Record<string, unknown> | undefined

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
        const { data: existingApp } = await adminDb
          .from('hustle_task_applications')
          .select('id, status')
          .eq('task_id', taskId)
          .eq('applicant_id', uid)
          .maybeSingle()

        if (existingApp && existingApp.status !== 'rejected') {
          return NextResponse.json({ error: 'You already applied to this gig.' }, { status: 400 })
        }

        const { data: insertedApp, error: appErr } = await adminDb
          .from('hustle_task_applications')
          .upsert(
            {
              task_id: taskId,
              applicant_id: uid,
              message: typeof body.message === 'string' ? body.message.trim().slice(0, 500) : null,
              status: 'pending',
            },
            { onConflict: 'task_id,applicant_id' },
          )
          .select('id, task_id, applicant_id, message, status, created_at')
          .single()

        if (appErr) {
          if (appErr.message.includes('hustle_task_applications')) {
            return NextResponse.json({ error: 'Applications are not available yet — run migrations.' }, { status: 503 })
          }
          throw appErr
        }
        application = insertedApp ?? undefined
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

    const { data: profileRow } = await adminDb.from('profiles').select('group_id').eq('id', uid).maybeSingle()
    const groupId = profileRow?.group_id ?? null
    const hustleLogAction =
      action === 'fund'
        ? 'hustle_escrow_funded'
        : action === 'approve'
          ? 'hustle_gig_paid'
          : action === 'cancel'
            ? 'hustle_gig_cancelled'
            : null
    if (hustleLogAction) {
      void adminDb.from('activity_logs').insert({
        user_id: uid,
        group_id: groupId,
        app_scope: 'kanban',
        action: hustleLogAction,
        resource_type: 'hustle_task',
        resource_id: taskId,
        details: { message: `${hustleLogAction}: ${task.title}`, task_id: taskId },
        status: 'success',
      })
    }

    return NextResponse.json({
      success: true,
      action,
      task: updated,
      application,
      posterCredits,
      workerCredits,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Trade action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
