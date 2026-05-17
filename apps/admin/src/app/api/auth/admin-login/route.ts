import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db'
import { normalizeAdminUsername } from '@/lib/admin-rbac'
import { getAdminMemberByUsername } from '@/utils/admin-auth'
import { createAdminClient } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username.trim() || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }

  const normalized = normalizeAdminUsername(username)
  if (normalized.length < 3) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  const svc = await createAdminClient()
  const member = await getAdminMemberByUsername(normalized, svc)

  if (!member) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const db = await createServerSupabaseClient()
  const { data, error } = await db.auth.signInWithPassword({
    email: member.email,
    password,
  })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await svc
    .from('admin_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', member.id)

  await svc.from('chat_events').insert({
    app_scope: 'admin',
    event_type: 'join',
    username: member.username,
    supabase_user_id: member.id,
    details: { at: new Date().toISOString() },
  })

  return NextResponse.json({
    ok: true,
    username: member.username,
    role: member.admin_role,
    display_name: member.display_name,
  })
}
