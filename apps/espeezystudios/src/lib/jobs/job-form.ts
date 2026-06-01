import type { StudioJob } from '@/lib/jobs/types'

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
