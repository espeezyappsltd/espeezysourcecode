import { getAdminDb } from '@/lib/supabase/admin'
import {
  generateFundReceiptNumber,
  generateFundVerifyToken,
  resolveFundReceiptProfile,
} from '@/lib/credits/fund-receipt'
import { tierSummary, CREDIT_FUND_TIERS } from '@/lib/credits/fund-tiers'

export type ApplyCreditTopupResult =
  | { applied: true; creditsAdded: number; balanceAfter: number; alreadyProcessed?: false }
  | { applied: false; alreadyProcessed: true; balanceAfter: number }

/**
 * Credit a user's balance once per Stripe session. Safe to call from webhooks only.
 */
export async function applyCreditTopupFromStripeSession(opts: {
  userId: string
  stripeSessionId: string
  creditsAmount: number
  amountGbp: number
  listingId?: string | null
  returnPath?: string | null
}): Promise<ApplyCreditTopupResult> {
  const db = getAdminDb()
  const credits = Math.floor(opts.creditsAmount)
  if (!opts.userId || credits <= 0 || !opts.stripeSessionId) {
    throw new Error('Invalid credit top-up payload')
  }

  const { data: existing } = await db
    .from('credit_fund_checkouts')
    .select('id, status')
    .eq('stripe_session_id', opts.stripeSessionId)
    .maybeSingle()

  if (existing?.status === 'completed') {
    const { data: profile } = await db
      .from('profiles')
      .select('espeezy_credits')
      .eq('id', opts.userId)
      .maybeSingle()
    return {
      applied: false,
      alreadyProcessed: true,
      balanceAfter: profile?.espeezy_credits ?? 0,
    }
  }

  if (!existing) {
    await db.from('credit_fund_checkouts').insert({
      user_id: opts.userId,
      stripe_session_id: opts.stripeSessionId,
      amount_gbp: opts.amountGbp,
      credits_amount: credits,
      status: 'pending',
      return_path: opts.returnPath ?? null,
      listing_id: opts.listingId ?? null,
    })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('espeezy_credits, full_name, username, email, espeezy_email')
    .eq('id', opts.userId)
    .maybeSingle()

  const next = (profile?.espeezy_credits ?? 0) + credits

  await db.from('profiles').update({ espeezy_credits: next }).eq('id', opts.userId)

  const displayName = resolveFundReceiptProfile(profile)
  const receiptNumber = generateFundReceiptNumber()
  const verifyToken = generateFundVerifyToken()
  const tier = CREDIT_FUND_TIERS.find((t) => t.amountGbp === opts.amountGbp)
  const tierLabel = tier ? tierSummary(tier) : `£${opts.amountGbp.toFixed(2)} top-up`
  const receiptPath = `/account/credits/receipt?session_id=${encodeURIComponent(opts.stripeSessionId)}`

  await db
    .from('credit_fund_checkouts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      receipt_number: receiptNumber,
      verify_token: verifyToken,
      user_display_name: displayName,
    })
    .eq('stripe_session_id', opts.stripeSessionId)

  await db.from('notifications').insert({
    user_id: opts.userId,
    type: 'credit_topup',
    title: 'Credits added',
    message: `+${credits} Espeezy credits are now in your account. Receipt ${receiptNumber}.`,
    link: receiptPath,
    metadata: {
      credits_added: credits,
      balance_after: next,
      amount_gbp: opts.amountGbp,
      stripe_session_id: opts.stripeSessionId,
      receipt_number: receiptNumber,
      verify_token: verifyToken,
      tier_label: tierLabel,
      user_display_name: displayName,
    },
  })

  return { applied: true, creditsAdded: credits, balanceAfter: next }
}
