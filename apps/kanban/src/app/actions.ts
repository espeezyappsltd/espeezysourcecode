'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { normalizeTaskStatus } from '@/lib/kanban/board-utils'
import { awardTaskCompletionScore } from '@/lib/tasks/contribution-score'
import { isPersistedTaskId } from '@/lib/tasks/task-ids'
import { revalidatePath } from 'next/cache'

export async function distributeTaskScore(taskId: string, assignees: string[], completedByUserId = '') {
  try {
    const result = await awardTaskCompletionScore(taskId, assignees, completedByUserId)
    if (!result.awarded) {
      return { success: false, reason: 'Already awarded' }
    }

    revalidatePath('/', 'layout')
    return { success: true, recipients: result.recipients, points: result.pointsPerUser }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Score distribution failed:', message)
    throw new Error(`Critical Error: ${message}`)
  }
}

export async function updateUserGameStats(userId: string, xpEarned: number, won: boolean) {
  try {
    const adminDb = getAdminDb()
    const { data: currentStats } = await adminDb
      .from('user_game_stats')
      .select('total_xp, wins, games_played')
      .eq('user_id', userId)
      .maybeSingle()

    const newData = {
      user_id: userId,
      total_xp: (currentStats?.total_xp || 0) + xpEarned,
      wins: (currentStats?.wins || 0) + (won ? 1 : 0),
      games_played: (currentStats?.games_played || 0) + 1,
      updated_at: new Date().toISOString()
    }

    const { error } = await adminDb
      .from('user_game_stats')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      throw error
    }

    revalidatePath('//chillout', 'page')
    return { success: true, stats: newData }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Stats update failed:', message)
    throw new Error(`Admin Node Error: ${message}`)
  }
}
export async function handleTaskStatusUpdate(taskId: string, newStatus: string, groupId: string, userId: string) {
  try {
    if (!isPersistedTaskId(taskId)) {
      throw new Error('Task is still saving — try again in a moment.')
    }

    const adminDb = getAdminDb()

    const { data: task, error: fetchError } = await adminDb
      .from('tasks')
      .select('id, title, description, status, category, assignees, group_id, due_date')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) throw new Error('Task not found')

    const payload = {
      action: 'update' as const,
      task: {
        ...task,
        status: normalizeTaskStatus(newStatus),
        group_id: task.group_id ?? groupId,
      },
      userId,
    }

    // Since we are in a server action, we can't easily use the 'start' helper if it depends on a specific environment,
    // but we can call the workflow function directly or via the API.
    // However, the best way is to trigger the same workflow logic.
    
    const { runTaskWorkflow } = await import('@/lib/tasks/task-service')
    await runTaskWorkflow(payload)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('Status update failed:', message)
    throw new Error(`Task Loop Error: ${message}`)
  }
}
