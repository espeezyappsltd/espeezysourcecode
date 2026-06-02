import type { JobBudgetEntry, StudioJob } from '@/lib/jobs/types'

export const JOB_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const JOB_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e42',
  in_progress: '#38bdf8',
  review: '#a78bfa',
  done: '#22c55e',
  cancelled: '#94a3b8',
}

export const DEMO_FEE_CENTS = 5000
export const MIN_CONSULT_FEE_CENTS = 2000

export function normalizeBudgetEntryAmount(label: string, amountCents: number): number {
  const normalized = label.trim().toLowerCase()
  if (normalized.includes('demo')) return DEMO_FEE_CENTS
  if (normalized.includes('consult')) return Math.max(amountCents, MIN_CONSULT_FEE_CENTS)
  return amountCents
}

export function jobHasDemoFee(entries: JobBudgetEntry[]): boolean {
  return entries.some((entry) => entry.label.trim().toLowerCase() === 'demo fee')
}

export function consultationEntriesBelowMinimum(entries: JobBudgetEntry[]): JobBudgetEntry[] {
  return entries.filter(
    (entry) => entry.label.trim().toLowerCase().includes('consult') && entry.amount_cents < MIN_CONSULT_FEE_CENTS,
  )
}

export function emptyJobForm(): Pick<StudioJob, 'title' | 'description' | 'status'> {
  return { title: '', description: '', status: 'pending' }
}

export function jobToFormValues(job: StudioJob): Partial<StudioJob> {
  return {
    title: job.title,
    description: job.description ?? '',
    status: job.status,
    client_name: job.client_name ?? '',
    client_email: job.client_email ?? '',
    deadline_at: job.deadline_at,
    budget_cents: job.budget_cents ?? 0,
    currency: job.currency ?? 'GBP',
  }
}
