import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db'
import { requireAdmin, isAuthError } from '@/utils/admin-auth'
import { createAdminClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdmin('chat')
  if (isAuthError(auth)) return auth

  const body = await req.json().catch(() => ({}))
  const eventType = body.event_type === 'leave' ? 'leave' : body.event_type === 'join' ? 'join' : 'active'
  const appScope = body.app_scope === 'hub' ? 'hub' : 'admin'

  const svc = await createAdminClient()
  await svc
    .from('admin_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', auth.user.id)

  const db = await createServerSupabaseClient()
  const { error } = await db.from('chat_events').insert({
    app_scope: appScope,
    event_type: eventType,
    username: auth.member.username,
    supabase_user_id: auth.user.id,
    details: { at: new Date().toISOString() },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
