/** Display subscription and one-time prices in GBP (£). */
export function formatGbpPrice(
  amount: number,
  options: { suffix?: string; perMonth?: boolean } = {},
): string {
  const major = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)
  const base = `£${major}`
  if (options.perMonth) return `${base}/month`
  if (options.suffix) return `${base} ${options.suffix}`
  return base
}

/** Normalize legacy "GBP 4.99" labels to "£4.99". */
export function normalizeGbpLabel(label: string): string {
  return label
    .replace(/\bGBP\s*/gi, '£')
    .replace(/\$\s*(\d)/g, '£$1')
    .replace(/USD\s*/gi, '£')
}
