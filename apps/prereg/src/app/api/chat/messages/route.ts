import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseConfig, normalizeUsername, supaRest } from '../../_lib/supabase-rest'

export const dynamic = 'force-dynamic'

const messageSchema = z.object({
  app_scope: z.enum(['prereg', 'games', 'kanban']),
  user_id: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3).max(24),
  message: z.string().trim().min(1).max(1000),
  supabase_user_id: z.string().uuid().optional(),
  firebase_uid: z.string().trim().max(128).optional(),
})

export async function GET(req: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const url = new URL(req.url)
  const appScope = (url.searchParams.get('app_scope') ?? 'prereg') as 'prereg' | 'games' | 'kanban'
  const limitRaw = Number(url.searchParams.get('limit') ?? '40')
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 40

  if (!['prereg', 'games', 'kanban'].includes(appScope)) {
    return NextResponse.json({ error: 'Invalid app_scope.' }, { status: 422 })
  }

  const { ok, data, status } = await supaRest(
    `chat_messages?select=id,app_scope,user_profile_id,supabase_user_id,firebase_uid,username,message,status,created_at,updated_at&app_scope=eq.${encodeURIComponent(appScope)}&status=neq.deleted&order=created_at.desc&limit=${limit}`,
    'GET',
  )

  if (!ok) {
    return NextResponse.json({ error: 'Unable to fetch chat messages.', details: data }, { status })
  }

  const { ok: eventsOk, data: eventsData } = await supaRest(
    `chat_events?select=id,event_type,username,details,created_at&app_scope=eq.${encodeURIComponent(appScope)}&event_type=eq.new_user&order=created_at.desc&limit=1`,
    'GET',
  )

  return NextResponse.json({
    messages: Array.isArray(data) ? [...data].reverse() : [],
    new_user_event: eventsOk && Array.isArray(eventsData) ? eventsData[0] ?? null : null,
  })
}

export async function POST(req: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat payload.' }, { status: 422 })
  }

  const cleanUsername = normalizeUsername(parsed.data.username)
  if (cleanUsername.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 valid characters.' }, { status: 422 })
  }

  const insertPayload = {
    app_scope: parsed.data.app_scope,
    username: cleanUsername,
    message: parsed.data.message.trim(),
    supabase_user_id: parsed.data.supabase_user_id ?? null,
    firebase_uid: parsed.data.firebase_uid ?? null,
    status: 'active',
    updated_at: new Date().toISOString(),
  }

  const { ok, data, status } = await supaRest(
    'chat_messages',
    'POST',
    insertPayload,
    { Prefer: 'return=representation' },
  )

  if (!ok) {
    return NextResponse.json({ error: 'Unable to send message.', details: data }, { status })
  }

  await supaRest('chat_events', 'POST', {
    app_scope: parsed.data.app_scope,
    event_type: 'message_created',
    username: cleanUsername,
    supabase_user_id: parsed.data.supabase_user_id ?? null,
    firebase_uid: parsed.data.firebase_uid ?? null,
    details: {
      user_id: parsed.data.user_id,
      message_preview: parsed.data.message.slice(0, 80),
    },
  }).catch(() => undefined)

  const row = Array.isArray(data) ? data[0] ?? null : null
  return NextResponse.json({ message: row })
}
