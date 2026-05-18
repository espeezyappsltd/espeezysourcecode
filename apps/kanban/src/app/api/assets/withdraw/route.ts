import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { getTradingMetricsForUser, creditsToWithdrawCents } from '@/lib/marketplace/trading-metrics'
import { validateCreditValue } from '@/lib/credits'
import { getStripeClient } from '@/utils/stripe'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIN_WITHDRAW_CENTS = 100

/**
 * POST /api/assets/withdraw
 * Withdraw cash for marketplace earnings only: sum(asset credit value × times sold) minus prior withdrawals.
 * Body: { creditsAmount: number }
 */
export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as { creditsAmount?: unknown }
    const creditCheck = validateCreditValue(body.creditsAmount, { required: true })
    if (!creditCheck.ok) {
      return NextResponse.json({ error: creditCheck.message }, { status: 422 })
    }

    const creditsAmount = creditCheck.value
    if (creditsAmount <= 0) {
      return NextResponse.json({ error: 'Withdrawal must be at least 1 credit.' }, { status: 400 })
    }

    const amountCents = creditsToWithdrawCents(creditsAmount)
    if (amountCents < MIN_WITHDRAW_CENTS) {
      return NextResponse.json(
        { error: 'Minimum cash withdrawal is £1.00 (about 10 credits).' },
        { status: 400 },
      )
    }

    const metrics = await getTradingMetricsForUser(user.id)
    if (creditsAmount > metrics.availableWithdrawCredits) {
      return NextResponse.json(
        {
          error: `You can withdraw up to ${metrics.availableWithdrawCredits} credits from marketplace sales (asset value × times sold, minus prior withdrawals).`,
          availableWithdrawCredits: metrics.availableWithdrawCredits,
          totalWithdrawableCredits: metrics.totalWithdrawableCredits,
          totalWithdrawnCredits: metrics.totalWithdrawnCredits,
        },
        { status: 400 },
      )
    }

    if (creditsAmount > metrics.creditsBalance) {
      return NextResponse.json(
        {
          error: 'Insufficient Espeezy credits to complete this withdrawal.',
          creditsBalance: metrics.creditsBalance,
        },
        { status: 400 },
      )
    }

    const db = getAdminDb()
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_account_id, espeezy_credits')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        {
          error: 'Connect Stripe on the marketplace page before withdrawing cash.',
          connectUrl: '/marketplace',
        },
        { status: 400 },
      )
    }

    let stripe: import('stripe').default
    try {
      stripe = getStripeClient()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Stripe is not configured'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'gbp',
      destination: profile.stripe_account_id,
      metadata: {
        user_id: user.id,
        credits_withdrawn: String(creditsAmount),
        source: 'marketplace_asset_sales',
      },
    })

    const newCredits = Math.max(0, (profile.espeezy_credits ?? 0) - creditsAmount)
    const { error: profileErr } = await db
      .from('profiles')
      .update({ espeezy_credits: newCredits })
      .eq('id', user.id)

    if (profileErr) {
      return NextResponse.json(
        { error: friendlySupabaseError(profileErr.message, 'Could not update credit balance') },
        { status: 500 },
      )
    }

    const { error: withdrawErr } = await db.from('marketplace_withdrawals').insert({
      user_id: user.id,
      credits_amount: creditsAmount,
      amount_cents: amountCents,
      stripe_transfer_id: transfer.id,
      status: 'completed',
    })

    if (withdrawErr) {
      console.error('[assets/withdraw] ledger insert failed after transfer:', withdrawErr.message)
    }

    const updated = await getTradingMetricsForUser(user.id)

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      creditsWithdrawn: creditsAmount,
      amountCents,
      metrics: {
        availableWithdrawCredits: updated.availableWithdrawCredits,
        creditsBalance: updated.creditsBalance,
        totalWithdrawnCredits: updated.totalWithdrawnCredits,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Withdrawal failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
