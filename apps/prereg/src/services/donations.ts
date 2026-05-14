export async function createDonationCheckout(payload: {
  amountCents: number
  featureTag?: string
  isAnonymous?: boolean
  donorName?: string
  donorEmail?: string
  message?: string
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await fetch('/api/stripe/donate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? 'Failed to start checkout. Please try again.' }
  }
  return { ok: true, url: data.url }
}

export function trackDonationClick(payload: {
  amountCents: number
  source: string
  context: string
  featureTag?: string
  actorKey?: string
}) {
  const body = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon('/api/donations/click', blob)
    return
  }

  void fetch('/api/donations/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics failures should never block checkout.
  })
}