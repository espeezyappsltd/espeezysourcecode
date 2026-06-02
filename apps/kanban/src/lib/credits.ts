/**
 * Project balance display (legacy internal units map to GBP for UI).
 * 50 units ≈ 1 month Pro · max listing value = 2 months Pro.
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
      return { ok: false, message: `Listing price is required (max ${formatCredits(MAX_ASSET_CREDIT_VALUE)}).` }
    }
    return { ok: true, value: 0 }
  }

  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, message: 'Listing price must be a non-negative number.' }
  }
  if (num > MAX_ASSET_CREDIT_VALUE) {
    return {
      ok: false,
      message: `Listing price cannot exceed ${formatCredits(MAX_ASSET_CREDIT_VALUE)} (2 months of Pro).`,
    }
  }
  return { ok: true, value: Math.floor(num) }
}

/** Cash equivalent for display (not used for Stripe settlement). */
export function creditsToGbpEquivalent(credits: number): number {
  return (clampCreditValue(credits) / CREDITS_PER_PRO_MONTH) * PRO_MONTHLY_GBP
}

export function formatCredits(credits: number): string {
  const gbp = creditsToGbpEquivalent(credits)
  return `£${gbp.toFixed(2)}`
}

export function formatCreditCapHint(): string {
  return `Max ${formatCredits(MAX_ASSET_CREDIT_VALUE)} (2× Pro month)`
}

/** Display-only GBP equivalent, e.g. "£4.99" */
export function formatGbpApprox(credits: number): string {
  return formatCredits(credits)
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
