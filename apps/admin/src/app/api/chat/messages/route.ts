import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'
import { normalizeAdminUsername } from '@/lib/admin-rbac'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAdmin('chat')
  if (isAuthError(auth)) return auth

  const url = new URL(req.url)
  const appScope = (url.searchParams.get('app_scope') ?? 'admin') as 'admin' | 'hub'
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 40) || 40, 100)

  if (!['admin', 'hub'].includes(appScope)) {
    return NextResponse.json({ error: 'Invalid app_scope' }, { status: 422 })
  }

  const db = await createServerSupabaseClient()
  const { data: messages, error } = await db
    .from('chat_messages')
    .select('id, username, message, status, created_at, supabase_user_id')
    .eq('app_scope', appScope)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: events } = await db
    .from('chat_events')
    .select('id, event_type, username, created_at, details')
    .eq('app_scope', appScope)
    .in('event_type', ['new_user', 'join', 'leave'])
    .order('created_at', { ascending: false })
    .limit(5)

  const presence = await db
    .from('admin_members')
    .select('username, display_name, last_seen_at, is_active')
    .eq('is_active', true)
    .order('last_seen_at', { ascending: false, nullsFirst: false })

  return NextResponse.json({
    messages: [...(messages ?? [])].reverse(),
    events: events ?? [],
    online_staff: presence.data ?? [],
    me: auth.member.username,
  })
}

export async function POST(req: Request) {
  const auth = await requireAdmin('chat')
  if (isAuthError(auth)) return auth

  const body = await req.json().catch(() => ({}))
  const appScope = body.app_scope === 'hub' ? 'hub' : 'admin'
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!message || message.length > 1000) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 422 })
  }

  const username = normalizeAdminUsername(auth.member.username)
  const db = await createServerSupabaseClient()

  const { data, error } = await db
    .from('chat_messages')
    .insert({
      app_scope: appScope,
      username,
      message,
      supabase_user_id: auth.user.id,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await db.from('chat_events').insert({
    app_scope: appScope,
    event_type: 'message_created',
    username,
    supabase_user_id: auth.user.id,
    details: { message_id: data?.id },
  })

  return NextResponse.json({ ok: true, id: data?.id })
}
