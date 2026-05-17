import { NextResponse } from 'next/server'
import {
  assertDevEnvironment,
  getHubPassword,
  HUB_SESSION_COOKIE,
  signHubSession,
} from '@/lib/dev-hub/auth'

export async function POST(req: Request) {
  try {
    assertDevEnvironment()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unavailable' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''

  if (password !== getHubPassword()) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(HUB_SESSION_COOKIE, signHubSession(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
