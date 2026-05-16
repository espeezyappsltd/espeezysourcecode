import { NextResponse } from 'next/server'
import { getStripeClient, getAppUrl } from '@/utils/stripe'
import { createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/stripe/connect
 * Initiates Stripe Connect onboarding for the current user.
 * Returns a Stripe onboarding URL for the user to complete account setup.
 */
export async function POST() {
  let stripe: import('stripe').default
  try {
    stripe = getStripeClient()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Stripe is not configured'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // Check if user already has a Stripe account
  const { data: profile } = await db
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  let accountId = profile?.stripe_account_id

  if (!accountId) {
    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        user_id: user.id,
      },
    })
    accountId = account.id
    await db.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${getAppUrl()}/marketplace?stripe=refresh`,
    return_url: `${getAppUrl()}/marketplace?stripe=return`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
