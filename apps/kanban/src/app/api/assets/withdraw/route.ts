import { NextResponse } from 'next/server'
import { getAdminDb, getRequestUser } from '@/lib/supabase/admin'
import { getTradingMetricsForUser, creditsToWithdrawCents } from '@/lib/marketplace/trading-metrics'
import {
  executePayPalPayout,
  executeStripePayout,
  loadPayoutProfile,
  resolvePayoutMethod,
  type PayoutMethod,
} from '@/lib/marketplace/withdraw-payout'
import { isPayPalConfigured } from '@/lib/paypal/config'
import { validateCreditValue } from '@/lib/credits'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIN_WITHDRAW_CENTS = 100

/**
 * POST /api/assets/withdraw
 * Body: { creditsAmount: number, payoutMethod?: 'stripe' | 'paypal' }
 */
export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as {
      creditsAmount?: unknown
      payoutMethod?: unknown
    }
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

    const profile = await loadPayoutProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    const method: PayoutMethod = resolvePayoutMethod(
      profile,
      typeof body.payoutMethod === 'string' ? body.payoutMethod : null,
    )

    if (method === 'paypal' && !isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal payouts are not configured. Use Stripe or contact support.' },
        { status: 503 },
      )
    }

    const db = getAdminDb()
    let stripeTransferId: string | null = null
    let paypalBatchId: string | null = null
    let paypalItemId: string | null = null

    if (method === 'stripe') {
      const { externalId } = await executeStripePayout({
        userId: user.id,
        profile,
        amountCents,
        creditsAmount,
      })
      stripeTransferId = externalId
    } else {
      const payout = await executePayPalPayout({
        userId: user.id,
        profile,
        amountCents,
        creditsAmount,
      })
      paypalBatchId = payout.batchId
      paypalItemId = payout.itemId
    }

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
      stripe_transfer_id: stripeTransferId,
      payout_method: method,
      paypal_payout_batch_id: paypalBatchId,
      paypal_payout_item_id: paypalItemId,
      status: 'completed',
    })

    if (withdrawErr) {
      console.error('[assets/withdraw] ledger insert failed after payout:', withdrawErr.message)
    }

    const updated = await getTradingMetricsForUser(user.id)

    return NextResponse.json({
      success: true,
      payoutMethod: method,
      transferId: stripeTransferId,
      paypalBatchId,
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
