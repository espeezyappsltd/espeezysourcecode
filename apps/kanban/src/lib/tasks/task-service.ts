import { getAdminDb } from '@/lib/supabase/admin'
import { afterOnboardingTaskUpdate } from '@/lib/onboarding/onboarding-service'
import { Q } from '@/lib/query-columns'
import { awardTaskCompletionScore, type ScoreAwardResult } from '@/lib/tasks/contribution-score'
import { isPersistedTaskId } from '@/lib/tasks/task-ids'
import type { TaskCategory, TaskStatus } from '@/types/database'
import { taskSchema } from '@/utils/validation'

const TASK_ROW_SELECT = `${Q.task}, score_awarded` as const

export type TaskPayload = {
  id?: string
  title: string
  description: string | null
  status: TaskStatus
  category: TaskCategory
  assignees: string[]
  group_id: string
  due_date: string | null
}

export type TaskWorkflowPayload = {
  action: 'create' | 'update'
  task: TaskPayload
  userId: string
}

async function logActivity(
  userId: string,
  groupId: string,
  action: string,
  details: string,
) {
  const db = getAdminDb()
  const { error } = await db.from('activity_logs').insert({
    user_id: userId,
    group_id: groupId,
    app_scope: 'kanban',
    action,
    resource_type: 'task',
    details: { message: details },
    status: 'success',
  })

  if (error) {
    console.warn('[task-service] activity_logs insert skipped:', error.message)
  }
}

async function notifyAssignees(
  assignees: string[],
  title: string,
  taskId: string,
  actingUserId: string,
) {
  const targets = assignees.filter((id) => id !== actingUserId)
  if (targets.length === 0) return

  const db = getAdminDb()
  const { error } = await db.from('notifications').insert(
    targets.map((userId) => ({
      user_id: userId,
      type: 'task_created',
      title: 'New task assigned',
      message: `You were assigned to ${title}`,
      link: `/?taskId=${taskId}`,
    })),
  )

  if (error) {
    console.warn('[task-service] notifications insert skipped:', error.message)
  }
}

async function checkAndDistributeScore(
  taskId: string,
  assignees: string[],
  completedByUserId: string,
): Promise<ScoreAwardResult | null> {
  const result = await awardTaskCompletionScore(taskId, assignees, completedByUserId)
  return result.awarded ? result : null
}

async function insertTask(task: TaskPayload) {
  const db = getAdminDb()
  const { data, error } = await db
    .from('tasks')
    .insert({ ...task })
    .select(TASK_ROW_SELECT)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Task insert failed')
  }

  return { id: data.id as string, task: data }
}

async function updateTaskRow(task: TaskPayload) {
  if (!task.id) throw new Error('Task ID missing')

  const db = getAdminDb()
  const { error } = await db
    .from('tasks')
    .update({
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category,
      assignees: task.assignees,
      due_date: task.due_date,
    })
    .eq('id', task.id)

  if (error) throw new Error(error.message)
}

async function runOnboardingHook(
  taskId: string,
  userId: string,
  groupId: string,
  status: string,
) {
  try {
    return await afterOnboardingTaskUpdate(taskId, userId, groupId, status)
  } catch (err) {
    console.warn('[task-service] onboarding hook skipped:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function runTaskWorkflow(payload: TaskWorkflowPayload) {
  const taskInput = { ...payload.task }
  if (taskInput.id && !isPersistedTaskId(taskInput.id)) {
    delete taskInput.id
  }

  const parsed = taskSchema.safeParse(taskInput)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid task payload')
  }

  const task = parsed.data

  if (payload.action === 'create') {
    const created = await insertTask(task)
    await logActivity(payload.userId, task.group_id, 'task_created', `Created task: ${task.title}`)
    await notifyAssignees(task.assignees, task.title, created.id, payload.userId)
    let scoreAward: ScoreAwardResult | null = null
    if (task.status === 'Done') {
      scoreAward = await checkAndDistributeScore(created.id, task.assignees, payload.userId)
    }
    const onboarding = await runOnboardingHook(
      created.id,
      payload.userId,
      task.group_id,
      task.status,
    )
    return { taskId: created.id, task: created.task, onboarding, scoreAward }
  }

  if (!task.id || !isPersistedTaskId(task.id)) {
    throw new Error('Task ID is required for updates.')
  }

  await updateTaskRow({ ...task, id: task.id })
  await logActivity(payload.userId, task.group_id, 'task_updated', `Updated task: ${task.title}`)
  await notifyAssignees(task.assignees, task.title, task.id, payload.userId)

  let scoreAward: ScoreAwardResult | null = null
  if (task.status === 'Done') {
    scoreAward = await checkAndDistributeScore(task.id, task.assignees, payload.userId)
  }

  const onboarding = await runOnboardingHook(
    task.id,
    payload.userId,
    task.group_id,
    task.status,
  )

  const db = getAdminDb()
  const { data: saved } = await db.from('tasks').select(TASK_ROW_SELECT).eq('id', task.id).single()

  return { taskId: task.id, task: saved ?? { ...task, id: task.id }, onboarding, scoreAward }
}
