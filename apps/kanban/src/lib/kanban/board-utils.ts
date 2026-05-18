import type { Task, TaskStatus } from '@/types/database'
import { isOnboardingDescription } from '@/lib/onboarding/dashboard-tasks'

export const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

export function assigneesEqual(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false
  }
  return true
}

export function filterVisibleTasks(tasks: Task[], profileId: string): Task[] {
  return tasks.filter((t) => {
    if (!isOnboardingDescription(t.description)) return true
    const assignees = t.assignees ?? []
    if (assignees.length === 0) return true
    return assignees.includes(profileId)
  })
}

export function upsertTaskList(prev: Task[], incoming: Task): Task[] {
  const index = prev.findIndex((t) => t.id === incoming.id)
  if (index === -1) return [...prev, incoming]
  const next = prev.slice()
  next[index] = incoming
  return next
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
    if (map[t.status]) map[t.status].push(t)
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
