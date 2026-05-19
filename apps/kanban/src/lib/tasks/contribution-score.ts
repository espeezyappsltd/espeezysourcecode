import { getAdminDb } from '@/lib/supabase/admin'

/** Seed / contribution points granted once per completed Kanban task per recipient. */
export const TASK_COMPLETION_SEED_POINTS = 15

export type ScoreAwardResult = {
  awarded: boolean
  recipients: string[]
  pointsPerUser: number
}

export function resolveScoreRecipients(assignees: string[] | null | undefined, completedByUserId: string): string[] {
  const fromAssignees = (assignees ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0)
  if (fromAssignees.length > 0) {
    return [...new Set(fromAssignees)]
  }
  return completedByUserId ? [completedByUserId] : []
}

/**
 * Idempotently awards seed points for a Done task (guarded by tasks.score_awarded).
 */
export async function awardTaskCompletionScore(
  taskId: string,
  recipients: string[],
  completedByUserId: string,
): Promise<ScoreAwardResult> {
  const userIds = resolveScoreRecipients(recipients, completedByUserId)
  if (userIds.length === 0) {
    return { awarded: false, recipients: [], pointsPerUser: TASK_COMPLETION_SEED_POINTS }
  }

  const db = getAdminDb()
  const { data: task, error: fetchError } = await db.from('tasks').select('score_awarded').eq('id', taskId).single()

  if (fetchError || !task || task.score_awarded) {
    return { awarded: false, recipients: userIds, pointsPerUser: TASK_COMPLETION_SEED_POINTS }
  }

  for (const userId of userIds) {
    const { data: profile } = await db.from('profiles').select('total_score').eq('id', userId).single()
    if (!profile) continue

    const nextScore = (profile.total_score ?? 0) + TASK_COMPLETION_SEED_POINTS
    const { error: updateError } = await db.from('profiles').update({ total_score: nextScore }).eq('id', userId)
    if (updateError) {
      console.error('[contribution-score] profile update failed:', updateError.message)
    }
  }

  const { error: lockError } = await db.from('tasks').update({ score_awarded: true }).eq('id', taskId)
  if (lockError) {
    console.error('[contribution-score] score_awarded lock failed:', lockError.message)
    return { awarded: false, recipients: userIds, pointsPerUser: TASK_COMPLETION_SEED_POINTS }
  }

  return { awarded: true, recipients: userIds, pointsPerUser: TASK_COMPLETION_SEED_POINTS }
}

/** Awards seed points for all Done tasks in a group that have not been scored yet. */
export async function backfillGroupContributionScores(groupId: string): Promise<{ tasksProcessed: number; usersAwarded: number }> {
  const db = getAdminDb()
  const { data: tasks, error } = await db
    .from('tasks')
    .select('id, assignees, score_awarded')
    .eq('group_id', groupId)
    .eq('status', 'Done')

  if (error || !tasks?.length) {
    return { tasksProcessed: 0, usersAwarded: 0 }
  }

  let tasksProcessed = 0
  let usersAwarded = 0

  for (const row of tasks) {
    if (row.score_awarded) continue
    const assignees = Array.isArray(row.assignees) ? (row.assignees as string[]) : []
    const result = await awardTaskCompletionScore(row.id, assignees, '')
    if (result.awarded) {
      tasksProcessed += 1
      usersAwarded += result.recipients.length
    }
  }

  return { tasksProcessed, usersAwarded }
}
