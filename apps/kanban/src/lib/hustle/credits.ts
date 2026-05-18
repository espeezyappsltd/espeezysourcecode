import { MAX_ASSET_CREDIT_VALUE, clampCreditValue } from '@/lib/credits'

/** ~$0.50 per credit from legacy payout_cents when payout_credits column is unset. */
export function centsToCredits(cents: number): number {
  if (!Number.isFinite(cents) || cents <= 0) return 0
  return clampCreditValue(Math.round(cents / 50))
}

export function resolveTaskPayoutCredits(row: {
  payout_credits?: number | null
  payout_cents?: number | null
}): number {
  if (typeof row.payout_credits === 'number' && row.payout_credits > 0) {
    return clampCreditValue(row.payout_credits)
  }
  return centsToCredits(row.payout_cents ?? 0)
}

export function creditsToLegacyCents(credits: number): number {
  return Math.max(100, clampCreditValue(credits) * 50)
}
