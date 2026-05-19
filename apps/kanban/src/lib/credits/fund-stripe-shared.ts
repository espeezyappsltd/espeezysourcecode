import {
  CREDITS_PER_PRO_MONTH,
  PRO_MONTHLY_GBP,
  clampCreditValue,
  creditsToGbpEquivalent,
} from '@/lib/credits'

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
