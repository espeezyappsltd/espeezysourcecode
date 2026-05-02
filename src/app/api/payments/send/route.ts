import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion })
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://espeezy.com'

// Platform fee: 2% of transfer, minimum 25 cents
function computeFee(amountCents: number): number {
  return Math.max(25, Math.ceil(amountCents * 0.02))
}

const SendSchema = z.object({
  recipient_username: z.string().min(2).max(50),
  amount_cents: z.number().int().min(100).max(100_000_00), // $1 – $100,000
  note: z.string().max(280).optional(),
})

// POST /api/payments/send — initiate a P2P payment checkout
export async function POST(req: NextRequest) {
  let stripe: Stripe
  try {
    stripe = getStripeClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe is not configured'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
    .catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 })
  }

  const { recipient_username, amount_cents, note } = parsed.data

  const admin = await createAdminClient()

  // Fetch sender profile
  const { data: sender } = await admin
    .from('profiles')
    .select('id, username, full_name, espeezy_email, stripe_account_id, stripe_account_status, email')
    .eq('id', user.id)
    .single()

  if (!sender) return NextResponse.json({ error: 'Sender profile not found' }, { status: 404 })
  if (sender.username?.toLowerCase() === recipient_username.toLowerCase()) {
    return NextResponse.json({ error: 'You cannot send money to yourself' }, { status: 422 })
  }

  // Fetch recipient by username
  const { data: recipient } = await admin
    .from('profiles')
    .select('id, username, full_name, espeezy_email, stripe_account_id, stripe_account_status, email')
    .ilike('username', recipient_username)
    .single()

  if (!recipient) return NextResponse.json({ error: 'Recipient not found. Check the username.' }, { status: 404 })
  if (!recipient.stripe_account_id || recipient.stripe_account_status !== 'active') {
    return NextResponse.json({
      error: `${recipient.full_name} has not connected a bank account yet. Ask them to set up payouts first.`,
    }, { status: 400 })
  }

  const fee_cents = computeFee(amount_cents)
  const net_cents = amount_cents - fee_cents

  // Create a pending transfer record
  const { data: transfer, error: transferErr } = await admin
    .from('p2p_transfers')
    .insert({
      sender_id: sender.id,
      recipient_id: recipient.id,
      amount_cents,
      fee_cents,
      net_cents,
      note: note ?? null,
      status: 'pending',
      sender_espeezy_email: sender.espeezy_email ?? `${sender.username}@espeezy.com`,
      recipient_espeezy_email: recipient.espeezy_email ?? `${recipient.username}@espeezy.com`,
    })
    .select()
    .single()

  if (transferErr || !transfer) {
    return NextResponse.json({ error: 'Failed to create transfer record' }, { status: 500 })
  }

  // Create Stripe Checkout Session — sender pays amount_cents, net_cents goes to recipient
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: sender.email ?? undefined,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Send money to @${recipient.username}`,
          description: note ? `Note: ${note}` : `P2P transfer on Espeezy`,
        },
        unit_amount: amount_cents,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_data: {
        destination: recipient.stripe_account_id,
        amount: net_cents,
      },
      metadata: {
        type: 'p2p_transfer',
        transfer_id: transfer.id,
        sender_id: sender.id,
        recipient_id: recipient.id,
      },
    },
    metadata: {
      type: 'p2p_transfer',
      transfer_id: transfer.id,
    },
    success_url: `${APP_URL}/dashboard/wallet?transfer=success&id=${transfer.id}`,
    cancel_url:  `${APP_URL}/dashboard/wallet?transfer=cancelled`,
  })

  // Store checkout session ID on the transfer record
  await admin
    .from('p2p_transfers')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', transfer.id)

  return NextResponse.json({ checkout_url: session.url, transfer_id: transfer.id }, { status: 201 })
}
