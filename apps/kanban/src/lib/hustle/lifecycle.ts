import type { TradeAction } from '@/services/hustle'

export type HustleTaskStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'paid'
  | 'disputed'
  | 'cancelled'

const TERMINAL: HustleTaskStatus[] = ['paid', 'cancelled', 'disputed']

export function isTerminalStatus(status: string): boolean {
  return TERMINAL.includes(status as HustleTaskStatus)
}

export function validateTradeAction(
  action: TradeAction,
  task: {
    status: string
    poster_id: string
    assignee_id?: string | null
    escrow_credits?: number
    payout_credits?: number
  },
  uid: string,
): string | null {
  if (isTerminalStatus(task.status)) {
    return 'This gig is closed and cannot be updated.'
  }

  switch (action) {
    case 'fund':
      if (task.poster_id !== uid) return 'Only the poster can fund escrow.'
      if (task.status !== 'open' && task.status !== 'assigned') {
        return 'Escrow can only be funded while the gig is open or assigned.'
      }
      if ((task.escrow_credits ?? 0) >= (task.payout_credits ?? 0)) {
        return 'Escrow is already fully funded.'
      }
      return null

    case 'apply':
      if (task.poster_id === uid) return 'You cannot apply to your own gig.'
      if (task.status !== 'open') return 'This gig is no longer accepting applications.'
      return null

    case 'accept':
      if (task.poster_id !== uid) return 'Only the poster can accept a worker.'
      if (task.status !== 'open' && task.status !== 'assigned') {
        return 'Cannot assign a worker in the current status.'
      }
      return null

    case 'start':
      if (task.assignee_id !== uid) return 'Only the assigned worker can start.'
      if (task.status !== 'assigned') return 'The gig must be assigned before you can start.'
      return null

    case 'submit':
      if (task.assignee_id !== uid) return 'Only the assigned worker can submit.'
      if (task.status !== 'in_progress' && task.status !== 'assigned') {
        return 'Start the gig before submitting work.'
      }
      return null

    case 'approve':
      if (task.poster_id !== uid) return 'Only the poster can approve and release payment.'
      if (task.status !== 'submitted' && task.status !== 'approved') {
        return 'Approve only after the worker submits for review.'
      }
      if ((task.escrow_credits ?? 0) <= 0) {
        return 'Fund escrow before releasing payment to the worker.'
      }
      return null

    case 'cancel':
      if (task.poster_id !== uid) return 'Only the poster can cancel this gig.'
      if (task.status === 'paid') return 'Paid gigs cannot be cancelled.'
      return null

    default:
      return 'Unknown action.'
  }
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Application pending',
  accepted: 'You were hired',
  rejected: 'Not selected',
}
