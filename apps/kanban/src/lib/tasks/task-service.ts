import { getAdminDb } from '@/lib/supabase/admin'
import { afterOnboardingTaskUpdate } from '@/lib/onboarding/onboarding-service'
import type { TaskCategory, TaskStatus } from '@/types/database'
import { taskSchema } from '@/utils/validation'

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

async function checkAndDistributeScore(taskId: string, assignees: string[]) {
  const db = getAdminDb()

  const { data: task, error: fetchError } = await db
    .from('tasks')
    .select('score_awarded')
    .eq('id', taskId)
    .single()

  if (fetchError || !task || task.score_awarded) return

  for (const userId of assignees) {
    const { data: profile } = await db.from('profiles').select('total_score').eq('id', userId).single()
    if (profile) {
      await db
        .from('profiles')
        .update({ total_score: (profile.total_score || 0) + 15 })
        .eq('id', userId)
    }
  }

  await db.from('tasks').update({ score_awarded: true }).eq('id', taskId)
}

async function insertTask(task: TaskPayload) {
  const db = getAdminDb()
  const { data, error } = await db
    .from('tasks')
    .insert({ ...task })
    .select('id, title, status, group_id, assignees, description, due_date, category, created_at, updated_at')
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

export async function runTaskWorkflow(payload: TaskWorkflowPayload) {
  const parsed = taskSchema.safeParse(payload.task)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid task payload')
  }

  const task = parsed.data

  if (payload.action === 'create') {
    const created = await insertTask(task)
    await logActivity(payload.userId, task.group_id, 'task_created', `Created task: ${task.title}`)
    await notifyAssignees(task.assignees, task.title, created.id, payload.userId)
    if (task.status === 'Done') {
      await checkAndDistributeScore(created.id, task.assignees)
    }
    const onboarding = await afterOnboardingTaskUpdate(
      created.id,
      payload.userId,
      task.group_id,
      task.status,
    )
    return { taskId: created.id, task: created.task, onboarding }
  }

  if (!task.id) {
    throw new Error('Task ID is required for updates.')
  }

  await updateTaskRow({ ...task, id: task.id })
  await logActivity(payload.userId, task.group_id, 'task_updated', `Updated task: ${task.title}`)
  await notifyAssignees(task.assignees, task.title, task.id, payload.userId)

  if (task.status === 'Done') {
    await checkAndDistributeScore(task.id, task.assignees)
  }

  const onboarding = await afterOnboardingTaskUpdate(
    task.id!,
    payload.userId,
    task.group_id,
    task.status,
  )

  return { taskId: task.id, onboarding }
}
