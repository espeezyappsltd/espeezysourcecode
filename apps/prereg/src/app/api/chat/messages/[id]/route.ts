import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseConfig, isAdminRequest, supaRest } from '../../../_lib/supabase-rest'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  message: z.string().trim().min(1).max(1000).optional(),
  status: z.enum(['active', 'edited', 'hidden', 'deleted']).optional(),
  reason: z.string().trim().max(250).optional(),
  user_id: z.string().trim().max(120).optional(),
  app_scope: z.enum(['prereg', 'games', 'kanban']).optional(),
  username: z.string().trim().max(24).optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const { id } = await params
  const { ok, data, status } = await supaRest(
    `chat_messages?id=eq.${encodeURIComponent(id)}&select=*`,
    'GET',
  )

  if (!ok) {
    return NextResponse.json({ error: 'Unable to fetch message.', details: data }, { status })
  }

  const message = Array.isArray(data) ? data[0] ?? null : null
  if (!message) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }

  return NextResponse.json({ message })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message update payload.' }, { status: 422 })
  }

  const { id } = await params
  const admin = isAdminRequest(req)

  if (!admin && !parsed.data.user_id) {
    return NextResponse.json({ error: 'Missing message owner id.' }, { status: 403 })
  }

  const { ok: existingOk, data: existingData } = await supaRest(
    `chat_messages?id=eq.${encodeURIComponent(id)}&select=*`,
    'GET',
  )

  const existing = existingOk && Array.isArray(existingData) ? existingData[0] : null
  if (!existing) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }

  if (!admin && parsed.data.user_id && parsed.data.user_id !== (existing as Record<string, unknown>).firebase_uid && parsed.data.user_id !== (existing as Record<string, unknown>).supabase_user_id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const nextStatus = parsed.data.status ?? (parsed.data.message ? 'edited' : (existing as Record<string, unknown>).status)
  const patch = {
    ...(parsed.data.message ? { message: parsed.data.message.trim() } : {}),
    status: nextStatus,
    moderated_reason: admin ? (parsed.data.reason ?? null) : null,
    moderated_by: admin ? (req.headers.get('x-agent-key') ?? 'admin') : null,
    updated_at: new Date().toISOString(),
  }

  const { ok, data, status } = await supaRest(
    `chat_messages?id=eq.${encodeURIComponent(id)}`,
    'PATCH',
    patch,
    { Prefer: 'return=representation' },
  )

  if (!ok) {
    return NextResponse.json({ error: 'Unable to update message.', details: data }, { status })
  }

  await supaRest('chat_events', 'POST', {
    app_scope: parsed.data.app_scope ?? (existing as Record<string, unknown>).app_scope,
    event_type: nextStatus === 'hidden' ? 'message_hidden' : nextStatus === 'deleted' ? 'message_deleted' : 'message_edited',
    username: parsed.data.username ?? (existing as Record<string, unknown>).username,
    details: {
      message_id: id,
      reason: parsed.data.reason ?? null,
      admin,
    },
  }).catch(() => undefined)

  const message = Array.isArray(data) ? data[0] ?? null : null
  return NextResponse.json({ message })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid delete payload.' }, { status: 422 })
  }

  return PATCH(req, { params })
}
