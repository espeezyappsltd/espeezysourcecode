import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  source: z.string().trim().max(50).optional(),
})

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PROJECT_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SECRET_KEY ?? '').trim()
  if (!url || !key) return null
  return { url, key }
}

function isAlreadyRegisteredError(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const data = payload as Record<string, unknown>
  const code = typeof data.code === 'string' ? data.code.toLowerCase() : ''
  const message = typeof data.message === 'string' ? data.message.toLowerCase() : ''
  return code === 'user_already_exists' || message.includes('already') || message.includes('registered')
}

export async function POST(req: Request) {
  const cfg = getSupabaseConfig()
  if (!cfg) {
    return NextResponse.json({ error: 'Signup service temporarily unavailable.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 422 })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const password = parsed.data.password
  const source = (parsed.data.source ?? 'games-signup').slice(0, 50)

  const res = await fetch(`${cfg.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: false,
      user_metadata: { source },
    }),
  })

  const payload = await res.json().catch(() => null)
  if (res.ok) {
    return NextResponse.json({
      success: true,
      message: 'Account created. Check your inbox for verification, then sign in.',
    })
  }

  if (res.status === 422 && isAlreadyRegisteredError(payload)) {
    return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
  }

  console.error('[games-signup] Supabase auth create failed:', res.status, payload)
  return NextResponse.json({ error: 'Could not create account right now.' }, { status: 503 })
}
