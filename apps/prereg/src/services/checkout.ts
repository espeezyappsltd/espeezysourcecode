export async function createStripeCheckout(payload: {
  plan: 'pro' | 'premium' | 'lifetime'
  email: string
  prefilled_promo_code?: string
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? 'Unable to start checkout. Please try again.' }
  }

  return { ok: true, url: data.url }
}