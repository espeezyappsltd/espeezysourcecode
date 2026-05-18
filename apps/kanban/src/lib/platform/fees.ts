/**
 * Platform fees on credit transactions (marketplace + hustle).
 * Aligned with Stripe P2P: 2% with a minimum fee on qualifying amounts.
 */

/** Basis points (200 = 2%). */
export const PLATFORM_FEE_BPS = 200

/** Minimum fee when gross meets minGrossForFee. */
export const MIN_PLATFORM_FEE_CREDITS = 1

/** No platform fee on 0–1 credit transactions. */
export const MIN_GROSS_FOR_PLATFORM_FEE = 2

export type PlatformFeeBreakdown = {
  grossCredits: number
  platformFeeCredits: number
  netCredits: number
}

/** Mirrors SQL `compute_platform_fee_credits`. */
export function computePlatformFeeCredits(gross: number): number {
  const g = Math.floor(gross)
  if (!Number.isFinite(g) || g < MIN_GROSS_FOR_PLATFORM_FEE) return 0

  const pctFee = Math.ceil((g * PLATFORM_FEE_BPS) / 10_000)
  const fee = Math.max(MIN_PLATFORM_FEE_CREDITS, pctFee)
  return Math.min(fee, g - 1)
}

export function computeNetAfterPlatformFee(gross: number): number {
  const g = Math.max(0, Math.floor(gross))
  return Math.max(0, g - computePlatformFeeCredits(g))
}

export function breakdownPlatformFee(gross: number): PlatformFeeBreakdown {
  const grossCredits = Math.max(0, Math.floor(gross))
  const platformFeeCredits = computePlatformFeeCredits(grossCredits)
  return {
    grossCredits,
    platformFeeCredits,
    netCredits: grossCredits - platformFeeCredits,
  }
}

export function formatPlatformFeeHint(gross: number): string {
  const { platformFeeCredits, netCredits } = breakdownPlatformFee(gross)
  if (platformFeeCredits <= 0) {
    return 'No platform fee on this amount.'
  }
  return `2% platform fee (${platformFeeCredits} cr) · recipient gets ${netCredits} cr`
}
