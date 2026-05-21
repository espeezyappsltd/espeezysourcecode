import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { exchangePayPalCode } from '@/lib/paypal/oauth'
import { getAppUrl } from '@/utils/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATE_COOKIE = 'paypal_oauth_state'
const USER_COOKIE = 'paypal_oauth_user'

function assetsRedirect(query: string) {
  const base = `${getAppUrl().replace(/\/$/, '')}/assets/marketplace`
  return NextResponse.redirect(`${base}?${query}`)
}

/**
 * GET /api/paypal/connect/callback — PayPal OAuth return; links verified email on profile.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const paypalError = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  if (paypalError) {
    return assetsRedirect(`paypal=error&message=${encodeURIComponent(paypalError)}`)
  }

  const jar = await cookies()
  const expectedState = jar.get(STATE_COOKIE)?.value
  const cookieUserId = jar.get(USER_COOKIE)?.value
  jar.delete(STATE_COOKIE)
  jar.delete(USER_COOKIE)

  if (!code || !state || !expectedState || state !== expectedState) {
    return assetsRedirect('paypal=error&message=Invalid+PayPal+authorization+session')
  }

  try {
    const { email } = await exchangePayPalCode(code)

    const sessionUser = await getRequestUser(req)
    const userId = sessionUser?.id ?? cookieUserId

    if (!userId) {
      return assetsRedirect('paypal=error&message=Sign+in+to+link+PayPal')
    }

    const db = getAdminDb()

    const { error } = await db
      .from('profiles')
      .update({
        paypal_email: email,
        paypal_account_status: 'linked',
        paypal_linked_at: new Date().toISOString(),
        preferred_payout_method: 'paypal',
      })
      .eq('id', userId)

    if (error) {
      return assetsRedirect(
        `paypal=error&message=${encodeURIComponent(error.message)}`,
      )
    }

    return assetsRedirect('paypal=linked')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PayPal linking failed'
    return assetsRedirect(`paypal=error&message=${encodeURIComponent(message)}`)
  }
}
