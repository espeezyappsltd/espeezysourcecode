import { formatGbpApprox } from '@/lib/credits'

/**
 * Platform fees on marketplace and hustle transactions (internal units → £ in UI).
 */
export const CREDITS_PER_PLATFORM_FEE = 50

export type PlatformFeeBreakdown = {
  grossCredits: number
  platformFeeCredits: number
  netCredits: number
}

/** Mirrors SQL `compute_platform_fee_credits`. */
export function computePlatformFeeCredits(gross: number): number {
  const g = Math.floor(gross)
  if (!Number.isFinite(g) || g <= 0) return 0

  const fee = Math.floor(g / CREDITS_PER_PLATFORM_FEE)
  if (fee <= 0) return 0
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
    return 'No platform fee on small amounts.'
  }
  return `Platform fee ${formatGbpApprox(platformFeeCredits)} · recipient gets ${formatGbpApprox(netCredits)}`
}
