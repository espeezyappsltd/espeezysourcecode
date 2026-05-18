import type { HustleCategory } from '@/lib/hustle/task-validation'
import type { HustleTaskWithProfiles } from '@/lib/hustle/task-enrich'

export type HustleApplication = {
  id: string
  task_id: string
  applicant_id: string
  message: string | null
  status: string
  created_at: string
  applicant: {
    id: string
    full_name: string | null
    avatar_url: string | null
    username: string | null
    role: string | null
  } | null
}

export type TradeAction = 'fund' | 'apply' | 'accept' | 'start' | 'submit' | 'approve' | 'cancel'

export async function fetchHustleTask(taskId: string) {
  const res = await fetch(`/api/hustle/tasks/${taskId}`, { credentials: 'include' })
  const data = (await res.json()) as {
    task?: HustleTaskWithProfiles
    applications?: HustleApplication[]
    my_application?: HustleApplication | null
    error?: string
  }
  if (!res.ok) throw new Error(data.error ?? 'Failed to load task')
  return data
}

export async function createHustleTask(payload: {
  title: string
  description: string
  category: HustleCategory
  payout_credits: number
  fund_now?: boolean
}) {
  const res = await fetch('/api/hustle/tasks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as { task?: HustleTaskWithProfiles; posterCredits?: number; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Could not create task')
  return data
}

export async function updateHustleTask(
  taskId: string,
  payload: Partial<{
    title: string
    description: string
    category: HustleCategory
    payout_credits: number
  }>,
) {
  const res = await fetch(`/api/hustle/tasks/${taskId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as { task?: HustleTaskWithProfiles; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Could not update task')
  return data
}

export async function cancelHustleTask(taskId: string) {
  const res = await fetch(`/api/hustle/tasks/${taskId}`, { method: 'DELETE', credentials: 'include' })
  const data = (await res.json()) as { error?: string; poster_credits?: number }
  if (!res.ok) throw new Error(data.error ?? 'Could not cancel task')
  return data
}

export async function hustleTrade(
  taskId: string,
  action: TradeAction,
  extra?: { applicant_id?: string; message?: string },
) {
  const res = await fetch(`/api/hustle/tasks/${taskId}/trade`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  })
  const data = (await res.json()) as {
    success?: boolean
    task?: HustleTaskWithProfiles
    application?: HustleApplication
    posterCredits?: number
    workerCredits?: number
    error?: string
  }
  if (!res.ok) throw new Error(data.error ?? 'Action failed')
  return data
}
