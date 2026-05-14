import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseConfig, normalizeUsername, supaRest } from '../../_lib/supabase-rest'

export const dynamic = 'force-dynamic'

const presenceSchema = z.object({
  app_scope: z.enum(['prereg', 'games', 'kanban']),
  event_type: z.enum(['new_user', 'join', 'leave', 'active']),
  user_id: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3).max(24),
  supabase_user_id: z.string().uuid().optional(),
  firebase_uid: z.string().trim().max(128).optional(),
})

export async function POST(req: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = presenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid presence payload.' }, { status: 422 })
  }

  const username = normalizeUsername(parsed.data.username)
  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 valid characters.' }, { status: 422 })
  }

  const payload = {
    app_scope: parsed.data.app_scope,
    event_type: parsed.data.event_type,
    username,
    supabase_user_id: parsed.data.supabase_user_id ?? null,
    firebase_uid: parsed.data.firebase_uid ?? null,
    details: {
      user_id: parsed.data.user_id,
      at: new Date().toISOString(),
    },
  }

  const { ok, data, status } = await supaRest('chat_events', 'POST', payload, { Prefer: 'return=representation' })
  if (!ok) {
    return NextResponse.json({ error: 'Unable to record presence.', details: data }, { status })
  }

  const event = Array.isArray(data) ? data[0] ?? null : null
  return NextResponse.json({ event })
}
