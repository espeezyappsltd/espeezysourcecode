type PresencePayload = {
  app_scope: 'prereg' | 'games' | 'kanban'
  event_type: 'new_user' | 'active'
  user_id: string
  username: string
}

export async function postChatPresence(payload: PresencePayload) {
  await fetch('/api/chat/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchChatMessages(appScope: 'prereg' | 'games' | 'kanban', limit = 30) {
  const res = await fetch(`/api/chat/messages?app_scope=${encodeURIComponent(appScope)}&limit=${limit}`, {
    cache: 'no-store',
  })
  return res.json().catch(() => ({ messages: [] })) as Promise<{
    messages?: Array<{ id: string; username: string; message: string; created_at: string; status: string }>
    new_user_event?: { id?: string; event_type?: string; username?: string; created_at?: string }
  }>
}

export async function sendChatMessage(payload: {
  app_scope: 'prereg' | 'games' | 'kanban'
  user_id: string
  username: string
  message: string
}) {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok }
}