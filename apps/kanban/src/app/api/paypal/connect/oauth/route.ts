import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { getRequestUser } from '@/lib/supabase/admin'
import { isPayPalConfigured } from '@/lib/paypal/config'
import { buildPayPalOAuthUrl } from '@/lib/paypal/oauth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATE_COOKIE = 'paypal_oauth_state'
const USER_COOKIE = 'paypal_oauth_user'
const COOKIE_MAX_AGE = 600

/**
 * GET /api/paypal/connect/oauth — start PayPal Login to verify and link account email.
 */
export async function GET(req: Request) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: 'PayPal is not configured on this server. Link your account with email instead.' },
      { status: 503 },
    )
  }

  const state = randomUUID()
  const jar = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  }
  jar.set(STATE_COOKIE, state, cookieOpts)
  jar.set(USER_COOKIE, user.id, cookieOpts)

  return NextResponse.json({ url: buildPayPalOAuthUrl(state) })
}
