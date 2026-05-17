import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireHubAdmin() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return null
  const svc = createAdminClient()
  const { data: member } = await svc
    .from('admin_members')
    .select('id, username')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!member) return null
  return { user, member, db, svc }
}

export async function GET() {
  const auth = await requireHubAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: messages, error } = await auth.db
    .from('chat_messages')
    .select('id, username, message, created_at')
    .eq('app_scope', 'hub')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: events } = await auth.db
    .from('chat_events')
    .select('id, event_type, username, created_at')
    .eq('app_scope', 'hub')
    .in('event_type', ['join', 'leave'])
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: staff } = await auth.svc
    .from('admin_members')
    .select('username, display_name, last_seen_at')
    .eq('is_active', true)

  return NextResponse.json({
    messages: [...(messages ?? [])].reverse(),
    events: events ?? [],
    online_staff: staff ?? [],
    me: auth.member.username,
  })
}

export async function POST(req: Request) {
  const auth = await requireHubAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Invalid message' }, { status: 422 })

  const { error } = await auth.db.from('chat_messages').insert({
    app_scope: 'hub',
    username: auth.member.username,
    message,
    supabase_user_id: auth.user.id,
    status: 'active',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
