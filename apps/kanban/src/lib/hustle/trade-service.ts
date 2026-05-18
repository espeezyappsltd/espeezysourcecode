import { getAdminDb } from '@/lib/supabase/admin'

const RPC_ERRORS: Record<string, string> = {
  task_not_found: 'Task not found.',
  not_poster: 'Only the task poster can do this.',
  not_assignee: 'Only the assigned worker can do this.',
  no_assignee: 'No worker assigned yet.',
  invalid_status: 'This action is not allowed for the current task status.',
  already_funded: 'Escrow is already funded.',
  not_funded: 'Fund escrow before releasing payment.',
  insufficient_credits: 'Insufficient Espeezy credits.',
  invalid_amount: 'Set a credit payout greater than zero.',
  cannot_apply_own: 'You cannot apply to your own task.',
  already_applied: 'You already applied to this task.',
}

function mapRpcError(message: string): string {
  for (const [code, text] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) return text
  }
  return message
}

export async function fundHustleEscrow(taskId: string, posterId: string) {
  const db = getAdminDb()
  const { data, error } = await db.rpc('hustle_task_fund_escrow', {
    p_task_id: taskId,
    p_poster_id: posterId,
  })
  if (error) throw new Error(mapRpcError(error.message))
  return data as { escrow_credits: number; poster_credits: number }
}

export async function releaseHustlePayment(taskId: string, posterId: string) {
  const db = getAdminDb()
  const { data, error } = await db.rpc('hustle_task_release_payment', {
    p_task_id: taskId,
    p_poster_id: posterId,
  })
  if (error) throw new Error(mapRpcError(error.message))
  return data as {
    status: string
    gross_credits?: number
    platform_fee_credits?: number
    worker_net_credits?: number
    worker_credits: number
    poster_credits: number
  }
}

export async function refundHustleEscrow(taskId: string, posterId: string) {
  const db = getAdminDb()
  const { data, error } = await db.rpc('hustle_task_refund_escrow', {
    p_task_id: taskId,
    p_poster_id: posterId,
  })
  if (error) throw new Error(mapRpcError(error.message))
  return data as { status: string; refunded: number; poster_credits?: number }
}
