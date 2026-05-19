import {
  CREDITS_PER_PRO_MONTH,
  PRO_MONTHLY_GBP,
  clampCreditValue,
  creditsToGbpEquivalent,
  formatCredits,
} from '@/lib/credits'
import { getOrCreateStripeCustomer } from '@/services/stripe'
import { getAppUrl, getStripeClient } from '@/utils/stripe'

/** Espeezy Credits — custom amount (Stripe Dashboard product). */
export const ESPEEZY_CREDITS_STRIPE_PRODUCT_ID =
  process.env.STRIPE_ESPEEZY_CREDITS_PRODUCT_ID?.trim() || 'prod_UXsAueA9d1fzlM'

export const MIN_CREDIT_FUND_GBP = 2
export const DEFAULT_CREDIT_FUND_GBP = 5

export function gbpToCredits(amountGbp: number): number {
  if (!Number.isFinite(amountGbp) || amountGbp < MIN_CREDIT_FUND_GBP) return 0
  const credits = Math.floor((amountGbp / PRO_MONTHLY_GBP) * CREDITS_PER_PRO_MONTH)
  return Math.max(1, clampCreditValue(credits))
}

export function creditsToFundGbp(credits: number): number {
  const c = clampCreditValue(credits)
  if (c <= 0) return MIN_CREDIT_FUND_GBP
  const gbp = creditsToGbpEquivalent(c)
  return Math.max(MIN_CREDIT_FUND_GBP, Math.round(gbp * 100) / 100)
}

export function validateFundAmountGbp(raw: unknown): { ok: true; amountGbp: number } | { ok: false; message: string } {
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num)) {
    return { ok: false, message: `Enter an amount of at least £${MIN_CREDIT_FUND_GBP}.` }
  }
  const amountGbp = Math.round(num * 100) / 100
  if (amountGbp < MIN_CREDIT_FUND_GBP) {
    return { ok: false, message: `Minimum funding amount is £${MIN_CREDIT_FUND_GBP}.` }
  }
  if (amountGbp > 500) {
    return { ok: false, message: 'Maximum single top-up is £500.' }
  }
  return { ok: true, amountGbp }
}

export type CreateCreditFundCheckoutOpts = {
  userId: string
  email?: string
  amountGbp: number
  returnPath?: string
  listingId?: string
  /** Shown in Stripe line item description */
  contextLabel?: string
}

export type CreditFundCheckoutResult = {
  sessionId: string
  checkoutUrl: string
  amountGbp: number
  creditsAmount: number
}

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
