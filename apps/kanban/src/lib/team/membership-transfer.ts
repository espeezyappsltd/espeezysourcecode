import { getAdminDb } from '@/lib/supabase/admin'

const JOIN_REQUEST_TAG = '[JOIN REQUEST]'

export function formatJoinRequestChatContent(senderName: string, customMessage?: string | null): string {
  const intro = `👋 ${JOIN_REQUEST_TAG} I'd like to join the team. I'm ${senderName.trim() || 'A student'}.`
  const extra = customMessage?.trim()
  if (!extra) return intro
  return `${intro}\n\n${extra.slice(0, 500)}`
}

/** Hide member tasks from old team board; still visible on profile. */
export async function archiveMemberTasksForGroup(userId: string, groupId: string): Promise<void> {
  const db = getAdminDb()

  const { data: tasks, error } = await db.from('tasks').select('id, assignees').eq('group_id', groupId)

  if (error) throw error
  if (!tasks?.length) return

  const owned = tasks.filter((t) => Array.isArray(t.assignees) && t.assignees.includes(userId))

  if (owned.length === 0) return

  const { error: updateError } = await db
    .from('tasks')
    .update({ board_visible: false })
    .in(
      'id',
      owned.map((t) => t.id),
    )

  if (updateError) throw updateError
}

/** Restore board visibility when member rejoins a team they previously left. */
export async function restoreMemberTasksOnGroupBoard(userId: string, groupId: string): Promise<void> {
  const db = getAdminDb()

  const { data: tasks, error } = await db
    .from('tasks')
    .select('id, assignees')
    .eq('group_id', groupId)
    .eq('board_visible', false)

  if (error) throw error
  if (!tasks?.length) return

  const owned = tasks.filter((t) => Array.isArray(t.assignees) && t.assignees.includes(userId))

  if (owned.length === 0) return

  const { error: updateError } = await db
    .from('tasks')
    .update({ board_visible: true })
    .in(
      'id',
      owned.map((t) => t.id),
    )

  if (updateError) throw updateError
}

export { JOIN_REQUEST_TAG }
