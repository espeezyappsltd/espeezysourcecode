/**
 * Donation service — thin wrapper around /api/stripe/donate.
 * Returns the Stripe Checkout URL to redirect to, or throws on error.
 */
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
