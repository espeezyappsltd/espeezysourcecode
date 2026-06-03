import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const inferAppScope = () => {
  if (typeof window === 'undefined') return 'system'
  const path = window.location.pathname
  if (path.startsWith('/dashboard')) return 'core'
  if (path.startsWith('/games')) return 'games'
  if (path.startsWith('/kanban')) return 'kanban'
  if (path.startsWith('/prereg')) return 'prereg'
  return 'system'
}

export const logEvent = async (eventData: Record<string, unknown>) => {
  try {
    const db = createBrowserSupabaseClient()
    const userIdRaw = typeof eventData.user_id === 'string' ? eventData.user_id : null
    const userId = userIdRaw && UUID_RE.test(userIdRaw) ? userIdRaw : null
    const details: Record<string, unknown> =
      eventData.details && typeof eventData.details === 'object' && !Array.isArray(eventData.details)
        ? { ...(eventData.details as Record<string, unknown>), group_id: eventData.group_id ?? null }
        : {
            message: eventData.details ?? null,
            metadata: eventData.metadata ?? null,
            group_id: eventData.group_id ?? null,
          }

    const groupIdCol =
      typeof eventData.group_id === 'string'
        ? eventData.group_id
        : typeof details.group_id === 'string'
          ? details.group_id
          : null

    const { error } = await db.from('activity_logs').insert({
      user_id: userId,
      app_scope: typeof eventData.app_scope === 'string' ? eventData.app_scope : inferAppScope(),
      action: String(eventData.action ?? 'UNKNOWN_ACTION'),
      resource_type: typeof eventData.resource_type === 'string' ? eventData.resource_type : 'system',
      resource_id: typeof eventData.resource_id === 'string' ? eventData.resource_id : null,
      details,
      status: typeof eventData.status === 'string' ? eventData.status : 'success',
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Critical failure writing to Supabase activity_logs:', error)
  }
}

export const logActivity = async (
  userId: string,
  groupId: string | null | undefined,
  action: string,
  details: string,
  metadata?: Record<string, unknown>,
) => {
  await logEvent({
    user_id: userId,
    group_id: groupId ?? null,
    app_scope: 'kanban',
    action,
    details,
    metadata: metadata ?? null,
  })
}
