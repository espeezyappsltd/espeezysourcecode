export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/account', { method: 'DELETE' })
  const data = (await res.json().catch(() => ({}))) as { error?: string }

  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Account termination failed' }
  }

  return { ok: true }
}

export async function createStripePortalSession(): Promise<{ ok: boolean; url?: string; error?: string }> {
  const res = await fetch('/api/stripe/portal', { method: 'POST' })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }

  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? 'Portal creation failed' }
  }

  return { ok: true, url: data.url }
}