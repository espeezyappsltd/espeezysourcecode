/**
 * Espeezy Credits economy (aligned with prereg docs + Pro billing).
 * 50 credits ≈ 1 month Pro · max listing/asset value = 2 months Pro (100 credits).
 */

export const CREDITS_PER_PRO_MONTH = 50
export const MAX_ASSET_CREDIT_MONTHS = 2
export const MAX_ASSET_CREDIT_VALUE = CREDITS_PER_PRO_MONTH * MAX_ASSET_CREDIT_MONTHS

/** Reference Pro monthly price (GBP) for cash-equivalent display only. */
export const PRO_MONTHLY_GBP = 4.99

export function clampCreditValue(raw: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.min(Math.floor(raw), MAX_ASSET_CREDIT_VALUE)
}

export function validateCreditValue(
  raw: unknown,
  { required = false }: { required?: boolean } = {},
): { ok: true; value: number } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      return { ok: false, message: `Credit value is required (max ${MAX_ASSET_CREDIT_VALUE}).` }
    }
    return { ok: true, value: 0 }
  }

  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, message: 'Credit value must be a non-negative number.' }
  }
  if (num > MAX_ASSET_CREDIT_VALUE) {
    return {
      ok: false,
      message: `Credit value cannot exceed ${MAX_ASSET_CREDIT_VALUE} (2 months of Pro credit).`,
    }
  }
  return { ok: true, value: Math.floor(num) }
}

/** Cash equivalent for display (not used for Stripe settlement). */
export function creditsToGbpEquivalent(credits: number): number {
  return (clampCreditValue(credits) / CREDITS_PER_PRO_MONTH) * PRO_MONTHLY_GBP
}

export function formatCredits(credits: number): string {
  const v = clampCreditValue(credits)
  return `${v} credit${v === 1 ? '' : 's'}`
}

export function formatCreditCapHint(): string {
  return `Max ${MAX_ASSET_CREDIT_VALUE} credits (2× Pro month)`
}

type MetadataLike = Record<string, unknown> | null | undefined

export function readCreditValueFromMetadata(metadata: MetadataLike): number {
  if (!metadata || typeof metadata !== 'object') return 0
  const raw = (metadata as { credit_value?: unknown }).credit_value
  if (typeof raw === 'number') return clampCreditValue(raw)
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = validateCreditValue(raw)
    return parsed.ok ? parsed.value : 0
  }
  return 0
}

export function mergeMetadataCreditValue(
  metadata: MetadataLike,
  creditValue: number,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {}
  base.credit_value = clampCreditValue(creditValue)
  return base
}
