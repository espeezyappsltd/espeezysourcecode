import { NextResponse } from 'next/server'
import { HUB_SESSION_COOKIE } from '@/lib/dev-hub/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(HUB_SESSION_COOKIE)
  return res
}
