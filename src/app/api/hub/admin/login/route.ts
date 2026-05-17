import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username.trim() || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const normalized = normalizeUsername(username)
  const svc = createAdminClient()
  const { data: member } = await svc
    .from('admin_members')
    .select('email, username, admin_role, display_name')
    .eq('username', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const db = await createClient()
  const { error } = await db.auth.signInWithPassword({ email: member.email, password })
  if (error) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await svc.from('admin_members').update({ last_seen_at: new Date().toISOString() }).eq('username', normalized)

  return NextResponse.json({
    ok: true,
    member: {
      username: member.username,
      email: member.email,
      admin_role: member.admin_role,
      display_name: member.display_name,
    },
  })
}
