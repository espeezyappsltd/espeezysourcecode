import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createAdminClient()
  const { data: member } = await svc
    .from('admin_members')
    .select('username')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const eventType = body.event_type === 'leave' ? 'leave' : body.event_type === 'join' ? 'join' : 'active'

  await svc.from('admin_members').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

  await db.from('chat_events').insert({
    app_scope: 'hub',
    event_type: eventType,
    username: member.username,
    supabase_user_id: user.id,
    details: { at: new Date().toISOString() },
  })

  return NextResponse.json({ ok: true })
}
