import { getAdminDb } from '../lib/supabase/admin'
import type { TaskCategory, TaskStatus } from '../types/database'
import { taskSchema } from '../utils/validation'

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
    if (payload.task.status === 'Done') {
      await checkAndDistributeScore(created.id, payload.task.assignees)
    }
    return { taskId: created.id }
  }

  if (!payload.task.id) {
    throw new FatalError('Task ID is required for updates.')
  }

  await updateTask(payload.task)
  await logActivity(payload.userId, payload.task.group_id, 'task_updated', `Updated task: ${payload.task.title}`, { task_id: payload.task.id })
  await notifyAssignees(payload.task.assignees, payload.task.title, payload.task.id, payload.userId)
  
  if (payload.task.status === 'Done') {
    await checkAndDistributeScore(payload.task.id, payload.task.assignees)
  }
  
  return { taskId: payload.task.id }
}

async function checkAndDistributeScore(taskId: string, assignees: string[]) {
  'use step'
  const db = getAdminDb()
  
  const { data: task, error: fetchError } = await db
    .from('tasks')
    .select('score_awarded')
    .eq('id', taskId)
    .single()
    
  if (fetchError || !task) return
  if (task.score_awarded) return

  // Award 15 points to each assignee
  for (const userId of assignees) {
    const { data: profile } = await db
      .from('profiles')
      .select('total_score')
      .eq('id', userId)
      .single()
      
    if (profile) {
      await db
        .from('profiles')
        .update({ total_score: (profile.total_score || 0) + 15 })
        .eq('id', userId)
    }
  }

  // Mark score as awarded
  await db.from('tasks').update({ score_awarded: true }).eq('id', taskId)
}

async function insertTask(task: TaskPayload) {
  'use step'

  const db = getAdminDb()

  const { data, error } = await db
    .from('tasks')
    .insert({ ...task })
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Task insert failed')
  }

  return { id: data.id }
}

async function updateTask(task: TaskPayload) {
  'use step'

  if (!task.id) throw new Error('Task ID missing')

  const db = getAdminDb()
  const { error } = await db.from('tasks').update({
    title: task.title,
    description: task.description,
    status: task.status,
    category: task.category,
    assignees: task.assignees,
    due_date: task.due_date,
  }).eq('id', task.id)

  if (error) {
    throw error
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

  const db = getAdminDb()
  const { error } = await db.from('activity_log').insert({ 
    user_id: userId, 
    group_id: groupId, 
    action_type: actionType, 
    description, 
    metadata 
  })

  if (error) {
    throw error
  }
}

async function notifyAssignees(assignees: string[], title: string, taskId: string, actingUserId: string) {
  'use step'

  const filtered = assignees.filter(id => id !== actingUserId)

  if (filtered.length === 0) {
    return
  }

  const db = getAdminDb()
  const { error } = await db.from('notifications').insert(
    filtered.map((userId) => ({
      user_id: userId,
      type: 'task_created',
      title: 'New task assigned',
      message: `You were assigned to ${title}`,
      link: `/?taskId=${taskId}`
    }))
  )

  if (error) {
    throw error
  }
}
