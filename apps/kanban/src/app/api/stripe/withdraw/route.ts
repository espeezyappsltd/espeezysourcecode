import { NextResponse } from 'next/server'
import { getStripeClient } from '@/utils/stripe'
import { createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/stripe/withdraw
 * Initiates a payout to the user's connected Stripe account.
 * Requires: { amountCents: number }
 */
export async function POST(req: Request) {
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

  const { data: profile } = await db
    .from('profiles')
    .select('stripe_account_id, balance_cents')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ error: 'No Stripe account linked.' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const amountCents = body?.amountCents
  if (!amountCents || typeof amountCents !== 'number' || amountCents < 100) {
    return NextResponse.json({ error: 'Invalid withdrawal amount.' }, { status: 400 })
  }

  if (profile.balance_cents < amountCents) {
    return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 })
  }

  // Create a payout to the connected account
  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'gbp',
      destination: profile.stripe_account_id,
      metadata: { user_id: user.id },
    })
    // Update user balance
    await db.from('profiles').update({ balance_cents: profile.balance_cents - amountCents }).eq('id', user.id)
    return NextResponse.json({ success: true, transferId: transfer.id })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Stripe payout failed' }, { status: 500 })
  }
}
