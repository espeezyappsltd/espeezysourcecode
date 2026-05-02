import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db'
import { sendP2PTransactionEmail } from '@/services/email'

export const dynamic = 'force-dynamic'

function getStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion })
}

const PayoutSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
})

async function isAdminUser(): Promise<boolean> {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return false
  const admin = await createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

// POST /api/quiz/prizes/payout — settle unpaid quiz cash prizes
// Auth: admin session OR X-Agent-Key header for internal workers
export async function POST(req: NextRequest) {
  let stripe: Stripe
  try {
    stripe = getStripeClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe is not configured'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const agentKey = req.headers.get('x-agent-key')
  const internalAllowed = Boolean(process.env.AGENT_API_KEY) && agentKey === process.env.AGENT_API_KEY
  const adminAllowed = await isAdminUser()

  if (!internalAllowed && !adminAllowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = PayoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 })
  }

  const { limit } = parsed.data
  const admin = await createAdminClient()

  const { data: sessions, error } = await admin
    .from('quiz_sessions')
    .select('id, user_id, prize_cents_won, prize_paid_out')
    .eq('status', 'completed')
    .eq('prize_paid_out', false)
    .gt('prize_cents_won', 0)
    .order('completed_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!sessions?.length) return NextResponse.json({ processed: 0, paid: 0, skipped: 0, results: [] })

  let paid = 0
  let skipped = 0
  const results: Array<{ session_id: string; status: 'paid' | 'skipped' | 'failed'; reason?: string }> = []

  for (const session of sessions) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, username, email, espeezy_email, stripe_account_id, stripe_account_status')
      .eq('id', session.user_id)
      .single()

    if (!profile?.stripe_account_id || profile.stripe_account_status !== 'active') {
      skipped++
      results.push({ session_id: session.id, status: 'skipped', reason: 'No active Stripe connected account' })
      continue
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: session.prize_cents_won,
        currency: 'usd',
        destination: profile.stripe_account_id,
        description: `Quiz prize payout for session ${session.id}`,
        metadata: {
          type: 'quiz_prize',
          quiz_session_id: session.id,
          user_id: profile.id,
        },
      })

      await admin
        .from('quiz_sessions')
        .update({ prize_paid_out: true, prize_transfer_id: transfer.id })
        .eq('id', session.id)

      await admin.from('reward_ledger').insert({
        user_id: profile.id,
        type: 'prize_cash_awarded',
        points: 0,
        cash_value_cents: session.prize_cents_won,
        description: `Cash prize payout for quiz session ${session.id}`,
        reference_id: session.id,
        reference_type: 'quiz_session',
      })

      await admin.from('notifications').insert({
        user_id: profile.id,
        type: 'quiz_prize_paid',
        title: `Prize paid: $${(session.prize_cents_won / 100).toFixed(2)}`,
        message: `Your quiz cash prize has been paid to your connected account.`,
        link: '/dashboard/wallet',
      })

      const to = [profile.email, profile.espeezy_email].filter((v): v is string => Boolean(v))
      if (to.length > 0) {
        await sendP2PTransactionEmail({
          to,
          role: 'recipient',
          transferId: transfer.id,
          counterpartyName: 'Espeezy Quiz Prize Engine',
          counterpartyUsername: 'espeezy',
          amountCents: session.prize_cents_won,
          feeCents: 0,
          netCents: session.prize_cents_won,
          note: `Quiz session ${session.id}`,
        })
      }

      paid++
      results.push({ session_id: session.id, status: 'paid' })
    } catch (e: unknown) {
      results.push({
        session_id: session.id,
        status: 'failed',
        reason: e instanceof Error ? e.message : 'Unknown transfer error',
      })
    }
  }

  return NextResponse.json({ processed: sessions.length, paid, skipped, results })
}
