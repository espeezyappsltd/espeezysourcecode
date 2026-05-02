import { createAdminClient } from '../../src/utils/supabase/server'
import type { TaskCategory, TaskStatus } from '../../src/types/database'
import { taskSchema } from '../../src/utils/validation'

class FatalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalError'
  }
}

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

export async function taskWorkflow(payload: TaskWorkflowPayload) {
  'use workflow'

  // 1. INDUSTRY GRADE VALIDATION
  try {
    taskSchema.parse(payload.task)
  } catch (err) {
    throw new FatalError(`Validation Breach: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  if (payload.action === 'create') {
    const created = await insertTask(payload.task)
    await logActivity(payload.userId, payload.task.group_id, 'task_created', `Created task: ${payload.task.title}`, { task_id: created.id })
    await notifyAssignees(payload.task.assignees, payload.task.title, created.id, payload.userId)
    return { taskId: created.id }
  }

  if (!payload.task.id) {
    throw new FatalError('Task ID is required for updates.')
  }

  await updateTask(payload.task)
  await logActivity(payload.userId, payload.task.group_id, 'task_updated', `Updated task: ${payload.task.title}`, { task_id: payload.task.id })
  await notifyAssignees(payload.task.assignees, payload.task.title, payload.task.id, payload.userId)
  return { taskId: payload.task.id }
}

async function insertTask(task: TaskPayload) {
  'use step'

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task }])
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to create task.')
  }

  return data
}

async function updateTask(task: TaskPayload) {
  'use step'

  const supabase = await createAdminClient()
  const { error } = await supabase
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

  if (error) {
    throw new Error(error.message)
  }
}

async function logActivity(
  userId: string,
  groupId: string,
  actionType: string,
  description: string,
  metadata: Record<string, unknown>
) {
  'use step'

  const supabase = await createAdminClient()
  const { error } = await supabase.from('activity_log').insert([{ user_id: userId, group_id: groupId, action_type: actionType, description, metadata }])

  if (error) {
    throw new Error(error.message)
  }
}

async function notifyAssignees(assignees: string[], title: string, taskId: string, actingUserId: string) {
  'use step'

  const filtered = assignees.filter(id => id !== actingUserId)

  if (filtered.length === 0) {
    return
  }

  const supabase = await createAdminClient()
  const notifications = filtered.map((userId) => ({
    user_id: userId,
    type: 'task_created',
    title: 'New task assigned',
    message: `You were assigned to ${title}`,
    link: `/dashboard?taskId=${taskId}`
  }))

  const { error } = await supabase.from('notifications').insert(notifications)
  if (error) {
    throw new Error(error.message)
  }
}
