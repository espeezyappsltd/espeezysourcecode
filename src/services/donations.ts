/**
 * Donation service  -  thin wrapper around /api/stripe/donate.
 * Returns the Stripe Checkout URL to redirect to, or throws on error.
 */
export type DonationTotal = {
  total_cents: number
  count: number
}

export async function fetchDonationTotal(): Promise<DonationTotal | null> {
  try {
    const res = await fetch('/api/donations/total', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const payload = Array.isArray(data) ? data[0] : data
    if (!payload || typeof payload.total_cents !== 'number') return null

    return {
      total_cents: payload.total_cents,
      count: typeof payload.count === 'number' ? payload.count : 0,
    }
  } catch {
    return null
  }
}

export async function createDonationCheckout({
  amountCents,
  featureTag = 'general',
  isAnonymous = false,
  donorName,
  donorEmail,
  message,
}: {
  amountCents: number
  featureTag?: string
  isAnonymous?: boolean
  donorName?: string
  donorEmail?: string
  message?: string
}): Promise<string> {
  const res = await fetch('/api/stripe/donate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountCents, featureTag, isAnonymous, donorName, donorEmail, message }),
  })
  const data = await res.json()
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Could not initialize donation checkout.')
  }
  return data.url as string
}
