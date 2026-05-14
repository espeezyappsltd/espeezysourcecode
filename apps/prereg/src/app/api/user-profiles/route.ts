import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseConfig, normalizeUsername, supaRest } from '../_lib/supabase-rest'

export const dynamic = 'force-dynamic'

const profileSchema = z.object({
  supabase_user_id: z.string().uuid().optional(),
  firebase_uid: z.string().trim().max(128).optional(),
  email: z.string().email().max(254).optional(),
  username: z.string().trim().min(3).max(24).optional(),
  display_name: z.string().trim().max(120).optional(),
  avatar_url: z.string().url().max(500).optional(),
  app_role: z.enum(['user', 'moderator', 'admin']).optional(),
})

export async function GET(req: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const username = (url.searchParams.get('username') ?? '').trim().toLowerCase()
  const limitRaw = Number(url.searchParams.get('limit') ?? '20')
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20

  const select = 'id,supabase_user_id,firebase_uid,email,username,display_name,avatar_url,app_role,is_banned,created_at,updated_at'
  let path = `user_profiles?select=${encodeURIComponent(select)}&order=created_at.desc&limit=${limit}`

  if (username) {
    path += `&username=eq.${encodeURIComponent(username)}`
  } else if (q) {
    const pattern = `*${q.replace(/\*/g, '')}*`
    path += `&or=${encodeURIComponent(`(username.ilike.${pattern},display_name.ilike.${pattern},email.ilike.${pattern})`)}`
  }

  const { ok, data, status } = await supaRest(path, 'GET')
  if (!ok) {
    return NextResponse.json({ error: 'Unable to fetch user profiles.', details: data }, { status })
  }

  return NextResponse.json({ profiles: Array.isArray(data) ? data : [] })
}

export async function POST(req: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile payload.' }, { status: 422 })
  }

  const input = parsed.data
  const username = input.username ? normalizeUsername(input.username) : undefined

  if (input.username && (!username || username.length < 3)) {
    return NextResponse.json({ error: 'Username must be at least 3 valid characters.' }, { status: 422 })
  }

  const payload = {
    ...input,
    ...(username ? { username } : {}),
    updated_at: new Date().toISOString(),
  }

  const conflictField = input.supabase_user_id
    ? 'supabase_user_id'
    : input.firebase_uid
      ? 'firebase_uid'
      : input.email
        ? 'email'
        : 'username'

  const { ok, data, status } = await supaRest(
    `user_profiles?on_conflict=${encodeURIComponent(conflictField)}`,
    'POST',
    payload,
    { Prefer: 'resolution=merge-duplicates,return=representation' },
  )

  if (!ok) {
    return NextResponse.json({ error: 'Unable to upsert profile.', details: data }, { status })
  }

  const profile = Array.isArray(data) ? data[0] ?? null : data
  return NextResponse.json({ profile })
}
