import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/utils/stripe'
import { getAdminDb } from '@/lib/supabase/admin'
import { getAuthUser, getUserProfile } from '@/utils/auth-server'

export const dynamic = 'force-dynamic'

function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION })
}

// POST /api/admin/payout  -  admin sends money to a user
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getUserProfile(user.uid)
  if (!profile || (profile as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = getAdminDb()

  const body = await req.json().catch(() => null)
  const { recipient_id, amount_cents, note } = body ?? {}

  // Validate recipient_id: must be a non-empty string
  if (!recipient_id || typeof recipient_id !== 'string') {
    return NextResponse.json({ error: 'Invalid recipient_id' }, { status: 400 })
  }

  // Validate amount_cents: must be a positive integer >= 100, no string coercion, no overflow
  const parsedAmount = Number(amount_cents)
  if (
    !amount_cents ||
    typeof amount_cents !== 'number' ||
    !Number.isFinite(parsedAmount) ||
    !Number.isInteger(parsedAmount) ||
    parsedAmount < 100 ||
    parsedAmount > 10_000_000_00 // max $10M
  ) {
    return NextResponse.json({ error: 'amount_cents must be a positive integer >= 100 (min $1)' }, { status: 400 })
  }

  const { data: recipient, error: recipientError } = await db
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', recipient_id)
    .single()

  if (recipientError || !recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!recipient.stripe_account_id || recipient.stripe_account_status !== 'active') {
    return NextResponse.json({ error: 'Recipient has no active bank account connected.' }, { status: 400 })
  }

  let stripe: Stripe
  try {
    stripe = getStripeClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe is not configured'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  let transfer: Stripe.Transfer
  try {
    transfer = await stripe.transfers.create({
      amount: Math.round(amount_cents),
      currency: 'usd',
      destination: recipient.stripe_account_id,
      description: note ?? 'Admin payout from espeezy.com',
      metadata: {
        admin_id: user.uid,
        recipient_id,
        note: note ?? '',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe transfer failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  await db.from('admin_payouts').insert({
    admin_id: user.uid,
    recipient_id,
    amount_cents: Math.round(amount_cents),
    stripe_transfer_id: transfer.id,
    note: note ?? null,
  })

  try {
    await db.from('activity_log').insert({
      user_id: user.uid,
      action: 'admin_payout',
      resource_type: 'admin_payout',
      resource_id: transfer.id,
      metadata: { recipient_id, amount_cents, note },
      severity: 'warning',
      timestamp: new Date().toISOString()
    })
  } catch { /* non-critical log */ }

  return NextResponse.json({ success: true, transfer_id: transfer.id })
}
