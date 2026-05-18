import { isTerminalStatus } from '@/lib/hustle/lifecycle'

export type GigsFilter = 'all' | 'action' | 'pending' | 'done'

export type GigUxItem = {
  title: string
  description?: string
  category: string
  status?: string
  created_at: string
  updated_at?: string
  payout_credits?: number
  escrow_credits?: number
  my_role?: 'applicant' | 'assignee'
  application_status?: string | null
}

export type GigNextAction = {
  label: string
  tone: 'action' | 'wait' | 'done'
}

const ACTION_PRIORITY: Record<string, number> = {
  action: 0,
  wait: 1,
  done: 2,
}

/** Worker perspective (My gigs tab). */
export function getWorkerGigNextAction(item: GigUxItem): GigNextAction | null {
  const isHired = item.my_role === 'assignee' || item.application_status === 'accepted'

  if (!isHired) {
    if (item.application_status === 'pending') {
      return { label: 'Waiting for poster to review your application', tone: 'wait' }
    }
    if (item.application_status === 'rejected') {
      return { label: 'Not selected for this gig', tone: 'done' }
    }
    return null
  }

  switch (item.status) {
    case 'assigned':
      return { label: 'Start work', tone: 'action' }
    case 'in_progress':
      return { label: 'Submit work for review', tone: 'action' }
    case 'submitted':
    case 'approved':
      return { label: 'Waiting for poster to approve & pay', tone: 'wait' }
    case 'paid':
      return { label: 'Payment released', tone: 'done' }
    case 'cancelled':
      return { label: 'Gig cancelled', tone: 'done' }
    case 'disputed':
      return { label: 'Under dispute', tone: 'wait' }
    default:
      return null
  }
}

/** Poster perspective (Posted tab). */
export function getPosterGigNextAction(item: GigUxItem): GigNextAction | null {
  const funded = (item.escrow_credits ?? 0) >= (item.payout_credits ?? 0)

  switch (item.status) {
    case 'open':
      return funded
        ? { label: 'Review applicants & hire', tone: 'action' }
        : { label: 'Fund escrow & review applicants', tone: 'action' }
    case 'assigned':
      return funded
        ? { label: 'Worker hired — waiting for them to start', tone: 'wait' }
        : { label: 'Fund escrow so worker can be paid', tone: 'action' }
    case 'in_progress':
      return { label: 'Worker is in progress', tone: 'wait' }
    case 'submitted':
    case 'approved':
      return { label: 'Approve work & release payment', tone: 'action' }
    case 'paid':
      return { label: 'Completed', tone: 'done' }
    case 'cancelled':
      return { label: 'Cancelled', tone: 'done' }
    default:
      return null
  }
}

export function gigNeedsAction(item: GigUxItem, perspective: 'worker' | 'poster'): boolean {
  const next =
    perspective === 'worker' ? getWorkerGigNextAction(item) : getPosterGigNextAction(item)
  return next?.tone === 'action'
}

export function matchesGigsFilter(
  item: GigUxItem,
  filter: GigsFilter,
  perspective: 'worker' | 'poster',
): boolean {
  if (filter === 'all') return true
  const next =
    perspective === 'worker' ? getWorkerGigNextAction(item) : getPosterGigNextAction(item)

  if (filter === 'action') return next?.tone === 'action'
  if (filter === 'done') {
    return isTerminalStatus(item.status ?? '') || next?.tone === 'done'
  }
  if (filter === 'pending') {
    if (isTerminalStatus(item.status ?? '')) return false
    if (next?.tone === 'action') return false
    return next?.tone === 'wait' || item.application_status === 'pending'
  }
  return true
}

export function sortGigsByPriority<T extends GigUxItem>(
  items: T[],
  perspective: 'worker' | 'poster',
): T[] {
  return [...items].sort((a, b) => {
    const aNext =
      perspective === 'worker' ? getWorkerGigNextAction(a) : getPosterGigNextAction(a)
    const bNext =
      perspective === 'worker' ? getWorkerGigNextAction(b) : getPosterGigNextAction(b)
    const aPri = ACTION_PRIORITY[aNext?.tone ?? 'wait'] ?? 1
    const bPri = ACTION_PRIORITY[bNext?.tone ?? 'wait'] ?? 1
    if (aPri !== bPri) return aPri - bPri
    return (
      new Date(b.updated_at ?? b.created_at).getTime() -
      new Date(a.updated_at ?? a.created_at).getTime()
    )
  })
}

export function hustleSearchPlaceholder(tab: string): string {
  switch (tab) {
    case 'gigs':
      return 'Search your gigs…'
    case 'posted':
      return 'Search gigs you posted…'
    case 'marketplace':
    default:
      return 'Search open gigs… (Ctrl+F)'
  }
}

export const LIFECYCLE_STEPS = [
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Hired' },
  { key: 'in_progress', label: 'Working' },
  { key: 'submitted', label: 'Review' },
  { key: 'paid', label: 'Paid' },
] as const

export function lifecycleStepIndex(status: string): number {
  if (status === 'cancelled' || status === 'disputed') return -1
  if (status === 'approved') return 3
  const idx = LIFECYCLE_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

export function matchesClientSearch(
  item: Pick<GigUxItem, 'title' | 'description' | 'category'>,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return (
    item.title.toLowerCase().includes(needle) ||
    (item.description?.toLowerCase().includes(needle) ?? false) ||
    item.category.toLowerCase().includes(needle)
  )
}
