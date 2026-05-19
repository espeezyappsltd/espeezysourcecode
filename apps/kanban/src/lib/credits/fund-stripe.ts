import { formatCredits } from '@/lib/credits'
import { getOrCreateStripeCustomer } from '@/services/stripe'
import { getAppUrl, getStripeClient } from '@/utils/stripe'
import {
  ESPEEZY_CREDITS_STRIPE_PRODUCT_ID,
  gbpToCredits,
  validateFundAmountGbp,
} from '@/lib/credits/fund-stripe-shared'

export type {
  CreateCreditFundCheckoutOpts,
  CreditFundCheckoutResult,
} from '@/lib/credits/fund-stripe-server-types'

export {
  ESPEEZY_CREDITS_STRIPE_PRODUCT_ID,
  MIN_CREDIT_FUND_GBP,
  DEFAULT_CREDIT_FUND_GBP,
  gbpToCredits,
  creditsToFundGbp,
  validateFundAmountGbp,
} from '@/lib/credits/fund-stripe-shared'

import type {
  CreateCreditFundCheckoutOpts,
  CreditFundCheckoutResult,
} from '@/lib/credits/fund-stripe-server-types'

export async function createCreditFundCheckout(
  opts: CreateCreditFundCheckoutOpts,
): Promise<CreditFundCheckoutResult> {
  const validated = validateFundAmountGbp(opts.amountGbp)
  if (!validated.ok) {
    throw new Error(validated.message)
  }

  const amountGbp = validated.amountGbp
  const creditsAmount = gbpToCredits(amountGbp)
  const stripe = getStripeClient()
  const appUrl = getAppUrl().replace(/\/$/, '')

  const customerId = opts.email
    ? await getOrCreateStripeCustomer({ userId: opts.userId, email: opts.email })
    : undefined

  const returnPath = opts.returnPath?.startsWith('/') ? opts.returnPath : '/account/credits'
  const successUrl = `${appUrl}${returnPath}?fund=success&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = opts.listingId
    ? `${appUrl}/marketplace?item=${opts.listingId}`
    : `${appUrl}${returnPath}?fund=cancelled`

  const description =
    opts.contextLabel ??
    `Add ${formatCredits(creditsAmount)} to your Espeezy credit account (£${amountGbp.toFixed(2)})`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    customer_email: customerId ? undefined : opts.email,
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product: ESPEEZY_CREDITS_STRIPE_PRODUCT_ID,
          unit_amount: Math.round(amountGbp * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'credit_topup',
      user_id: opts.userId,
      credits_amount: String(creditsAmount),
      amount_gbp: String(amountGbp),
      ...(opts.listingId ? { listing_id: opts.listingId, pending_listing_id: opts.listingId } : {}),
    },
    payment_intent_data: {
      metadata: {
        type: 'credit_topup',
        user_id: opts.userId,
        credits_amount: String(creditsAmount),
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    amountGbp,
    creditsAmount,
  }
}
