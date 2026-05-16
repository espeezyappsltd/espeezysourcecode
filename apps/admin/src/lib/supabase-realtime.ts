// src/lib/supabase-realtime.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

export function getKanbanChannel(groupId: string) {
  return supabase.channel(`room:${groupId}:kanban`, { config: { private: true } })
}

export async function subscribeKanban(groupId: string, onChange: (payload: Record<string, unknown>) => void) {
  await supabase.realtime.setAuth()
  const channel = getKanbanChannel(groupId)
  channel
    .on('broadcast', { event: 'INSERT' }, ({ payload }) => onChange(payload))
    .on('broadcast', { event: 'UPDATE' }, ({ payload }) => onChange(payload))
    .on('broadcast', { event: 'DELETE' }, ({ payload }) => onChange(payload))
    .subscribe()
  return channel
}

export async function broadcastKanbanChange(groupId: string, event: 'INSERT'|'UPDATE'|'DELETE', payload: Record<string, unknown>) {
  await supabase.realtime.setAuth()
  const channel = getKanbanChannel(groupId)
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}
