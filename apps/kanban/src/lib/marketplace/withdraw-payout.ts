import { getAdminDb } from '@/lib/supabase/admin'
import { createPayPalPayout } from '@/lib/paypal/client'
import { getStripeClient } from '@/utils/stripe'
import { friendlySupabaseError } from '@/utils/supabase-errors'

export type PayoutMethod = 'stripe' | 'paypal'

export type PayoutProfile = {
  espeezy_credits: number | null
  stripe_account_id: string | null
  stripe_account_status: string | null
  paypal_email: string | null
  paypal_account_status: string | null
  preferred_payout_method: string | null
}

export async function loadPayoutProfile(userId: string): Promise<PayoutProfile | null> {
  const db = getAdminDb()
  const { data, error } = await db
    .from('profiles')
    .select(
      'espeezy_credits, stripe_account_id, stripe_account_status, paypal_email, paypal_account_status, preferred_payout_method',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (error.message.includes('paypal_email') || error.message.includes('preferred_payout')) {
      const fallback = await db
        .from('profiles')
        .select('espeezy_credits, stripe_account_id, stripe_account_status')
        .eq('id', userId)
        .maybeSingle()
      if (fallback.data) {
        return {
          ...fallback.data,
          paypal_email: null,
          paypal_account_status: 'unlinked',
          preferred_payout_method: 'stripe',
        }
      }
    }
    throw new Error(friendlySupabaseError(error.message, 'Could not load payout profile'))
  }

  return data as PayoutProfile | null
}

export function resolvePayoutMethod(
  profile: PayoutProfile,
  requested?: string | null,
): PayoutMethod {
  if (requested === 'paypal' || requested === 'stripe') return requested
  const pref = profile.preferred_payout_method
  if (pref === 'paypal' || pref === 'stripe') return pref
  if (profile.paypal_account_status === 'linked' && profile.paypal_email) return 'paypal'
  if (profile.stripe_account_id) return 'stripe'
  return 'stripe'
}

export async function executeStripePayout(params: {
  userId: string
  profile: PayoutProfile
  amountCents: number
  creditsAmount: number
}): Promise<{ externalId: string }> {
  if (!params.profile.stripe_account_id) {
    throw new Error('Connect Stripe on the marketplace page before withdrawing via bank.')
  }

  const stripe = getStripeClient()
  const transfer = await stripe.transfers.create({
    amount: params.amountCents,
    currency: 'gbp',
    destination: params.profile.stripe_account_id,
    metadata: {
      user_id: params.userId,
      credits_withdrawn: String(params.creditsAmount),
      source: 'marketplace_asset_sales',
    },
  })

  return { externalId: transfer.id }
}

export async function executePayPalPayout(params: {
  userId: string
  profile: PayoutProfile
  amountCents: number
  creditsAmount: number
}): Promise<{ batchId: string; itemId: string }> {
  if (params.profile.paypal_account_status !== 'linked' || !params.profile.paypal_email) {
    throw new Error('Link your PayPal account on My Assets before withdrawing to PayPal.')
  }

  const batchId = `esz-${params.userId.slice(0, 8)}-${Date.now()}`
  const itemId = `item-${Date.now()}`

  const result = await createPayPalPayout({
    receiverEmail: params.profile.paypal_email,
    amountCents: params.amountCents,
    note: `Espeezy marketplace withdrawal (${params.creditsAmount} credits)`,
    senderItemId: itemId,
    batchId,
  })

  return { batchId: result.batchId, itemId: result.itemId }
}
