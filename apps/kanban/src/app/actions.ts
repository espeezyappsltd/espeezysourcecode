'use server'

import { getAdminDb } from '@/lib/supabase/admin'
import { normalizeTaskStatus } from '@/lib/kanban/board-utils'
import { isPersistedTaskId } from '@/lib/tasks/task-ids'
import { revalidatePath } from 'next/cache'

export async function distributeTaskScore(taskId: string, assignees: string[]) {
  try {
    const adminDb = getAdminDb()
    const { data: taskData, error: taskError } = await adminDb
      .from('tasks')
      .select('score_awarded')
      .eq('id', taskId)
      .single()

    if (taskError || !taskData) throw new Error('Task node validation failed')
    if (taskData.score_awarded) {
      return { success: false, reason: 'Already awarded' }
    }

    // Safely traverse all assignees and globally inject +15 Validity Score internally
    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        const { data: profile } = await adminDb
          .from('profiles')
          .select('total_score')
          .eq('id', userId)
          .single()
        if (profile) {
          await adminDb
            .from('profiles')
            .update({ total_score: (profile.total_score || 0) + 15 })
            .eq('id', userId)
        }
      }
    }

    // Close the physical lock permanently
    await adminDb.from('tasks').update({ score_awarded: true }).eq('id', taskId)

    revalidatePath('/', 'layout')
    return { success: true }
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
