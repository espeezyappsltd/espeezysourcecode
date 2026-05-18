import type { Task, TaskStatus } from '@/types/database'
import { isOnboardingDescription } from '@/lib/onboarding/dashboard-tasks'

export const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

const STATUS_ALIASES: Record<string, TaskStatus> = {
  todo: 'To Do',
  'to-do': 'To Do',
  'in progress': 'In Progress',
  in_progress: 'In Progress',
  'in review': 'In Review',
  in_review: 'In Review',
  done: 'Done',
  complete: 'Done',
  completed: 'Done',
}

/** Coerce DB / legacy status strings into Kanban column keys. */
export function normalizeTaskStatus(status: string | null | undefined): TaskStatus {
  if (!status) return 'To Do'
  if (KANBAN_COLUMNS.includes(status as TaskStatus)) return status as TaskStatus
  const key = status.trim().toLowerCase()
  return STATUS_ALIASES[key] ?? 'To Do'
}

/** PostgREST may return uuid[] or occasionally a serialized value — always yield string[]. */
export function normalizeAssignees(assignees: unknown): string[] {
  if (Array.isArray(assignees)) {
    return assignees.filter((id): id is string => typeof id === 'string' && id.length > 0)
  }
  if (typeof assignees === 'string' && assignees.startsWith('[')) {
    try {
      const parsed = JSON.parse(assignees) as unknown
      return normalizeAssignees(parsed)
    } catch {
      return []
    }
  }
  return []
}

export function normalizeTaskRow(task: Task): Task {
  return {
    ...task,
    status: normalizeTaskStatus(task.status),
    assignees: normalizeAssignees(task.assignees),
  }
}

export function assigneesEqual(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false
  }
  return true
}

export function filterVisibleTasks(tasks: Task[], profileId: string | null | undefined): Task[] {
  if (!profileId) return tasks.map(normalizeTaskRow)

  const normalized = tasks.map(normalizeTaskRow)
  const filtered = normalized.filter((t) => {
    if (!isOnboardingDescription(t.description)) return true
    const assignees = t.assignees ?? []
    if (assignees.length === 0) return true
    return assignees.includes(profileId)
  })

  // Safety: never hide the entire board when tasks exist (stale assignee data, etc.)
  if (filtered.length === 0 && normalized.length > 0) {
    return normalized
  }

  return filtered
}

export function upsertById<T extends { id: string }>(prev: T[], incoming: T): T[] {
  const index = prev.findIndex((t) => t.id === incoming.id)
  if (index === -1) return [...prev, incoming]
  const next = prev.slice()
  next[index] = incoming
  return next
}

export function upsertTaskList(prev: Task[], incoming: Task): Task[] {
  return upsertById(prev, incoming)
}

export function removeTaskFromList(prev: Task[], taskId: string): Task[] {
  return prev.filter((t) => t.id !== taskId)
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map: Record<TaskStatus, Task[]> = {
    'To Do': [],
    'In Progress': [],
    'In Review': [],
    Done: [],
  }
  for (const t of tasks) {
    const status = normalizeTaskStatus(t.status)
    map[status].push({ ...t, status })
  }
  return map
}

/** Shallow compare column task lists so unchanged columns keep stable array refs. */
export function stabilizeTasksByColumn(
  prev: Record<TaskStatus, Task[]> | null,
  next: Record<TaskStatus, Task[]>,
): Record<TaskStatus, Task[]> {
  if (!prev) return next

  const stable = { ...next }
  for (const col of KANBAN_COLUMNS) {
    const a = prev[col]
    const b = next[col]
    if (a.length === b.length && a.every((task, i) => task === b[i])) {
      stable[col] = a
    }
  }
  return stable
}

export function columnTasksEqual(prev: Task[], next: Task[]): boolean {
  if (prev === next) return true
  if (prev.length !== next.length) return false
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i]
    const b = next[i]
    if (a !== b) return false
  }
  return true
}
